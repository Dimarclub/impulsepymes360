import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireRole('ADMIN', 'AFFILIATE', 'SUPPLIER', 'PARTNER')
  if (auth instanceof NextResponse) return auth
  const [
    totalUsers, totalProducts, totalOrders, totalSuppliers,
    totalCouriers, totalPartners, totalAffiliates, pendingApps,
    orders, commissions, partners, adClicks
  ] = await Promise.all([
    db.user.count(),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.order.count(),
    db.supplier.count(),
    db.courier.count(),
    db.partner.count(),
    db.user.count({ where: { role: { in: ['AFFILIATE', 'CLIENT'] } } }),
    db.application.count({ where: { status: 'PENDING' } }),
    db.order.findMany({ take: 30, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
    db.commission.findMany({ take: 50, orderBy: { createdAt: 'desc' } }),
    db.partner.findMany({ include: { user: { select: { name: true } } } }),
    db.advertisement.aggregate({ _sum: { clicks: true, impressions: true } }),
  ])

  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const totalCommissions = commissions.reduce((s, c) => s + c.amount, 0)
  const totalCapital = partners.reduce((s, p) => s + p.totalContribution, 0)

  // Ventas por día (últimos 14 días)
  const days: { date: string; total: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const total = orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).reduce((s, o) => s + o.total, 0)
    days.push({ date: key, total: +total.toFixed(2) })
  }

  // Ventas por categoría
  const products = await db.product.findMany({ include: { category: true } })
  const orderItems = await db.orderItem.findMany({ include: { product: { include: { category: true } } } })
  const byCategory: Record<string, number> = {}
  for (const oi of orderItems) {
    const cn = oi.product.category?.name || 'Otros'
    byCategory[cn] = (byCategory[cn] || 0) + oi.price * oi.quantity
  }

  // Comisiones por nivel
  const commissionsByLevel: Record<string, number> = { N0: 0, N1: 0, N2: 0, N3: 0 }
  for (const c of commissions) {
    const key = c.level === 0 ? 'N0' : `N${c.level}`
    commissionsByLevel[key] = (commissionsByLevel[key] || 0) + c.amount
  }

  return NextResponse.json({
    stats: {
      totalUsers, totalProducts, totalOrders, totalSuppliers,
      totalCouriers, totalPartners, totalAffiliates, pendingApps,
      revenue: +revenue.toFixed(2),
      totalCommissions: +totalCommissions.toFixed(2),
      totalCapital: +totalCapital.toFixed(2),
      adClicks: adClicks._sum.clicks || 0,
      adImpressions: adClicks._sum.impressions || 0,
    },
    salesByDay: days,
    salesByCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value: +value.toFixed(2) })),
    commissionsByLevel: Object.entries(commissionsByLevel).map(([name, value]) => ({ name, value: +value.toFixed(2) })),
    recentOrders: orders.slice(0, 10),
    topProducts: products.slice(0, 5).map((p) => ({ name: p.name, sales: p.reviewCount, revenue: p.price * p.reviewCount })),
  })
}
