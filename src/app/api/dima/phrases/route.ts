import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Planes → número de frases incluidas (fallback si no hay plan en Provider)
const PLAN_PHRASES_FALLBACK: Record<string, number> = {
  STARTER: 5,
  EMPRENDEDOR: 10,
  COMERCIAL: 15,
  PREMIUM: 30,
  ELITE: 35,
  CORPORATIVO: 40,
}

async function getCurrentSupplier(
  userId: string
): Promise<{ id: string; plan: string; dimaPhrases: number } | null> {
  const sup = await db.supplier.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!sup) return null
  let planName = 'STARTER'
  let dimaPhrases = 5
  // Resolver el plan real desde Provider → Subscription → Plan.dimaPhrases
  const provider = await db.provider.findUnique({
    where: { userId },
    include: {
      subscription: { include: { plan: { select: { name: true, dimaPhrases: true } } } },
    },
  })
  if (provider?.subscription?.plan) {
    planName = provider.subscription.plan.name
    dimaPhrases = provider.subscription.plan.dimaPhrases || 5
  }
  return { id: sup.id, plan: planName, dimaPhrases }
}

// GET /api/dima/phrases — lista SearchPhrase del supplier (o todas si ADMIN)
export async function GET(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { searchParams } = new URL(req.url)
  const supplierIdParam = searchParams.get('supplierId')

  let supplierId: string | null = null
  if (user.role === 'ADMIN' && supplierIdParam) {
    supplierId = supplierIdParam
  } else if (user.role === 'SUPPLIER') {
    const sup = await db.supplier.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!sup) return NextResponse.json({ error: 'No tienes perfil de proveedor.' }, { status: 404 })
    supplierId = sup.id
  } else if (user.role === 'ADMIN') {
    // ADMIN sin supplierId → todas
    const phrases = await db.searchPhrase.findMany({
      include: { supplier: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ ok: true, phrases })
  }

  if (!supplierId) {
    return NextResponse.json({ error: 'Falta supplierId' }, { status: 400 })
  }

  const phrases = await db.searchPhrase.findMany({
    where: { supplierId },
    orderBy: { createdAt: 'desc' },
  })

  const planInfo = await getCurrentSupplier(user.id)
  const planLimit = planInfo ? planInfo.dimaPhrases || PLAN_PHRASES_FALLBACK[planInfo.plan] || 5 : 5
  const includedCount = phrases.filter((p) => p.monthlyPrice === 0).length
  const extraCount = phrases.length - includedCount
  const extraCost = phrases
    .filter((p) => p.monthlyPrice > 0)
    .reduce((s, p) => s + p.monthlyPrice, 0)

  return NextResponse.json({
    ok: true,
    phrases,
    plan: planInfo?.plan || 'STARTER',
    planLimit,
    includedCount,
    extraCount,
    extraCost,
  })
}

// POST /api/dima/phrases — crea una nueva frase
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const body = await req.json().catch(() => ({}))
  const { phrase, category, isPremium } = body as {
    phrase?: string
    category?: string
    isPremium?: boolean
  }

  if (!phrase || phrase.trim().length < 2) {
    return NextResponse.json({ error: 'Frase requerida' }, { status: 400 })
  }

  const planInfo = await getCurrentSupplier(user.id)
  if (!planInfo) {
    return NextResponse.json({ error: 'No tienes perfil de proveedor.' }, { status: 404 })
  }

  // Contar frases existentes
  const existingCount = await db.searchPhrase.count({ where: { supplierId: planInfo.id } })
  const planLimit = planInfo.dimaPhrases || PLAN_PHRASES_FALLBACK[planInfo.plan] || 5
  const isIncluded = existingCount < planLimit

  const newPhrase = await db.searchPhrase.create({
    data: {
      supplierId: planInfo.id,
      phrase: phrase.trim().toLowerCase(),
      category: category || null,
      isPremium: !!isPremium,
      status: 'ACTIVE',
      monthlyPrice: isIncluded ? 0 : 1,
      paidUntil: isIncluded ? null : new Date(Date.now() + 30 * 86400000),
    },
  })

  return NextResponse.json(
    {
      ok: true,
      phrase: newPhrase,
      included: isIncluded,
      monthlyCost: isIncluded ? 0 : 1,
    },
    { status: 201 }
  )
}
