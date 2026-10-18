import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { getPaymentProvider } from '@/lib/services/payment'

// Crear intención de pago para un carrito
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const body = await req.json()
  const { items, shippingAddress, city } = body as {
    items: { productId: string; quantity: number }[]
    shippingAddress?: string
    city?: string
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 })
  }

  // Calcular total desde la DB (no confiar en el cliente)
  const productIds = items.map((i) => i.productId)
  const products = await db.product.findMany({ where: { id: { in: productIds } } })
  let subtotal = 0
  const orderItems: { productId: string; quantity: number; price: number }[] = []
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId)
    if (!p || p.stock < it.quantity) {
      return NextResponse.json({ error: `Producto no disponible o sin stock: ${it.productId}` }, { status: 400 })
    }
    subtotal += p.price * it.quantity
    orderItems.push({ productId: it.productId, quantity: it.quantity, price: p.price })
  }

  const provider = getPaymentProvider()
  const intent = await provider.createIntent(subtotal, 'usd', { userId, itemCount: String(items.length) })

  // Pre-crear la orden en estado PENDING_PAYMENT
  const commission = +(subtotal * 0.08).toFixed(2)
  const orderNumber = 'DM-' + String(1000 + Math.floor(Math.random() * 9000))
  const order = await db.order.create({
    data: {
      orderNumber,
      userId,
      subtotal,
      commission,
      total: +subtotal.toFixed(2),
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'CARD',
      shippingAddress,
      city,
      items: { create: orderItems },
    },
  })

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    paymentIntentId: intent.id,
    clientSecret: intent.clientSecret,
    amount: subtotal,
    provider: process.env.PAYMENT_PROVIDER || 'test',
  })
}
