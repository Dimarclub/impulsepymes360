import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, requireSession } from '@/lib/security/auth'

// Listar mensajes de WhatsApp (log)
export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const role = (auth as { role: string }).role
  if (role !== 'ADMIN' && role !== 'SUPPLIER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  const messages = await db.whatsAppMessage.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    include: { shipmentRequest: { select: { id: true, status: true, recipientName: true } } },
    take: 100,
  })
  return NextResponse.json(messages)
}
