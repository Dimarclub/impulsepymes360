import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Aporte de efectivo
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const { amount, description } = body as { amount: number; description?: string }

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  let account = await db.cooperativeAccount.findUnique({ where: { userId } })
  if (!account) account = await db.cooperativeAccount.create({ data: { userId } })

  const newBalance = account.balance + amount
  const [updatedAccount, tx] = await db.$transaction([
    db.cooperativeAccount.update({
      where: { userId },
      data: { balance: newBalance, totalContributed: { increment: amount } },
    }),
    db.cooperativeTransaction.create({
      data: {
        accountId: account.id,
        type: 'DEPOSIT',
        amount,
        description: description || 'Aporte de efectivo',
        status: 'COMPLETED',
      },
    }),
  ])

  return NextResponse.json({ account: updatedAccount, transaction: tx }, { status: 201 })
}
