import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

function authUser(auth: { id: string; role: string }) {
  return { id: auth.id, role: auth.role, name: '', email: '' }
}

/**
 * Crea un mensaje enviado por el AGENT (el negocio autenticado).
 * Body: { body }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const session = await db.chatSession.findUnique({ where: { id } })
  if (!session) {
    return NextResponse.json({ error: 'Sesión de chat no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(authUser(auth), session.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
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
      sender: 'AGENT',
      body: text.slice(0, 4000),
    },
  })

  // Actualiza updatedAt de la sesión para reordenar la lista
  await db.chatSession.update({ where: { id }, data: { updatedAt: new Date() } })

  return NextResponse.json({ ok: true, message }, { status: 201 })
}
