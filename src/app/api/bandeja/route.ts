import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/bandeja
 * Lista los UnifiedMessage del usuario (50 más recientes).
 * Filtros query: ?channel=WHATSAPP&status=UNREAD
 * Retorna: { ok, messages, stats: { total, unread, byChannel } }
 * Acceso: SUPPLIER + ADMIN.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel') || undefined
  const status = searchParams.get('status') || undefined

  const where: {
    userId: string
    channel?: string
    status?: string
    isOutgoing?: boolean
  } = {
    userId: auth.id,
  }
  if (channel && channel !== 'ALL') where.channel = channel.toUpperCase()
  if (status && status !== 'ALL') where.status = status.toUpperCase()

  const messages = await db.unifiedMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { contact: true },
  })

  // Stats globales del usuario (sin filtros) para pintar badges de canales
  const all = await db.unifiedMessage.findMany({
    where: { userId: auth.id },
    select: { channel: true, status: true },
  })

  const byChannel: Record<string, number> = {}
  let total = 0
  let unread = 0
  for (const m of all) {
    total++
    byChannel[m.channel] = (byChannel[m.channel] || 0) + 1
    if (m.status === 'UNREAD') unread++
  }

  return NextResponse.json({
    ok: true,
    messages,
    stats: { total, unread, byChannel },
  })
}

/**
 * POST /api/bandeja
 * Crea un mensaje outgoing (enviado por el usuario).
 * Body: { channel, fromName, fromHandle?, toName?, subject?, body, contactId? }
 * El mensaje se crea como isOutgoing=true, status=READ.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  if (!body?.channel || !body?.fromName || !body?.body) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: channel, fromName, body' },
      { status: 400 }
    )
  }

  const created = await db.unifiedMessage.create({
    data: {
      userId: auth.id,
      channel: String(body.channel).toUpperCase(),
      fromName: body.fromName,
      fromHandle: body.fromHandle || null,
      toName: body.toName || null,
      subject: body.subject || null,
      body: body.body,
      contactId: body.contactId || null,
      isOutgoing: true,
      status: 'READ',
    },
  })

  return NextResponse.json({ ok: true, message: created }, { status: 201 })
}
