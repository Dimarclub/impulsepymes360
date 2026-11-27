import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { getPublishedBagRate } from '@/lib/bag-rate'

const MIN_DAYS_BETWEEN = 25

// Aplica el rendimiento del periodo a todos los socios con la tasa publicada por la cooperativa
// (según su resultado real; sin tasa fija). Evita aplicarlo dos veces en el mismo mes.
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const rate = await getPublishedBagRate()
  if (rate <= 0) {
    return NextResponse.json({ success: true, processed: 0, totalInterest: 0, message: 'No hay tasa publicada para este periodo. Publícala primero (POST /api/bag-investment/admin).' })
  }
  const ratePct = rate * 100
  const since = new Date(Date.now() - MIN_DAYS_BETWEEN * 86400000)
  const accounts = await db.cooperativeAccount.findMany({ where: { status: 'ACTIVE', balance: { gt: 0 } } })
  let totalInterest = 0
  let processed = 0

  for (const account of accounts) {
    const interestAmount = +(account.balance * rate).toFixed(2)
    if (interestAmount <= 0) continue
    const recent = await db.cooperativeTransaction.findFirst({ where: { accountId: account.id, type: 'INTEREST', createdAt: { gte: since } }, select: { id: true } })
    if (recent) continue

    await db.$transaction([
      db.cooperativeAccount.update({
        where: { id: account.id },
        data: { balance: { increment: interestAmount }, totalEarned: { increment: interestAmount } },
      }),
      db.cooperativeTransaction.create({
        data: { accountId: account.id, type: 'INTEREST', amount: interestAmount, description: `Rendimiento del periodo ${ratePct.toFixed(2)}% sobre $${account.balance.toFixed(2)}`, status: 'COMPLETED' },
      }),
    ])

    totalInterest += interestAmount
    processed++

    if (db.notification) {
      await db.notification.create({ data: { userId: account.userId, type: 'COMMISSION_EARNED', title: `Interés: $${interestAmount.toFixed(2)}`, message: `Tu capital recibió ${ratePct.toFixed(2)}% según el resultado publicado de la cooperativa.`, link: '/?module=cooperativa' } }).catch(() => {})
    }
  }

  return NextResponse.json({ success: true, processed, totalInterest: +totalInterest.toFixed(2), message: `Interés calculado para ${processed} socios. Total: $${totalInterest.toFixed(2)}` })
}
