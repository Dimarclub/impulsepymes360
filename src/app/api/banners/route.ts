import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const banners = await db.banner.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
  return NextResponse.json(banners)
}

export async function POST(req: Request) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const banner = await db.banner.create({
    data: {
      title: body.title, imageUrl: body.imageUrl || null, videoUrl: body.videoUrl || null,
      gifUrl: body.gifUrl || null, linkUrl: body.linkUrl || null, placement: body.placement || 'HOME_MAIN',
      width: body.width || 1320, height: body.height || 330, active: body.active ?? true, order: body.order || 0,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })
  return NextResponse.json(banner, { status: 201 })
}
