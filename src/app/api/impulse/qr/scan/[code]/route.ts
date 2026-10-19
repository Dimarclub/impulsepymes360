import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Escaneo público de QR: GET /api/impulse/qr/scan/[code]
// Registra el escaneo y redirige al targetUrl
export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const qr = await db.qRCode.findUnique({ where: { code: code.toUpperCase() } })
  if (!qr) return NextResponse.json({ error: 'QR no encontrado' }, { status: 404 })
  // Registrar escaneo
  await db.qRCode.update({
    where: { id: qr.id },
    data: {
      scans: { increment: 1 },
      lastScanAt: new Date(),
      scanLogs: JSON.stringify([...(qr.scanLogs ? JSON.parse(qr.scanLogs) : []), { date: new Date().toISOString() }].slice(-100)),
    },
  })
  // Devolver la URL destino (el frontend redirige)
  return NextResponse.json({ targetUrl: qr.targetUrl, scans: qr.scans + 1 })
}
