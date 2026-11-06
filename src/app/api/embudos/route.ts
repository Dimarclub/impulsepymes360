import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/embudos
 * Lista los embudos (funnels) del usuario autenticado (SUPPLIER o ADMIN).
 * Los ADMIN ven todos los embudos; los SUPPLIER solo los suyos.
 * Incluye stages + _count.deals + suma de `value` por stage.
 */
export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const where = auth.role === 'ADMIN' ? {} : { userId: auth.id }

  const funnels = await db.funnel.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      stages: { orderBy: { order: 'asc' } },
      _count: { select: { deals: true } },
    },
  })

  // Calcular suma de `value` por stage (agregado manual porque _count no suma)
  const stageAgg = await db.deal.groupBy({
    by: ['stageId'],
    _sum: { value: true },
    _count: { _all: true },
  })
  const sumByStage = new Map<string, { total: number; count: number }>()
  for (const row of stageAgg) {
    sumByStage.set(row.stageId, {
      total: row._sum.value || 0,
      count: row._count._all,
    })
  }

  const result = funnels.map((f) => {
    const totalValue = f.stages.reduce(
      (acc, s) => acc + (sumByStage.get(s.id)?.total || 0),
      0
    )
    const totalDeals = f._count.deals
    return {
      id: f.id,
      name: f.name,
      description: f.description,
      userId: f.userId,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      stages: f.stages.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        color: s.color,
        total: sumByStage.get(s.id)?.total || 0,
        count: sumByStage.get(s.id)?.count || 0,
      })),
      stats: {
        totalValue,
        totalDeals,
      },
    }
  })

  return NextResponse.json({ ok: true, funnels: result })
}

/**
 * POST /api/embudos
 * Crea un embudo + sus stages (4 por defecto si no se envían).
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const { name, description, stages } = body as {
    name?: string
    description?: string
    stages?: { name: string; order: number; color?: string }[]
  }

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  // Stages por defecto estilo CRMHUB
  const DEFAULT_STAGES = [
    { name: 'Nuevos Leads', order: 0, color: 'emerald' },
    { name: 'Contactados', order: 1, color: 'amber' },
    { name: 'Propuesta Enviada', order: 2, color: 'purple' },
    { name: 'Ventas Cerradas', order: 3, color: 'cyan' },
  ]
  const finalStages =
    Array.isArray(stages) && stages.length > 0
      ? stages.map((s, i) => ({
          name: String(s.name || '').trim() || `Etapa ${i + 1}`,
          order: Number(s.order ?? i),
          color: s.color ? String(s.color) : null,
        }))
      : DEFAULT_STAGES

  const funnel = await db.funnel.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      userId: auth.id,
      stages: { create: finalStages },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json(
    {
      ok: true,
      funnel: {
        id: funnel.id,
        name: funnel.name,
        description: funnel.description,
        userId: funnel.userId,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        stages: funnel.stages.map((s) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          color: s.color,
          total: 0,
          count: 0,
        })),
        stats: { totalValue: 0, totalDeals: 0 },
      },
    },
    { status: 201 }
  )
}
