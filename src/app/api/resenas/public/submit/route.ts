import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function clampRating(n: unknown): number | null {
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  const int = Math.trunc(v)
  if (int < 1 || int > 5) return null
  return int
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

/**
 * Endpoint público (sin auth): un cliente envía una reseña.
 * La reseña se crea con status=PENDING para que el negocio la apruebe antes
 * de publicarla en su widget.
 *
 * Body: { userId, customerName, customerEmail?, rating, title?, comment? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const userId = String(body.userId ?? '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'Falta el identificador del negocio (userId)' }, { status: 400 })
  }

  // Verificar que el usuario exista
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  }

  const customerName = String(body.customerName ?? '').trim()
  if (!customerName) {
    return NextResponse.json({ error: 'Tu nombre es obligatorio' }, { status: 400 })
  }
  if (customerName.length > 80) {
    return NextResponse.json({ error: 'El nombre es demasiado largo' }, { status: 400 })
  }

  const rating = clampRating(body.rating)
  if (rating === null) {
    return NextResponse.json({ error: 'El rating debe estar entre 1 y 5 estrellas' }, { status: 400 })
  }

  const customerEmail =
    typeof body.customerEmail === 'string' && isEmail(body.customerEmail)
      ? body.customerEmail.trim()
      : null

  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : null
  const comment =
    typeof body.comment === 'string' && body.comment.trim()
      ? body.comment.trim().slice(0, 2000)
      : null

  if (!comment) {
    return NextResponse.json({ error: 'Por favor escribe un comentario' }, { status: 400 })
  }

  await db.review.create({
    data: {
      userId,
      customerName,
      customerEmail,
      rating,
      title,
      comment,
      source: 'INTERNAL',
      status: 'PENDING',
    },
  })

  return NextResponse.json(
    {
      ok: true,
      message:
        '¡Gracias por tu reseña! El negocio la revisará antes de publicarla.',
    },
    { status: 201 }
  )
}
