import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const placement = searchParams.get('placement')
  const all = searchParams.get('all') === 'true'
  const where: Record<string, unknown> = {}
  if (!all) {
    where.status = 'ACTIVE'
    where.startDate = { lte: new Date() }
    where.endDate = { gte: new Date() }
  }
  if (placement) where.placement = placement
  const ads = await db.advertisement.findMany({
    where,
    include: { supplier: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(ads)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN', 'SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const ad = await db.advertisement.create({
    data: {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : new Date(Date.now() + 30 * 86400000),
      supplierId: body.supplierId || null,
      status: body.status || 'ACTIVE',
    },
  })
  return NextResponse.json(ad, { status: 201 })
}
