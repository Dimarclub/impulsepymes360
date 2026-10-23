import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const { id } = await params
  const raffle = await db.raffle.findUnique({ where: { id } })
  if (!raffle) return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 })
  if (raffle.status !== 'ACTIVE') return NextResponse.json({ error: 'Sorteo cerrado' }, { status: 400 })
  const stickerCount = await db.albumProgress.count({ where: { userId } })
  if (stickerCount < raffle.minStickers) return NextResponse.json({ error: `Necesitas ${raffle.minStickers} stickers. Tienes ${stickerCount}.` }, { status: 400 })
  const existing = await db.raffleEntry.findUnique({ where: { raffleId_userId: { raffleId: id, userId } } })
  if (existing) return NextResponse.json({ already: true, message: 'Ya estás participando' })
  const extraEntries = Math.floor((stickerCount - raffle.minStickers) / 5)
  await db.raffleEntry.create({ data: { raffleId: id, userId, entries: 1 + extraEntries } })
  return NextResponse.json({ entered: true, entries: 1 + extraEntries, message: `¡Estás participando con ${1 + extraEntries} entrada(s)!` }, { status: 201 })
}
