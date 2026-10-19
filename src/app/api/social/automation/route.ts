import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const rules = await db.automationRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const rule = await db.automationRule.create({
    data: {
      userId,
      name: body.name,
      type: body.type || 'BULK_PRODUCT',
      config: JSON.stringify(body.config || {}),
      status: body.status || 'ACTIVE',
    },
  })
  return NextResponse.json(rule, { status: 201 })
}
