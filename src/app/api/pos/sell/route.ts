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
  const subtotal = +items.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
  const productRateMap = new Map(products.map((p) => [p.id, p.commissionRate || 9]))
  const commission = +items.reduce((s, it) => {
    const rate = productRateMap.get(it.productId) || 9
    return s + (it.price * it.quantity * rate / 100)
  }, 0).toFixed(2)
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

  // ===== Generar comisiones N0 + N1-N3 (sobre subtotal) =====
  try {
    const n0Amount = +(subtotal * 0.03).toFixed(2)
    const extraCommission = +items.reduce((s, it) => {
      const rate = productRateMap.get(it.productId) || 9
      const extra = Math.max(0, rate - 9)
      return s + (it.price * it.quantity * extra / 100)
    }, 0).toFixed(2)

    await db.commission.create({
      data: {
        userId: buyerUser.id,
        orderId: order.id,
        sourceUserId: buyerUser.id,
        amount: +(n0Amount + extraCommission).toFixed(2),
        level: 0,
        rate: 3 + (extraCommission > 0 ? (extraCommission / subtotal * 100) : 0),
        status: 'PENDING',
      },
    })

    let current: { sponsorId: string | null } = buyerUser
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (!current.sponsorId) break
      const sponsor = await db.user.findUnique({
        where: { id: current.sponsorId },
        select: { id: true, sponsorId: true },
      })
      if (!sponsor) break
      await db.commission.create({
        data: {
          userId: sponsor.id,
          orderId: order.id,
          sourceUserId: buyerUser.id,
          amount: +(subtotal * 0.02).toFixed(2),
          level: lvl,
          rate: 2,
          status: 'PENDING',
        },
      })
      current = sponsor
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
