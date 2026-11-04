import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/ferias
 * Lista todas las ferias con conteo de stands. Público (para el dropdown del POS) o admin.
 * Sin auth → solo ferias activas/agendadas (para que el POS pueda listarlas).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const onlyActive = searchParams.get('onlyActive') === 'true'
  const includePast = searchParams.get('includePast') === 'true'

  const where: Record<string, unknown> = {}
  if (onlyActive) {
    where.status = { in: ['SCHEDULED', 'ACTIVE'] }
  }
  if (!includePast) {
    // Solo ferias cuya endDate >= ahora (o sin endDate)
    where.endDate = { gte: new Date() }
  }

  const fairs = await db.fair.findMany({
    where,
    orderBy: { startDate: 'asc' },
    include: {
      _count: { select: { booths: true } },
    },
  })

  // Calcular stands disponibles / reservados / confirmados en lote
  const booths = await db.fairBooth.groupBy({
    by: ['fairId', 'status'],
    _count: { _all: true },
  })

  const boothMap = new Map<string, { total: number; available: number; reserved: number; confirmed: number }>()
  for (const f of fairs) {
    boothMap.set(f.id, { total: f._count.booths, available: 0, reserved: 0, confirmed: 0 })
  }
  for (const b of booths) {
    const entry = boothMap.get(b.fairId)
    if (!entry) continue
    if (b.status === 'AVAILABLE') entry.available = b._count._all
    else if (b.status === 'RESERVED') entry.reserved = b._count._all
    else if (b.status === 'CONFIRMED') entry.confirmed = b._count._all
  }

  const result = fairs.map((f) => ({
    id: f.id,
    name: f.name,
    description: f.description,
    location: f.location,
    city: f.city,
    startDate: f.startDate,
    endDate: f.endDate,
    status: f.status,
    createdAt: f.createdAt,
    booths: boothMap.get(f.id) || { total: 0, available: 0, reserved: 0, confirmed: 0 },
  }))

  return NextResponse.json({ ok: true, fairs: result })
}

/**
 * POST /api/ferias
 * Admin crea una feria + auto-genera N stands AVAILABLE.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const {
    name,
    description,
    location,
    city,
    startDate,
    endDate,
    boothCount,
  }: {
    name?: string
    description?: string
    location?: string
    city?: string
    startDate?: string
    endDate?: string
    boothCount?: number
  } = body

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Las fechas son obligatorias' }, { status: 400 })
  }
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 })
  }
  if (end < start) {
    return NextResponse.json({ error: 'La fecha fin debe ser posterior a la fecha inicio' }, { status: 400 })
  }
  const count = Math.max(0, Math.min(500, Number(boothCount) || 0))

  // Auto-detectar estado si no se especifica
  const now = new Date()
  let status = 'SCHEDULED'
  if (start <= now && end >= now) status = 'ACTIVE'
  if (end < now) status = 'COMPLETED'

  const fair = await db.fair.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      city: city?.trim() || null,
      startDate: start,
      endDate: end,
      status,
      booths: count > 0
        ? {
            create: Array.from({ length: count }, (_, i) => ({
              boothNumber: `Stand ${String.fromCharCode(65 + Math.floor(i / 10))}-${(i % 10) + 1}`,
              status: 'AVAILABLE',
            })),
          }
        : undefined,
    },
    include: { _count: { select: { booths: true } } },
  })

  return NextResponse.json({
    ok: true,
    fair: {
      id: fair.id,
      name: fair.name,
      description: fair.description,
      location: fair.location,
      city: fair.city,
      startDate: fair.startDate,
      endDate: fair.endDate,
      status: fair.status,
      createdAt: fair.createdAt,
      booths: { total: fair._count.booths, available: fair._count.booths, reserved: 0, confirmed: 0 },
    },
  }, { status: 201 })
}
