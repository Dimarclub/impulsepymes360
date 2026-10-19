import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  const where: Record<string, unknown> = { userId }
  if (folderId) where.folderId = folderId
  const assets = await db.mediaAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { folder: true },
  })
  return NextResponse.json(assets)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const asset = await db.mediaAsset.create({
    data: {
      userId,
      name: body.name,
      url: body.url,
      type: body.type || 'IMAGE',
      size: body.size || 0,
      folderId: body.folderId || null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    },
  })
  return NextResponse.json(asset, { status: 201 })
}
