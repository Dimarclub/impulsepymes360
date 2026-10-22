import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { getPaymentProvider } from '@/lib/services/payment'
import { notifyOrderReceived, notifyCommissionEarned } from '@/lib/services/notifications'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { orderId, paymentIntentId } = body as { orderId: string; paymentIntentId: string }

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })
  if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
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
  })

  const buyer = await db.user.findUnique({ where: { id: order.userId } })
  if (buyer) {
    const n0 = +(order.subtotal * 0.03).toFixed(2)
    await db.commission.create({ data: { userId: buyer.id, orderId, sourceUserId: buyer.id, amount: n0, level: 0, rate: 3, status: 'PENDING' } })
    notifyCommissionEarned(buyer.id, n0, 0, buyer.name).catch(() => {})
    let current = buyer
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (!current.sponsorId) break
      const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
      if (!sponsor) break
      const amt = +(order.subtotal * 0.02).toFixed(2)
      await db.commission.create({ data: { userId: sponsor.id, orderId, sourceUserId: buyer.id, amount: amt, level: lvl, rate: 2, status: 'PENDING' } })
      notifyCommissionEarned(sponsor.id, amt, lvl, buyer.name).catch(() => {})
      current = sponsor
    }
  }

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
