import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const account = await db.socialAccount.findUnique({ where: { id } })
  if (!account) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, account.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  await db.socialAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
