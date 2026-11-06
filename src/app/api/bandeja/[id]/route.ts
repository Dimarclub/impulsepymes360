import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

type OwnerCheck = { kind: 'notfound' } | { kind: 'forbidden' } | { kind: 'ok'; msg: any }

/**
 * Verifica ownership del mensaje. Retorna un discriminado.
 */
async function getMessageForUser(id: string, userId: string, isAdmin: boolean): Promise<OwnerCheck> {
  const msg = await db.unifiedMessage.findUnique({
    where: { id },
    include: { contact: true },
  })
  if (!msg) return { kind: 'notfound' }
  if (!isAdmin && msg.userId !== userId) return { kind: 'forbidden' }
  return { kind: 'ok', msg }
}

/**
 * PATCH /api/bandeja/[id]
 * Body: { status?, contactId? }
 *  - status: UNREAD | READ | REPLIED | ARCHIVED
 *  - contactId: id de CrmContact para vincular (o null para desvincular)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const isAdmin = auth.role === 'ADMIN'
  const existing = await getMessageForUser(id, auth.id, isAdmin)
  if (existing.kind === 'notfound') {
    return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
  }
  if (existing.kind === 'forbidden') {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  const body = await req.json()
  const data: { status?: string; contactId?: string | null } = {}

  if (body.status) {
    const s = String(body.status).toUpperCase()
    if (!['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'].includes(s)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    data.status = s
  }

  if ('contactId' in body) {
    data.contactId = body.contactId || null
  }

  const updated = await db.unifiedMessage.update({
    where: { id },
    data,
    include: { contact: true },
  })

  return NextResponse.json({ ok: true, message: updated })
}

/**
 * DELETE /api/bandeja/[id]
 * Elimina el mensaje (solo dueño o admin).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const isAdmin = auth.role === 'ADMIN'
  const existing = await getMessageForUser(id, auth.id, isAdmin)
  if (existing.kind === 'notfound') {
    return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
  }
  if (existing.kind === 'forbidden') {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  await db.unifiedMessage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
