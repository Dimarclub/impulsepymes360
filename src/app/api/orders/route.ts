import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, requireRole } from '@/lib/security/auth'

export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'AFFILIATE')
  if (auth instanceof NextResponse) return auth
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
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  // Forzar userId al usuario autenticado (no se puede falsear)
  body.userId = (auth as { id: string }).id
  const { userId, items, shippingAddress, city, paymentMethod } = body as {
    userId: string
    items: { productId: string; quantity: number; price: number }[]
    shippingAddress?: string
    city?: string
    paymentMethod?: string
  }

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0)

  // Calcular comisión total basada en el commissionRate de cada producto
  const products = await db.product.findMany({
    where: { id: { in: items.map((it) => it.productId) } },
    select: { id: true, commissionRate: true },
  })
  const productRateMap = new Map(products.map((p) => [p.id, p.commissionRate || 9]))
  // Comisión ponderada: suma de (precio × cantidad × rate/100) por item
  const commission = +items.reduce((s, it) => {
    const rate = productRateMap.get(it.productId) || 9
    return s + (it.price * it.quantity * rate / 100)
  }, 0).toFixed(2)

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

  // Generar comisiones N0 (3%) + 3 niveles (2% c/u) sobre el total de comisión disponible
  // Si el producto tiene commissionRate > 9, el excedente se reparte como bono extra en N0
  const buyer = await db.user.findUnique({ where: { id: userId } })
  if (buyer) {
    // Comisión base: N0 = 3%, N1-N3 = 2% c/u (sobre el subtotal)
    const n0Rate = 0.03
    const nRate = 0.02
    const n0Amount = +(subtotal * n0Rate).toFixed(2)

    // Bono extra para N0 si los productos tienen commissionRate > 9%
    const extraCommission = +items.reduce((s, it) => {
      const rate = productRateMap.get(it.productId) || 9
      const extra = Math.max(0, rate - 9) // excedente sobre el 9% base
      return s + (it.price * it.quantity * extra / 100)
    }, 0).toFixed(2)

    await db.commission.create({ data: { userId: buyer.id, orderId: order.id, sourceUserId: buyer.id, amount: +(n0Amount + extraCommission).toFixed(2), level: 0, rate: 3 + (extraCommission > 0 ? (extraCommission / subtotal * 100) : 0), status: 'PENDING' } })
    let current = buyer
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (!current.sponsorId) break
      const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
      if (!sponsor) break
      await db.commission.create({ data: { userId: sponsor.id, orderId: order.id, sourceUserId: buyer.id, amount: +(subtotal * 0.02).toFixed(2), level: lvl, rate: 2, status: 'PENDING' } })
      current = sponsor
    }
  }

  // ===== Generar notificaciones ORDER_RECEIVED =====
  try {
    // 1. Notificar al comprador (confirmación)
    await db.notification.create({
      data: {
        userId,
        type: 'ORDER_RECEIVED',
        title: `Pedido ${orderNumber} confirmado`,
        message: `Tu pedido por $${total.toFixed(2)} fue confirmado. Estamos preparando tu envío.`,
        link: '/?module=marketplace',
      },
    })

    // 2. Notificar a todos los ADMIN (gestión de pedidos + logística)
    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'ORDER_RECEIVED',
          title: `Nuevo pedido ${orderNumber}`,
          message: `Pedido de ${buyer?.name || 'cliente'} por $${total.toFixed(2)} (${items.length} items). Requiere asignar mensajero en Logística.`,
          link: '/?module=logistics',
        })),
      })
    }

    // 3. Notificar a los proveedores de los items (tienen que despachar)
    const products = await db.product.findMany({
      where: { id: { in: items.map((it) => it.productId) } },
      select: { supplierId: true },
    })
    const supplierIds = [...new Set(products.map((p) => p.supplierId).filter(Boolean))] as string[]
    if (supplierIds.length > 0) {
      const suppliers = await db.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { userId: true, companyName: true },
      })
      if (suppliers.length > 0) {
        await db.notification.createMany({
          data: suppliers.map((s) => ({
            userId: s.userId,
            type: 'ORDER_RECEIVED',
            title: `Nuevo pedido para despachar — ${orderNumber}`,
            message: `Tienes un pedido de ${buyer?.name || 'cliente'} por $${total.toFixed(2)}. Revisa tu backoffice para prepararlo.`,
            link: '/?module=supplier-backoffice',
          })),
        })
      }
    }
  } catch (notifErr) {
    console.error('[orders POST] notif error:', notifErr)
  }

  // ===== Auto-crear Delivery (status PENDING, sin courier) para logística =====
  try {
    await db.delivery.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        taskType: 'SOBRE',
        pickupAddress: shippingAddress || null,
        deliveryAddress: shippingAddress || null,
        notes: `Pedido ${orderNumber} — ${items.length} items — ${buyer?.name || 'cliente'} — ${city || 'N/A'}`,
      },
    })
  } catch (delivErr) {
    console.error('[orders POST] delivery create error:', delivErr)
  }

  return NextResponse.json(order, { status: 201 })
}
