import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/security/auth'
import {
  BAG_PANELS,
  BAG_TOTAL_SPACES,
  BAG_SPACE_PRICE,
  type BagPanel,
} from '@/lib/bag-plan'

// ---------- Helpers ----------

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DEMO_SPONSORS = [
  { name: 'TecnoExpress', color: 'emerald' },
  { name: 'Hogar Total', color: 'amber' },
  { name: 'Moda Fashion', color: 'rose' },
  { name: 'Fresca y Sano', color: 'orange' },
  { name: 'Autopartes DIM', color: 'teal' },
  { name: 'Farmacia Salud', color: 'green' },
  { name: 'Auki Chocolate', color: 'yellow' },
  { name: 'Bazar Dimar', color: 'pink' },
  { name: 'Dimar Tour', color: 'cyan' },
  { name: 'Comprovit', color: 'lime' },
  { name: 'Reciclarte', color: 'fuchsia' },
  { name: 'Impresión 3D', color: 'red' },
  { name: 'Pizza Express', color: 'orange' },
  { name: 'Boutique Bella', color: 'purple' },
  { name: 'Ferretería El Tornillo', color: 'stone' },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function monthLabel(d: Date): string {
  return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function nextMonthDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0)
}

/**
 * Asegura que existan las dos ediciones del bolso:
 *  - currentEdition (este mes, PRINTED, 297 SOLD con sponsors demo)
 *  - nextEdition (mes siguiente, OPEN, 297 AVAILABLE)
 */
