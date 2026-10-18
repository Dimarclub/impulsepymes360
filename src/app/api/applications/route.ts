import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const apps = await db.application.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(apps)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const app = await db.application.create({
    data: {
      type: body.type,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      details: body.details ? JSON.stringify(body.details) : null,
      status: 'PENDING',
    },
  })
  return NextResponse.json(app, { status: 201 })
}
