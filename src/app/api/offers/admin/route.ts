import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/offers/admin
 *
 * GET (admin): retorna TODAS las ofertas (cualquier estado) para que el
 *              admin las revise. Orden: PENDING primero, luego APPROVED,
 *              REJECTED, EXPIRED, y dentro de cada grupo por createdAt desc.
 *              Incluye supplier (companyName, websiteSlug, logoUrl).
 *
 *              Marca como EXPIRED las ofertas APPROVED o PENDING cuya
 *              endDate ya pasó.
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

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  EXPIRED: 3,
}

export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  try {
    const offers = await db.offer.findMany({
      include: {
        supplier: {
          select: { id: true, companyName: true, userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Marcar EXPIRED en DB para las que ya pasaron
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
        console.error('[offers/admin GET] expire update error:', err)
      }
    }

    // Lookup providers en lote
    const userIds = offers.map((o) => o.supplier.userId)
    const providers = userIds.length
      ? await db.provider.findMany({
          where: { userId: { in: userIds } },
          select: { userId: true, websiteSlug: true, logoUrl: true },
        })
      : []
    const providerByUserId = new Map(providers.map((p) => [p.userId, p]))

    const result = offers
      .map((o) => {
        const provider = providerByUserId.get(o.supplier.userId)
        const websiteSlug = provider?.websiteSlug || slugify(o.supplier.companyName)
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
            id: o.supplier.id,
            companyName: o.supplier.companyName,
            websiteSlug,
            logoUrl: provider?.logoUrl || null,
          },
        }
      })
      .sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 99
        const sb = STATUS_ORDER[b.status] ?? 99
        if (sa !== sb) return sa - sb
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    return NextResponse.json({ ok: true, offers: result })
  } catch (err) {
    console.error('[offers/admin GET] error:', err)
    return NextResponse.json({ ok: true, offers: [] })
  }
}
