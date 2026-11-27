import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { BAG_RATE_KEY, BAG_RATE_MAX, getPublishedBagRate } from '@/lib/bag-rate'

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

/**
 * POST /api/bag-investment/admin   Body: { rate }  (fracción mensual, ej. 0.02 = 2%)
 * Solo ADMIN. Publica la tasa del periodo, calculada con el resultado real de la
 * cooperativa. Debe estar entre 0 y el tope de seguridad.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  let body: { rate?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const rate = Number(body.rate)
  if (!Number.isFinite(rate) || rate < 0 || rate > BAG_RATE_MAX) {
    return NextResponse.json(
      { error: `La tasa debe estar entre 0 y ${BAG_RATE_MAX} (ej. 0.02 = 2%)` },
      { status: 400 },
    )
  }
  await db.siteSettings.upsert({
    where: { key: BAG_RATE_KEY },
    update: { value: String(rate) },
    create: { key: BAG_RATE_KEY, value: String(rate) },
  })
  return NextResponse.json({ ok: true, rate: await getPublishedBagRate() })
}
