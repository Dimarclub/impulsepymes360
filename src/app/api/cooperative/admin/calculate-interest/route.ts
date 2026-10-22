import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Calcular interés compuesto 5% mensual para todos los socios
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const accounts = await db.cooperativeAccount.findMany({ where: { status: 'ACTIVE', balance: { gt: 0 } } })
  let totalInterest = 0
  let processed = 0

  for (const account of accounts) {
    const interestAmount = +(account.balance * (account.interestRate / 100)).toFixed(2)
    if (interestAmount <= 0) continue

    await db.$transaction([
      db.cooperativeAccount.update({
        where: { id: account.id },
        data: { balance: { increment: interestAmount }, totalEarned: { increment: interestAmount } },
      }),
      db.cooperativeTransaction.create({
        data: { accountId: account.id, type: 'INTEREST', amount: interestAmount, description: `Interés ${account.interestRate}% sobre $${account.balance.toFixed(2)}`, status: 'COMPLETED' },
      }),
    ])

    totalInterest += interestAmount
    processed++

    if (db.notification) {
      await db.notification.create({ data: { userId: account.userId, type: 'COMMISSION_EARNED', title: `Interés: $${interestAmount.toFixed(2)}`, message: `Tu capital generó ${account.interestRate}% este mes.`, link: '/?module=cooperativa' } }).catch(() => {})
    }
  }

  return NextResponse.json({ success: true, processed, totalInterest: +totalInterest.toFixed(2), message: `Interés calculado para ${processed} socios. Total: $${totalInterest.toFixed(2)}` })
}
