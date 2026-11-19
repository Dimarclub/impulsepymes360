import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/dima/track-scan — público: registra escaneo de QR de material POP
// Body: { qrCode, userId? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { qrCode, userId } = body as { qrCode: string; userId?: string }

  if (!qrCode) return NextResponse.json({ error: 'qrCode requerido' }, { status: 400 })

  const pop = await db.popPurchase.findFirst({
    where: { qrCode },
    select: { id: true, userId: true, scanCount: true, downloadCount: true },
  })

  if (!pop) {
    return NextResponse.json({
      ok: true,
      found: false,
      appDownloadUrl: '/dima',
    })
  }

  await db.popPurchase.update({
    where: { id: pop.id },
    data: { scanCount: { increment: 1 } },
  })

  // Otorgar una DimaStar al usuario que escanea (motivo SEARCH)
  if (userId) {
    await db.dimaStar.create({
      data: { userId, amount: 1, reason: 'SEARCH', referenceId: pop.id },
    })
  }

  return NextResponse.json({
    ok: true,
    found: true,
    popPurchaseOwner: pop.userId,
    appDownloadUrl: '/dima',
  })
}
