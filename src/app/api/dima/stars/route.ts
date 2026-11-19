import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// GET /api/dima/stars — lista DimaStars del usuario + total + cashback disponible
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const stars = await db.dimaStar.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const total = stars.reduce((s, st) => s + st.amount, 0)
  const cashbackDisponible = Math.floor(total / 10) // cada 10 stars = $1

  // Calcular cuántas stars ya fueron canjeadas (revisando transacciones DIMA_CASHBACK)
  const account = await db.cooperativeAccount.findUnique({ where: { userId } })
  const redeemedTxs = account
    ? await db.cooperativeTransaction.findMany({
        where: { accountId: account.id, type: 'COMMISSION_MARKETPLACE', description: { contains: 'Dima Cashback' } },
      })
    : []
  const redeemedCashback = redeemedTxs.reduce((s, t) => s + t.amount, 0)
  const starsRedeemed = Math.floor(redeemedCashback) * 10

  return NextResponse.json({
    ok: true,
    stars: stars.map((s) => ({
      id: s.id,
      amount: s.amount,
      reason: s.reason,
      referenceId: s.referenceId,
      createdAt: s.createdAt,
    })),
    total,
    cashbackDisponible,
    starsRedeemed,
    cashbackRedeemed: redeemedCashback,
  })
}

// POST /api/dima/stars — canjear cashback (transfiere a CooperativeAccount)
export async function POST() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const stars = await db.dimaStar.findMany({ where: { userId } })
  const total = stars.reduce((s, st) => s + st.amount, 0)

  let account = await db.cooperativeAccount.findUnique({ where: { userId } })
  if (!account) {
    account = await db.cooperativeAccount.create({
      data: { userId, balance: 0, totalContributed: 0, totalEarned: 0, totalWithdrawn: 0 },
    })
  }

  const redeemedTxs = await db.cooperativeTransaction.findMany({
    where: { accountId: account.id, type: 'COMMISSION_MARKETPLACE', description: { contains: 'Dima Cashback' } },
  })
  const redeemedCashback = redeemedTxs.reduce((s, t) => s + t.amount, 0)
  const starsRedeemed = Math.floor(redeemedCashback) * 10
  const availableStars = total - starsRedeemed
  const cashbackToRedeem = Math.floor(availableStars / 10)

  if (cashbackToRedeem <= 0) {
    return NextResponse.json({ error: 'No tienes cashback disponible para canjear.' }, { status: 400 })
  }

  await db.cooperativeTransaction.create({
    data: {
      accountId: account.id,
      type: 'COMMISSION_MARKETPLACE',
      amount: cashbackToRedeem,
      description: `Dima Cashback (${cashbackToRedeem * 10} estrellas)`,
      status: 'COMPLETED',
    },
  })
  await db.cooperativeAccount.update({
    where: { userId },
    data: {
      balance: { increment: cashbackToRedeem },
      totalEarned: { increment: cashbackToRedeem },
    },
  })

  return NextResponse.json({
    ok: true,
    cashbackRedeemed: cashbackToRedeem,
    starsUsed: cashbackToRedeem * 10,
    message: `¡Canjeaste ${cashbackToRedeem} estrellas por $${cashbackToRedeem.toFixed(2)}!`,
  })
}
