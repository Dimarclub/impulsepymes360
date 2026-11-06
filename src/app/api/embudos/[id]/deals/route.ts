import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

type Ctx = { params: Promise<{ id: string }> }

async function ensureOwned(auth: { id: string; role: string }, funnelId: string) {
  const funnel = await db.funnel.findUnique({
    where: { id: funnelId },
    select: { userId: true },
  })
  if (!funnel) return { error: NextResponse.json({ error: 'Embudo no encontrado' }, { status: 404 }) }
  if (!isOwnerOrAdmin(auth, funnel.userId)) {
    return { error: NextResponse.json({ error: 'Sin permisos sobre este embudo' }, { status: 403 }) }
  }
  return { funnel }
}

/**
 * GET /api/embudos/[id]/deals
 * Lista todos los deals del funnel con su stage + contact.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const owned = await ensureOwned(auth, id)
  if ('error' in owned) return owned.error

  const deals = await db.deal.findMany({
    where: { funnelId: id },
    include: {
      stage: { select: { id: true, name: true, order: true, color: true } },
      contact: { select: { id: true, name: true, company: true, email: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, deals })
}

/**
 * POST /api/embudos/[id]/deals
 * Crea un deal en el funnel (stageId requerido).
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const owned = await ensureOwned(auth, id)
  if ('error' in owned) return owned.error

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const {
    stageId,
    title,
    value,
    contactId,
    probability,
    expectedCloseDate,
    notes,
  } = body as {
    stageId?: string
    title?: string
    value?: number | string
    contactId?: string | null
    probability?: number | string
    expectedCloseDate?: string | null
    notes?: string | null
  }

  if (!stageId || !title || !title.trim()) {
    return NextResponse.json(
      { error: 'stageId y title son obligatorios' },
      { status: 400 }
    )
  }

  // Verificar que la stage pertenece al funnel
  const stage = await db.funnelStage.findFirst({
    where: { id: stageId, funnelId: id },
    select: { id: true },
  })
  if (!stage) {
    return NextResponse.json(
      { error: 'La etapa no pertenece a este embudo' },
      { status: 400 }
    )
  }

  // Validar contacto si viene
  if (contactId) {
    const contact = await db.crmContact.findUnique({ where: { id: contactId }, select: { id: true } })
    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 400 })
    }
  }

  const closeDate = expectedCloseDate ? new Date(expectedCloseDate) : null
  if (closeDate && isNaN(closeDate.getTime())) {
    return NextResponse.json({ error: 'Fecha de cierre inválida' }, { status: 400 })
  }

  const deal = await db.deal.create({
    data: {
      funnelId: id,
      stageId,
      title: title.trim(),
      value: Number(value) || 0,
      currency: 'USD',
      probability: Math.max(0, Math.min(100, Number(probability) || 0)),
      contactId: contactId || null,
      expectedCloseDate: closeDate,
      notes: notes ? String(notes).trim() : null,
      assignedToId: auth.id,
    },
    include: {
      stage: { select: { id: true, name: true, order: true, color: true } },
      contact: { select: { id: true, name: true, company: true, email: true, phone: true } },
    },
  })

  return NextResponse.json({ ok: true, deal }, { status: 201 })
}
