import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * Lista las ChatSession del usuario autenticado.
 * Orden: ACTIVE primero, luego WAITING, luego CLOSED.
 * Dentro de cada grupo, ordenadas por updatedAt desc.
 *
 * Retorna además estadísticas: active, closed, today.
 */
export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const sessionsRaw = await db.chatSession.findMany({
    where: { userId: auth.id },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { body: true, sender: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Ordenar por prioridad de status: ACTIVE > WAITING > CLOSED
  const statusPriority: Record<string, number> = {
    ACTIVE: 0,
    WAITING: 1,
    CLOSED: 2,
  }
  const sessions = sessionsRaw.sort((a, b) => {
    const pa = statusPriority[a.status] ?? 99
    const pb = statusPriority[b.status] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const today = sessionsRaw.filter((s) => new Date(s.createdAt) >= startOfDay).length
  const active = sessionsRaw.filter((s) => s.status === 'ACTIVE').length
  const closed = sessionsRaw.filter((s) => s.status === 'CLOSED').length

  return NextResponse.json({
    ok: true,
    sessions,
    stats: { active, closed, today },
  })
}
