import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = { ...body }
  if (body.trigger) update.trigger = body.trigger.toLowerCase()
  const template = await db.whatsAppTemplate.update({ where: { id }, data: update })
  return NextResponse.json(template)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.whatsAppTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
