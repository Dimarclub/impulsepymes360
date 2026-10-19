import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Listar ediciones PubliBags (público)
export async function GET() {
  const editions = await db.adEdition.findMany({
    include: {
      _count: {
        select: {
          adSpaces: { where: { status: 'AVAILABLE' } },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  })
  return NextResponse.json(editions.map(e => ({
    ...e,
    availableSpaces: e._count.adSpaces,
  })))
}
