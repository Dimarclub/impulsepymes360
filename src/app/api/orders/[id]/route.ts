import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const { status, courierId } = body as { status: string; courierId?: string }

  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { supplier: { include: { user: true } } } } } } },
  })
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

  const update: Record<string, unknown> = { status }
  if (courierId !== undefined) update.courierId = courierId || null
  const updated = await db.order.update({ where: { id }, data: update })

  const STATUS_MSG: Record<string, string> = {
    CONFIRMED: 'Tu pedido ha sido confirmado y está siendo preparado',
    SHIPPED: `Tu pedido ${order.orderNumber} ha sido enviado${courierId ? ' y asignado a un mensajero' : ''}`,
    IN_TRANSIT: `Tu pedido ${order.orderNumber} está en camino`,
    DELIVERED: `Tu pedido ${order.orderNumber} ha sido entregado. ¡Gracias por tu compra!`,
    CANCELLED: `Tu pedido ${order.orderNumber} ha sido cancelado`,
  }

  // Notificar al comprador
  if (db.notification) {
    await db.notification.create({ data: { userId: order.userId, type: 'ORDER_STATUS', title: `Pedido ${order.orderNumber}: ${status}`, message: STATUS_MSG[status] || `Estado: ${status}`, link: '/?module=marketplace' } }).catch(() => {})
    // Notificar a proveedores
    const notified = new Set<string>()
    for (const item of order.items) {
      const su = item.product?.supplier?.user
      if (su && !notified.has(su.id)) {
        notified.add(su.id)
        await db.notification.create({ data: { userId: su.id, type: 'ORDER_STATUS', title: `Pedido ${order.orderNumber}: ${status}`, message: STATUS_MSG[status] || `Estado: ${status}`, link: '/?module=supplier-backoffice' } }).catch(() => {})
      }
    }
  }

  // Crear delivery si se asigna mensajero
  if (courierId && status === 'SHIPPED') {
    await db.delivery.upsert({
      where: { orderId: id },
      update: { courierId, status: 'ASSIGNED' },
      create: { orderId: id, courierId, status: 'ASSIGNED', pickupAddress: order.shippingAddress || '', deliveryAddress: order.shippingAddress || '' },
    }).catch(() => {})
  }
  if (status === 'IN_TRANSIT' || status === 'DELIVERED') {
    await db.delivery.updateMany({ where: { orderId: id }, data: { status: status === 'IN_TRANSIT' ? 'IN_TRANSIT' : 'DELIVERED' } }).catch(() => {})
  }

  return NextResponse.json(updated)
}
