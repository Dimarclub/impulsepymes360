import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId
  const commissions = await db.commission.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { sourceUser: { select: { name: true } } },
  })
  return NextResponse.json(commissions)
}
