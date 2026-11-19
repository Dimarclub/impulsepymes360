import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { REFERRAL_SIGNUP } from '../_lib'

// POST /api/dima/subscribe — suscripción a Dima Plus (auth requerido)
// Body: { plan: 'PLUS', billingCycle: 'MONTHLY'|'ANNUAL', referredBy?: string (userId) }
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const body = await req.json().catch(() => ({}))
  const { plan, billingCycle, referredBy } = body as {
    plan: 'PLUS' | 'FREE'
    billingCycle: 'MONTHLY' | 'ANNUAL'
    referredBy?: string
  }

  if (plan !== 'PLUS') {
    return NextResponse.json({ error: 'Plan no soportado. Usa PLUS.' }, { status: 400 })
  }
  const cycle = billingCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY'
  const paymentAmount = cycle === 'ANNUAL' ? 200 : 20

  // Verificar si ya tiene suscripción activa
  const existing = await db.dimaSubscription.findUnique({ where: { userId } })
  if (existing && existing.status === 'ACTIVE' && existing.plan === 'PLUS') {
    return NextResponse.json(
      { error: 'Ya tienes una suscripción Dima Plus activa.' },
      { status: 409 }
    )
  }

  // Resolver referredBy → buscar sponsor
  let referrerId: string | null = null
  if (referredBy) {
    const ref = await db.user.findUnique({ where: { id: referredBy }, select: { id: true } })
    if (ref) referrerId = ref.id
  }

  const subscription = await db.$transaction(async (tx) => {
    let sub = await tx.dimaSubscription.findUnique({ where: { userId } })
    if (sub) {
      sub = await tx.dimaSubscription.update({
        where: { userId },
        data: {
          plan: 'PLUS',
          billingCycle: cycle,
          pricePerMonth: 20,
          status: 'ACTIVE',
          investedAmount: { increment: paymentAmount },
          currentBalance: { increment: paymentAmount },
          lastCompoundAt: new Date(),
          currentPeriodEnd: new Date(Date.now() + (cycle === 'ANNUAL' ? 365 : 30) * 86400000),
          referredBy: referrerId || sub.referredBy,
          cancelledAt: null,
        },
      })
    } else {
      sub = await tx.dimaSubscription.create({
        data: {
          userId,
          plan: 'PLUS',
          billingCycle: cycle,
          pricePerMonth: 20,
          status: 'ACTIVE',
          investedAmount: paymentAmount,
          currentBalance: paymentAmount,
          totalEarned: 0,
          lastCompoundAt: new Date(),
          startedAt: new Date(),
          currentPeriodEnd: new Date(Date.now() + (cycle === 'ANNUAL' ? 365 : 30) * 86400000),
          referredBy: referrerId,
        },
      })
    }

    // Crear AppReferral para cada nivel de la cadena N1, N2, N3
    const sponsors: Array<{ id: string; level: number }> = []
    if (referrerId) {
      let currentId: string | null = referrerId
      for (let level = 1; level <= 3; level++) {
        if (!currentId) break
        const u = await tx.user.findUnique({
          where: { id: currentId },
          select: { id: true, sponsorId: true },
        })
        if (!u) break
        sponsors.push({ id: u.id, level })
        currentId = u.sponsorId
      }
    }

    const firstCommissions: Array<{ level: number; userId: string; amount: number }> = []

    for (const sp of sponsors) {
      const signupAmount = REFERRAL_SIGNUP[sp.level as 1 | 2 | 3] || 0
      const monthlyAmount = sp.level === 1 ? 2 : sp.level === 2 ? 1 : 0.5

      // Si ya existía una AppReferral (mismo referrer+referred), actualizar
      const existingRef = await tx.appReferral.findUnique({
        where: { referredId: userId },
      })
      if (existingRef && existingRef.referrerId === sp.id) {
        await tx.appReferral.update({
          where: { id: existingRef.id },
          data: {
            signupCommission: { increment: signupAmount },
            monthlyCommission: monthlyAmount,
            totalEarned: { increment: signupAmount },
            lastPaidAt: new Date(),
            status: 'ACTIVE',
          },
        })
      } else if (!existingRef) {
        await tx.appReferral.create({
          data: {
            referrerId: sp.id,
            referredId: userId,
            level: sp.level,
            signupCommission: signupAmount,
            monthlyCommission: monthlyAmount,
            totalEarned: signupAmount,
            lastPaidAt: new Date(),
            status: 'ACTIVE',
          },
        })
      }
      firstCommissions.push({ level: sp.level, userId: sp.id, amount: signupAmount })
    }

    // Acreditar signup commissions a cada sponsor
    for (const c of firstCommissions) {
      const sponsorAccount = await tx.cooperativeAccount.findUnique({ where: { userId: c.userId } })
      if (sponsorAccount) {
        await tx.cooperativeTransaction.create({
          data: {
            accountId: sponsorAccount.id,
            type: 'COMMISSION_MARKETPLACE',
            amount: c.amount,
            description: `Comisión Dima N${c.level} (signup)`,
            referenceId: sub.id,
            status: 'COMPLETED',
          },
        })
        await tx.cooperativeAccount.update({
          where: { userId: c.userId },
          data: {
            balance: { increment: c.amount },
            totalEarned: { increment: c.amount },
          },
        })
      } else {
        await tx.cooperativeAccount.create({
          data: {
            userId: c.userId,
            balance: c.amount,
            totalContributed: 0,
            totalEarned: c.amount,
            totalWithdrawn: 0,
          },
        })
        const newAcc = await tx.cooperativeAccount.findUnique({ where: { userId: c.userId } })
        if (newAcc) {
          await tx.cooperativeTransaction.create({
            data: {
              accountId: newAcc.id,
              type: 'COMMISSION_MARKETPLACE',
              amount: c.amount,
              description: `Comisión Dima N${c.level} (signup)`,
              referenceId: sub.id,
              status: 'COMPLETED',
            },
          })
        }
      }
    }

    return { sub, firstCommissions }
  })

  return NextResponse.json(
    {
      ok: true,
      subscription: {
        id: subscription.sub.id,
        plan: subscription.sub.plan,
        billingCycle: subscription.sub.billingCycle,
        status: subscription.sub.status,
        investedAmount: subscription.sub.investedAmount,
        currentBalance: subscription.sub.currentBalance,
        currentPeriodEnd: subscription.sub.currentPeriodEnd,
      },
      investedAmount: subscription.sub.investedAmount,
      firstCommissions: subscription.firstCommissions,
    },
    { status: 201 }
  )
}
