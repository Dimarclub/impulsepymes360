import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

async function getPhraseOwnerId(phraseId: string): Promise<{ supplierId: string; userId: string } | null> {
  const p = await db.searchPhrase.findUnique({
    where: { id: phraseId },
    select: { supplier: { select: { id: true, userId: true } } },
  })
  if (!p) return null
  return { supplierId: p.supplier.id, userId: p.supplier.userId }
}

// PATCH /api/dima/phrases/[id] — actualiza phrase/category/isPremium/status (owner)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { id } = await params
  const owner = await getPhraseOwnerId(id)
  if (!owner) return NextResponse.json({ error: 'Frase no encontrada' }, { status: 404 })
  if (user.role !== 'ADMIN' && owner.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { phrase, category, isPremium, status, monthlyPrice, paidUntil } = body as {
    phrase?: string
    category?: string
    isPremium?: boolean
    status?: 'ACTIVE' | 'PAUSED'
    monthlyPrice?: number
    paidUntil?: string
  }

  const data: any = {}
  if (typeof phrase === 'string' && phrase.trim()) data.phrase = phrase.trim().toLowerCase()
  if (category !== undefined) data.category = category || null
  if (typeof isPremium === 'boolean') data.isPremium = isPremium
  if (status === 'ACTIVE' || status === 'PAUSED') data.status = status
  if (typeof monthlyPrice === 'number') data.monthlyPrice = monthlyPrice
  if (paidUntil !== undefined) {
    data.paidUntil = paidUntil ? new Date(paidUntil) : null
  }

  const updated = await db.searchPhrase.update({ where: { id }, data })
  return NextResponse.json({ ok: true, phrase: updated })
}

// DELETE /api/dima/phrases/[id] — elimina (owner)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { id } = await params
  const owner = await getPhraseOwnerId(id)
  if (!owner) return NextResponse.json({ error: 'Frase no encontrada' }, { status: 404 })
  if (user.role !== 'ADMIN' && owner.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await db.searchPhrase.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
