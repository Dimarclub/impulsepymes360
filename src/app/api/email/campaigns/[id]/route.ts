import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  // Si se envía, marcar como SENT y simular métricas
  if (body.status === 'SENT') {
    const campaign = await db.emailCampaign.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), openCount: Math.floor((body.recipientCount || 0) * 0.65), clickCount: Math.floor((body.recipientCount || 0) * 0.22) },
    })
    return NextResponse.json(campaign)
  }
  const campaign = await db.emailCampaign.update({ where: { id }, data: body })
  return NextResponse.json(campaign)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.emailCampaign.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
