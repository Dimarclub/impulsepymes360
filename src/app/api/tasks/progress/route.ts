import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  let progress = await db.taskProgress.findUnique({ where: { userId } })
  if (!progress) progress = await db.taskProgress.create({ data: { userId } })
  return NextResponse.json(progress)
}

export async function PATCH(req: Request) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const tasks = ['scanDone', 'identifyDone', 'visitWebDone', 'shareDone', 'commentDone', 'photoDone']
  const update: Record<string, unknown> = {}
  for (const t of tasks) { if (body[t] !== undefined) update[t] = body[t] }
  if (body.photoUrl) update.photoUrl = body.photoUrl
  if (body.identifiedCompany) update.identifiedCompany = body.identifiedCompany
  if (body.shareUrl) update.shareUrl = body.shareUrl
  if (body.commentText) update.commentText = body.commentText
  let progress = await db.taskProgress.findUnique({ where: { userId } })
  if (!progress) progress = await db.taskProgress.create({ data: { userId } })
  const updated = { ...progress, ...update }
  const allDone = updated.scanDone && updated.identifyDone && updated.visitWebDone && updated.shareDone && updated.commentDone && updated.photoDone
  if (allDone && !progress.completed) { update.completed = true; update.completedAt = new Date() }
  const result = await db.taskProgress.upsert({ where: { userId }, update, create: { userId, ...update } })
  return NextResponse.json(result)
}
