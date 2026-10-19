import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// Listar QRs del proveedor actual
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const provider = await db.provider.findFirst({ where: { userId } })
  if (!provider) return NextResponse.json([])
  const qrs = await db.qRCode.findMany({
    where: { providerId: provider.id },
    include: { adSpace: { select: { position: true, edition: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(qrs)
}
