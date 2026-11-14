import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

const VALID_METHODS = new Set(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'SALDO_BILLETERA', 'QR'])

export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Items vacíos' }, { status: 400 })
  }

  const {
    items,
    paymentMethod,
    fairId,
    customerName,
    customerPhone,
    affiliateCode,
  }: {
    items: { productId: string; quantity: number; price: number }[]
    paymentMethod: string
    fairId?: string
    customerName?: string
    customerPhone?: string
    affiliateCode?: string
  } = body

  if (!paymentMethod || !VALID_METHODS.has(paymentMethod)) {
    return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })
  }

  if (fairId) {
    const fair = await db.fair.findUnique({ where: { id: fairId }, select: { id: true, status: true } })
    if (!fair) return NextResponse.json({ error: 'Feria no encontrada' }, { status: 404 })
  }

  // Resolver el supplier del usuario autenticado
  const supplier = await db.supplier.findUnique({
    where: { userId: auth.id },
    select: { id: true, companyName: true, userId: true, city: true },
  })
  if (!supplier) {
    return NextResponse.json({ error: 'Tu usuario no tiene proveedor asociado' }, { status: 403 })
  }

  // Validar productos: deben pertenecer al supplier autenticado (o admin puede usar cualquier supplier)
  const productIds = items.map((it) => it.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, supplierId: true, name: true, stock: true, commissionRate: true, price: true },
  })

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'Uno o más productos no existen' }, { status: 400 })
  }

  // Si es SUPPLIER, todos los items deben ser de su propio catálogo
  if (auth.role === 'SUPPLIER') {
    const owned = products.every((p) => p.supplierId === supplier.id)
    if (!owned) {
      return NextResponse.json({ error: 'Solo puedes vender productos de tu propio catálogo' }, { status: 403 })
    }
  }

  // Validar stock suficiente
  for (const it of items) {
    const p = products.find((p) => p.id === it.productId)
    if (!p) continue
    if (it.quantity <= 0) {
      return NextResponse.json({ error: `Cantidad inválida para ${p.name}` }, { status: 400 })
    }
    if (p.stock < it.quantity) {
      return NextResponse.json({ error: `Stock insuficiente para ${p.name} (disponible: ${p.stock})` }, { status: 400 })
    }
  }

  // Resolver el "buyer" (userId) — si hay affiliateCode, usar ese user; si no, usar el supplier mismo
  let buyerUser: { id: string; name: string; email: string; sponsorId: string | null } | null = null
  if (affiliateCode && affiliateCode.trim()) {
    const code = affiliateCode.trim().toUpperCase()
    buyerUser = await db.user.findFirst({
      where: { affiliateCode: code },
      select: { id: true, name: true, email: true, sponsorId: true },
    })
    if (!buyerUser) {
      return NextResponse.json({ error: `Código de afiliado inválido: ${code}` }, { status: 400 })
    }
  }
  if (!buyerUser) {
    buyerUser = await db.user.findUnique({
      where: { id: supplier.userId },
      select: { id: true, name: true, email: true, sponsorId: true },
    })
  }
  if (!buyerUser) {
    return NextResponse.json({ error: 'No se pudo resolver el comprador' }, { status: 500 })
  }

  // Calcular subtotal, comisión total (ponderada por commissionRate de cada producto)
  // NUEVO MODELO: marketplace = 1% × 3 niveles (N1 + N2 + N3 = 3% total)
  // El combo-publibags NO genera comisión marketplace — genera BagInvestment (5% mensual compuesto)
  const subtotal = +items.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
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

  const marketplaceSubtotal = +marketplaceItems.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
  const investmentAmount = +comboItems.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
  const comboQuantity = comboItems.reduce((s, it) => s + it.quantity, 0)

  // Comisión marketplace: 3% total (1% N1 + 1% N2 + 1% N3)
  const commission = +(marketplaceSubtotal * 0.03).toFixed(2)
  const total = subtotal

  const orderNumber = 'DM-' + String(2000 + Math.floor(Math.random() * 7999))

  // Crear la orden + items + descontar stock en una transacción
  const customerLabel = [customerName, customerPhone].filter(Boolean).join(' · ')
  const shippingAddress = customerLabel || `POS - ${supplier.companyName}`
  const orderCity = supplier.city || undefined

  const order = await db.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId: buyerUser!.id,
        subtotal,
        commission,
        total,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod,
        shippingAddress,
        city: orderCity,
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.price,
          })),
        },
      },
      include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
    })

    // Descontar stock
    for (const it of items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity } },
      })
    }

    return newOrder
  })

  // ===== Crear BagInvestment si hay compra de combo (inversión, no comisión marketplace) =====
  if (comboQuantity > 0 && investmentAmount > 0) {
    try {
      await db.bagInvestment.create({
        data: {
          userId: buyerUser!.id,
          comboQuantity,
          amount: investmentAmount,
          monthlyRate: 0.05,
          currentBalance: investmentAmount,
          lastCompoundAt: new Date(),
          totalEarned: 0,
          orderId: order.id,
          status: 'ACTIVE',
        },
      })
    } catch (invErr) {
      console.error('[pos/sell] bag investment error:', invErr)
    }
  }

  // ===== Generar comisiones marketplace (1% N1 + 1% N2 + 1% N3) =====
  try {
    if (marketplaceSubtotal > 0) {
      const sponsors = []
      let current: { sponsorId: string | null } = buyerUser
      for (let lvl = 1; lvl <= 3; lvl++) {
        if (!current.sponsorId) break
        const sponsor = await db.user.findUnique({
          where: { id: current.sponsorId },
          select: { id: true, sponsorId: true },
        })
        if (!sponsor) break
        sponsors.push(sponsor)
        current = sponsor
      }

      // N1 = sponsors[0], N2 = sponsors[1], N3 = sponsors[2] — 1% cada uno
      if (sponsors[0]) {
        await db.commission.create({
          data: {
            userId: sponsors[0].id,
            orderId: order.id,
            sourceUserId: buyerUser.id,
            amount: +(marketplaceSubtotal * 0.01).toFixed(2),
            level: 1,
            rate: 1,
            status: 'PENDING',
          },
        })
      }
      if (sponsors[1]) {
        await db.commission.create({
          data: {
            userId: sponsors[1].id,
            orderId: order.id,
            sourceUserId: buyerUser.id,
            amount: +(marketplaceSubtotal * 0.01).toFixed(2),
            level: 2,
            rate: 1,
            status: 'PENDING',
          },
        })
      }
      if (sponsors[2]) {
        await db.commission.create({
          data: {
            userId: sponsors[2].id,
            orderId: order.id,
            sourceUserId: buyerUser.id,
            amount: +(marketplaceSubtotal * 0.01).toFixed(2),
            level: 3,
            rate: 1,
            status: 'PENDING',
          },
        })
      }
    }
  } catch (commissionErr) {
    console.error('[pos/sell] commission error:', commissionErr)
  }

  // ===== Notificaciones =====
  try {
    await db.notification.create({
      data: {
        userId: buyerUser.id,
        type: 'ORDER_RECEIVED',
        title: `Venta POS ${orderNumber} registrada`,
        message: `Venta registrada por ${supplier.companyName} por $${total.toFixed(2)}. ${fairId ? 'Asociada a feria.' : ''}`,
        link: '/?module=supplier-backoffice',
      },
    })

    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'ORDER_RECEIVED',
          title: `Nueva venta POS — ${orderNumber}`,
          message: `${supplier.companyName} registró una venta POS por $${total.toFixed(2)} (${paymentMethod}).`,
          link: '/?module=finanzas',
        })),
      })
    }
  } catch (notifErr) {
    console.error('[pos/sell] notif error:', notifErr)
  }

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      orderNumber,
      total,
      subtotal,
      commission,
      paymentMethod,
      items: order.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        price: it.price,
        name: it.product?.name || 'Producto',
        imageUrl: it.product?.imageUrl || null,
      })),
    },
  }, { status: 201 })
}
