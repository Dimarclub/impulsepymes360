import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/deliveries/request
 *
 * Permite a un SUPPLIER (o ADMIN) solicitar un servicio de logística
 * (envío de sobre o carga) de forma independiente — NO proviene de un
 * pedido del marketplace.
 *
 * Flujo: proveedor solicita → se crea un Order mínimo (dummy) + Delivery
 * (status PENDING) → el Delta Master (admin) lo ve en Logística "Por
 * asignar" → arrastra a un mensajero → mensajero entrega.
 *
 * El `Delivery.orderId` es @unique y obligatorio en el schema, por eso
 * creamos un Order mínimo (subtotal/total/commission = 0) para alojar la
 * solicitud. El `orderNumber` usa el prefijo 'LOG-' para distinguirlo de
 * los pedidos del marketplace (prefijo 'DM-').
 */

const VALID_TASK_TYPES = ['SOBRE', 'CARGA'] as const
type TaskType = (typeof VALID_TASK_TYPES)[number]

const TASK_TYPE_LABEL: Record<TaskType, string> = {
  SOBRE: 'sobre',
  CARGA: 'carga',
}

// POST: crea una nueva solicitud de logística
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string; name: string; email: string }

  let body: {
    taskType?: string
    pickupAddress?: string
    deliveryAddress?: string
    notes?: string
    recipientName?: string
    recipientPhone?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const taskType = (body.taskType || '').toUpperCase() as TaskType
  if (!VALID_TASK_TYPES.includes(taskType)) {
    return NextResponse.json({ error: 'taskType debe ser SOBRE o CARGA' }, { status: 400 })
  }
  const pickupAddress = (body.pickupAddress || '').trim()
  const deliveryAddress = (body.deliveryAddress || '').trim()
  if (!pickupAddress || !deliveryAddress) {
    return NextResponse.json(
      { error: 'Las direcciones de recogida y entrega son obligatorias' },
      { status: 400 },
    )
  }
  const recipientName = body.recipientName?.trim() || null
  const recipientPhone = body.recipientPhone?.trim() || null

  // Componer notas internas con info del destinatario + notas del proveedor
  const notesParts: string[] = []
  if (recipientName) notesParts.push(`Destinatario: ${recipientName}`)
  if (recipientPhone) notesParts.push(`Tel: ${recipientPhone}`)
  if (body.notes?.trim()) notesParts.push(body.notes.trim())
  notesParts.push(`Solicitud de logística de ${user.name}`)
  const notes = notesParts.join(' · ')

  // 1) Crear Order mínimo (dummy) — el Delivery requiere orderId @unique
  const orderNumber = 'LOG-' + String(1000 + Math.floor(Math.random() * 9000))
  let order
  try {
    order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal: 0,
        commission: 0,
        total: 0,
        status: 'CONFIRMED',
        paymentStatus: 'N/A',
        paymentMethod: 'LOGISTICA',
        shippingAddress: deliveryAddress,
        city: null,
      },
    })
  } catch (err) {
    console.error('[deliveries/request POST] order create error:', err)
    return NextResponse.json({ error: 'No se pudo crear la orden' }, { status: 500 })
  }

  // 2) Crear Delivery (PENDING, sin courier) — aparecerá en "Por asignar"
  let delivery
  try {
    delivery = await db.delivery.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        taskType,
        amountToCollect: 0,
        pickupAddress,
        deliveryAddress,
        notes,
      },
      include: {
        order: { include: { user: { select: { name: true } } } },
        courier: { include: { user: { select: { name: true } } } },
      },
    })
  } catch (err) {
    console.error('[deliveries/request POST] delivery create error:', err)
    // best-effort: borrar la orden huérfana
    try { await db.order.delete({ where: { id: order.id } }) } catch { /* noop */ }
    return NextResponse.json({ error: 'No se pudo crear el delivery' }, { status: 500 })
  }

  // 3) Notificar a todos los ADMIN (Delta Master) — best-effort
  try {
    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'ORDER_RECEIVED',
          title: 'Nueva solicitud de logística',
          message: `El proveedor ${user.name} solicita enviar un ${TASK_TYPE_LABEL[taskType]} a ${deliveryAddress}. Requiere asignar mensajero.`,
          link: '/?module=logistics',
        })),
      })
    }
  } catch (notifErr) {
    console.error('[deliveries/request POST] notif error:', notifErr)
  }

  return NextResponse.json({ ok: true, delivery }, { status: 201 })
}

// GET: lista las solicitudes de logística del proveedor autenticado
export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  // Filtrar entregas donde el order pertenece al usuario.
  // Solo las órdenes con prefijo 'LOG-' son solicitudes de logística
  // independientes (excluye pedidos del marketplace con prefijo 'DM-').
  const deliveries = await db.delivery.findMany({
    where: {
      order: {
        userId: user.id,
        orderNumber: { startsWith: 'LOG-' },
      },
    },
    include: {
      order: { select: { orderNumber: true, createdAt: true } },
      courier: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ ok: true, deliveries })
}
