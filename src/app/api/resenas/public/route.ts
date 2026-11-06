import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Endpoint público (sin auth): lista las reseñas PUBLISHED de un userId específico.
 * Útil para embeber widgets de reputación en sitios externos.
 * Query: ?userId=xxx
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = (searchParams.get('userId') || '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400 })
  }

  const reviews = await db.review.findMany({
    where: { userId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const total = reviews.length
  const ratings = reviews.map((r) => r.rating).filter((r) => r >= 1 && r <= 5)
  const average =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of ratings) distribution[r] = (distribution[r] || 0) + 1

  return NextResponse.json({
    ok: true,
    reviews,
    stats: {
      total,
      average: Number(average.toFixed(2)),
      distribution,
    },
  })
}
