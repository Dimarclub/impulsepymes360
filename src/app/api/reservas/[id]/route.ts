import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

function startOfUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * GET /api/reservas/[id]
 * Detalle de un Room con supplier + availability próximos 30 días + bookings activos.
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
    include: {
      supplier: {
        select: {
          id: true,
          companyName: true,
          city: true,
          phone: true,
          address: true,
          user: { select: { provider: { select: { logoUrl: true } } } },
        },
      },
      _count: { select: { bookings: true } },
    },
  })
  if (!room) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })

  const today = startOfUTCDate(new Date())
  const end = new Date(today)
  end.setUTCDate(end.getUTCDate() + 30)

  const [availability, bookings] = await Promise.all([
    db.roomAvailability.findMany({
      where: { roomId: id, date: { gte: today, lte: end } },
      orderBy: { date: 'asc' },
    }),
    db.booking.findMany({
      where: {
        roomId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkOut: { gte: new Date() },
      },
      orderBy: { checkIn: 'asc' },
      select: {
        id: true,
        bookingCode: true,
        checkIn: true,
        checkOut: true,
        quantity: true,
        status: true,
        guestName: true,
      },
      take: 50,
    }),
  ])

  return NextResponse.json({ ok: true, room, availability, bookings })
}

/**
 * PATCH /api/reservas/[id]
 * Actualiza campos del Room. Si cambia quantity, reajusta RoomAvailability futura.
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

  const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
  if (!sup || !isOwnerOrAdmin(auth, sup.userId)) {
    if (auth.role !== 'ADMIN' || !sup) {
      return NextResponse.json({ error: 'Sin permiso sobre este recurso' }, { status: 403 })
    }
  }
  if (sup && room.supplierId !== sup.id && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso sobre este recurso' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const data: any = {}
  const allowed = ['name', 'type', 'description', 'capacity', 'pricePerNight', 'amenities', 'imageUrl', 'gallery', 'address', 'city', 'isActive']
  for (const k of allowed) {
    if (k in body) {
      if (k === 'amenities' || k === 'gallery') {
        data[k] = body[k] ? (Array.isArray(body[k]) ? JSON.stringify(body[k]) : String(body[k])) : null
      } else {
        data[k] = body[k]
      }
    }
  }

  let newQuantity: number | undefined
  if (typeof body.quantity === 'number' || (typeof body.quantity === 'string' && body.quantity !== '')) {
    const q = parseInt(body.quantity, 10)
    if (!isNaN(q) && q > 0 && q !== room.quantity) {
      data.quantity = q
      newQuantity = q
    }
  }

  const updated = await db.room.update({ where: { id }, data })

  if (newQuantity !== undefined) {
    // Reajusta disponibilidad futura: asegura que available no sea mayor que newQuantity
    const today = startOfUTCDate(new Date())
    const future = await db.roomAvailability.findMany({
      where: { roomId: id, date: { gte: today } },
      select: { id: true, available: true },
    })
    for (const a of future) {
      if (a.available > newQuantity) {
        await db.roomAvailability.update({ where: { id: a.id }, data: { available: newQuantity } })
      }
    }
  }

  return NextResponse.json({ ok: true, room: updated })
}

/**
 * DELETE /api/reservas/[id]
 * Elimina el Room. Bookings se quedan (onDelete: SetNull implícito por no tener Cascade).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const room = await db.room.findUnique({
    where: { id },
    select: { id: true, supplierId: true },
  })
  if (!room) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })

  const sup = await db.supplier.findUnique({ where: { userId: auth.id }, select: { id: true } })
  if (sup && room.supplierId !== sup.id && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso sobre este recurso' }, { status: 403 })
  }
  if (!sup && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin proveedor asociado' }, { status: 403 })
  }

  await db.room.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
