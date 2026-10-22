import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const { id } = await params
  const n = await db.notification.findUnique({ where: { id } })
  if (!n || n.userId !== userId) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  await db.notification.update({ where: { id }, data: { read: true, readAt: new Date() } })
  return NextResponse.json({ ok: true })
}
