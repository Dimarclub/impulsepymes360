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
  const orders = await db.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: { select: { name: true, imageUrl: true } } } },
      user: { select: { name: true } },
    },
    take: 100,
  })
  return NextResponse.json(orders)
}
