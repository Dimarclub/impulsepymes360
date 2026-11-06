import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

const VALID_STATUSES = ['ACTIVE', 'CLOSED', 'WAITING'] as const
type Status = (typeof VALID_STATUSES)[number]

function authUser(auth: { id: string; role: string }) {
  return { id: auth.id, role: auth.role, name: '', email: '' }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const session = await db.chatSession.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!session) {
    return NextResponse.json({ error: 'Sesión de chat no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(authUser(auth), session.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, session })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.chatSession.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Sesión de chat no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(authUser(auth), existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.status === 'string' && body.status.trim()) {
    const statusRaw = body.status.trim().toUpperCase()
    if ((VALID_STATUSES as readonly string[]).includes(statusRaw)) {
      data.status = statusRaw as Status
    }
  }

  const updated = await db.chatSession.update({ where: { id }, data })
  return NextResponse.json({ ok: true, session: updated })
}
