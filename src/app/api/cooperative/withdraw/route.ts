import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Retirar capital acumulado
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const { amount } = body as { amount: number }

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const account = await db.cooperativeAccount.findUnique({ where: { userId } })
  if (!account) return NextResponse.json({ error: 'No tienes cuenta' }, { status: 404 })
  if (account.balance < amount) return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })

  const [updatedAccount, tx] = await db.$transaction([
    db.cooperativeAccount.update({
      where: { userId },
      data: { balance: { decrement: amount }, totalWithdrawn: { increment: amount } },
    }),
    db.cooperativeTransaction.create({
      data: {
        accountId: account.id,
        type: 'WITHDRAWAL',
        amount: -amount,
        description: 'Retiro de capital acumulado',
        status: 'COMPLETED',
      },
    }),
  ])

  return NextResponse.json({ account: updatedAccount, transaction: tx }, { status: 200 })
}
