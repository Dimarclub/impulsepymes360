import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await db.directoryEntry.findUnique({
    where: { id },
    include: { provider: { select: { id: true, companyName: true, logoUrl: true, coverUrl: true, city: true, websiteSlug: true, description: true, category: true, address: true, phone: true, mobile: true, affiliateRate: true } }, stickers: true },
  })
  if (!entry) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  await db.directoryEntry.update({ where: { id }, data: { viewCount: { increment: 1 } } })
  return NextResponse.json(entry)
}
