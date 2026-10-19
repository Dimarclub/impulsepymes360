import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where: Record<string, unknown> = { userId }
  if (status) where.status = status
  const posts = await db.socialPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true, price: true, imageUrl: true } },
      accounts: { include: { account: true } },
    },
    take: 100,
  })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const { caption, mediaUrls, mediaType, productId, affiliateCode, accountIds, scheduledAt, status } = body

  const post = await db.socialPost.create({
    data: {
      userId,
      caption,
      mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
      mediaType: mediaType || 'IMAGE',
      productId: productId || null,
      affiliateCode: affiliateCode || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: status || 'DRAFT',
      accounts: accountIds?.length
        ? { create: accountIds.map((accountId: string) => ({ accountId })) }
        : undefined,
    },
    include: { accounts: { include: { account: true } } },
  })
  return NextResponse.json(post, { status: 201 })
}
