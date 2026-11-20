import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin
 * Solo ADMIN. Dashboard global del sistema Dima.
 * Retorna stats globales + top 10 afiliados + top 10 buscadores del mes.
 */
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  // ---------- Queries en paralelo ----------
  const [
    subscriptions,
    phrases,
    branches,
    popPurchases,
    starsThisMonthAgg,
    starsAllTime,
    reviews,
    appReferrals,
  ] = await Promise.all([
    db.dimaSubscription.findMany({
      select: {
        id: true,
        plan: true,
        status: true,
        investedAmount: true,
        currentBalance: true,
        totalEarned: true,
        userId: true,
      },
    }),
    db.searchPhrase.findMany({
      select: {
        id: true,
        status: true,
        supplierId: true,
      },
    }),
    db.supplierBranch.findMany({
      select: { id: true, isActive: true },
    }),
    db.popPurchase.findMany({
      select: {
        id: true,
        amount: true,
        currentBalance: true,
        totalEarned: true,
        scanCount: true,
        downloadCount: true,
        status: true,
      },
    }),
    db.dimaStar.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.dimaStar.findMany({
      select: { userId: true, amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    }),
    db.review.findMany({
      select: { id: true, status: true, rating: true },
    }),
    db.appReferral.findMany({
      include: {
        referrer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        referred: { select: { id: true, name: true, email: true } },
      },
      orderBy: { totalEarned: 'desc' },
      take: 200,
    }),
  ])

  // ---------- Stats ----------
  const plusActive = subscriptions.filter(
    (s) => s.plan === 'PLUS' && s.status === 'ACTIVE'
  )
  const plusAll = subscriptions.filter((s) => s.plan === 'PLUS')
  const freeUsers = subscriptions.filter((s) => s.plan === 'FREE')

  // Proveedores con frases (IDs únicos que tienen al menos una frase)
  const supplierIdsWithPhrases = new Set(phrases.map((p) => p.supplierId))
  const activePhrases = phrases.filter((p) => p.status === 'ACTIVE')
  const activeBranches = branches.filter((b) => b.isActive)

  // Capital invertido total (DimaSubscription + PopPurchase)
  const subsCapital = plusAll.reduce((s, x) => s + (x.investedAmount || 0), 0)
  const popCapital = popPurchases.reduce((s, x) => s + (x.amount || 0), 0)
  const capitalTotalInvertido = subsCapital + popCapital

  // Interés total pagado (sum de totalEarned)
  const subsInterest = subscriptions.reduce((s, x) => s + (x.totalEarned || 0), 0)
  const popInterest = popPurchases.reduce((s, x) => s + (x.totalEarned || 0), 0)
  const interesTotalPagado = subsInterest + popInterest

  // Descargas atribuidas (sum de downloadCount en PopPurchase)
  const descargasAtribuidas = popPurchases.reduce(
    (s, x) => s + (x.downloadCount || 0),
    0
  )

  // Stars otorgadas este mes
  const starsOtorgadasMes = starsThisMonthAgg._sum.amount || 0

  // Reseñas pendientes / publicadas
  const resenasPendientes = reviews.filter((r) => r.status === 'PENDING').length
  const resenasPublicadas = reviews.filter((r) => r.status === 'PUBLISHED').length
  const resenasOcultas = reviews.filter((r) => r.status === 'HIDDEN').length
  const ratingsValid = reviews
    .filter((r) => r.status === 'PUBLISHED' && r.rating >= 1 && r.rating <= 5)
    .map((r) => r.rating)
  const promedioGlobal =
    ratingsValid.length > 0
      ? Number(
          (ratingsValid.reduce((a, b) => a + b, 0) / ratingsValid.length).toFixed(2)
        )
      : 0

  // ---------- Top 10 afiliados por comisiones ganadas ----------
  // Agrupar AppReferral por referrerId y sumar totalEarned + monthlyCommission (recurrente)
  const byReferrer = new Map<
    string,
    {
      referrerId: string
      referrerName: string
      referrerEmail: string
      referrerAvatarUrl: string | null
      totalEarned: number
      monthlyRecurring: number
      referralsCount: number
    }
  >()

  for (const r of appReferrals) {
    const key = r.referrerId
    if (!r.referrer) continue
    const existing = byReferrer.get(key) || {
      referrerId: r.referrerId,
      referrerName: r.referrer.name,
      referrerEmail: r.referrer.email,
      referrerAvatarUrl: r.referrer.avatarUrl || null,
      totalEarned: 0,
      monthlyRecurring: 0,
      referralsCount: 0,
    }
    existing.totalEarned += r.totalEarned || 0
    if (r.status === 'ACTIVE') {
      existing.monthlyRecurring += r.monthlyCommission || 0
    }
    existing.referralsCount += 1
    byReferrer.set(key, existing)
  }

  const topAffiliates = Array.from(byReferrer.values())
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 10)

  // ---------- Top 10 buscadores del mes ----------
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const starsByUserThisMonth = new Map<
    string,
    { userId: string; stars: number; count: number }
  >()

  for (const s of starsAllTime) {
    if (new Date(s.createdAt) < startOfMonth) continue
    const ex = starsByUserThisMonth.get(s.userId) || {
      userId: s.userId,
      stars: 0,
      count: 0,
    }
    ex.stars += s.amount || 0
    ex.count += 1
    starsByUserThisMonth.set(s.userId, ex)
  }

  const topSearchersRaw = Array.from(starsByUserThisMonth.values()).sort(
    (a, b) => b.stars - a.stars
  )

  // Para cada uno de los top, buscar nombre + total de cashback acumulado (todas las stars del usuario)
  const topSearchers = await Promise.all(
    topSearchersRaw.slice(0, 10).map(async (u) => {
      const user = await db.user.findUnique({
        where: { id: u.userId },
        select: { id: true, name: true, email: true, avatarUrl: true, city: true },
      })
      const totalStars = await db.dimaStar.aggregate({
        where: { userId: u.userId },
        _sum: { amount: true },
      })
      return {
        userId: u.userId,
        name: user?.name || '—',
        email: user?.email || '',
        avatarUrl: user?.avatarUrl || null,
        city: user?.city || null,
        starsMes: u.stars,
        countMes: u.count,
        cashbackAcumulado: Math.floor((totalStars._sum.amount || 0) / 10), // cada 10 stars = $1
      }
    })
  )

  // ---------- Response ----------
  return NextResponse.json({
    ok: true,
    stats: {
      plusActive: plusActive.length,
      dimaFree: freeUsers.length,
      proveedoresConFrases: supplierIdsWithPhrases.size,
      frasesActivas: activePhrases.length,
      sucursalesActivas: activeBranches.length,
      capitalTotalInvertido,
      interesTotalPagado,
      descargasAtribuidas,
      starsOtorgadasMes,
      resenasPendientes,
      resenasPublicadas,
      resenasOcultas,
      promedioGlobal,
      popPurchasesCount: popPurchases.length,
      popPurchasesActive: popPurchases.filter((p) => p.status === 'ACTIVE').length,
      popPurchasesWithdrawn: popPurchases.filter((p) => p.status === 'WITHDRAWN').length,
      scansTotales: popPurchases.reduce((s, p) => s + (p.scanCount || 0), 0),
      referralsTotal: appReferrals.length,
    },
    topAffiliates,
    topSearchers,
  })
}
