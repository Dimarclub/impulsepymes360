import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const partners = await db.partner.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, city: true } },
      contributions: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const user = await db.user.create({
    data: { email: body.email, name: body.name, role: 'PARTNER', phone: body.phone, city: body.city, password: await bcrypt.hash(body.password || 'dimar123', 10) },
  })
  const amount = body.amount || 300
  const partner = await db.partner.create({
    data: {
      userId: user.id,
      totalContribution: amount,
      totalReturns: +(amount * 0.03).toFixed(2),
      status: 'ACTIVE',
      contributions: {
        create: { amount, returnRate: 3, monthlyReturn: +(amount * 0.03).toFixed(2), status: 'ACTIVE' },
      },
    },
    include: { contributions: true },
  })
  return NextResponse.json(partner, { status: 201 })
}
