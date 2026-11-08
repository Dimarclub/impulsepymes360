import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * POST /api/reservas/scan
 * Body: { qrCode }
 * Marca CHECKED_IN si estaba CONFIRMED, CHECKED_OUT si estaba CHECKED_IN.
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

  const { qrCode } = body
  if (!qrCode || typeof qrCode !== 'string') {
    return NextResponse.json({ error: 'qrCode es obligatorio' }, { status: 400 })
  }

  const booking = await db.booking.findFirst({
    where: { qrCode: qrCode.trim() },
    include: { room: { select: { name: true, type: true } }, supplier: { select: { userId: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'QR no encontrado' }, { status: 404 })

  if (booking.supplier.userId !== auth.id && auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Este QR no pertenece a tus recursos' }, { status: 403 })
  }

  const now = new Date()
  let action: string = 'NO_ACTION'

  if (booking.status === 'CONFIRMED') {
    await db.booking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_IN', checkedInAt: now },
    })
    action = 'CHECKED_IN'
  } else if (booking.status === 'CHECKED_IN') {
    await db.booking.update({
      where: { id: booking.id },
      data: { status: 'CHECKED_OUT', checkedOutAt: now },
    })
    action = 'CHECKED_OUT'
  } else {
    return NextResponse.json({
      ok: false,
      error: `No se puede escanear: estado actual ${booking.status}`,
      booking,
      action: 'NO_ACTION',
    }, { status: 409 })
  }

  const updated = await db.booking.findUnique({
    where: { id: booking.id },
    include: { room: { select: { name: true, type: true, city: true } } },
  })

  // Notificar al usuario
  try {
    if (booking.userId) {
      await db.notification.create({
        data: {
          userId: booking.userId,
          type: action === 'CHECKED_IN' ? 'BOOKING_CHECKED_IN' : 'BOOKING_CHECKED_OUT',
          title: action === 'CHECKED_IN' ? 'Check-in confirmado' : 'Check-out realizado',
          message: action === 'CHECKED_IN'
            ? `Check-in registrado para ${booking.bookingCode}. ¡Disfruta tu estadía!`
            : `Check-out completado para ${booking.bookingCode}. ¡Gracias por tu visita!`,
          link: '/?module=reservas',
        },
      })
    }
  } catch {
    // no-op
  }

  return NextResponse.json({ ok: true, booking: updated, action })
}
