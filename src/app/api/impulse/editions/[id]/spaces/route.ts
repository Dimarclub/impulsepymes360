import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Reservar espacios de una edición (durante el wizard de onboarding)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const { positions } = body as { positions: number[] }
  const edition = await db.adEdition.findUnique({ where: { id } })
  if (!edition) return NextResponse.json({ error: 'Edición no encontrada' }, { status: 404 })
  if (edition.status !== 'OPEN') return NextResponse.json({ error: 'Edición cerrada' }, { status: 400 })
  // Reservar
  const result = await db.adSpace.updateMany({
    where: { editionId: id, position: { in: positions }, status: 'AVAILABLE' },
    data: { status: 'RESERVED', reservedAt: new Date() },
  })
  return NextResponse.json({ reserved: result.count })
}
