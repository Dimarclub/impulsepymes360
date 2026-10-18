import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN', 'COURIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const courier = await db.courier.update({ where: { id }, data: body })
  return NextResponse.json(courier)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.courier.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
