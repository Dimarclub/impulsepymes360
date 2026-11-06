import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

type Ctx = { params: Promise<{ id: string; dealId: string }> }

/**
 * PATCH /api/embudos/[id]/deals/[dealId]
 * Actualiza campos del deal. Si cambia stageId, valida que la nueva stage
 * pertenezca al mismo funnel.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id, dealId } = await params
  const funnel = await db.funnel.findUnique({ where: { id }, select: { userId: true } })
  if (!funnel) {
    return NextResponse.json({ error: 'Embudo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, funnel.userId)) {
    return NextResponse.json({ error: 'Sin permisos sobre este embudo' }, { status: 403 })
  }

  const existing = await db.deal.findUnique({
    where: { id: dealId },
    select: { id: true, funnelId: true },
  })
  if (!existing || existing.funnelId !== id) {
    return NextResponse.json({ error: 'Deal no encontrado en este embudo' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const data: {
    stageId?: string
    title?: string
    value?: number
    probability?: number
    notes?: string | null
    expectedCloseDate?: Date | null
    contactId?: string | null
  } = {}

  if (typeof body.stageId === 'string' && body.stageId) {
    const stage = await db.funnelStage.findFirst({
      where: { id: body.stageId, funnelId: id },
      select: { id: true },
    })
    if (!stage) {
      return NextResponse.json(
        { error: 'La etapa no pertenece a este embudo' },
        { status: 400 }
      )
    }
    data.stageId = body.stageId
  }
  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim()
  }
  if (body.value !== undefined) {
    data.value = Number(body.value) || 0
  }
  if (body.probability !== undefined) {
    data.probability = Math.max(0, Math.min(100, Number(body.probability) || 0))
  }
  if (body.notes !== undefined) {
    data.notes = typeof body.notes === 'string' ? body.notes.trim() || null : null
  }
  if (body.expectedCloseDate !== undefined) {
    const d = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null
    if (d && isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Fecha de cierre inválida' }, { status: 400 })
    }
    data.expectedCloseDate = d
  }
  if (body.contactId !== undefined) {
    if (body.contactId) {
      const c = await db.crmContact.findUnique({ where: { id: body.contactId }, select: { id: true } })
      if (!c) {
        return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 400 })
      }
      data.contactId = body.contactId
    } else {
      data.contactId = null
    }
  }

  const updated = await db.deal.update({
    where: { id: dealId },
    data,
    include: {
      stage: { select: { id: true, name: true, order: true, color: true } },
      contact: { select: { id: true, name: true, company: true, email: true, phone: true } },
    },
  })

  return NextResponse.json({ ok: true, deal: updated })
}

/**
 * DELETE /api/embudos/[id]/deals/[dealId]
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id, dealId } = await params
  const funnel = await db.funnel.findUnique({ where: { id }, select: { userId: true } })
  if (!funnel) {
    return NextResponse.json({ error: 'Embudo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, funnel.userId)) {
    return NextResponse.json({ error: 'Sin permisos sobre este embudo' }, { status: 403 })
  }

  const existing = await db.deal.findUnique({
    where: { id: dealId },
    select: { id: true, funnelId: true },
  })
  if (!existing || existing.funnelId !== id) {
    return NextResponse.json({ error: 'Deal no encontrado en este embudo' }, { status: 404 })
  }

  await db.deal.delete({ where: { id: dealId } })
  return NextResponse.json({ ok: true })
}
