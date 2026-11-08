import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REJECTED']

/**
 * GET /api/reservas/admin
 * Lista TODOS los bookings del sistema. Solo ADMIN.
 * Query: ?status=&supplierId=&from=&to=
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const supplierId = searchParams.get('supplierId')
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  const where: {
    status?: string
    supplierId?: string
    createdAt?: { gte?: Date; lte?: Date }
  } = {}
  if (status && VALID_STATUSES.includes(status)) where.status = status
  if (supplierId) where.supplierId = supplierId
  if (fromStr || toStr) {
    const gte = fromStr ? new Date(fromStr) : undefined
    const lte = toStr ? new Date(toStr) : undefined
    if ((gte && !isNaN(gte.getTime())) || (lte && !isNaN(lte.getTime()))) {
      where.createdAt = {}
      if (gte) where.createdAt.gte = gte
      if (lte) where.createdAt.lte = lte
    }
  }

  const [bookings, total, pending, confirmed, revenueAgg] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        room: { select: { id: true, name: true, type: true, city: true, imageUrl: true } },
        supplier: { select: { id: true, companyName: true, city: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      take: 1000,
    }),
    db.booking.count({ where }),
    db.booking.count({ where: { ...where, status: 'PENDING' } }),
    db.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
    db.booking.aggregate({
      where: { ...where, status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] } },
      _sum: { total: true },
    }),
  ])

  return NextResponse.json({
    ok: true,
    bookings,
    stats: {
      total,
      pending,
      confirmed,
      revenue: revenueAgg._sum.total || 0,
    },
  })
}