async function ensureTwoEditions() {
  const now = new Date()
  const city = 'Guayaquil'

  // ===== Current edition (PRINTED, este mes) =====
  const currentSlug = `bag-${now.getFullYear()}-${slugify(MONTHS_ES[now.getMonth()])}-${slugify(city)}-actual`
  let currentEdition = await db.adEdition.findUnique({
    where: { slug: currentSlug },
    include: {
      adSpaces: {
        orderBy: { position: 'asc' },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
          buyer: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!currentEdition) {
    const start = firstOfMonth(now)
    const end = lastOfMonth(now)
    const name = `Edición PubliBags ${MONTHS_ES[now.getMonth()]} ${now.getFullYear()} - ${city}`
    currentEdition = await db.adEdition.create({
      data: {
        name,
        slug: currentSlug,
        city,
        totalSpaces: BAG_TOTAL_SPACES,
        bagSize: '60x50',
        printQuantity: 500,
        startDate: start,
        endDate: end,
        status: 'PRINTED',
        adSpaces: {
          create: Array.from({ length: BAG_TOTAL_SPACES }, (_, i) => {
            const position = i + 1
            const sponsor = DEMO_SPONSORS[(position + now.getMonth()) % DEMO_SPONSORS.length]
            return {
              position,
              type: position % 4 === 0 ? 'IMAGE' : 'QR',
              status: 'SOLD',
              price: BAG_SPACE_PRICE,
              soldAt: start,
              buyerName: sponsor.name,
            }
          }),
        },
      },
      include: {
        adSpaces: {
          orderBy: { position: 'asc' },
          include: {
            provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
            buyer: { select: { id: true, name: true } },
          },
        },
      },
    })
  } else {
    // Re-llenar posiciones faltantes como SOLD demo (idempotente)
    const existingPositions = new Set(currentEdition.adSpaces.map((s) => s.position))
    const missing: number[] = []
    for (let i = 1; i <= BAG_TOTAL_SPACES; i++) {
      if (!existingPositions.has(i)) missing.push(i)
    }
    if (missing.length > 0) {
      await db.adSpace.createMany({
        data: missing.map((position) => {
          const sponsor = DEMO_SPONSORS[(position + now.getMonth()) % DEMO_SPONSORS.length]
          return {
            editionId: currentEdition!.id,
            position,
            type: position % 4 === 0 ? 'IMAGE' : 'QR',
            status: 'SOLD',
            price: BAG_SPACE_PRICE,
            soldAt: firstOfMonth(now),
            buyerName: sponsor.name,
          }
        }),
      })
      currentEdition = await db.adEdition.findUnique({
        where: { id: currentEdition.id },
        include: {
          adSpaces: {
            orderBy: { position: 'asc' },
            include: {
              provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
              buyer: { select: { id: true, name: true } },
            },
          },
        },
      })!
    }
  }

  // ===== Next edition (OPEN, mes siguiente) =====
  const next = nextMonthDate(now)
  const nextSlug = `bag-${next.getFullYear()}-${slugify(MONTHS_ES[next.getMonth()])}-${slugify(city)}-proxima`
  let nextEdition = await db.adEdition.findUnique({
    where: { slug: nextSlug },
    include: {
      adSpaces: {
        orderBy: { position: 'asc' },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
          buyer: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!nextEdition) {
    const start = firstOfMonth(next)
    const end = lastOfMonth(next)
    const name = `Edición PubliBags ${MONTHS_ES[next.getMonth()]} ${next.getFullYear()} - ${city}`
    nextEdition = await db.adEdition.create({
      data: {
        name,
        slug: nextSlug,
        city,
        totalSpaces: BAG_TOTAL_SPACES,
        bagSize: '60x50',
        printQuantity: 500,
        startDate: start,
        endDate: end,
        status: 'OPEN',
        adSpaces: {
          create: Array.from({ length: BAG_TOTAL_SPACES }, (_, i) => ({
            position: i + 1,
            type: 'QR',
            status: 'AVAILABLE',
            price: BAG_SPACE_PRICE,
          })),
        },
      },
      include: {
        adSpaces: {
          orderBy: { position: 'asc' },
          include: {
            provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
            buyer: { select: { id: true, name: true } },
          },
        },
      },
    })
  } else {
    const existingPositions = new Set(nextEdition.adSpaces.map((s) => s.position))
    const missing: number[] = []
    for (let i = 1; i <= BAG_TOTAL_SPACES; i++) {
      if (!existingPositions.has(i)) missing.push(i)
    }
    if (missing.length > 0) {
      await db.adSpace.createMany({
        data: missing.map((position) => ({
          editionId: nextEdition!.id,
          position,
          type: 'QR',
          status: 'AVAILABLE',
          price: BAG_SPACE_PRICE,
        })),
      })
      nextEdition = await db.adEdition.findUnique({
        where: { id: nextEdition.id },
        include: {
          adSpaces: {
            orderBy: { position: 'asc' },
            include: {
              provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
              buyer: { select: { id: true, name: true } },
            },
          },
        },
      })!
    }
  }

  return { currentEdition: currentEdition!, nextEdition: nextEdition! }
}

function computeStats(spaces: Array<{ status: string; price: number }>) {
  let available = 0
  let reserved = 0
  let sold = 0
  let revenue = 0
  for (const s of spaces) {
    if (s.status === 'AVAILABLE') available++
    else if (s.status === 'RESERVED') reserved++
    else if (s.status === 'SOLD') {
      sold++
      revenue += s.price || 0
    }
  }
  return {
    total: BAG_TOTAL_SPACES,
    available,
    reserved,
    sold,
    revenue,
    potential: BAG_TOTAL_SPACES * BAG_SPACE_PRICE,
  }
}

function serializePanel(p: BagPanel) {
  return {
    key: p.key,
    label: p.label,
    cols: p.cols,
    rows: p.rows,
    start: p.start,
    end: p.end,
    widthCm: p.widthCm,
    heightCm: p.heightCm,
  }
}

function serializeEdition(e: {
  id: string
  name: string
  slug: string
  city: string
  totalSpaces: number
  bagSize: string
  printQuantity: number
  startDate: Date
  endDate: Date
  status: string
}) {
  return {
    id: e.id,
    name: e.name,
    slug: e.slug,
    city: e.city,
    totalSpaces: e.totalSpaces,
    bagSize: e.bagSize,
    printQuantity: e.printQuantity,
    startDate: e.startDate,
    endDate: e.endDate,
    status: e.status,
    monthLabel: monthLabel(e.startDate),
  }
}

function serializeSpace(s: {
  id: string
  position: number
  type: string
  status: string
  price: number
  providerId: string | null
  buyerId: string | null
  buyerName: string | null
  imageUrl: string | null
  reservedAt: Date | null
  soldAt: Date | null
  provider: { companyName: string; logoUrl: string | null; websiteSlug?: string } | null
  buyer: { id: string; name: string } | null
}) {
  return {
    id: s.id,
    position: s.position,
    type: s.type,
    status: s.status,
    price: s.price,
    providerId: s.providerId,
    buyerId: s.buyerId,
    buyerName: s.buyerName,
    provider: s.provider
      ? {
          companyName: s.provider.companyName,
          logoUrl: s.provider.logoUrl,
          websiteSlug: s.provider.websiteSlug,
        }
      : null,
    imageUrl: s.imageUrl,
    reservedAt: s.reservedAt,
    soldAt: s.soldAt,
  }
}

// ---------- GET ----------

export async function GET() {
  try {
    const { currentEdition, nextEdition } = await ensureTwoEditions()

    const currentSpaces = currentEdition.adSpaces.map(serializeSpace)
    const nextSpaces = nextEdition.adSpaces.map(serializeSpace)
    const currentStats = computeStats(currentEdition.adSpaces)
    const nextStats = computeStats(nextEdition.adSpaces)

    return NextResponse.json({
      currentEdition: serializeEdition(currentEdition),
      nextEdition: serializeEdition(nextEdition),
      currentSpaces,
      nextSpaces,
      panels: BAG_PANELS.map(serializePanel),
      currentStats,
      nextStats,
    })
  } catch (err) {
    console.error('[bag-plan GET]', err)
    return NextResponse.json(
      { error: 'Error al cargar el plano del bolso' },
      { status: 500 }
    )
  }
}

// ---------- PATCH ----------

interface PatchBody {
  spaceId: string
  action: 'reserve' | 'release' | 'assign' | 'buy'
  providerId?: string
  type?: 'QR' | 'IMAGE' | 'LOGO'
  imageUrl?: string
  price?: number
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión.' },
        { status: 401 }
      )
    }

    const body = (await req.json()) as PatchBody
    const { spaceId, action } = body
    if (!spaceId || !action) {
      return NextResponse.json(
        { error: 'Faltan parámetros (spaceId, action).' },
        { status: 400 }
      )
    }

    const space = await db.adSpace.findUnique({
      where: { id: spaceId },
      include: { edition: true },
    })
    if (!space) {
      return NextResponse.json({ error: 'Espacio no encontrado.' }, { status: 404 })
    }

    const now = new Date()

    // ===== BUY: el flujo principal de compra → socio + aporte + comisiones =====
    if (action === 'buy') {
      // Debe ser la edición OPEN (nextEdition)
      if (space.edition.status !== 'OPEN') {
        return NextResponse.json(
          { error: 'Esta campaña no está abierta para compra.' },
          { status: 400 }
        )
      }
      if (space.status !== 'AVAILABLE' && space.status !== 'RESERVED') {
        return NextResponse.json(
          { error: 'El espacio no está disponible para compra.' },
          { status: 400 }
        )
      }
      // Si está RESERVED, debe ser por este usuario (o admin) — pero en nuestro flujo
      // el reserve no asigna providerId al usuario, así que permitimos comprar igual.
      const price = typeof body.price === 'number' && body.price > 0 ? body.price : BAG_SPACE_PRICE
      const type = body.type || 'QR'
      const imageUrl = body.imageUrl || null
      const cashback = +(price * 0.03).toFixed(2) // N0: 3%
      const sponsorCommission = +(price * 0.02).toFixed(2) // N1-N3: 2%

      // Transacción atómica: Partner + PartnerContribution + CooperativeAccount +
      // DEPOSIT + N0 cashback + cadena de sponsors (Commission + COMMISSION_MARKETPLACE) +
      // Notification.
      const result = await db.$transaction(async (tx) => {
        const [updatedSpace, partner] = await Promise.all([
          tx.adSpace.update({
            where: { id: spaceId },
            data: {
              status: 'SOLD',
              soldAt: now,
              reservedAt: space.reservedAt ?? now,
              buyerId: user.id,
              buyerName: user.name,
              type,
              imageUrl,
              price,
            },
            include: {
              provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
              buyer: { select: { id: true, name: true } },
            },
          }),
          tx.partner.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              totalContribution: price,
              totalReturns: 0,
              status: 'ACTIVE',
            },
            update: {
              totalContribution: { increment: price },
            },
            select: { id: true, userId: true },
          }),
        ])

        // 3. PartnerContribution
        await tx.partnerContribution.create({
          data: {
            partnerId: partner.id,
            amount: price,
            returnRate: 5,
            monthlyReturn: +(price * 0.05).toFixed(2),
            status: 'ACTIVE',
            date: now,
          },
        })

        // 4. Upsert CooperativeAccount del comprador
        const buyerAccount = await tx.cooperativeAccount.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            balance: price + cashback,
            totalContributed: price,
            totalEarned: cashback,
            interestRate: 5,
            status: 'ACTIVE',
          },
          update: {
            balance: { increment: price + cashback },
            totalContributed: { increment: price },
            totalEarned: { increment: cashback },
          },
          select: { id: true, balance: true, userId: true },
        })

        // 5. DEPOSIT transaction
        await tx.cooperativeTransaction.create({
          data: {
            accountId: buyerAccount.id,
            type: 'DEPOSIT',
            amount: price,
            description: `Aporte por compra espacio PubliBags #${space.position} — ${space.edition.name}`,
            referenceId: space.id,
            status: 'COMPLETED',
          },
        })

        // 6. N0 cashback COMMISSION_MARKETPLACE
        await tx.cooperativeTransaction.create({
          data: {
            accountId: buyerAccount.id,
            type: 'COMMISSION_MARKETPLACE',
            amount: cashback,
            description: `Cashback 3% N0 por compra espacio #${space.position}`,
            referenceId: space.id,
            status: 'COMPLETED',
          },
        })

        // 7. Sponsor chain (3 niveles)
        const sponsorCommissions: Array<{ level: number; amount: number; sponsorName?: string }> = []
        let cursor = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, sponsorId: true, name: true },
        })
        for (let lvl = 1; lvl <= 3; lvl++) {
          if (!cursor?.sponsorId) break
          const sponsor = await tx.user.findUnique({
            where: { id: cursor.sponsorId },
            select: { id: true, sponsorId: true, name: true },
          })
          if (!sponsor) break

          // Commission record (PENDING)
          await tx.commission.create({
            data: {
              userId: sponsor.id,
              sourceUserId: user.id,
              amount: sponsorCommission,
              level: lvl,
              rate: 2,
              status: 'PENDING',
            },
          })

          // Upsert sponsor's cooperative account
          const sponsorAccount = await tx.cooperativeAccount.upsert({
            where: { userId: sponsor.id },
            create: {
              userId: sponsor.id,
              balance: sponsorCommission,
              totalContributed: 0,
              totalEarned: sponsorCommission,
              interestRate: 5,
              status: 'ACTIVE',
            },
            update: {
              balance: { increment: sponsorCommission },
              totalEarned: { increment: sponsorCommission },
            },
            select: { id: true, userId: true },
          })

          await tx.cooperativeTransaction.create({
            data: {
              accountId: sponsorAccount.id,
              type: 'COMMISSION_MARKETPLACE',
              amount: sponsorCommission,
              description: `Comisión N${lvl} (2%) por compra PubliBags #${space.position} de ${user.name}`,
              referenceId: space.id,
              status: 'COMPLETED',
            },
          })

          sponsorCommissions.push({ level: lvl, amount: sponsorCommission, sponsorName: sponsor.name })
          cursor = sponsor
        }

        // 8. Notification
        const totalSponsorComms = sponsorCommissions.reduce((a, c) => a + c.amount, 0)
        await tx.notification.create({
          data: {
            userId: user.id,
            type: 'PUBLIBAGS_PURCHASE',
            title: '¡Eres socio PubliBags!',
            message:
              `Compraste el espacio #${space.position} por $${price.toFixed(2)}. ` +
              `Tu aporte de capital genera 5% interés mensual compuesto. ` +
              (sponsorCommissions.length > 0
                ? `Tu red de afiliados ganó $${totalSponsorComms.toFixed(2)} en comisiones.`
                : ''),
          },
        })

        return {
          space: updatedSpace,
          newBalance: buyerAccount.balance,
          sponsorCommissions: sponsorCommissions,
        }
      })

      const serialized = serializeSpace({
        ...result.space,
        buyerId: result.space.buyer?.id ?? null,
        buyerName: result.space.buyer?.name ?? space.buyerName,
      })

      return NextResponse.json({
        ok: true,
        space: serialized,
        financial: {
          aporte: price,
          cashback,
          sponsorCommissions: result.sponsorCommissions,
          newBalance: result.newBalance,
        },
      })
    }

    // ===== Acciones heredadas: reserve / release / assign =====
    if (space.edition.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'La edición no está abierta.' },
        { status: 400 }
      )
    }

    let updated

    if (action === 'reserve') {
      if (space.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'El espacio no está disponible.' },
          { status: 400 }
        )
      }
      updated = await db.adSpace.update({
        where: { id: spaceId },
        data: { status: 'RESERVED', reservedAt: now, buyerId: user.id, buyerName: user.name },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
          buyer: { select: { id: true, name: true } },
        },
      })
    } else if (action === 'release') {
      const canRelease =
        user.role === 'ADMIN' ||
        (space.status === 'RESERVED' && space.buyerId === user.id) ||
        (space.status === 'SOLD' && user.role === 'ADMIN')
      if (!canRelease) {
        return NextResponse.json(
          { error: 'No tienes permisos para liberar este espacio.' },
          { status: 403 }
        )
      }
      updated = await db.adSpace.update({
        where: { id: spaceId },
        data: {
          status: 'AVAILABLE',
          reservedAt: null,
          soldAt: null,
          providerId: null,
          buyerId: null,
          buyerName: null,
          imageUrl: null,
          type: 'QR',
          price: BAG_SPACE_PRICE,
        },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
          buyer: { select: { id: true, name: true } },
        },
      })
    } else if (action === 'assign') {
      if (user.role !== 'ADMIN' && user.role !== 'SUPPLIER') {
        return NextResponse.json(
          { error: 'Permisos insuficientes para asignar espacios.' },
          { status: 403 }
        )
      }
      const providerId = body.providerId || null
      const type = body.type || 'QR'
      const price =
        typeof body.price === 'number' && body.price >= 0 ? body.price : space.price
      const imageUrl = body.imageUrl || null

      updated = await db.adSpace.update({
        where: { id: spaceId },
        data: {
          status: 'SOLD',
          soldAt: now,
          reservedAt: space.reservedAt ?? now,
          providerId,
          type,
          imageUrl,
          price,
        },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
          buyer: { select: { id: true, name: true } },
        },
      })
    } else {
      return NextResponse.json(
        { error: `Acción inválida: ${action}` },
        { status: 400 }
      )
    }

    const serialized = serializeSpace({
      ...updated,
      buyerId: updated.buyer?.id ?? null,
      buyerName: updated.buyer?.name ?? null,
    })

    return NextResponse.json({ ok: true, space: serialized })
  } catch (err) {
    console.error('[bag-plan PATCH]', err)
    return NextResponse.json(
      { error: 'Error al actualizar el espacio.' },
      { status: 500 }
    )
  }
}
