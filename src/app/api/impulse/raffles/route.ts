import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const raffles = await db.raffle.findMany({ orderBy: { drawDate: 'asc' }, include: { _count: { select: { entries: true } } } })
  return NextResponse.json(raffles.map(r => ({ ...r, entriesCount: r._count.entries })))
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const raffle = await db.raffle.create({ data: { name: body.name, description: body.description || null, prize: body.prize, prizeImageUrl: body.prizeImageUrl || null, drawDate: new Date(body.drawDate), minStickers: body.minStickers || 10 } })
  return NextResponse.json(raffle, { status: 201 })
}
