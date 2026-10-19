import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const accounts = await db.socialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  // En producción: aquí iría el OAuth real de cada plataforma
  const account = await db.socialAccount.create({
    data: {
      userId,
      platform: body.platform,
      handle: body.handle,
      displayName: body.displayName || body.handle,
      avatarUrl: body.avatarUrl || null,
      followerCount: body.followerCount || 0,
      connected: true,
      token: 'mock_oauth_token_' + Date.now(),
    },
  })
  return NextResponse.json(account, { status: 201 })
}
