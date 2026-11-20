import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * PATCH /api/dima/admin/reviews/[id]
 * Solo ADMIN. Aprobar (status=PUBLISHED) o rechazar (status=HIDDEN) una review.
 * Body: { status: 'PUBLISHED' | 'HIDDEN' }
 *
 * Al publicar, recalcula el rating promedio del supplier.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const existing = await db.review.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'Reseña no encontrada' },
      { status: 404 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { status } = body as { status?: 'PUBLISHED' | 'HIDDEN' }

  if (status !== 'PUBLISHED' && status !== 'HIDDEN') {
    return NextResponse.json(
      { ok: false, error: 'status debe ser PUBLISHED o HIDDEN' },
      { status: 400 }
    )
  }

  const updated = await db.review.update({
    where: { id },
    data: { status },
  })

  // Recalcular el rating promedio del supplier (si existe)
  try {
    const supplier = await db.supplier.findUnique({
      where: { userId: existing.userId },
      select: { id: true },
    })
    if (supplier) {
      const agg = await db.review.aggregate({
        where: { userId: existing.userId, status: 'PUBLISHED' },
        _avg: { rating: true },
        _count: { rating: true },
      })
      const avg = agg._avg.rating ?? 0
      await db.supplier.update({
        where: { id: supplier.id },
        data: { rating: Number(avg.toFixed(2)) },
      })
    }
  } catch {
    // no bloquear el response si falla la agregación
  }

  return NextResponse.json({ ok: true, review: updated })
}
