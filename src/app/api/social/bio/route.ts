import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const pages = await db.bioPage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const slug = body.slug || (await db.user.findUnique({ where: { id: userId } }))?.affiliateCode?.toLowerCase() || 'bio-' + Date.now()
  const page = await db.bioPage.create({
    data: {
      userId,
      slug,
      title: body.title,
      subtitle: body.subtitle || null,
      avatarUrl: body.avatarUrl || null,
      theme: body.theme || 'emerald',
      affiliateCode: body.affiliateCode || null,
      links: body.links ? JSON.stringify(body.links) : '[]',
      published: body.published ?? true,
    },
  })
  return NextResponse.json(page, { status: 201 })
}
