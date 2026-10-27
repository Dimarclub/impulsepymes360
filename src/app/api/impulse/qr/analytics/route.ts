import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession } from '@/lib/security/auth'

// Analytics de escaneos QR
// Admin ve todos; proveedor ve solo los suyos
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const role = (auth as { role: string }).role

  const where = role === 'ADMIN' ? {} : { provider: { userId } }
  const qrs = await db.qRCode.findMany({
    where,
    include: {
      provider: { select: { companyName: true, logoUrl: true } },
      adSpace: { select: { position: true, edition: { select: { name: true, city: true } } } },
    },
    orderBy: { scans: 'desc' },
  })

  const totalScans = qrs.reduce((s, q) => s + q.scans, 0)
  const totalUnique = qrs.reduce((s, q) => s + q.uniqueScans, 0)
  const activeQrs = qrs.length

  // Escaneos por día (últimos 14 días) — parsear scanLogs
  const scansByDay: { date: string; scans: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    let count = 0
    for (const q of qrs) {
      if (!q.scanLogs) continue
      try {
        const logs = JSON.parse(q.scanLogs) as { date: string }[]
        count += logs.filter((l) => l.date.slice(0, 10) === key).length
      } catch { /* ignore */ }
    }
    scansByDay.push({ date: key, scans: count })
  }

  // Top QRs por escaneos
  const topQrs = qrs.slice(0, 10).map((q) => ({
    id: q.id,
    code: q.code,
    provider: q.provider.companyName,
    scans: q.scans,
    uniqueScans: q.uniqueScans,
    lastScanAt: q.lastScanAt,
    edition: q.adSpace?.edition.name || null,
  }))

  return NextResponse.json({
    stats: { totalScans, totalUnique, activeQrs, avgScansPerQr: activeQrs > 0 ? Math.round(totalScans / activeQrs) : 0 },
    scansByDay,
    topQrs,
    allQrs: qrs.map((q) => ({
      id: q.id,
      code: q.code,
      provider: q.provider.companyName,
      logoUrl: q.provider.logoUrl,
      scans: q.scans,
      uniqueScans: q.uniqueScans,
      lastScanAt: q.lastScanAt,
      edition: q.adSpace?.edition.name || null,
      position: q.adSpace?.position || null,
    })),
  })
}
