import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin/subscriptions
 * Solo ADMIN. Lista TODAS las DimaSubscription del sistema con user info.
 * Filtros: ?status=ACTIVE|PAST_DUE|CANCELLED&plan=FREE|PLUS
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // ACTIVE | PAST_DUE | CANCELLED
  const plan = searchParams.get('plan') // FREE | PLUS

  const where: any = {}
  if (status && ['ACTIVE', 'PAST_DUE', 'CANCELLED'].includes(status)) {
    where.status = status
  }
  if (plan && ['FREE', 'PLUS'].includes(plan)) {
    where.plan = plan
  }

  const subscriptions = await db.dimaSubscription.findMany({
    where,
    include: {
      user: {
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

  return NextResponse.json({
    ok: true,
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      plan: s.plan,
      pricePerMonth: s.pricePerMonth,
      billingCycle: s.billingCycle,
      status: s.status,
      investedAmount: s.investedAmount,
      currentBalance: s.currentBalance,
      totalEarned: s.totalEarned,
      lastCompoundAt: s.lastCompoundAt,
      startedAt: s.startedAt,
      currentPeriodEnd: s.currentPeriodEnd,
      cancelledAt: s.cancelledAt,
      referredBy: s.referredBy,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      user: s.user,
    })),
  })
}
