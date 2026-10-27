import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const zone = await db.zone.update({ where: { id }, data: body })
  return NextResponse.json(zone)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.zone.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
