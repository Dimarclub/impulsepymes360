import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { getPaymentProvider } from '@/lib/services/payment'

// Confirmar el pago: procesa con el provider y, si éxito, confirma la orden + genera comisiones
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
    return NextResponse.json({ success: false, error: 'Pago rechazado', transactionId: result.transactionId }, { status: 402 })
  }

  // Pago exitoso: confirmar orden, descontar stock, generar comisiones
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    })
    // Descontar stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }
  })

  // Generar comisiones N0 + 3 niveles
  const buyer = await db.user.findUnique({ where: { id: order.userId } })
  if (buyer) {
    await db.commission.create({
      data: { userId: buyer.id, orderId, sourceUserId: buyer.id, amount: +(order.subtotal * 0.03).toFixed(2), level: 0, rate: 3, status: 'PENDING' },
    })
    let current = buyer
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (!current.sponsorId) break
      const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
      if (!sponsor) break
      await db.commission.create({
        data: { userId: sponsor.id, orderId, sourceUserId: buyer.id, amount: +(order.subtotal * 0.02).toFixed(2), level: lvl, rate: 2, status: 'PENDING' },
      })
      current = sponsor
    }
  }

  return NextResponse.json({
    success: true,
    orderId,
    orderNumber: order.orderNumber,
    transactionId: result.transactionId,
    provider: result.provider,
  })
}
