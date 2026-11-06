import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Endpoint público (sin auth): el visitante envía un mensaje al negocio.
 * Body: { body }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await db.chatSession.findUnique({
    where: { id },
    select: { id: true, status: true },
  })
  if (!session) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }
  if (session.status === 'CLOSED') {
    return NextResponse.json({ error: 'Esta sesión está cerrada' }, { status: 410 })
  }

  const body = await req.json().catch(() => ({}))
  const text = String(body?.body ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío' }, { status: 400 })
  }

  const message = await db.chatMessage.create({
    data: {
      sessionId: id,
      sender: 'VISITOR',
      body: text.slice(0, 4000),
    },
  })

  // Si la sesión estaba en WAITING, al recibir un mensaje del visitante,
  // la pasamos a ACTIVE para que el negocio la vea en su bandeja principal.
  // Si ya estaba ACTIVE, la mantenemos.
  if (session.status === 'WAITING') {
    await db.chatSession.update({
      where: { id },
      data: { status: 'ACTIVE', updatedAt: new Date() },
    })
  } else {
    await db.chatSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true, message }, { status: 201 })
}
