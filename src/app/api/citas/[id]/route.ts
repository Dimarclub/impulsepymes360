import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { isOwnerOrAdmin } from '@/lib/security/auth'

const VALID_STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

/**
 * GET /api/citas/[id]
 * Detalle de una cita. Solo dueño o admin.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await ctx.params
  const appt = await db.appointment.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true, company: true, stage: true, source: true } },
    },
  })
  if (!appt) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, appt.userId)) {
    return NextResponse.json({ error: 'No tienes permisos sobre esta cita' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, appointment: appt })
}

/**
 * PATCH /api/citas/[id]
 * Actualiza campos de una cita. Solo dueño o admin.
 * Soporta: clientName, clientEmail, clientPhone, service, startsAt, endsAt, notes, contactId, status.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await ctx.params
  const existing = await db.appointment.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'No tienes permisos sobre esta cita' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (typeof body.clientName === 'string') data.clientName = body.clientName.trim()
  if (typeof body.clientEmail === 'string') data.clientEmail = body.clientEmail.trim() || null
  if (typeof body.clientPhone === 'string') data.clientPhone = body.clientPhone.trim() || null
  if (typeof body.service === 'string') data.service = body.service.trim()
  if (typeof body.notes === 'string') data.notes = body.notes.trim() || null
  if (body.contactId !== undefined) data.contactId = body.contactId || null

  if (body.startsAt !== undefined) {
    const s = new Date(body.startsAt)
    if (isNaN(s.getTime())) return NextResponse.json({ error: 'startsAt inválida' }, { status: 400 })
    data.startsAt = s
  }
  if (body.endsAt !== undefined) {
    const e = new Date(body.endsAt)
    if (isNaN(e.getTime())) return NextResponse.json({ error: 'endsAt inválida' }, { status: 400 })
    data.endsAt = e
  }
  // Validar coherencia de fechas
  const finalStart = (data.startsAt as Date | undefined) ?? existing.startsAt
  const finalEnd = (data.endsAt as Date | undefined) ?? existing.endsAt
  if (finalEnd <= finalStart) {
    return NextResponse.json({ error: 'La fecha fin debe ser posterior a la fecha inicio' }, { status: 400 })
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    data.status = body.status
  }

  // Validar contactId si viene
  if (data.contactId) {
    const contact = await db.crmContact.findUnique({ where: { id: data.contactId as string } })
    if (!contact) return NextResponse.json({ error: 'Contacto CRM no encontrado' }, { status: 400 })
  }

  const updated = await db.appointment.update({
    where: { id },
    data,
    include: {
      contact: { select: { id: true, name: true, email: true, phone: true, company: true, stage: true, source: true } },
    },
  })

  return NextResponse.json({ ok: true, appointment: updated })
}

/**
 * DELETE /api/citas/[id]
 * Elimina una cita. Solo dueño o admin.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await ctx.params
  const existing = await db.appointment.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'No tienes permisos sobre esta cita' }, { status: 403 })
  }

  await db.appointment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
