import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// GET /api/dima/referrals — lista AppReferrals donde el usuario es referrer + stats
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const referrals = await db.appReferral.findMany({
    where: { referrerId: userId },
    include: { referred: { select: { name: true, email: true, role: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const byLevel = {
    1: referrals.filter((r) => r.level === 1),
    2: referrals.filter((r) => r.level === 2),
    3: referrals.filter((r) => r.level === 3),
  }

  const comisionesMensualesEsperadas = referrals
    .filter((r) => r.status === 'ACTIVE')
    .reduce((s, r) => s + r.monthlyCommission, 0)

  const totalGanado = referrals.reduce((s, r) => s + r.totalEarned, 0)
  const totalSignup = referrals.reduce((s, r) => s + r.signupCommission, 0)
  const totalMensual = referrals.reduce((s, r) => s + r.monthlyCommission, 0)

  // Top 10 buscadores del mes (usuarios con más DimaStars este mes)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const topUsers = await db.dimaStar.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: startOfMonth } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 10,
  })

  const topUsersWithName = await Promise.all(
    topUsers.map(async (u) => {
      const user = await db.user.findUnique({
        where: { id: u.userId },
        select: { name: true, email: true, avatarUrl: true, city: true },
      })
      return {
        userId: u.userId,
        name: user?.name || '—',
        email: user?.email || '',
        city: user?.city || null,
        avatarUrl: user?.avatarUrl || null,
        stars: u._sum.amount || 0,
      }
    })
  )

  return NextResponse.json({
    ok: true,
    referrals: referrals.map((r) => ({
      id: r.id,
      level: r.level,
      referredName: r.referred?.name || '—',
      referredEmail: r.referred?.email || '',
      referredCity: r.referred?.city || null,
      signupCommission: r.signupCommission,
      monthlyCommission: r.monthlyCommission,
      totalEarned: r.totalEarned,
      status: r.status,
      lastPaidAt: r.lastPaidAt,
      createdAt: r.createdAt,
    })),
    stats: {
      n1: byLevel[1].length,
      n2: byLevel[2].length,
      n3: byLevel[3].length,
      total: referrals.length,
      active: referrals.filter((r) => r.status === 'ACTIVE').length,
      comisionesMensualesEsperadas,
      totalGanado,
      totalSignup,
      totalMensual,
    },
    topUsers: topUsersWithName,
  })
}
