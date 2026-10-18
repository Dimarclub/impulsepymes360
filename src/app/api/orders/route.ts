import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const status = searchParams.get('status')
  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId
  if (status) where.status = status
  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true } },
      delivery: { include: { courier: { include: { user: { select: { name: true } } } } } },
    },
    take: 200,
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, items, shippingAddress, city, paymentMethod } = body as {
    userId: string
    items: { productId: string; quantity: number; price: number }[]
    shippingAddress?: string
    city?: string
    paymentMethod?: string
  }

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0)
  const commission = +(subtotal * 0.08).toFixed(2)
  const total = +subtotal.toFixed(2)
  const orderNumber = 'DM-' + String(1000 + Math.floor(Math.random() * 9000))

  const order = await db.order.create({
    data: {
      orderNumber,
      userId,
      subtotal,
      commission,
      total,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: paymentMethod || 'TARJETA',
      shippingAddress,
      city,
      items: { create: items.map((it) => ({ productId: it.productId, quantity: it.quantity, price: it.price })) },
    },
    include: { items: true },
  })

  // Generar comisiones N0 + 3 niveles
  const buyer = await db.user.findUnique({ where: { id: userId } })
  if (buyer) {
    await db.commission.create({ data: { userId: buyer.id, orderId: order.id, sourceUserId: buyer.id, amount: +(subtotal * 0.03).toFixed(2), level: 0, rate: 3, status: 'PENDING' } })
    let current = buyer
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (!current.sponsorId) break
      const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
      if (!sponsor) break
      await db.commission.create({ data: { userId: sponsor.id, orderId: order.id, sourceUserId: buyer.id, amount: +(subtotal * 0.02).toFixed(2), level: lvl, rate: 2, status: 'PENDING' } })
      current = sponsor
    }
  }

  return NextResponse.json(order, { status: 201 })
}
