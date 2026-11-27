import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

function genQrCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return 'DIMA-' + code
}

// POST /api/dima/pop-purchase — compra de material POP (aporte de capital; rendimiento según resultado publicado)
// Body: { amount, items: [{type, quantity, unitPrice}], qrCode? }
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const body = await req.json().catch(() => ({}))
  const { amount, items, qrCode } = body as {
    amount?: number
    items?: Array<{ type: string; quantity: number; unitPrice: number }>
    qrCode?: string
  }

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Items requeridos' }, { status: 400 })
  }

  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
  if (Math.abs(total - amount) > 1) {
    return NextResponse.json(
      { error: `El total de items (${total}) no coincide con el monto (${amount})` },
      { status: 400 }
    )
  }

  const purchase = await db.popPurchase.create({
    data: {
      userId,
      amount: total,
      items: JSON.stringify(items),
      monthlyRate: 0, // la tasa vigente la publica la cooperativa
      currentBalance: total,
      totalEarned: 0,
      lastCompoundAt: new Date(),
      qrCode: qrCode || genQrCode(),
      scanCount: 0,
      downloadCount: 0,
      status: 'ACTIVE',
    },
  })

  // Otorgar 1 DimaStar por la compra
  await db.dimaStar.create({
    data: {
      userId,
      amount: 1,
      reason: 'PURCHASE',
      referenceId: purchase.id,
    },
  })

  return NextResponse.json(
    {
      ok: true,
      popPurchase: {
        id: purchase.id,
        amount: purchase.amount,
        currentBalance: purchase.currentBalance,
        qrCode: purchase.qrCode,
        items: purchase.items,
        createdAt: purchase.createdAt,
      },
    },
    { status: 201 }
  )
}

// GET /api/dima/pop-purchase — lista las PopPurchases del usuario + stats
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const purchases = await db.popPurchase.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const totalInvertido = purchases.reduce((s, p) => s + p.amount, 0)
  const balanceTotal = purchases
    .filter((p) => p.status === 'ACTIVE')
    .reduce((s, p) => s + p.currentBalance, 0)
  const interesGanado = purchases.reduce((s, p) => s + p.totalEarned, 0)
  const totalScans = purchases.reduce((s, p) => s + p.scanCount, 0)
  const totalDownloads = purchases.reduce((s, p) => s + p.downloadCount, 0)

  return NextResponse.json({
    ok: true,
    popPurchases: purchases.map((p) => ({
      id: p.id,
      amount: p.amount,
      items: p.items,
      monthlyRate: p.monthlyRate,
      currentBalance: p.currentBalance,
      totalEarned: p.totalEarned,
      lastCompoundAt: p.lastCompoundAt,
      qrCode: p.qrCode,
      scanCount: p.scanCount,
      downloadCount: p.downloadCount,
      status: p.status,
      createdAt: p.createdAt,
    })),
    stats: {
      totalInvertido,
      balanceTotal,
      interesGanado,
      totalScans,
      totalDownloads,
      count: purchases.length,
    },
  })
}
