import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const page = await db.bioPage.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, page.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const body = await req.json()
  const update: Record<string, unknown> = { ...body }
  if (body.links && Array.isArray(body.links)) update.links = JSON.stringify(body.links)
  const updated = await db.bioPage.update({ where: { id }, data: update })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const page = await db.bioPage.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, page.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  await db.bioPage.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
