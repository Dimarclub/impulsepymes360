import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/offers/mine
 *
 * GET (supplier): retorna TODAS las ofertas del proveedor autenticado
 *                  (cualquier estado: PENDING, APPROVED, REJECTED, EXPIRED).
 *                  Incluye datos públicos del supplier (companyName,
 *                  websiteSlug, logoUrl) para mostrar el QR cuando esté
 *                  aprobada.
 *
 *                  Si un ADMIN lo llama, retorna 403 (debe usar
 *                  /api/offers/admin o el módulo ofertas-admin).
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

export async function GET() {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const supplier = await db.supplier.findUnique({
    where: { userId: user.id },
    select: { id: true, companyName: true, userId: true },
  })
  if (!supplier) {
    return NextResponse.json(
      { error: 'No tienes un perfil de proveedor.' },
      { status: 403 },
    )
  }

  const offers = await db.offer.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: 'desc' },
  })

  // Marcar EXPIRED si endDate < now y estaba APPROVED o PENDING
  const now = new Date()
  const toExpire = offers.filter(
    (o) => o.endDate < now && (o.status === 'APPROVED' || o.status === 'PENDING'),
  )
  if (toExpire.length > 0) {
    try {
      await db.offer.updateMany({
        where: { id: { in: toExpire.map((o) => o.id) } },
        data: { status: 'EXPIRED' },
      })
    } catch (err) {
      console.error('[offers/mine GET] expire update error:', err)
    }
  }

  // Provider para websiteSlug + logoUrl
  const provider = await db.provider.findUnique({
    where: { userId: supplier.userId },
    select: { websiteSlug: true, logoUrl: true },
  })
  const websiteSlug = provider?.websiteSlug || slugify(supplier.companyName)

  const result = offers.map((o) => {
    // Aplicar el estado expirado en memoria si se acaba de marcar
    const effectiveStatus =
      o.endDate < now && (o.status === 'APPROVED' || o.status === 'PENDING')
        ? 'EXPIRED'
        : o.status
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
      status: effectiveStatus,
      qrCode: o.qrCode,
      qrTargetUrl: o.qrTargetUrl || `/w/${websiteSlug}`,
      adminNotes: o.adminNotes,
      createdAt: o.createdAt,
      supplier: {
        id: supplier.id,
        companyName: supplier.companyName,
        websiteSlug,
        logoUrl: provider?.logoUrl || null,
      },
    }
  })

  return NextResponse.json({ ok: true, offers: result })
}
