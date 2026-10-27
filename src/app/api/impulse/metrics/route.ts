import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession } from '@/lib/security/auth'

// Métricas unificadas del ecosistema ImpulsePymes360
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const role = (auth as { role: string }).role
  const userId = (auth as { id: string }).id

  // Si es proveedor, filtrar métricas a su cuenta
  const providerFilter = role === 'SUPPLIER' ? await db.provider.findFirst({ where: { userId } }) : null
  const providerId = providerFilter?.id

  // 1. MARKETPLACE: ventas, productos, revenue
  const [totalProducts, activeProducts, totalOrders, orders] = await Promise.all([
    db.product.count(role === 'SUPPLIER' && providerId ? {
      where: { supplier: { provider: { id: providerId } } },
    } : {}),
    db.product.count(role === 'SUPPLIER' && providerId ? {
      where: { status: 'ACTIVE', supplier: { provider: { id: providerId } } },
    } : { where: { status: 'ACTIVE' } }),
    db.order.count(),
    db.order.findMany({
      where: role === 'SUPPLIER' && providerId ? { items: { some: { product: { supplier: { provider: { id: providerId } } } } } } : {},
      take: 30,
      orderBy: { createdAt: 'desc' },
      select: { total: true, createdAt: true, status: true },
    }),
  ])
  const revenue = orders.reduce((s, o) => s + o.total, 0)

  // 2. AFILIADOS: comisiones, red
  const [totalCommissions, pendingCommissions, totalAffiliates] = await Promise.all([
    db.commission.aggregate({ _sum: { amount: true } }),
    db.commission.aggregate({ _sum: { amount: true }, where: { status: 'PENDING' } }),
    db.user.count({ where: { role: { in: ['AFFILIATE', 'CLIENT'] } } }),
  ])

  // 3. FUERZA DELTA: envíos
  const [totalShipments, pendingShipments, deliveredShipments] = await Promise.all([
    db.shipmentRequest.count(),
    db.shipmentRequest.count({ where: { status: 'PENDING' } }),
    db.shipmentRequest.count({ where: { status: 'DELIVERED' } }),
  ])

  // 4. DIRECTORIO: fichas, vistas
  const [directoryEntries, directoryViews, directoryVisits] = await Promise.all([
    db.directoryEntry.count(),
    db.directoryEntry.aggregate({ _sum: { viewCount: true } }),
    db.directoryEntry.aggregate({ _sum: { visitCount: true } }),
  ])

  // 5. PUBLIBAGS: espacios, escaneos QR
  const [adSpacesSold, totalQrScans, activeEditions] = await Promise.all([
    db.adSpace.count({ where: { status: 'SOLD' } }),
    db.qRCode.aggregate({ _sum: { scans: true } }),
    db.adEdition.count({ where: { status: 'OPEN' } }),
  ])

  // 6. WEB EXPRESS: sitios, vistas
  const [websites, websiteViews] = await Promise.all([
    db.websiteExpress.count(),
    db.websiteExpress.aggregate({ _sum: { views: true } }),
  ])

  // 7. SOCIAL: posts, alcance
  const [socialPosts, socialReach] = await Promise.all([
    db.socialPost.count(),
    db.socialPost.aggregate({ _sum: { reach: true } }),
  ])

  // 8. AUTOMATIZACIÓN: eventos
  const [totalEvents, completedEvents] = await Promise.all([
    db.eventLog.count(),
    db.eventLog.count({ where: { status: 'COMPLETED' } }),
  ])

  // Ventas por día (14 días)
  const salesByDay: { date: string; total: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const total = orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).reduce((s, o) => s + o.total, 0)
    salesByDay.push({ date: key, total: +total.toFixed(2) })
  }

  // ROI por canal (ingresos atribuidos)
  const channelROI = [
    { channel: 'Marketplace', revenue: +revenue.toFixed(2), icon: 'ShoppingBag' },
    { channel: 'Web Express', revenue: 0, icon: 'Globe', views: websiteViews._sum.views || 0 },
    { channel: 'PubliBags QR', revenue: 0, icon: 'QrCode', scans: totalQrScans._sum.scans || 0 },
    { channel: 'Directorio', revenue: 0, icon: 'MapPin', views: directoryViews._sum.viewCount || 0 },
    { channel: 'Social Media', revenue: 0, icon: 'Share2', reach: socialReach._sum.reach || 0 },
  ]

  return NextResponse.json({
    marketplace: { totalProducts, activeProducts, totalOrders, revenue: +revenue.toFixed(2) },
    affiliates: {
      totalCommissions: +(totalCommissions._sum.amount || 0).toFixed(2),
      pendingCommissions: +(pendingCommissions._sum.amount || 0).toFixed(2),
      totalAffiliates,
    },
    fuerzaDelta: { totalShipments, pendingShipments, deliveredShipments },
    directorio: {
      entries: directoryEntries,
      views: directoryViews._sum.viewCount || 0,
      visits: directoryVisits._sum.visitCount || 0,
    },
    publibags: {
      adSpacesSold,
      qrScans: totalQrScans._sum.scans || 0,
      activeEditions,
    },
    webExpress: { websites, views: websiteViews._sum.views || 0 },
    social: { posts: socialPosts, reach: socialReach._sum.reach || 0 },
    automation: { totalEvents, completedEvents },
    salesByDay,
    channelROI,
  })
}
