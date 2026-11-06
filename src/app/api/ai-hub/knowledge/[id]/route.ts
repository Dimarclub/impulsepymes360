import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// PATCH /api/ai-hub/knowledge/[id] — actualiza artículo (solo owner o admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const existing = await db.knowledgeArticle.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'No tienes permiso para editar este artículo' }, { status: 403 })
  }

  let body: {
    title?: string
    content?: string
    category?: string | null
    tags?: string | null
    isPublished?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim().slice(0, 200)
  }
  if (typeof body.content === 'string' && body.content.trim()) {
    data.content = body.content.trim()
  }
  if (body.category !== undefined) {
    data.category = body.category?.trim() || null
  }
  if (body.tags !== undefined) {
    data.tags = body.tags?.trim() || null
  }
  if (typeof body.isPublished === 'boolean') {
    data.isPublished = body.isPublished
  }

  const updated = await db.knowledgeArticle.update({ where: { id }, data })
  return NextResponse.json(updated)
}

// DELETE /api/ai-hub/knowledge/[id] — elimina artículo (solo owner o admin)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const existing = await db.knowledgeArticle.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'No tienes permiso para eliminar este artículo' }, { status: 403 })
  }

  await db.knowledgeArticle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
