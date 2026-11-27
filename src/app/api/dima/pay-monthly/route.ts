import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { REFERRAL_MONTHLY } from '../_lib'

// POST /api/dima/pay-monthly — cobro mensual recurrente de Dima Plus (auth)
// Acredita el pago como aporte de capital y paga comisiones N1/N2/N3 a los sponsors.
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const body = await req.json().catch(() => ({}))
  const { billingCycle } = body as { billingCycle?: 'MONTHLY' | 'ANNUAL' }

  const sub = await db.dimaSubscription.findUnique({ where: { userId } })
  if (!sub || sub.status !== 'ACTIVE' || sub.plan !== 'PLUS') {
    return NextResponse.json({ error: 'No tienes suscripción Dima Plus activa.' }, { status: 400 })
  }

  const cycle = billingCycle === 'ANNUAL' ? 'ANNUAL' : sub.billingCycle || 'MONTHLY'
  const amount = cycle === 'ANNUAL' ? 200 : 20

  // Buscar sponsors del usuario (referredBy como N1)
  const sponsors: Array<{ id: string; level: number }> = []
  if (sub.referredBy) {
    let currentId: string | null = sub.referredBy
    for (let level = 1; level <= 3; level++) {
      if (!currentId) break
      const u = await db.user.findUnique({
        where: { id: currentId },
        select: { id: true, sponsorId: true },
      })
      if (!u) break
      sponsors.push({ id: u.id, level })
      currentId = u.sponsorId
    }
  }

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.dimaSubscription.update({
      where: { userId },
      data: {
        investedAmount: { increment: amount },
        currentBalance: { increment: amount },
        lastCompoundAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + (cycle === 'ANNUAL' ? 365 : 30) * 86400000),
        billingCycle: cycle,
      },
    })

    // Pagar comisiones mensuales a cada sponsor
    const commissions: Array<{ level: number; userId: string; amount: number }> = []
    for (const sp of sponsors) {
      const monthly = sp.level === 1 ? REFERRAL_MONTHLY[1] : sp.level === 2 ? REFERRAL_MONTHLY[2] : REFERRAL_MONTHLY[3]
      const acc = await tx.cooperativeAccount.findUnique({ where: { userId: sp.id } })
      if (acc) {
        await tx.cooperativeTransaction.create({
          data: {
            accountId: acc.id,
            type: 'COMMISSION_MARKETPLACE',
            amount: monthly,
            description: `Comisión Dima N${sp.level} (mensual)`,
            referenceId: updated.id,
            status: 'COMPLETED',
          },
        })
        await tx.cooperativeAccount.update({
          where: { userId: sp.id },
          data: {
            balance: { increment: monthly },
            totalEarned: { increment: monthly },
          },
        })
      } else {
        await tx.cooperativeAccount.create({
          data: { userId: sp.id, balance: monthly, totalEarned: monthly },
        })
        const newAcc = await tx.cooperativeAccount.findUnique({ where: { userId: sp.id } })
        if (newAcc) {
          await tx.cooperativeTransaction.create({
            data: {
              accountId: newAcc.id,
              type: 'COMMISSION_MARKETPLACE',
              amount: monthly,
              description: `Comisión Dima N${sp.level} (mensual)`,
              referenceId: updated.id,
              status: 'COMPLETED',
            },
          })
        }
      }
      // Actualizar totalEarned del AppReferral
      const ref = await tx.appReferral.findUnique({ where: { referredId: userId } })
      if (ref && ref.referrerId === sp.id) {
        await tx.appReferral.update({
          where: { id: ref.id },
          data: {
            totalEarned: { increment: monthly },
            lastPaidAt: new Date(),
          },
        })
      }
      commissions.push({ level: sp.level, userId: sp.id, amount: monthly })
    }

    return { updated, commissions }
  })

  return NextResponse.json({
    ok: true,
    newBalance: result.updated.currentBalance,
    investedAmount: result.updated.investedAmount,
    currentPeriodEnd: result.updated.currentPeriodEnd,
    commissions: result.commissions,
  })
}
