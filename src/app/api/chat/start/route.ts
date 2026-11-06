import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Inicia una nueva ChatSession desde el lado del visitante (widget público).
 * Body: { visitorName, visitorEmail?, userId, visitorIp? }
 * Crea con status=WAITING (en espera de que el negocio atienda).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const userId = String(body.userId ?? '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'Falta el identificador del negocio (userId)' }, { status: 400 })
  }
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
  }

  const visitorName = String(body.visitorName ?? '').trim()
  if (!visitorName) {
    return NextResponse.json({ error: 'Tu nombre es obligatorio' }, { status: 400 })
  }
  if (visitorName.length > 80) {
    return NextResponse.json({ error: 'El nombre es demasiado largo' }, { status: 400 })
  }

  const visitorEmail =
    typeof body.visitorEmail === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.visitorEmail)
      ? body.visitorEmail.trim()
      : null

  // visitorIp opcional (suele venir del header x-forwarded-for)
  let visitorIp: string | null = null
  if (typeof body.visitorIp === 'string' && body.visitorIp.trim()) {
    visitorIp = body.visitorIp.trim().slice(0, 64)
  } else {
    const xf = req.headers.get('x-forwarded-for')
    if (xf) visitorIp = xf.split(',')[0].trim().slice(0, 64)
  }

  const session = await db.chatSession.create({
    data: {
      userId,
      visitorName,
      visitorEmail,
      visitorIp,
      status: 'WAITING',
    },
  })

  return NextResponse.json(
    { ok: true, sessionId: session.id },
    { status: 201 }
  )
}
