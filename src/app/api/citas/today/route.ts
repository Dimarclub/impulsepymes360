import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/citas/today
 * Lista las citas de hoy para el usuario autenticado, ordenadas por startsAt asc.
 * Excluye las canceladas.
 */
export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const where: { userId?: string; startsAt: { gte: Date; lt: Date }; status: { not: string } } = {
    startsAt: { gte: startOfDay, lt: endOfDay },
    status: { not: 'CANCELLED' },
  }

  // Cada usuario ve sus propias citas de hoy (incluido ADMIN)
  where.userId = auth.id

  const appointments = await db.appointment.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true, company: true } },
    },
  })

  return NextResponse.json({ ok: true, appointments })
}
