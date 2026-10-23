import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession } from '@/lib/security/auth'

/**
 * PATCH /api/deliveries/[id]
 *
 * Body shape:
 * {
 *   action: 'assign' | 'status' | 'sign' | 'incident' | 'release',
 *   courierId?: string,      // for 'assign'
 *   status?: string,         // for 'status' (PICKED_UP, IN_TRANSIT, DELIVERED, FAILED)
 *   signatureName?: string,  // for 'sign'
 *   incidentType?: string,   // for 'incident'
 *   incidentDesc?: string,   // for 'incident'
 *   notes?: string,          // optional, for any action
 * }
 *
 * Cada acción verifica permisos y dispara notificaciones (try/catch
 * para que un fallo de notif no rompa la operación principal).
 */

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
}

const INCIDENT_LABELS: Record<string, string> = {
  DIRECCION_INCORRECTA: 'Dirección incorrecta',
  CLIENTE_AUSENTE: 'Cliente ausente',
  DAÑO: 'Daño',
  OTRO: 'Otro',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const action: string = body.action || 'status'

  // Sesión base (todas las acciones requieren sesión)
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string; name: string; email: string }

  // Cargar el delivery actual + relaciones para autorización y notificaciones
  const existing = await db.delivery.findUnique({
    where: { id },
    include: {
      order: { include: { user: { select: { id: true, name: true } } } },
      courier: { include: { user: { select: { id: true, name: true } } } },
    },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Delivery no encontrado' }, { status: 404 })
  }

  // Helper: ¿es el courier asignado al delivery?
  const isAssignedCourier = async (): Promise<boolean> => {
    if (user.role !== 'COURIER') return false
    if (!existing.courierId) return false
    const myCourier = await db.courier.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    return !!myCourier && myCourier.id === existing.courierId
  }

  let updateData: Record<string, unknown> = {}
  const notifs: Array<{ userId: string; type: string; title: string; message: string; link?: string }> = []
  const orderNumber = existing.order?.orderNumber || id.slice(-6)
  const buyerName = existing.order?.user?.name || 'cliente'
  const buyerId = existing.order?.user?.id
  const deliveryAddress = existing.deliveryAddress || existing.order?.city || ''

  if (action === 'assign') {
    // Solo ADMIN puede asignar
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo un admin puede asignar mensajeros' }, { status: 403 })
    }
    const courierId: string | undefined = body.courierId
    if (!courierId) {
      return NextResponse.json({ error: 'courierId requerido' }, { status: 400 })
    }
    const courier = await db.courier.findUnique({
      where: { id: courierId },
      include: { user: { select: { id: true, name: true } } },
    })
    if (!courier) {
      return NextResponse.json({ error: 'Courier no encontrado' }, { status: 404 })
    }
    updateData = {
      courierId,
      status: 'ASSIGNED',
      incidentType: null,
      incidentDesc: null,
    }
    if (typeof body.notes === 'string') updateData.notes = body.notes
    // Notificar al courier
    notifs.push({
      userId: courier.userId,
      type: 'SHIPMENT_ASSIGNED',
      title: 'Nuevo sobre asignado',
      message: `Pedido ${orderNumber} para entregar en ${deliveryAddress || 'dirección pendiente'}.`,
      link: '/?module=courier-app',
    })
    // Notificar al comprador
    if (buyerId) {
      notifs.push({
        userId: buyerId,
        type: 'ORDER_STATUS',
        title: 'Tu pedido fue asignado a un mensajero',
        message: `${courier.user.name} tiene tu pedido ${orderNumber} y pronto estará en camino.`,
        link: '/?module=marketplace',
      })
    }
  } else if (action === 'status') {
    // ADMIN o el courier asignado pueden cambiar estado
    const adminOrCourier = user.role === 'ADMIN' || (await isAssignedCourier())
    if (!adminOrCourier) {
      return NextResponse.json({ error: 'No autorizado para cambiar el estado' }, { status: 403 })
    }
    const status: string | undefined = body.status
    const valid = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'ASSIGNED', 'PENDING']
    if (!status || !valid.includes(status)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 })
    }
    updateData = { status }
    if (typeof body.notes === 'string') updateData.notes = body.notes
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }
    // Si FAILED, dejar registro de incidente si viene
    if (status === 'FAILED' && body.incidentType) {
      updateData.incidentType = body.incidentType
      if (typeof body.incidentDesc === 'string') updateData.incidentDesc = body.incidentDesc
    }
    // Notificar al comprador
    if (buyerId) {
      let title = `Pedido ${orderNumber} actualizado`
      let msg = `El estado de tu pedido cambió a: ${STATUS_LABELS[status] || status}.`
      if (status === 'PICKED_UP') {
        title = 'Tu pedido fue recogido'
        msg = `El mensajero ya recogió tu pedido ${orderNumber}.`
      } else if (status === 'IN_TRANSIT') {
        title = 'Tu pedido está en camino'
        msg = `El mensajero va rumbo a tu dirección con el pedido ${orderNumber}.`
      } else if (status === 'DELIVERED') {
        title = 'Pedido entregado ✅'
        msg = `Tu pedido ${orderNumber} fue entregado. ¡Gracias por tu compra!`
      } else if (status === 'FAILED') {
        title = 'Inconveniente con tu pedido'
        msg = `Hubo un inconveniente con tu pedido ${orderNumber}. Te contactaremos.`
      }
      notifs.push({
        userId: buyerId,
        type: 'ORDER_STATUS',
        title,
        message: msg,
        link: '/?module=marketplace',
      })
    }
    // Si FAILED → también notificar a todos los admins
    if (status === 'FAILED') {
      const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        notifs.push({
          userId: a.id,
          type: 'ORDER_STATUS',
          title: `Incidencia en pedido ${orderNumber}`,
          message: `El mensajero marcó el pedido como FALLIDO.`,
          link: '/?module=logistics',
        })
      }
    }
  } else if (action === 'sign') {
    // Solo el courier asignado puede firmar
    const ok = await isAssignedCourier()
    if (!ok) {
      return NextResponse.json({ error: 'Solo el mensajero asignado puede firmar' }, { status: 403 })
    }
    const signatureName: string | undefined = body.signatureName
    if (!signatureName || !signatureName.trim()) {
      return NextResponse.json({ error: 'Falta el nombre de quien recibe' }, { status: 400 })
    }
    updateData = {
      status: 'DELIVERED',
      deliveredAt: new Date(),
      signatureName: signatureName.trim(),
    }
    if (typeof body.notes === 'string') updateData.notes = body.notes
    if (buyerId) {
      notifs.push({
        userId: buyerId,
        type: 'ORDER_STATUS',
        title: 'Pedido entregado ✅',
        message: `Tu pedido ${orderNumber} fue entregado a ${signatureName.trim()}.`,
        link: '/?module=marketplace',
      })
    }
    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const a of admins) {
      notifs.push({
        userId: a.id,
        type: 'ORDER_STATUS',
        title: 'Entrega completada',
        message: `Pedido ${orderNumber} entregado a ${signatureName.trim()} por ${existing.courier?.user?.name || 'mensajero'}.`,
        link: '/?module=logistics',
      })
    }
  } else if (action === 'incident') {
    // Solo el courier asignado puede reportar incidencia
    const ok = await isAssignedCourier()
    if (!ok) {
      return NextResponse.json({ error: 'Solo el mensajero asignado puede reportar incidencias' }, { status: 403 })
    }
    const incidentType: string | undefined = body.incidentType
    if (!incidentType) {
      return NextResponse.json({ error: 'incidentType requerido' }, { status: 400 })
    }
    updateData = {
      incidentType,
      incidentDesc: typeof body.incidentDesc === 'string' ? body.incidentDesc : null,
    }
    if (typeof body.notes === 'string') updateData.notes = body.notes
    // Si no estaba ya FAILED, marcar como FAILED
    if (existing.status !== 'FAILED') {
      updateData.status = 'FAILED'
    }
    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const a of admins) {
      notifs.push({
        userId: a.id,
        type: 'ORDER_STATUS',
        title: `Incidencia reportada en pedido ${orderNumber}`,
        message: `${INCIDENT_LABELS[incidentType] || incidentType}${body.incidentDesc ? ` — ${body.incidentDesc}` : ''}`,
        link: '/?module=logistics',
      })
    }
  } else if (action === 'release') {
    // Solo ADMIN puede liberar
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo un admin puede liberar el mensajero' }, { status: 403 })
    }
    updateData = {
      courierId: null,
      status: 'PENDING',
      incidentType: null,
      incidentDesc: null,
      signatureName: null,
      deliveredAt: null,
    }
    if (typeof body.notes === 'string') updateData.notes = body.notes
  } else {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  // Aplicar la actualización
  const updated = await db.delivery.update({
    where: { id },
    data: updateData,
    include: {
      order: { include: { user: { select: { name: true } } } },
      courier: { include: { user: { select: { name: true } } } },
    },
  })

  // Sincronizar el estado del Order con el delivery (best-effort)
  try {
    if (updated.status === 'DELIVERED') {
      await db.order.update({ where: { id: updated.orderId }, data: { status: 'DELIVERED' } })
    } else if (updated.status === 'ASSIGNED' || updated.status === 'PICKED_UP' || updated.status === 'IN_TRANSIT') {
      await db.order.update({ where: { id: updated.orderId }, data: { status: 'SHIPPED' } })
    } else if (updated.status === 'FAILED') {
      await db.order.update({ where: { id: updated.orderId }, data: { status: 'CONFIRMED' } })
    }
  } catch (orderErr) {
    console.error('[deliveries PATCH] order sync error:', orderErr)
  }

  // Disparar notificaciones (best-effort)
  try {
    if (notifs.length > 0) {
      await db.notification.createMany({ data: notifs })
    }
  } catch (notifErr) {
    console.error('[deliveries PATCH] notif error:', notifErr)
  }

  return NextResponse.json(updated)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN', 'COURIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const delivery = await db.delivery.findUnique({
    where: { id },
    include: {
      order: { include: { user: { select: { name: true } } } },
      courier: { include: { user: { select: { name: true } } } },
    },
  })
  if (!delivery) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(delivery)
}
