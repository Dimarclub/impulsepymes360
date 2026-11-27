import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createOrderCommissions } from '@/lib/commissions'
import { requireSession } from '@/lib/security/auth'
import { getPaymentProvider } from '@/lib/services/payment'
import { notifyOrderReceived } from '@/lib/services/notifications'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { orderId, paymentIntentId } = body as { orderId: string; paymentIntentId: string }

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  if (order.userId !== auth.id && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (order.paymentStatus === 'PAID') return NextResponse.json({ error: 'Orden ya pagada' }, { status: 400 })

  const provider = getPaymentProvider()
  const result = await provider.confirm(paymentIntentId)

  if (!result.success) {
    await db.order.update({ where: { id: orderId }, data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' } })
    return NextResponse.json({ success: false, error: 'Pago rechazado' }, { status: 402 })
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED', paymentStatus: 'PAID' } })
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
    }
    // Mismas reglas que /api/orders: 1 % a 3 niveles, idempotente
    await createOrderCommissions(tx, { orderId, buyerId: order.userId, base: order.subtotal })
  })

  const buyer = await db.user.findUnique({ where: { id: order.userId } })
  // Notificar a proveedores
  const items = await db.orderItem.findMany({ where: { orderId }, include: { product: { include: { supplier: { include: { user: true } } } } } })
  const notified = new Set<string>()
  for (const item of items) {
    const su = item.product?.supplier?.user
    if (su && !notified.has(su.id)) {
      notified.add(su.id)
      notifyOrderReceived(su.id, order.orderNumber, order.total, buyer?.name || 'Cliente').catch(() => {})
    }
  }

  return NextResponse.json({ success: true, orderId, orderNumber: order.orderNumber, transactionId: result.transactionId, provider: result.provider })
}
