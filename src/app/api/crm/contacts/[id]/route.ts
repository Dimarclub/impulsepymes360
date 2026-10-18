import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const contact = await db.crmContact.update({ where: { id }, data: body })
  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.crmContact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
