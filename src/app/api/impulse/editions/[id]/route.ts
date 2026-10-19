import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Detalle de una edición con sus espacios (grid)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const edition = await db.adEdition.findUnique({
    where: { id },
    include: {
      adSpaces: {
        orderBy: { position: 'asc' },
        include: { provider: { select: { companyName: true, logoUrl: true } } },
      },
    },
  })
  if (!edition) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  return NextResponse.json(edition)
}
