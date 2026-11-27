import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { getPublishedBagRate } from '@/lib/bag-rate'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * POST /api/bag-investment/compound
 * Aplica el rendimiento del periodo (tasa publicada por la cooperativa según su resultado real,
 * sin tasa fija prometida) a TODAS las inversiones activas del usuario
 * cuya última aplicación haya sido hace más de 30 días.
 *
 * Validación de elegibilidad:
 *   - Solo aplica si el usuario tiene sponsorId (N1/N2 o N3 con red).
 *   - Si es N3 puro (sin red) → 400 con mensaje explicativo.
 *
 * Crea un BagCompoundEntry por cada inversión procesada y actualiza el balance.
 */
export async function POST() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  // Validar elegibilidad (¿el usuario tiene sponsor?)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { sponsorId: true, name: true },
  })
  if (!user?.sponsorId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Necesitas construir tu red para ganar interés. Invita a otros con tu código de afiliado para ser N1 o N2 y desbloquear el interés compuesto.',
      },
      { status: 400 }
    )
  }

  const rate = await getPublishedBagRate()
  if (rate <= 0) {
    return NextResponse.json({
      ok: true,
      updated: 0,
      totalInterest: 0,
      message:
        'La cooperativa aún no publica el resultado de este periodo. No se aplicó rendimiento; tu capital sigue intacto.',
    })
  }

  const now = new Date()
  const investments = await db.bagInvestment.findMany({
    where: { userId, status: 'ACTIVE' },
  })

  let updated = 0
  let totalInterest = 0

  for (const inv of investments) {
    // ¿Han pasado más de 30 días desde el último compound?
    const last = inv.lastCompoundAt
    if (!last) continue
    if (now.getTime() - last.getTime() < THIRTY_DAYS_MS) continue

    const startingBalance = inv.currentBalance
    const interestEarned = +(startingBalance * rate).toFixed(4)
    const endingBalance = +(startingBalance + interestEarned).toFixed(4)

    await db.$transaction([
      db.bagCompoundEntry.create({
        data: {
          investmentId: inv.id,
          periodStart: last,
          periodEnd: now,
          startingBalance,
          interestEarned,
          endingBalance,
          appliedAt: now,
        },
      }),
      db.bagInvestment.update({
        where: { id: inv.id },
        data: {
          currentBalance: endingBalance,
          totalEarned: +(inv.totalEarned + interestEarned).toFixed(4),
          lastCompoundAt: now,
        },
      }),
    ])

    updated += 1
    totalInterest += interestEarned
  }

  return NextResponse.json({
    ok: true,
    updated,
    totalInterest: +totalInterest.toFixed(4),
    message:
      updated > 0
        ? `Se aplicó interés compuesto a ${updated} inversión(es).`
        : 'No hay inversiones listas para aplicar interés compuesto todavía.',
  })
}
