import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const logos = await db.brandLogo.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
  return NextResponse.json(logos)
}

export async function POST(req: Request) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const logo = await db.brandLogo.create({
    data: { name: body.name, logoUrl: body.logoUrl, linkUrl: body.linkUrl || null, active: body.active ?? true, order: body.order || 0 },
  })
  return NextResponse.json(logo, { status: 201 })
}
