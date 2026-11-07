import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

function startOfUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function buildDateRange(from: Date, to: Date): Date[] {
  const out: Date[] = []
  const cursor = startOfUTCDate(from)
  const end = startOfUTCDate(to)
  while (cursor.getTime() <= end.getTime()) {
    out.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

/**
 * GET /api/reservas/[id]/availability?from=ISO&to=ISO
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const room = await db.room.findUnique({
    where: { id },
    select: { id: true, quantity: true },
  })
  if (!room) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const now = new Date()
  const fromStr = searchParams.get('from')
  const toStr = searchParams.get('to')
  const from = fromStr ? new Date(fromStr) : startOfUTCDate(now)
  const to = toStr ? new Date(toStr) : new Date(from.getTime() + 30 * 86400000)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }

  const range = buildDateRange(from, to)
  const records = await db.roomAvailability.findMany({
    where: { roomId: id, date: { in: range } },
    select: { date: true, available: true },
  })
  const map = new Map(records.map((r) => [r.date.toISOString(), r.available]))

  const days = range.map((d) => ({
    date: d.toISOString(),
    available: map.has(d.toISOString()) ? map.get(d.toISOString())! : room.quantity,
  }))

  return NextResponse.json({ ok: true, days })
}

/**
 * PATCH /api/reservas/[id]/availability
 * Body: { date: ISO, available: N } o { range: { from, to }, available: N }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const room = await db.room.findUnique({
    where: { id },
    select: { id: true, supplierId: true, quantity: true },
  })
  if (!room) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })

  const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true, userId: true } })
  if (!sup) return NextResponse.json({ error: 'Sin proveedor asociado' }, { status: 403 })
  if (room.supplierId !== sup.id && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso sobre este recurso' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const available = parseInt(body.available, 10)
  if (isNaN(available) || available < 0) {
    return NextResponse.json({ error: 'available debe ser >= 0' }, { status: 400 })
  }

  let dates: Date[] = []
  if (body.range && body.range.from && body.range.to) {
    const from = new Date(body.range.from)
    const to = new Date(body.range.to)
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to < from) {
      return NextResponse.json({ error: 'Rango inválido' }, { status: 400 })
    }
    dates = buildDateRange(from, to)
  } else if (body.date) {
    const d = new Date(body.date)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
    dates = [startOfUTCDate(d)]
  } else {
    return NextResponse.json({ error: 'Se requiere date o range' }, { status: 400 })
  }

  // upserts
  await db.$transaction(
    dates.map((d) =>
      db.roomAvailability.upsert({
        where: { roomId_date: { roomId: id, date: d } },
        update: { available },
        create: { roomId: id, date: d, available },
      })
    )
  )

  return NextResponse.json({ ok: true, updated: dates.length })
}
