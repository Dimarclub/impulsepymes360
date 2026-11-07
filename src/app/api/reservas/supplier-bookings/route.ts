import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REJECTED']

/**
 * GET /api/reservas/supplier-bookings
 * Lista bookings de los rooms del supplier actual.
 * Query: ?status=PENDING|...
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
  if (!sup) {
    return NextResponse.json({
      ok: true,
      bookings: [],
      stats: { pending: 0, confirmed: 0, checkedIn: 0, checkedOut: 0, cancelled: 0, revenue: 0 },
    })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where: { supplierId: string; status?: string } = { supplierId: sup.id }
  if (status && VALID_STATUSES.includes(status)) where.status = status

  const [bookings, pending, confirmed, checkedIn, checkedOut, cancelled, revenueAgg] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: { checkIn: 'asc' },
      include: {
        room: { select: { id: true, name: true, type: true, imageUrl: true, city: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      take: 500,
    }),
    db.booking.count({ where: { supplierId: sup.id, status: 'PENDING' } }),
    db.booking.count({ where: { supplierId: sup.id, status: 'CONFIRMED' } }),
    db.booking.count({ where: { supplierId: sup.id, status: 'CHECKED_IN' } }),
    db.booking.count({ where: { supplierId: sup.id, status: 'CHECKED_OUT' } }),
    db.booking.count({ where: { supplierId: sup.id, status: { in: ['CANCELLED', 'NO_SHOW', 'REJECTED'] } } }),
    db.booking.aggregate({
      where: { supplierId: sup.id, status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] } },
      _sum: { total: true },
    }),
  ])

  return NextResponse.json({
    ok: true,
    bookings,
    stats: {
      pending,
      confirmed,
      checkedIn,
      checkedOut,
      cancelled,
      revenue: revenueAgg._sum.total || 0,
    },
  })
}
