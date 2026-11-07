import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * GET /api/reservas/my-bookings
 * Lista los bookings del usuario actual ordenados por checkIn asc.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const bookings = await db.booking.findMany({
    where: { userId: auth.id },
    orderBy: { checkIn: 'asc' },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          type: true,
          imageUrl: true,
          city: true,
          capacity: true,
          pricePerNight: true,
        },
      },
      supplier: {
        select: {
          id: true,
          companyName: true,
          phone: true,
          city: true,
          user: { select: { provider: { select: { logoUrl: true } } } },
        },
      },
    },
  })

  return NextResponse.json({ ok: true, bookings })
}
