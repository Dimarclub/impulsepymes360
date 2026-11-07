import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

const VALID_TYPES = ['HOTEL_ROOM', 'CAR', 'TOUR', 'EQUIPMENT']

function startOfUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function buildDateRange(checkIn: Date, checkOut: Date): Date[] {
  const out: Date[] = []
  const cursor = startOfUTCDate(checkIn)
  const end = startOfUTCDate(checkOut)
  while (cursor.getTime() < end.getTime()) {
    out.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

function nightsBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
}

/**
 * POST /api/reservas/search
 * Body: { checkIn, checkOut, guests?, city?, type? }
 * Retorna rooms disponibles con cálculo de precio.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { checkIn, checkOut } = body
  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: 'checkIn y checkOut son obligatorios' }, { status: 400 })
  }
  const ci = new Date(checkIn)
  const co = new Date(checkOut)
  if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  if (co <= ci) {
    return NextResponse.json({ error: 'checkOut debe ser posterior a checkIn' }, { status: 400 })
  }

  const guests = parseInt(body.guests, 10) || 1
  const city = body.city?.trim() || undefined
  const type = body.type && VALID_TYPES.includes(body.type) ? body.type : undefined

  const where: {
    isActive: boolean
    type?: string
    city?: { contains: string }
    capacity?: { gte: number }
  } = { isActive: true }
  if (type) where.type = type
  if (city) where.city = { contains: city }
  if (guests > 0) where.capacity = { gte: guests }

  const rooms = await db.room.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      supplier: {
        select: {
          id: true,
          companyName: true,
          city: true,
          phone: true,
          user: { select: { provider: { select: { logoUrl: true } } } },
        },
      },
    },
  })

  const range = buildDateRange(ci, co)
  const nights = nightsBetween(ci, co)
  const qty = guests // 1 unidad cubre los guests si capacity >= guests

  const results = []
  for (const room of rooms) {
    const avail = await db.roomAvailability.findMany({
      where: { roomId: room.id, date: { in: range } },
      select: { date: true, available: true },
    })
    const map = new Map(avail.map((a) => [a.date.toISOString(), a.available]))
    const minAvail = range.reduce((min, d) => {
      const v = map.get(d.toISOString())
      return Math.min(min, v === undefined ? room.quantity : v)
    }, room.quantity)
    if (minAvail < 1) continue

    const unitPrice = room.pricePerNight
    const subtotal = nights * unitPrice * 1 // 1 unidad por defecto
    const serviceFee = subtotal * 0.05
    const total = subtotal + serviceFee

    results.push({
      room,
      supplier: room.supplier,
      nights,
      unitPrice,
      subtotal,
      serviceFee,
      total,
      available: minAvail,
    })
  }

  return NextResponse.json({ ok: true, results })
}
