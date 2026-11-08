import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/reservas/mine
 * Lista las Rooms del supplier autenticado + stats.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  let supplierId: string | undefined
  if (auth.role === 'SUPPLIER') {
    const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
    if (!sup) return NextResponse.json({ error: 'No tienes proveedor asociado' }, { status: 403 })
    supplierId = sup.id
  } else {
    const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
    supplierId = sup?.id
  }

  if (!supplierId) {
    return NextResponse.json({ ok: true, rooms: [], stats: { totalRooms: 0, totalBookings: 0, monthRevenue: 0, avgOccupation: 0 } })
  }

  const rooms = await db.room.findMany({
    where: { supplierId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { bookings: true, availability: true } },
    },
  })

  const roomIds = rooms.map((r) => r.id)

  // Stats del mes actual
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [totalBookings, monthBookings, activeBookings] = await Promise.all([
    db.booking.count({ where: { roomId: { in: roomIds } } }),
    db.booking.findMany({
      where: {
        roomId: { in: roomIds },
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { notIn: ['CANCELLED', 'REJECTED', 'NO_SHOW'] },
      },
      select: { total: true },
    }),
    db.booking.count({
      where: {
        roomId: { in: roomIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      },
    }),
  ])

  const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.total || 0), 0)
  const totalCapacity = rooms.reduce((s, r) => s + r.quantity, 0)
  const avgOccupation = totalCapacity > 0 ? Math.min(100, Math.round((activeBookings / Math.max(1, totalCapacity)) * 100)) : 0

  return NextResponse.json({
    ok: true,
    rooms,
    stats: {
      totalRooms: rooms.length,
      totalBookings,
      monthRevenue,
      avgOccupation,
    },
  })
}
