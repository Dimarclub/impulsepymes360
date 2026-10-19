import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const post = await db.socialPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, post.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const body = await req.json()
  const update: Record<string, unknown> = { ...body }
  if (body.mediaUrls && Array.isArray(body.mediaUrls)) update.mediaUrls = JSON.stringify(body.mediaUrls)
  if (body.scheduledAt) update.scheduledAt = new Date(body.scheduledAt)
  if (body.accountIds) {
    // Reconstruir relaciones
    await db.socialPostAccount.deleteMany({ where: { postId: id } })
    if (body.accountIds.length > 0) {
      await db.socialPostAccount.createMany({
        data: body.accountIds.map((accountId: string) => ({ postId: id, accountId })),
      })
    }
    delete update.accountIds
  }
  const updated = await db.socialPost.update({ where: { id }, data: update, include: { accounts: { include: { account: true } } } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const post = await db.socialPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, post.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  await db.socialPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
