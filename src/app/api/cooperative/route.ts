import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Cuenta del socio + transacciones
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  let account = await db.cooperativeAccount.findUnique({
    where: { userId },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
  })

  if (!account) {
    account = await db.cooperativeAccount.create({ data: { userId } })
  }

  return NextResponse.json(account)
}
