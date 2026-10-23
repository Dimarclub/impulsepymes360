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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Asegura que exista una edición "OPEN" con totalSpaces=270 (la edición bolso).
 * Si no existe, la crea con todos los 270 AdSpaces disponibles.
 * Devuelve la edición + sus espacios ya creados.
 */
async function ensureBagEdition() {
  // 1. Buscar edición activa del bolso (270 espacios, status OPEN)
  let edition = await db.adEdition.findFirst({
    where: { status: 'OPEN', totalSpaces: BAG_TOTAL_SPACES },
    orderBy: { startDate: 'desc' },
    include: {
      adSpaces: {
        orderBy: { position: 'asc' },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
        },
      },
    },
  })

  // 2. Si no existe, crear (auto-seed)
  if (!edition) {
    const now = new Date()
    const month = MONTHS_ES[now.getMonth()]
    const year = now.getFullYear()
    const city = 'Guayaquil'
    const name = `Edición PubliBags ${month} ${year} - ${city}`
    let slug = `bag-${year}-${slugify(month)}-${slugify(city)}`

    // Asegurar unicidad del slug
    let suffix = 2
    while (await db.adEdition.findUnique({ where: { slug } })) {
      slug = `bag-${year}-${slugify(month)}-${slugify(city)}-${suffix}`
      suffix++
    }

    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + 60)

    edition = await db.adEdition.create({
      data: {
        name,
        slug,
        city,
        totalSpaces: BAG_TOTAL_SPACES,
        bagSize: '60x50',
        printQuantity: 500,
        startDate: now,
        endDate,
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
          },
        },
      },
    })
  } else {
    // 3. Si la edición existe pero faltan espacios, crearlos
    const existingPositions = new Set(edition.adSpaces.map((s) => s.position))
    const missing: number[] = []
    for (let i = 1; i <= BAG_TOTAL_SPACES; i++) {
      if (!existingPositions.has(i)) missing.push(i)
    }
    if (missing.length > 0) {
      await db.adSpace.createMany({
        data: missing.map((position) => ({
          editionId: edition!.id,
          position,
          type: 'QR',
          status: 'AVAILABLE',
          price: BAG_SPACE_PRICE,
        })),
      })
      // Re-cargar con los nuevos espacios
      edition = await db.adEdition.findUnique({
        where: { id: edition.id },
        include: {
          adSpaces: {
            orderBy: { position: 'asc' },
            include: {
              provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
            },
          },
        },
      })
    }
  }

  return edition!
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

// ---------- GET ----------

export async function GET() {
  try {
    const edition = await ensureBagEdition()

    const spaces = edition.adSpaces.map((s) => ({
      id: s.id,
      position: s.position,
      type: s.type,
      status: s.status,
      price: s.price,
      providerId: s.providerId,
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
    }))

    const stats = computeStats(edition.adSpaces)

    return NextResponse.json({
      edition: {
        id: edition.id,
        name: edition.name,
        slug: edition.slug,
        city: edition.city,
        totalSpaces: edition.totalSpaces,
        bagSize: edition.bagSize,
        printQuantity: edition.printQuantity,
        startDate: edition.startDate,
        endDate: edition.endDate,
        status: edition.status,
      },
      spaces,
      panels: BAG_PANELS.map(serializePanel),
      stats,
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
  action: 'reserve' | 'release' | 'assign'
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
    if (space.edition.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'La edición no está abierta.' },
        { status: 400 }
      )
    }

    let updated
    const now = new Date()

    if (action === 'reserve') {
      // Cualquier usuario autenticado puede reservar si está disponible
      if (space.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'El espacio no está disponible.' },
          { status: 400 }
        )
      }
      updated = await db.adSpace.update({
        where: { id: spaceId },
        data: { status: 'RESERVED', reservedAt: now },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
        },
      })
    } else if (action === 'release') {
      // Liberar: owner de la reserva o ADMIN
      const canRelease =
        user.role === 'ADMIN' ||
        (space.status === 'RESERVED' && space.providerId === user.id) ||
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
          imageUrl: null,
          type: 'QR',
          price: BAG_SPACE_PRICE,
        },
        include: {
          provider: { select: { companyName: true, logoUrl: true, websiteSlug: true } },
        },
      })
    } else if (action === 'assign') {
      // Asignar y vender: solo ADMIN o SUPPLIER
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
        },
      })
    } else {
      return NextResponse.json(
        { error: `Acción inválida: ${action}` },
        { status: 400 }
      )
    }

    const serialized = {
      id: updated.id,
      position: updated.position,
      type: updated.type,
      status: updated.status,
      price: updated.price,
      providerId: updated.providerId,
      provider: updated.provider
        ? {
            companyName: updated.provider.companyName,
            logoUrl: updated.provider.logoUrl,
            websiteSlug: updated.provider.websiteSlug,
          }
        : null,
      imageUrl: updated.imageUrl,
      reservedAt: updated.reservedAt,
      soldAt: updated.soldAt,
    }

    return NextResponse.json({ ok: true, space: serialized })
  } catch (err) {
    console.error('[bag-plan PATCH]', err)
    return NextResponse.json(
      { error: 'Error al actualizar el espacio.' },
      { status: 500 }
    )
  }
}
