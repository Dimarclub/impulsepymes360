import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

const VALID_STATUSES = ['PUBLISHED', 'HIDDEN', 'PENDING'] as const
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
  const review = await db.review.findUnique({ where: { id } })
  if (!review) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(authUser(auth), review.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, review })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.review.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 })
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

  if (typeof body.response === 'string') {
    const responseText = body.response.trim()
    if (responseText) {
      data.response = responseText.slice(0, 2000)
      // Si no tenía respuesta previa, marcar fecha
      if (!existing.response || existing.response.trim() === '') {
        data.respondedAt = new Date()
      }
    } else if (body.response === '') {
      // Permitir limpiar la respuesta
      data.response = null
      data.respondedAt = null
    }
  }

  const updated = await db.review.update({ where: { id }, data })
  return NextResponse.json({ ok: true, review: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.review.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(authUser(auth), existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  await db.review.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
