import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/offers
 *
 * Sistema de Ofertas — ImpulsePymes360
 *
 * GET  (publico):  retorna todas las ofertas APPROVED activas
 *                   (startDate <= now <= endDate). Incluye supplier +
 *                   provider (vía user) para obtener companyName, logoUrl,
 *                   websiteSlug. Orden: createdAt desc.
 *
 * POST (supplier/admin): crea una nueva oferta en estado PENDING.
 *                   El supplierId se deriva del User autenticado → Supplier.
 */

// ---------- Helpers ----------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'oferta'
}

// ---------- GET (público) ----------
export async function GET() {
  const now = new Date()
  try {
    const offers = await db.offer.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Adjuntar provider (logoUrl, websiteSlug) vía userId del supplier
    const supplierUserIds = offers.map((o) => o.supplier.userId)
    const providers = supplierUserIds.length
      ? await db.provider.findMany({
          where: { userId: { in: supplierUserIds } },
          select: { userId: true, websiteSlug: true, logoUrl: true },
        })
      : []
    const providerByUserId = new Map(providers.map((p) => [p.userId, p]))

    const result = offers.map((o) => {
      const provider = providerByUserId.get(o.supplier.userId)
      const websiteSlug = provider?.websiteSlug || slugify(o.supplier.companyName)
      return {
        id: o.id,
        title: o.title,
        description: o.description,
        originalPrice: o.originalPrice,
        offerPrice: o.offerPrice,
        discountPct: o.discountPct,
        imageUrl: o.imageUrl,
        startDate: o.startDate,
        endDate: o.endDate,
        status: o.status,
        qrCode: o.qrCode,
        qrTargetUrl: o.qrTargetUrl || `/w/${websiteSlug}`,
        createdAt: o.createdAt,
        supplier: {
          id: o.supplier.id,
          companyName: o.supplier.companyName,
          websiteSlug,
          logoUrl: provider?.logoUrl || null,
        },
      }
    })

    return NextResponse.json({ ok: true, offers: result })
  } catch (err) {
    console.error('[offers GET] error:', err)
    return NextResponse.json({ ok: true, offers: [] })
  }
}

// ---------- POST (supplier/admin) ----------
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string; name: string }

  let body: {
    title?: string
    description?: string
    originalPrice?: number | string | null
    offerPrice?: number | string | null
    discountPct?: number | string | null
    imageUrl?: string | null
    startDate?: string
    endDate?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  if (!title) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
  }
  if (!body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: 'Las fechas de inicio y fin son obligatorias' },
      { status: 400 },
    )
  }

  const startDate = new Date(body.startDate)
  const endDate = new Date(body.endDate)
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  if (endDate <= startDate) {
    return NextResponse.json(
      { error: 'La fecha de fin debe ser posterior a la de inicio' },
      { status: 400 },
    )
  }

  // Resolver supplierId desde el User autenticado
  let supplier
  if (user.role === 'ADMIN') {
    // Un admin no tiene perfil de proveedor por defecto.
    return NextResponse.json(
      { error: 'El admin debe crear ofertas desde el backoffice del proveedor.' },
      { status: 400 },
    )
  } else {
    supplier = await db.supplier.findUnique({ where: { userId: user.id } })
    if (!supplier) {
      return NextResponse.json(
        { error: 'No tienes un perfil de proveedor. Contacta al administrador.' },
        { status: 403 },
      )
    }
  }

  // Precios y descuento
  const originalPrice = body.originalPrice != null && body.originalPrice !== ''
    ? Number(body.originalPrice)
    : null
  const offerPrice = body.offerPrice != null && body.offerPrice !== ''
    ? Number(body.offerPrice)
    : null
  let discountPct = body.discountPct != null && body.discountPct !== ''
    ? Math.round(Number(body.discountPct))
    : null

  if (originalPrice != null && offerPrice != null && originalPrice > 0) {
    const calc = Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
    if (discountPct == null) discountPct = calc
  }
  if (discountPct != null && (discountPct < 0 || discountPct > 100)) {
    return NextResponse.json(
      { error: 'El porcentaje de descuento debe estar entre 0 y 100' },
      { status: 400 },
    )
  }

  const description = body.description?.trim() || null
  const imageUrl = body.imageUrl?.trim() || null

  try {
    const offer = await db.offer.create({
      data: {
        supplierId: supplier.id,
        title,
        description,
        originalPrice,
        offerPrice,
        discountPct,
        imageUrl,
        startDate,
        endDate,
        status: 'PENDING',
      },
    })

    // Notificar a todos los ADMIN — best-effort
    try {
      const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'OFFER_RECEIVED',
            title: 'Nueva oferta pendiente de aprobación',
            message: `${supplier.companyName} envió la oferta "${title}". Revísala y apruébala o recházala.`,
            link: '/?module=ofertas-admin',
          })),
        })
      }
    } catch (notifErr) {
      console.error('[offers POST] notif error:', notifErr)
    }

    return NextResponse.json({ ok: true, offer }, { status: 201 })
  } catch (err) {
    console.error('[offers POST] create error:', err)
    return NextResponse.json({ error: 'No se pudo crear la oferta' }, { status: 500 })
  }
}
