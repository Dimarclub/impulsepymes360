import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// GET /api/dima/my-subscription — lista DimaSubscription + PopPurchases + DimaStars + AppReferrals + stats
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const [subscription, popPurchases, stars, referralsMade, referralsFrom, user] = await Promise.all([
    db.dimaSubscription.findUnique({ where: { userId } }),
    db.popPurchase.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.dimaStar.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.appReferral.findMany({
      where: { referrerId: userId },
      include: { referred: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.appReferral.findMany({
      where: { referredId: userId },
      include: { referrer: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, affiliateCode: true, sponsorId: true },
    }),
  ])

  // Stats
  const capitalTotalInvertido =
    (subscription?.investedAmount || 0) +
    popPurchases.reduce((s, p) => s + p.currentBalance, 0)
  const balanceActual =
    (subscription?.currentBalance || 0) +
    popPurchases.filter((p) => p.status === 'ACTIVE').reduce((s, p) => s + p.currentBalance, 0)
  const interesGanado =
    (subscription?.totalEarned || 0) +
    popPurchases.reduce((s, p) => s + p.totalEarned, 0)
  const starsTotal = stars.reduce((s, st) => s + st.amount, 0)
  const cashbackDisponible = Math.floor(starsTotal / 10) // cada 10 stars = $1

  const referralsByLevel = {
    1: referralsMade.filter((r) => r.level === 1).length,
    2: referralsMade.filter((r) => r.level === 2).length,
    3: referralsMade.filter((r) => r.level === 3).length,
  }

  const comisionesMensualesEsperadas = referralsMade
    .filter((r) => r.status === 'ACTIVE')
    .reduce((s, r) => s + r.monthlyCommission, 0)
  const comisionesTotalGanadas = referralsMade.reduce((s, r) => s + r.totalEarned, 0)
  const comisionesPorCobrar = referralsMade
    .filter((r) => r.status === 'ACTIVE')
    .reduce((s, r) => s + r.monthlyCommission, 0)

  return NextResponse.json({
    ok: true,
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          affiliateCode: user.affiliateCode,
          sponsorId: user.sponsorId,
        }
      : null,
    subscription: subscription
      ? {
          id: subscription.id,
          plan: subscription.plan,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
          investedAmount: subscription.investedAmount,
          currentBalance: subscription.currentBalance,
          totalEarned: subscription.totalEarned,
          lastCompoundAt: subscription.lastCompoundAt,
          startedAt: subscription.startedAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
          referredBy: subscription.referredBy,
        }
      : null,
    popPurchases: popPurchases.map((p) => ({
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
    stars: stars.map((s) => ({
      id: s.id,
      amount: s.amount,
      reason: s.reason,
      referenceId: s.referenceId,
      createdAt: s.createdAt,
    })),
    referrals: {
      made: referralsMade.map((r) => ({
        id: r.id,
        level: r.level,
        referredName: r.referred?.name || '—',
        referredEmail: r.referred?.email || '',
        signupCommission: r.signupCommission,
        monthlyCommission: r.monthlyCommission,
        totalEarned: r.totalEarned,
        status: r.status,
        lastPaidAt: r.lastPaidAt,
        createdAt: r.createdAt,
      })),
      from: referralsFrom.map((r) => ({
        id: r.id,
        level: r.level,
        referrerName: r.referrer?.name || '—',
        signupCommission: r.signupCommission,
        monthlyCommission: r.monthlyCommission,
        totalEarned: r.totalEarned,
        status: r.status,
        createdAt: r.createdAt,
      })),
    },
    stats: {
      capitalTotalInvertido,
      balanceActual,
      interesGanado,
      starsTotal,
      cashbackDisponible,
      comisionesMensualesEsperadas,
      comisionesTotalGanadas,
      comisionesPorCobrar,
      referralsByLevel,
    },
  })
}
