import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { partnerId, amount } = body
  const monthlyReturn = +(amount * 0.03).toFixed(2)
  const contribution = await db.partnerContribution.create({
    data: { partnerId, amount, returnRate: 3, monthlyReturn, status: 'ACTIVE' },
  })
  // Actualizar totales del partner
  const partner = await db.partner.findUnique({ where: { id: partnerId }, include: { contributions: true } })
  if (partner) {
    const total = partner.contributions.reduce((s, c) => s + c.amount, 0)
    const returns = partner.contributions.reduce((s, c) => s + c.monthlyReturn, 0)
    await db.partner.update({ where: { id: partnerId }, data: { totalContribution: total, totalReturns: +returns.toFixed(2) } })
  }
  return NextResponse.json(contribution, { status: 201 })
}
