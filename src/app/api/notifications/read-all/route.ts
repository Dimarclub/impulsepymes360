import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function PATCH() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const result = await db.notification.updateMany({ where: { userId, read: false }, data: { read: true, readAt: new Date() } })
  return NextResponse.json({ updated: result.count })
}
