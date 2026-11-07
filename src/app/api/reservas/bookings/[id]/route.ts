import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REJECTED']
const VALID_PAYMENT = ['UNPAID', 'DEPOSIT', 'PAID', 'REFUNDED']

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

/**
 * GET /api/reservas/[bookingId]
 * Detalle del booking (owner del booking, supplier del room, o admin).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const booking = await db.booking.findUnique({
    where: { id: id },
    include: {
      room: {
        select: {
          id: true,
          name: true,
          type: true,
          imageUrl: true,
          city: true,
          address: true,
          capacity: true,
          supplierId: true,
        },
      },
      supplier: { select: { id: true, companyName: true, phone: true, userId: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  })
  if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  // Verificar permisos
  const isOwner = booking.userId && isOwnerOrAdmin(auth, booking.userId)
  const isSupplierOwner = booking.supplier.userId === auth.id
  if (!isOwner && !isSupplierOwner && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso sobre esta reserva' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, booking })
}

/**
 * PATCH /api/reservas/[bookingId]
 * Transiciones de status. Si CANCELLED, restaurar cupos.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const booking = await db.booking.findUnique({
    where: { id: id },
    include: { room: { select: { supplierId: true } }, supplier: { select: { userId: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  if (booking.supplier.userId !== auth.id && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Sin permiso sobre esta reserva' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const data: any = {}
  if (body.status && VALID_STATUSES.includes(body.status)) {
    data.status = body.status
    const now = new Date()
    if (body.status === 'CONFIRMED') data.confirmedAt = now
    if (body.status === 'CANCELLED') data.cancelledAt = now
    if (body.status === 'CHECKED_IN') data.checkedInAt = now
    if (body.status === 'CHECKED_OUT') data.checkedOutAt = now
  }
  if (body.paymentStatus && VALID_PAYMENT.includes(body.paymentStatus)) {
    data.paymentStatus = body.paymentStatus
  }
  if (typeof body.notes === 'string') data.notes = body.notes

  const updated = await db.$transaction(async (tx) => {
    const prev = await tx.booking.findUnique({ where: { id: id }, select: { status: true } })
    const next = await tx.booking.update({ where: { id: id }, data })

    // Si está pasando a CANCELLED (y antes no lo estaba), restaurar cupos
    if (data.status === 'CANCELLED' && prev && prev.status !== 'CANCELLED') {
      const range = buildDateRange(booking.checkIn, booking.checkOut)
      for (const d of range) {
        const row = await tx.roomAvailability.findUnique({
          where: { roomId_date: { roomId: booking.roomId, date: d } },
        })
        if (row) {
          await tx.roomAvailability.update({
            where: { id: row.id },
            data: { available: { increment: booking.quantity } },
          })
        }
      }
    }
    return next
  })

  // Notificar al usuario si cambió status
  try {
    if (booking.userId && data.status) {
      const msgMap: Record<string, { t: string; m: string }> = {
        CONFIRMED: { t: 'Reserva confirmada', m: `Tu reserva ${booking.bookingCode} fue confirmada por el proveedor.` },
        REJECTED: { t: 'Reserva rechazada', m: `Lamentamos informarte que tu reserva ${booking.bookingCode} fue rechazada.` },
        CHECKED_IN: { t: 'Check-in realizado', m: `Check-in confirmado para ${booking.bookingCode}. ¡Disfruta!` },
        CHECKED_OUT: { t: 'Check-out realizado', m: `Gracias por tu visita. Reserva ${booking.bookingCode} cerrada.` },
        CANCELLED: { t: 'Reserva cancelada', m: `Tu reserva ${booking.bookingCode} fue cancelada. Los cupos han sido liberados.` },
        NO_SHOW: { t: 'No-show registrado', m: `Tu reserva ${booking.bookingCode} se marcó como no presentado.` },
      }
      const info = msgMap[data.status]
      if (info) {
        await db.notification.create({
          data: {
            userId: booking.userId,
            type: 'BOOKING_' + data.status,
            title: info.t,
            message: info.m,
            link: '/?module=reservas',
          },
        })
      }
    }
  } catch {
    // no-op
  }

  return NextResponse.json({ ok: true, booking: updated })
}
