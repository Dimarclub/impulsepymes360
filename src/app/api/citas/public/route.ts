import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/citas/public?userId=xxx&from=ISO&to=ISO
 * Endpoint público de booking: devuelve los slots disponibles para el usuario indicado
 * basados en su horario laboral (9-18h) y sus citas existentes (no canceladas).
 * Slots de 1 hora, saltando los que se solapan con citas existentes.
 * No requiere autenticación.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')

  if (!userId) {
    return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400 })
  }

  const now = new Date()
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = toStr ? new Date(toStr) : new Date(from.getTime() + 7 * 86400000)
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: 'Rango de fechas inválido' }, { status: 400 })
  }

  // Limitar a máximo 30 días
  const maxTo = new Date(from.getTime() + 30 * 86400000)
  const effectiveTo = to > maxTo ? maxTo : to

  // Cargar citas existentes del usuario en el rango (no canceladas)
  const existing = await db.appointment.findMany({
    where: {
      userId,
      status: { notIn: ['CANCELLED'] },
      startsAt: { gte: from, lt: effectiveTo },
    },
    select: { startsAt: true, endsAt: true },
  })

  const busy = existing.map((a) => ({
    start: a.startsAt.getTime(),
    end: a.endsAt.getTime(),
  }))

  // Generar slots de 1 hora entre 9:00 y 18:00 (último slot inicia a las 17:00)
  const slots: { start: string; end: string; available: boolean }[] = []
  const WORK_START = 9
  const WORK_END = 18
  const SLOT_MS = 60 * 60 * 1000

  // Iterar día por día
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0)
  const endBound = new Date(effectiveTo.getFullYear(), effectiveTo.getMonth(), effectiveTo.getDate(), 0, 0, 0)

  while (cursor <= endBound) {
    const dayOfWeek = cursor.getDay() // 0=domingo, 6=sábado
    // Saltar domingos
    if (dayOfWeek !== 0) {
      for (let h = WORK_START; h < WORK_END; h++) {
        const slotStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), h, 0, 0)
        const slotEnd = new Date(slotStart.getTime() + SLOT_MS)
        // No crear slots en el pasado
        if (slotStart.getTime() < now.getTime()) continue
        if (slotEnd > effectiveTo) continue
        const overlap = busy.some((b) => {
          return slotStart.getTime() < b.end && slotEnd.getTime() > b.start
        })
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !overlap,
        })
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return NextResponse.json({ ok: true, slots })
}
