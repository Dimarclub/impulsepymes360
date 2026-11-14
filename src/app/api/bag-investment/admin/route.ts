import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/bag-investment/admin
 * Solo ADMIN. Lista TODOS los BagInvestment del sistema con user info + compoundings.
 * Stats globales: total invertido en plataforma, balance total, total interés pagado,
 * # inversionistas activos.
 */
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const investments = await db.bagInvestment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      compoundings: {
        orderBy: { appliedAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const active = investments.filter((i) => i.status === 'ACTIVE')
  const withdrawn = investments.filter((i) => i.status === 'WITHDRAWN')

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)
  const totalBalance = active.reduce((s, i) => s + i.currentBalance, 0)
  const totalInterestPaid = investments.reduce((s, i) => s + i.totalEarned, 0)
  const activeInvestorCount = new Set(active.map((i) => i.userId)).size
  const totalInvestors = new Set(investments.map((i) => i.userId)).size
  const withdrawnAmount = withdrawn.reduce((s, i) => s + i.currentBalance, 0)

  return NextResponse.json({
    ok: true,
    investments: investments.map((inv) => ({
      id: inv.id,
      comboQuantity: inv.comboQuantity,
      amount: inv.amount,
      monthlyRate: inv.monthlyRate,
      currentBalance: inv.currentBalance,
      lastCompoundAt: inv.lastCompoundAt,
      totalEarned: inv.totalEarned,
      orderId: inv.orderId,
      status: inv.status,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      user: inv.user,
      compoundingsCount: inv.compoundings.length,
      compoundings: inv.compoundings,
    })),
    stats: {
      totalInvested,
      totalBalance,
      totalInterestPaid,
      activeInvestorCount,
      totalInvestors,
      activeCount: active.length,
      withdrawnCount: withdrawn.length,
      totalCount: investments.length,
      withdrawnAmount,
    },
  })
}
