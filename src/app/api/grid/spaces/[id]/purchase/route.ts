import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const { id } = await params
  const space = await db.gridSpace.findUnique({ where: { id } })
  if (!space) return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
  if (space.status !== 'AVAILABLE') return NextResponse.json({ error: 'Espacio no disponible' }, { status: 400 })
  const qrCode = 'GRID-' + id.slice(-6).toUpperCase()
  const updated = await db.gridSpace.update({ where: { id }, data: { ownerId: userId, status: 'OWNED', ownedAt: new Date(), purchasePrice: 20, qrCode, qrUrl: `/r/${qrCode}` } })
  return NextResponse.json(updated, { status: 201 })
}
