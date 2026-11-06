import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

const VALID_STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

/**
 * GET /api/citas
 * Lista las citas del usuario autenticado (SUPPLIER o ADMIN).
 * Query params:
 *  - from: ISO date (default: hoy 00:00)
 *  - to: ISO date (default: hoy + 30 días)
 *  - status: SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW
 *  - all: true (solo ADMIN, lista todas las citas)
 * Retorna: { ok, appointments, stats: { total, today, upcoming, completed, cancelled } }
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const status = searchParams.get('status')

  const now = new Date()
  const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const to = toStr ? new Date(toStr) : new Date(from.getTime() + 30 * 86400000)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }

  const listWhere: {
    userId?: string
    startsAt?: { gte: Date; lte: Date }
    status?: string
  } = {}
  if (auth.role !== 'ADMIN' || searchParams.get('all') !== 'true') {
    listWhere.userId = auth.id
  }
  listWhere.startsAt = { gte: from, lte: to }
  if (status && VALID_STATUSES.includes(status)) {
    listWhere.status = status
  }

  const [appointments, totalCount, todayCount, upcomingCount, completedCount, cancelledCount] =
    await Promise.all([
      db.appointment.findMany({
        where: listWhere,
        orderBy: { startsAt: 'asc' },
        include: {
          contact: { select: { id: true, name: true, email: true, phone: true, company: true } },
        },
      }),
      db.appointment.count({ where: { userId: auth.id } }),
      db.appointment.count({
        where: {
          userId: auth.id,
          startsAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          status: { not: 'CANCELLED' },
        },
      }),
      db.appointment.count({
        where: {
          userId: auth.id,
          startsAt: { gte: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      db.appointment.count({ where: { userId: auth.id, status: 'COMPLETED' } }),
      db.appointment.count({ where: { userId: auth.id, status: 'CANCELLED' } }),
    ])

  return NextResponse.json({
    ok: true,
    appointments,
    stats: {
      total: totalCount,
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      cancelled: cancelledCount,
    },
  })
}

/**
 * POST /api/citas
 * Crea una nueva cita para el usuario autenticado.
 * Body: { clientName, clientEmail?, clientPhone?, service, startsAt, endsAt, notes?, contactId?, status? }
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const {
    clientName,
    clientEmail,
    clientPhone,
    service,
    startsAt,
    endsAt,
    notes,
    contactId,
    status,
  }: {
    clientName?: string
    clientEmail?: string
    clientPhone?: string
    service?: string
    startsAt?: string
    endsAt?: string
    notes?: string
    contactId?: string
    status?: string
  } = body

  if (!clientName || !clientName.trim()) {
    return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 })
  }
  if (!service || !service.trim()) {
    return NextResponse.json({ error: 'El servicio es obligatorio' }, { status: 400 })
  }
  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: 'Las fechas son obligatorias' }, { status: 400 })
  }
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  if (end <= start) {
    return NextResponse.json({ error: 'La fecha fin debe ser posterior a la fecha inicio' }, { status: 400 })
  }

  // Validar status si viene
  const finalStatus = status && VALID_STATUSES.includes(status) ? status : 'SCHEDULED'

  // Validar contactId si viene
  if (contactId) {
    const contact = await db.crmContact.findUnique({ where: { id: contactId } })
    if (!contact) {
      return NextResponse.json({ error: 'Contacto CRM no encontrado' }, { status: 400 })
    }
  }

  const appointment = await db.appointment.create({
    data: {
      userId: auth.id,
      contactId: contactId || null,
      clientName: clientName.trim(),
      clientEmail: clientEmail?.trim() || null,
      clientPhone: clientPhone?.trim() || null,
      service: service.trim(),
      startsAt: start,
      endsAt: end,
      status: finalStatus,
      notes: notes?.trim() || null,
    },
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true, company: true } },
    },
  })

  return NextResponse.json({ ok: true, appointment }, { status: 201 })
}
