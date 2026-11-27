import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { getPublishedBagRate } from '@/lib/bag-rate'

/**
 * GET /api/bag-investment
 * Lista las BagInvestment del usuario actual + stats agregadas.
 *
 * Reglas de elegibilidad:
 *   - Si el usuario tiene sponsorId (es N1, N2 o N3 con red), eligible = true.
 *   - Si no (N3 puro, sin red), eligible = false — no gana interés compuesto.
 */
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const publishedRate = await getPublishedBagRate()

  // Elegibilidad: ¿el usuario tiene sponsor (forma parte de una red)?
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true, name: true, email: true, role: true },
  })
  const eligible = !!(user?.sponsorId)

  const investments = await db.bagInvestment.findMany({
    where: { userId },
    include: {
      compoundings: { orderBy: { appliedAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // ---- Stats agregadas ----
  const active = investments.filter((i) => i.status === 'ACTIVE')
  const withdrawn = investments.filter((i) => i.status === 'WITHDRAWN')

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)
  const totalBalance = active.reduce((s, i) => s + i.currentBalance, 0)
  const totalEarned = investments.reduce((s, i) => s + i.totalEarned, 0)
  const activeCount = active.length
  const withdrawnCount = withdrawn.length

  // Proyección referencial con la tasa publicada vigente (0 si no hay publicación)
  const projected12 = totalBalance * Math.pow(1 + publishedRate, 12)

  // Próximo compound: el lastCompoundAt más antiguo entre las activas + 30 días
  let nextCompoundAt: string | null = null
  if (active.length > 0) {
    const oldest = active
      .map((i) => i.lastCompoundAt)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    if (oldest) {
      const next = new Date(oldest.getTime() + 30 * 86400000)
      nextCompoundAt = next.toISOString()
    }
  }

  return NextResponse.json({
    ok: true,
    eligible,
    publishedRate,
    user: user
      ? { name: user.name, email: user.email, role: user.role }
      : null,
    investments: investments.map((inv) => ({
      id: inv.id,
      comboQuantity: inv.comboQuantity,
      amount: inv.amount,
      monthlyRate: publishedRate,
      currentBalance: inv.currentBalance,
      lastCompoundAt: inv.lastCompoundAt,
      totalEarned: inv.totalEarned,
      orderId: inv.orderId,
      status: inv.status,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      compoundings: inv.compoundings.map((c) => ({
        id: c.id,
        periodStart: c.periodStart,
        periodEnd: c.periodEnd,
        startingBalance: c.startingBalance,
        interestEarned: c.interestEarned,
        endingBalance: c.endingBalance,
        appliedAt: c.appliedAt,
      })),
    })),
    stats: {
      totalInvested,
      totalBalance,
      totalEarned,
      projected12,
      activeCount,
      withdrawnCount,
      totalCount: investments.length,
      nextCompoundAt,
    },
  })
}
