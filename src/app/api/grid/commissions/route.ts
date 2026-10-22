import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const role = (auth as { role: string }).role
  const where = role === 'ADMIN' ? {} : { userId }
  const commissions = await db.gridCommission.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, space: { select: { buyerName: true, position: true, page: { select: { monthName: true } } } } }, take: 200 })
  return NextResponse.json(commissions)
}
