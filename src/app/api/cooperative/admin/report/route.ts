import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Reporte financiero admin
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const [accounts, allTransactions, orders, gridCommissions, materialPrices, inventory] = await Promise.all([
    db.cooperativeAccount.findMany({ include: { user: { select: { name: true, email: true } } } }),
    db.cooperativeTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    db.order.findMany({ where: { paymentStatus: 'PAID' }, select: { total: true, commission: true, createdAt: true } }),
    db.gridCommission.findMany({ select: { amount: true, status: true, createdAt: true } }),
    db.materialPrice.findMany(),
    db.materialInventory.findMany(),
  ])

  const totalCapital = accounts.reduce((s, a) => s + a.balance, 0)
  const totalContributed = accounts.reduce((s, a) => s + a.totalContributed, 0)
  const totalWithdrawn = accounts.reduce((s, a) => s + a.totalWithdrawn, 0)
  const totalSocios = accounts.length

  // Ingresos
  const marketplaceRevenue = orders.reduce((s, o) => s + o.total, 0)
  const marketplaceCommission = orders.reduce((s, o) => s + o.commission, 0)
  const gridCommissionTotal = gridCommissions.reduce((s, c) => s + c.amount, 0)

  // Por tipo de transacción
  const deposits = allTransactions.filter((t) => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0)
  const materials = allTransactions.filter((t) => t.type === 'MATERIAL').reduce((s, t) => s + t.amount, 0)
  const withdrawals = allTransactions.filter((t) => t.type === 'WITHDRAWAL').reduce((s, t) => s + Math.abs(t.amount), 0)
  const interest = allTransactions.filter((t) => t.type === 'INTEREST').reduce((s, t) => s + t.amount, 0)

  return NextResponse.json({
    stats: {
      totalSocios,
      totalCapital,
      totalContributed,
      totalWithdrawn,
      marketplaceRevenue,
      marketplaceCommission,
      gridCommissionTotal,
      deposits,
      materials,
      withdrawals,
      interest,
    },
    accounts: accounts.slice(0, 50),
    recentTransactions: allTransactions.slice(0, 30),
    materialPrices,
    inventory,
  })
}
