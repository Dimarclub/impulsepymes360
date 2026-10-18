import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId
  const commissions = await db.commission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  // Obtener nombres de usuarios origen por separado
  const sourceIds = [...new Set(commissions.map((c) => c.sourceUserId).filter(Boolean))] as string[]
  const sourceUsers = sourceIds.length > 0
    ? await db.user.findMany({ where: { id: { in: sourceIds } }, select: { id: true, name: true } })
    : []
  const sourceMap = new Map(sourceUsers.map((u) => [u.id, u.name]))
  const result = commissions.map((c) => ({
    ...c,
    sourceUser: c.sourceUserId ? { name: sourceMap.get(c.sourceUserId) || 'Usuario' } : null,
  }))
  return NextResponse.json(result)
}
