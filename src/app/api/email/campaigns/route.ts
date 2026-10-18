import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const campaigns = await db.emailCampaign.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  // Calcular destinatarios según audiencia
  const segment = body.audience || 'ALL'
  const where = segment === 'ALL' ? {} : { segment }
  const count = await db.emailSubscriber.count({ where: { ...where, active: true } })
  const campaign = await db.emailCampaign.create({
    data: {
      name: body.name,
      subject: body.subject,
      content: body.content,
      template: body.template || 'PROMOTION',
      audience: body.audience || 'ALL',
      status: body.status || 'DRAFT',
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      recipientCount: count,
    },
  })
  return NextResponse.json(campaign, { status: 201 })
}
