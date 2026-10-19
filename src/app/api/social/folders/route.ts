import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const folders = await db.mediaFolder.findMany({
    where: { userId },
    include: { _count: { select: { assets: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(folders)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const folder = await db.mediaFolder.create({
    data: { userId, name: body.name, color: body.color || '#0d9488' },
  })
  return NextResponse.json(folder, { status: 201 })
}
