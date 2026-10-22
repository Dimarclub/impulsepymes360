import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const [spaces, commissions] = await Promise.all([
    db.gridSpace.findMany({ where: { ownerId: userId }, orderBy: { ownedAt: 'desc' }, include: { page: { select: { monthName: true, month: true } } } }),
    db.gridCommission.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, include: { space: { select: { buyerName: true, page: { select: { monthName: true } } } } }, take: 100 }),
  ])
  return NextResponse.json({ spaces, commissions, stats: { totalSpaces: spaces.length, soldSpaces: spaces.filter((s) => s.status === 'SOLD').length, ownedSpaces: spaces.filter((s) => s.status === 'OWNED').length, totalCommissions: commissions.reduce((s, c) => s + c.amount, 0), pendingCommissions: commissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0), paidCommissions: commissions.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0) } })
}
