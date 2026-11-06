import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Endpoint público (sin auth): el visitante obtiene los mensajes de su sesión
 * (para mostrar el chat widget en su sitio).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await db.chatSession.findUnique({
    where: { id },
    select: { id: true, status: true, visitorName: true, createdAt: true },
  })
  if (!session) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
  }
  const messages = await db.chatMessage.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ ok: true, session, messages })
}
