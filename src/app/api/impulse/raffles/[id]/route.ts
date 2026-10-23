import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  if (body.draw) {
    const entries = await db.raffleEntry.findMany({ where: { raffleId: id } })
    if (entries.length === 0) return NextResponse.json({ error: 'No hay participantes' }, { status: 400 })
    const weighted: string[] = []
    for (const e of entries) { for (let i = 0; i < e.entries; i++) weighted.push(e.userId) }
    const winnerId = weighted[Math.floor(Math.random() * weighted.length)]
    await db.raffleEntry.updateMany({ where: { raffleId: id }, data: { winner: false } })
    await db.raffleEntry.updateMany({ where: { raffleId: id, userId: winnerId }, data: { winner: true } })
    const updated = await db.raffle.update({ where: { id }, data: { status: 'DRAWN' } })
    const winner = await db.user.findUnique({ where: { id: winnerId }, select: { name: true, email: true } })
    return NextResponse.json({ raffle: updated, winner })
  }
  const updated = await db.raffle.update({ where: { id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.raffle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
