import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const { code } = body as { code: string }
  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  const sticker = await db.sticker.findUnique({ where: { code: code.toUpperCase() }, include: { directoryEntry: { include: { provider: { select: { companyName: true } } } } } })
  if (!sticker) return NextResponse.json({ error: 'Sticker no válido' }, { status: 404 })
  const existing = await db.albumProgress.findUnique({ where: { userId_stickerId: { userId, stickerId: sticker.id } } })
  if (existing) return NextResponse.json({ already: true, message: 'Ya tienes este sticker' })
  await db.albumProgress.create({ data: { userId, stickerId: sticker.id, source: 'STORE_VISIT' } })
  if (sticker.directoryEntryId) await db.directoryEntry.update({ where: { id: sticker.directoryEntryId }, data: { visitCount: { increment: 1 } } })
  return NextResponse.json({ collected: true, sticker: { name: sticker.name, rarity: sticker.rarity, imageUrl: sticker.imageUrl }, provider: sticker.directoryEntry?.provider?.companyName || null }, { status: 201 })
}
