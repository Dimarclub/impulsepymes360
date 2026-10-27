import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, type SessionUser } from '@/lib/security/auth'

/**
 * /api/offers/[id]
 *
 * GET    (público): retorna una oferta APPROVED activa por id.
 * PATCH  (admin):   aprueba o rechaza una oferta.
 *                    Body: { action: 'approve' | 'reject', adminNotes? }
 *                    - approve → status APPROVED, genera qrCode (4 letras del
 *                      nombre del supplier + 4 dígitos aleatorios), set
 *                      qrTargetUrl = /w/{provider.websiteSlug || slug}.
 *                      Notifica al supplier.
 *                    - reject  → status REJECTED, set adminNotes. Notifica.
 * DELETE (admin | supplier owner): elimina la oferta.
 */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'oferta'
}

function randomDigits(n: number): string {
  let out = ''
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString()
  return out
}

function makeQrCode(companyName: string): string {
  const base = (companyName || 'OFRT')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X')
  return `${base}${randomDigits(4)}`
}

// ---------- GET (público) ----------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const now = new Date()
  try {
    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { id: true, companyName: true, userId: true },
        },
      },
    })
    if (!offer) {
      return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
    }
    // Público solo puede ver APPROVED activas
    const isActive =
      offer.status === 'APPROVED' &&
      offer.startDate <= now &&
      offer.endDate >= now
    if (!isActive) {
      return NextResponse.json({ error: 'Oferta no disponible' }, { status: 404 })
    }

    const provider = await db.provider.findUnique({
      where: { userId: offer.supplier.userId },
      select: { websiteSlug: true, logoUrl: true },
    })
    const websiteSlug = provider?.websiteSlug || slugify(offer.supplier.companyName)

    return NextResponse.json({
      ok: true,
      offer: {
        id: offer.id,
        title: offer.title,
        description: offer.description,
        originalPrice: offer.originalPrice,
        offerPrice: offer.offerPrice,
        discountPct: offer.discountPct,
        imageUrl: offer.imageUrl,
        startDate: offer.startDate,
        endDate: offer.endDate,
        status: offer.status,
        qrCode: offer.qrCode,
        qrTargetUrl: offer.qrTargetUrl || `/w/${websiteSlug}`,
        createdAt: offer.createdAt,
        supplier: {
          id: offer.supplier.id,
          companyName: offer.supplier.companyName,
          websiteSlug,
          logoUrl: provider?.logoUrl || null,
        },
      },
    })
  } catch (err) {
    console.error('[offers/[id] GET] error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// ---------- PATCH (admin) ----------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const adminUser = auth as SessionUser

  const { id } = await params
  let body: { action?: string; adminNotes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const action = (body.action || '').toLowerCase()
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { error: "action debe ser 'approve' o 'reject'" },
      { status: 400 },
    )
  }

  const offer = await db.offer.findUnique({
    where: { id },
    include: { supplier: { select: { id: true, companyName: true, userId: true } } },
  })
  if (!offer) {
    return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
  }

  const adminNotes = body.adminNotes?.trim() || null

  if (action === 'approve') {
    // Generar qrCode + qrTargetUrl
    const provider = await db.provider.findUnique({
      where: { userId: offer.supplier.userId },
      select: { websiteSlug: true },
    })
    const websiteSlug = provider?.websiteSlug || slugify(offer.supplier.companyName)
    const qrCode = makeQrCode(offer.supplier.companyName)
    const qrTargetUrl = `/w/${websiteSlug}`

    const updated = await db.offer.update({
      where: { id },
      data: {
        status: 'APPROVED',
        qrCode,
        qrTargetUrl,
        adminNotes,
      },
    })

    // Notificar al supplier (vía user)
    try {
      await db.notification.create({
        data: {
          userId: offer.supplier.userId,
          type: 'OFFER_APPROVED',
          title: '¡Tu oferta fue aprobada!',
          message: `La oferta "${offer.title}" fue aprobada y ya es visible en el módulo público de Ofertas. QR: ${qrCode}`,
          link: '/?module=supplier-backoffice',
        },
      })
    } catch (notifErr) {
      console.error('[offers/[id] PATCH approve] notif error:', notifErr)
    }

    return NextResponse.json({ ok: true, offer: updated })
  } else {
    // reject
    const updated = await db.offer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNotes,
      },
    })

    try {
      await db.notification.create({
        data: {
          userId: offer.supplier.userId,
          type: 'OFFER_REJECTED',
          title: 'Tu oferta fue rechazada',
          message: `La oferta "${offer.title}" fue rechazada${adminNotes ? `: ${adminNotes}` : ''}. Puedes editarla y reenviarla.`,
          link: '/?module=supplier-backoffice',
        },
      })
    } catch (notifErr) {
      console.error('[offers/[id] PATCH reject] notif error:', notifErr)
    }

    return NextResponse.json({ ok: true, offer: updated })
  }
}

// ---------- DELETE (admin | supplier owner) ----------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as SessionUser

  const { id } = await params
  const offer = await db.offer.findUnique({
    where: { id },
    select: { id: true, supplierId: true, supplier: { select: { userId: true } } },
  })
  if (!offer) {
    return NextResponse.json({ error: 'Oferta no encontrada' }, { status: 404 })
  }

  // Verificar ownership: admin o supplier dueño
  const isOwner = offer.supplier.userId === user.id
  if (user.role !== 'ADMIN' && !isOwner) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  try {
    await db.offer.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[offers/[id] DELETE] error:', err)
    return NextResponse.json({ error: 'No se pudo eliminar la oferta' }, { status: 500 })
  }
}
