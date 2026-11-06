import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

/**
 * POST /api/bandeja/[id]/reply
 * Envía una respuesta a un mensaje entrante.
 * Body: { body }
 * - Crea un UnifiedMessage outgoing con el mismo canal del original.
 * - fromName = toName del original (o nombre del usuario), fromHandle = handle del destinatario.
 * - parentMessageId = id del mensaje original.
 * - Marca el original como REPLIED.
 * (Simulado: no envía realmente por la red social.)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const original = await db.unifiedMessage.findUnique({ where: { id } })

  if (!original) {
    return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: '' } as any, original.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  const body = await req.json()
  if (!body?.body || !String(body.body).trim()) {
    return NextResponse.json(
      { error: 'El cuerpo de la respuesta es obligatorio' },
      { status: 400 }
    )
  }

  // El outgoing se "envía a" el contacto que escribió originalmente.
  const created = await db.unifiedMessage.create({
    data: {
      userId: auth.id,
      channel: original.channel,
      fromName: auth.name || 'Yo',
      fromHandle: null,
      toName: original.fromName,
      subject: original.subject ? `Re: ${original.subject}` : null,
      body: String(body.body).trim(),
      contactId: original.contactId || null,
      isOutgoing: true,
      status: 'READ',
      parentMessageId: original.id,
    },
  })

  // Marcamos el original como respondido.
  await db.unifiedMessage.update({
    where: { id: original.id },
    data: { status: 'REPLIED' },
  })

  return NextResponse.json({ ok: true, message: created }, { status: 201 })
}
