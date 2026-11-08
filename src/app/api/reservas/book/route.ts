import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

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

function randomCode(len: number, alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'): string {
  let out = ''
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

function uniqueBookingCode(): string {
  return 'RES-' + randomCode(6)
}

function uniqueQrCode(): string {
  return randomCode(8)
}

/**
 * POST /api/reservas/book
 * Crea un Booking + decrementa RoomAvailability para cada día del rango.
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

  const { roomId, checkIn, checkOut, guests, quantity, guestName, guestEmail, guestPhone, notes, affiliateCode, paymentMethod } = body

  if (!roomId) return NextResponse.json({ error: 'roomId es obligatorio' }, { status: 400 })
  if (!checkIn || !checkOut) return NextResponse.json({ error: 'checkIn y checkOut son obligatorios' }, { status: 400 })
  if (!guestName || !guestEmail || !guestPhone) {
    return NextResponse.json({ error: 'Datos del huésped incompletos' }, { status: 400 })
  }

  const ci = new Date(checkIn)
  const co = new Date(checkOut)
  if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  if (co <= ci) return NextResponse.json({ error: 'checkOut debe ser posterior a checkIn' }, { status: 400 })

  const room = await db.room.findUnique({
    where: { id: roomId },
    include: { supplier: { select: { id: true, userId: true, companyName: true } } },
  })
  if (!room || !room.isActive) {
    return NextResponse.json({ error: 'Recurso no disponible' }, { status: 404 })
  }

  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  const g = Math.max(1, parseInt(guests, 10) || 1)
  if (qty > room.quantity) {
    return NextResponse.json({ error: `Solo hay ${room.quantity} unidades disponibles` }, { status: 400 })
  }

  const range = buildDateRange(ci, co)
  const nights = nightsBetween(ci, co)
  if (nights < 1) return NextResponse.json({ error: 'Mínimo 1 noche' }, { status: 400 })

  // Validar cupos
  const existing = await db.roomAvailability.findMany({
    where: { roomId, date: { in: range } },
    select: { date: true, available: true },
  })
  const map = new Map(existing.map((e) => [e.date.toISOString(), e.available]))
  for (const d of range) {
    const v = map.get(d.toISOString())
    const avail = v === undefined ? room.quantity : v
    if (avail < qty) {
      return NextResponse.json({
        error: `Sin cupo para ${d.toISOString().slice(0, 10)} (disponible: ${avail}, solicitado: ${qty})`,
      }, { status: 409 })
    }
  }

  const unitPrice = room.pricePerNight
  const subtotal = nights * unitPrice * qty
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  // Buscar afiliado sponsor si viene code
  let sponsor: { id: string } | null = null
  if (affiliateCode) {
    sponsor = await db.user.findUnique({
      where: { affiliateCode },
      select: { id: true },
    })
  }

  const bookingCode = uniqueBookingCode()
  const qrCode = uniqueQrCode()

  // Transacción: crear booking + decrementar cupos
  const booking = await db.$transaction(async (tx) => {
    // Upsert availability rows y decrementar
    for (const d of range) {
      const existingRow = await tx.roomAvailability.findUnique({
        where: { roomId_date: { roomId, date: d } },
      })
      if (existingRow) {
        await tx.roomAvailability.update({
          where: { id: existingRow.id },
          data: { available: { decrement: qty } },
        })
      } else {
        await tx.roomAvailability.create({
          data: { roomId, date: d, available: Math.max(0, room.quantity - qty) },
        })
      }
    }

    const created = await tx.booking.create({
      data: {
        bookingCode,
        roomId,
        supplierId: room.supplierId,
        userId: auth.id,
        guestName: String(guestName).trim(),
        guestEmail: String(guestEmail).trim(),
        guestPhone: String(guestPhone).trim(),
        checkIn: ci,
        checkOut: co,
        nights,
        guests: g,
        quantity: qty,
        unitPrice,
        subtotal,
        serviceFee,
        total,
        currency: room.currency,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: paymentMethod || null,
        qrCode,
        notes: notes || null,
        affiliateCode: sponsor ? affiliateCode : (affiliateCode || null),
      },
    })
    return created
  })

  // Notificaciones (no bloqueantes)
  try {
    const notifs: { userId: string; type: string; title: string; message: string; link: string | null }[] = []
    if (room.supplier?.userId) {
      notifs.push({
        userId: room.supplier.userId,
        type: 'BOOKING_RECEIVED',
        title: 'Nueva reserva recibida',
        message: `${guestName} reservó ${room.name} (${bookingCode}). Total: $${total.toFixed(2)}`,
        link: '/?module=reservas-admin',
      })
    }
    notifs.push({
      userId: auth.id,
      type: 'BOOKING_CONFIRMED',
      title: 'Reserva registrada',
      message: `Tu reserva ${bookingCode} para ${room.name} está en espera de confirmación.`,
      link: '/?module=reservas',
    })
    if (notifs.length > 0) {
      await db.notification.createMany({ data: notifs })
    }
  } catch {
    // no-op
  }

  return NextResponse.json({ ok: true, booking }, { status: 201 })
}
