import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin/reviews
 * Solo ADMIN. Lista TODAS las reviews (por defecto PENDING) con supplier + user info.
 * Filtros: ?status=PENDING|PUBLISHED|HIDDEN
 *
 * Nota: Review.userId es el userId del supplier (recibe la reseña). Para obtener
 * el supplier info buscamos Supplier donde userId === Review.userId.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status')

  const where: any = {}
  if (statusParam && ['PENDING', 'PUBLISHED', 'HIDDEN'].includes(statusParam)) {
    where.status = statusParam
  } else {
    where.status = 'PENDING'
  }

  const reviews = await db.review.findMany({
    where,
    include: {
      user: {
        // El supplier user (recibe la reseña)
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Para cada review, resolver el Supplier donde userId === review.userId
  const supplierUserIds = Array.from(
    new Set(reviews.map((r) => r.userId).filter(Boolean))
  )
  const suppliers = await db.supplier.findMany({
    where: { userId: { in: supplierUserIds } },
    select: {
      id: true,
      userId: true,
      companyName: true,
      city: true,
      category: true,
      rating: true,
    },
  })
  const supplierByUserId = new Map(suppliers.map((s) => [s.userId, s]))

  return NextResponse.json({
    ok: true,
    reviews: reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      customerName: r.customerName,
      customerEmail: r.customerEmail,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      source: r.source,
      status: r.status,
      response: r.response,
      respondedAt: r.respondedAt,
      createdAt: r.createdAt,
      user: r.user,
      supplier: supplierByUserId.get(r.userId) || null,
    })),
  })
}
