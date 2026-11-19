import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// POST /api/dima/compound — aplica interés compuesto 5% mensual a DimaSubscription + PopPurchases
// Solo si han pasado >= 30 días desde el último compound.
export async function POST() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const now = new Date()
  const THIRTY_DAYS = 30 * 86400000
  const RATE = 0.05

  let subInterest = 0
  let popInterest = 0

  // DimaSubscription compound
  const sub = await db.dimaSubscription.findUnique({ where: { userId } })
  if (sub && sub.status === 'ACTIVE' && sub.plan === 'PLUS') {
    const last = sub.lastCompoundAt ? sub.lastCompoundAt.getTime() : sub.startedAt.getTime()
    if (now.getTime() - last >= THIRTY_DAYS) {
      const interest = +(sub.currentBalance * RATE).toFixed(4)
      if (interest > 0) {
        await db.dimaSubscription.update({
          where: { userId },
          data: {
            currentBalance: { increment: interest },
            totalEarned: { increment: interest },
            lastCompoundAt: now,
          },
        })
        subInterest = interest
      }
    }
  }

  // PopPurchases compound
  const pops = await db.popPurchase.findMany({
    where: { userId, status: 'ACTIVE' },
  })
  for (const p of pops) {
    const last = p.lastCompoundAt ? p.lastCompoundAt.getTime() : p.createdAt.getTime()
    if (now.getTime() - last >= THIRTY_DAYS) {
      const interest = +(p.currentBalance * RATE).toFixed(4)
      if (interest > 0) {
        await db.popPurchase.update({
          where: { id: p.id },
          data: {
            currentBalance: { increment: interest },
            totalEarned: { increment: interest },
            lastCompoundAt: now,
          },
        })
        popInterest += interest
      }
    }
  }

  const totalInterest = +(subInterest + popInterest).toFixed(4)

  if (totalInterest === 0) {
    return NextResponse.json({
      ok: true,
      updated: false,
      message: 'No hay intereses para aplicar todavía. Vuelve en otro mes.',
      interestEarned: 0,
      newBalance: sub?.currentBalance || 0,
    })
  }

  return NextResponse.json({
    ok: true,
    updated: true,
    interestEarned: totalInterest,
    subInterest,
    popInterest,
    newBalance: (sub?.currentBalance || 0) + subInterest,
  })
}
