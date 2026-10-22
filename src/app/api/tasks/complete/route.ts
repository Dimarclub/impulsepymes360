import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function POST() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const progress = await db.taskProgress.findUnique({ where: { userId } })
  if (!progress || !progress.completed) return NextResponse.json({ error: 'Debes completar todas las tareas primero' }, { status: 400 })
  const updated = await db.taskProgress.update({ where: { userId }, data: { rewardClaimed: true, rewardClaimedAt: new Date() } })
  return NextResponse.json(updated)
}
