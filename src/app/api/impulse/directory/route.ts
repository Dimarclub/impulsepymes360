import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category')
  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (q) { where.OR = [{ provider: { companyName: { contains: q } } }, { shortDesc: { contains: q } }, { category: { contains: q } }] }
  if (category) where.category = category
  const entries = await db.directoryEntry.findMany({
    where, orderBy: { featured: 'desc' },
    include: { provider: { select: { id: true, companyName: true, logoUrl: true, city: true, websiteSlug: true, description: true, category: true, address: true, phone: true, mobile: true } }, _count: { select: { stickers: true } } },
  })
  return NextResponse.json(entries)
}
