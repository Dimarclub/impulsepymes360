import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin/referrals
 * Solo ADMIN. Lista TODOS los AppReferral del sistema con referrer + referred info.
 */
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const referrals = await db.appReferral.findMany({
    include: {
      referrer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          city: true,
          role: true,
        },
      },
      referred: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          city: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalReferrals = referrals.length
  const totalSignupCommission = referrals.reduce(
    (s, r) => s + (r.signupCommission || 0),
    0
  )
  const totalMonthlyRecurring = referrals
    .filter((r) => r.status === 'ACTIVE')
    .reduce((s, r) => s + (r.monthlyCommission || 0), 0)
  const totalEarned = referrals.reduce((s, r) => s + (r.totalEarned || 0), 0)
  const activeCount = referrals.filter((r) => r.status === 'ACTIVE').length

  return NextResponse.json({
    ok: true,
    referrals: referrals.map((r) => ({
      id: r.id,
      referrerId: r.referrerId,
      referredId: r.referredId,
      level: r.level,
      signupCommission: r.signupCommission,
      monthlyCommission: r.monthlyCommission,
      totalEarned: r.totalEarned,
      lastPaidAt: r.lastPaidAt,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      referrer: r.referrer,
      referred: r.referred,
    })),
    stats: {
      total: totalReferrals,
      active: activeCount,
      totalSignupCommission,
      totalMonthlyRecurring,
      totalEarned,
      byLevel: {
        n1: referrals.filter((r) => r.level === 1).length,
        n2: referrals.filter((r) => r.level === 2).length,
        n3: referrals.filter((r) => r.level === 3).length,
      },
    },
  })
}
