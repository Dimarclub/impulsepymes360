import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const pageId = searchParams.get('pageId')
  const campaign = await db.gridCampaign.findFirst({ where: { status: 'ACTIVE' } })
  if (!campaign) return NextResponse.json({ error: 'No hay campaña activa' }, { status: 404 })

  // Si se pide una página específica, devolver sus espacios
  if (pageId) {
    const spaces = await db.gridSpace.findMany({
      where: { pageId },
      orderBy: { position: 'asc' },
      select: { id: true, position: true, status: true, buyerName: true, imageUrl: true, qrCode: true, owner: { select: { name: true } } },
    })
    return NextResponse.json({ spaces })
  }

  const where: Record<string, unknown> = { campaignId: campaign.id }
  if (month) where.month = parseInt(month)
  const pages = await db.gridPage.findMany({
    where, orderBy: { month: 'asc' },
    include: { _count: { select: { spaces: { where: { status: 'AVAILABLE' } } } } },
  })
  const stats = {
    totalSpaces: await db.gridSpace.count({ where: { page: { campaignId: campaign.id } } }),
    available: await db.gridSpace.count({ where: { page: { campaignId: campaign.id }, status: 'AVAILABLE' } }),
    owned: await db.gridSpace.count({ where: { page: { campaignId: campaign.id }, status: 'OWNED' } }),
    sold: await db.gridSpace.count({ where: { page: { campaignId: campaign.id }, status: 'SOLD' } }),
  }
  return NextResponse.json({ campaign, pages, stats })
}
