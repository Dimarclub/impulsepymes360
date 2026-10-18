import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const subs = await db.emailSubscriber.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(subs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sub = await db.emailSubscriber.upsert({
    where: { email: body.email },
    update: { name: body.name, segment: body.segment || 'ALL', active: true },
    create: { email: body.email, name: body.name, segment: body.segment || 'ALL', active: true },
  })
  return NextResponse.json(sub, { status: 201 })
}
