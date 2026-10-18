import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ad = await db.advertisement.findUnique({
    where: { id },
    include: { supplier: true },
  })
  if (!ad) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(ad)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = { ...body }
  if (body.startDate) data.startDate = new Date(body.startDate)
  if (body.endDate) data.endDate = new Date(body.endDate)
  if (body.supplierId === '' || body.supplierId === null) data.supplierId = null
  delete data.id
  const ad = await db.advertisement.update({ where: { id }, data })
  return NextResponse.json(ad)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.advertisement.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
