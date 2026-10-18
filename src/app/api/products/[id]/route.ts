import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true, supplier: true },
  })
  if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN', 'SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const update: Record<string, unknown> = { ...body }
  if (body.tags && Array.isArray(body.tags)) update.tags = JSON.stringify(body.tags)
  if (body.compareAtPrice === '') update.compareAtPrice = null
  const product = await db.product.update({ where: { id }, data: update })
  return NextResponse.json(product)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN', 'SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.product.update({ where: { id }, data: { status: 'ARCHIVED' } })
  return NextResponse.json({ ok: true })
}
