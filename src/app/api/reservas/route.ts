import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, requireRole } from '@/lib/security/auth'

const VALID_TYPES = ['HOTEL_ROOM', 'CAR', 'TOUR', 'EQUIPMENT']

function startOfUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function nightsBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime()
  return Math.max(0, Math.round(ms / 86400000))
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

/**
 * GET /api/reservas
 * Catálogo público para usuarios autenticados.
 * Query: ?city=&type=&checkIn=ISO&checkOut=ISO&guests=N
 */
export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')?.trim() || undefined
  const type = searchParams.get('type') || undefined
  const checkInStr = searchParams.get('checkIn')
  const checkOutStr = searchParams.get('checkOut')
  const guestsStr = searchParams.get('guests')

  const where: {
    isActive: boolean
    type?: string
    city?: { contains: string }
    capacity?: { gte: number }
  } = { isActive: true }
  if (type && VALID_TYPES.includes(type)) where.type = type
  if (city) where.city = { contains: city }
  if (guestsStr) {
    const g = parseInt(guestsStr, 10)
    if (!isNaN(g) && g > 0) where.capacity = { gte: g }
  }

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
          address: true,
          userId: true,
          user: { select: { provider: { select: { logoUrl: true } } } },
        },
      },
      _count: { select: { bookings: true } },
    },
  })

  // Si vienen fechas, filtra por disponibilidad real en RoomAvailability
  let filtered = rooms
  if (checkInStr && checkOutStr) {
    const checkIn = new Date(checkInStr)
    const checkOut = new Date(checkOutStr)
    if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()) && checkOut > checkIn) {
      const range = buildDateRange(checkIn, checkOut)
      const qty = parseInt(guestsStr || '1', 10) || 1
      const availableRooms = []
      for (const room of rooms) {
        const avail = await db.roomAvailability.findMany({
          where: { roomId: room.id, date: { in: range } },
          select: { date: true, available: true },
        })
        // Si faltan días del rango, se asume disponible = room.quantity
        const map = new Map(avail.map((a) => [a.date.toISOString(), a.available]))
        const ok = range.every((d) => {
          const v = map.get(d.toISOString())
          return v === undefined ? room.quantity >= qty : v >= qty
        })
        if (ok) availableRooms.push(room)
      }
      filtered = availableRooms
    }
  }

  return NextResponse.json({ ok: true, rooms: filtered })
}

/**
 * POST /api/reservas
 * Crea un Room (SUPPLIER o ADMIN). Inicializa RoomAvailability para 90 días.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { name, type, description, capacity, pricePerNight, quantity, amenities, imageUrl, gallery, address, city } = body
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nombre del recurso es obligatorio' }, { status: 400 })
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }
  const cap = parseInt(capacity, 10)
  const price = parseFloat(pricePerNight)
  const qty = parseInt(quantity, 10)
  if (isNaN(cap) || cap < 1) return NextResponse.json({ error: 'Capacidad inválida' }, { status: 400 })
  if (isNaN(price) || price < 0) return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
  if (isNaN(qty) || qty < 1) return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })

  // Resolver supplier del usuario actual
  let supplierId: string | undefined
  if (auth.role === 'SUPPLIER') {
    const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
    if (!sup) return NextResponse.json({ error: 'No tienes proveedor asociado' }, { status: 403 })
    supplierId = sup.id
  } else {
    // ADMIN: si viene supplierId en body lo usa; sino crea su propio supplier
    if (body.supplierId) {
      supplierId = body.supplierId
    } else {
      const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
      if (!sup) return NextResponse.json({ error: 'Indica supplierId o crea tu proveedor' }, { status: 400 })
      supplierId = sup.id
    }
  }

  const room = await db.room.create({
    data: {
      supplierId,
      name: name.trim(),
      type,
      description: description || null,
      capacity: cap,
      pricePerNight: price,
      quantity: qty,
      amenities: amenities ? (Array.isArray(amenities) ? JSON.stringify(amenities) : String(amenities)) : null,
      imageUrl: imageUrl || null,
      gallery: gallery ? (Array.isArray(gallery) ? JSON.stringify(gallery) : String(gallery)) : null,
      address: address || null,
      city: city || null,
    },
  })

  // Inicializar disponibilidad 90 días
  const days: { roomId: string; date: Date; available: number }[] = []
  const today = startOfUTCDate(new Date())
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() + i)
    days.push({ roomId: room.id, date: d, available: qty })
  }
  await db.roomAvailability.createMany({ data: days })

  return NextResponse.json({ ok: true, room }, { status: 201 })
}
