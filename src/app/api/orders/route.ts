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
  // NUEVO MODELO: marketplace = 1% × 3 niveles (N1 + N2 + N3 = 3% total)
  // El combo-publibags NO genera comisión marketplace — genera BagInvestment (5% mensual compuesto)
  const products = await db.product.findMany({
    where: { id: { in: items.map((it) => it.productId) } },
    select: { id: true, commissionRate: true, slug: true, supplierId: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  // Detectar si hay items del combo-publibags (inversión)
  const comboItems = items.filter((it) => {
    const p = productMap.get(it.productId)
    return p?.slug === 'combo-publibags'
  })
  const marketplaceItems = items.filter((it) => {
    const p = productMap.get(it.productId)
    return p?.slug !== 'combo-publibags'
  })

  // Comisión marketplace: 3% total (1% N1 + 1% N2 + 1% N3) sobre el subtotal de marketplaceItems
  const marketplaceSubtotal = +marketplaceItems.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
  const commission = +(marketplaceSubtotal * 0.03).toFixed(2) // 3% total

  // Inversión en bolsos: monto total de comboItems (1 combo = $44)
  const investmentAmount = +comboItems.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
  const comboQuantity = comboItems.reduce((s, it) => s + it.quantity, 0)

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

  // ===== Crear BagInvestment si hay compra de combo (inversión, no comisión marketplace) =====
  if (comboQuantity > 0 && investmentAmount > 0) {
    await db.bagInvestment.create({
      data: {
        userId,
        comboQuantity,
        amount: investmentAmount,
        monthlyRate: 0.05, // 5% mensual
        currentBalance: investmentAmount, // arranca con el monto invertido
        lastCompoundAt: new Date(),
        totalEarned: 0,
        orderId: order.id,
        status: 'ACTIVE',
      },
    })
  }

  // ===== Generar comisiones marketplace (1% N1 + 1% N2 + 1% N3) sobre el subtotal del marketplace =====
  // N3 (clientes/proveedores) solo consumen — NO ganan nada
  // Solo N1 y N2 ganan del árbol de sponsors arriba del comprador
  const buyer = await db.user.findUnique({ where: { id: userId } })
  if (buyer && marketplaceSubtotal > 0) {
    const n1Amount = +(marketplaceSubtotal * 0.01).toFixed(2) // 1% al N1
    const n2Amount = +(marketplaceSubtotal * 0.01).toFixed(2) // 1% al N2
    const n3Amount = +(marketplaceSubtotal * 0.01).toFixed(2) // 1% al N3

    let current = buyer
    const sponsors = []
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (!current.sponsorId) break
      const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
      if (!sponsor) break
      sponsors.push({ user: sponsor, level: lvl })
      current = sponsor
    }

    // N1 = sponsors[0], N2 = sponsors[1], N3 = sponsors[2]
    if (sponsors[0]) {
      await db.commission.create({ data: { userId: sponsors[0].user.id, orderId: order.id, sourceUserId: buyer.id, amount: n1Amount, level: 1, rate: 1, status: 'PENDING' } })
    }
    if (sponsors[1]) {
      await db.commission.create({ data: { userId: sponsors[1].user.id, orderId: order.id, sourceUserId: buyer.id, amount: n2Amount, level: 2, rate: 1, status: 'PENDING' } })
    }
    if (sponsors[2]) {
      await db.commission.create({ data: { userId: sponsors[2].user.id, orderId: order.id, sourceUserId: buyer.id, amount: n3Amount, level: 3, rate: 1, status: 'PENDING' } })
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
