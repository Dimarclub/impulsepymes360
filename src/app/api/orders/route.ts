import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, requireRole } from '@/lib/security/auth'

class OrderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'OrderError'
  }
}

const COD_METHODS = ['CONTRA_ENTREGA', 'EFECTIVO']

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

// POST /api/orders
// Crea en UNA transacción: pedido, ítems, inversión de combo, comisiones,
// entrega pendiente (con dirección de retiro del proveedor) y alertas.
// Si algo falla, no queda un pedido sin entrega ni alertas a medias.
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const rawItems = Array.isArray(body.items) ? body.items : []
  if (rawItems.length === 0 || rawItems.length > 100) {
    return NextResponse.json({ error: 'El pedido debe tener entre 1 y 100 productos' }, { status: 400 })
  }
  const requested = new Map<string, number>()
  for (const raw of rawItems) {
    const it = raw as { productId?: unknown; quantity?: unknown }
    const quantity = Number(it?.quantity)
    if (typeof it?.productId !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'Producto o cantidad inválidos' }, { status: 400 })
    }
    requested.set(it.productId, (requested.get(it.productId) || 0) + quantity)
  }

  const shippingAddress = typeof body.shippingAddress === 'string' ? body.shippingAddress.trim().slice(0, 255) : ''
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 100) : ''
  const paymentMethod =
    typeof body.paymentMethod === 'string' && body.paymentMethod.trim()
      ? body.paymentMethod.trim().toUpperCase().slice(0, 30)
      : 'TARJETA'
  const isCod = COD_METHODS.includes(paymentMethod)

  try {
    const order = await db.$transaction(async (tx) => {
      // Precios y comisiones SIEMPRE desde la base de datos, no desde el cliente
      const products = await tx.product.findMany({
        where: { id: { in: [...requested.keys()] }, status: 'ACTIVE' },
        select: { id: true, price: true, slug: true, supplierId: true },
      })
      if (products.length !== requested.size) {
        throw new OrderError('Algún producto ya no está disponible', 400)
      }
      const lines = products.map((p) => ({
        productId: p.id,
        quantity: requested.get(p.id) as number,
        price: p.price,
        isCombo: p.slug === 'combo-publibags',
        supplierId: p.supplierId,
      }))

      const marketplaceLines = lines.filter((l) => !l.isCombo)
      const comboLines = lines.filter((l) => l.isCombo)
      const needsDelivery = marketplaceLines.length > 0

      if (isCod && comboLines.length > 0) {
        throw new OrderError('El combo PubliBags no se puede pagar contra entrega', 400)
      }
      if (needsDelivery && !shippingAddress) {
        throw new OrderError('La dirección de entrega es obligatoria', 400)
      }

      const sum = (ls: typeof lines) => +ls.reduce((s, l) => s + l.price * l.quantity, 0).toFixed(2)
      const subtotal = sum(lines)
      const marketplaceSubtotal = sum(marketplaceLines)
      const investmentAmount = sum(comboLines)
      const comboQuantity = comboLines.reduce((s, l) => s + l.quantity, 0)
      const commission = +(marketplaceSubtotal * 0.03).toFixed(2)
      const total = +subtotal.toFixed(2)

      const orderNumber = 'DM-' + randomBytes(4).toString('hex').toUpperCase()
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          commission,
          total,
          // Contra entrega: queda confirmado pero SIN pagar hasta que el mensajero cobre
          status: 'CONFIRMED',
          paymentStatus: isCod ? 'UNPAID' : 'PAID',
          paymentMethod,
          shippingAddress: shippingAddress || null,
          city: city || null,
          items: { create: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })) },
        },
        include: { items: true },
      })

      if (comboQuantity > 0 && investmentAmount > 0) {
        await tx.bagInvestment.create({
          data: {
            userId,
            comboQuantity,
            amount: investmentAmount,
            monthlyRate: 0, // la tasa vigente la publica la cooperativa; no hay tasa fija prometida
            currentBalance: investmentAmount,
            lastCompoundAt: new Date(),
            totalEarned: 0,
            orderId: created.id,
            status: 'ACTIVE',
          },
        })
      }

      // Comisiones marketplace: 1% a cada uno de los 3 niveles de patrocinadores
      const buyer = await tx.user.findUnique({ where: { id: userId } })
      if (buyer && marketplaceSubtotal > 0) {
        const perLevel = +(marketplaceSubtotal * 0.01).toFixed(2)
        let current = buyer
        for (let level = 1; level <= 3; level += 1) {
          if (!current.sponsorId) break
          const sponsor = await tx.user.findUnique({ where: { id: current.sponsorId } })
          if (!sponsor) break
          await tx.commission.create({
            data: {
              userId: sponsor.id,
              orderId: created.id,
              sourceUserId: buyer.id,
              amount: perLevel,
              level,
              rate: 1,
              status: 'PENDING',
            },
          })
          current = sponsor
        }
      }

      // Proveedores de los ítems + dirección de retiro (sucursal principal)
      const supplierIds = [...new Set(marketplaceLines.map((l) => l.supplierId).filter(Boolean))] as string[]
      const suppliers = supplierIds.length
        ? await tx.supplier.findMany({
            where: { id: { in: supplierIds } },
            include: { branches: { where: { isActive: true }, orderBy: { isMain: 'desc' } } },
          })
        : []

      const pickupParts = suppliers.map((s) => {
        const branch = s.branches[0]
        const where = branch
          ? `${branch.address}, ${branch.city}`
          : [s.address, s.city].filter(Boolean).join(', ')
        return `${s.companyName} — ${where || 'dirección por coordinar'}`
      })
      const pickupAddress = pickupParts.length > 0 ? pickupParts.join(' | ') : null

      if (needsDelivery) {
        await tx.delivery.create({
          data: {
            orderId: created.id,
            status: 'PENDING',
            taskType: 'SOBRE',
            amountToCollect: isCod ? marketplaceSubtotal : 0,
            pickupAddress,
            deliveryAddress: shippingAddress,
            notes: `Pedido ${orderNumber} — ${lines.length} productos — ${buyer?.name || 'cliente'} — ${city || 'N/A'}${
              suppliers.length > 1 ? ' — RETIRO EN VARIOS PROVEEDORES' : ''
            }${isCod ? ` — COBRAR $${marketplaceSubtotal.toFixed(2)}` : ''}`,
          },
        })
      }

      // Alertas (dentro de la transacción: si falla, no se crea el pedido a medias)
      const notifications: Array<{ userId: string; type: string; title: string; message: string; link: string }> = [
        {
          userId,
          type: 'ORDER_RECEIVED',
          title: `Pedido ${orderNumber} confirmado`,
          message: `Tu pedido por $${total.toFixed(2)} fue confirmado. Estamos preparando tu envío.`,
          link: '/?module=marketplace',
        },
      ]

      if (needsDelivery) {
        const admins = await tx.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
        for (const a of admins) {
          notifications.push({
            userId: a.id,
            type: 'ORDER_RECEIVED',
            title: `Nuevo pedido ${orderNumber}`,
            message: `Pedido de ${buyer?.name || 'cliente'} por $${total.toFixed(2)}${
              isCod ? ' (COBRAR contra entrega)' : ''
            }. Retiro: ${pickupAddress || 'por coordinar'}. Requiere asignar mensajero.`,
            link: '/?module=logistics',
          })
        }
        for (const s of suppliers) {
          notifications.push({
            userId: s.userId,
            type: 'ORDER_RECEIVED',
            title: `Nuevo pedido para despachar — ${orderNumber}`,
            message: `Tienes un pedido de ${buyer?.name || 'cliente'}. Prepáralo: un mensajero pasará a retirarlo.`,
            link: '/?module=supplier-backoffice',
          })
        }
      }
      await tx.notification.createMany({ data: notifications })

      return created
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[orders POST] error:', error)
    return NextResponse.json({ error: 'No se pudo crear el pedido' }, { status: 500 })
  }
}
