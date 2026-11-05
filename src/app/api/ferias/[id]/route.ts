import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/ferias/[id]
 * Detalle de una feria con todos sus stands (incluye supplier si está asignado).
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const { searchParams } = new URL(req.url)
  const withRevenue = searchParams.get('withRevenue') === 'true'

  const fair = await db.fair.findUnique({
    where: { id },
    include: {
      booths: {
        orderBy: { boothNumber: 'asc' },
        include: {
          supplier: {
            select: { id: true, companyName: true, city: true, phone: true, category: true, user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  })

  if (!fair) return NextResponse.json({ error: 'Feria no encontrada' }, { status: 404 })

  let revenue = 0
  if (withRevenue) {
    // Revenue aproximado: no hay campo fairId en Order; lo simulamos a partir de las órdenes
    // cuyos items son de productos de los suppliers con stand confirmado y createdAt en rango de feria.
    const confirmedSupplierIds = fair.booths
      .filter((b) => b.supplierId && b.status === 'CONFIRMED')
      .map((b) => b.supplierId!)
    if (confirmedSupplierIds.length > 0) {
      const products = await db.product.findMany({
        where: { supplierId: { in: confirmedSupplierIds } },
        select: { id: true },
      })
      const productIds = products.map((p) => p.id)
      if (productIds.length > 0) {
        const orders = await db.order.findMany({
          where: {
            createdAt: { gte: fair.startDate, lte: fair.endDate },
            items: { some: { productId: { in: productIds } } },
          },
          select: { total: true },
        })
        revenue = orders.reduce((s, o) => s + (o.total || 0), 0)
      }
    }
  }

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
      booths: fair.booths.map((b) => ({
        id: b.id,
        boothNumber: b.boothNumber,
        status: b.status,
        supplierId: b.supplierId,
        supplier: b.supplier ? {
          id: b.supplier.id,
          companyName: b.supplier.companyName,
          city: b.supplier.city,
          phone: b.supplier.phone,
          category: b.supplier.category,
        } : null,
      })),
      revenue,
    },
  })
}

/**
 * PATCH /api/ferias/[id]  (ADMIN)
 * Actualiza una feria.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const existing = await db.fair.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Feria no encontrada' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.location !== undefined) data.location = body.location?.trim() || null
  if (body.city !== undefined) data.city = body.city?.trim() || null
  if (body.status !== undefined) data.status = body.status
  if (body.startDate) {
    const d = new Date(body.startDate)
    if (!isNaN(d.getTime())) data.startDate = d
  }
  if (body.endDate) {
    const d = new Date(body.endDate)
    if (!isNaN(d.getTime())) data.endDate = d
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const updated = await db.fair.update({
    where: { id },
    data,
    include: { _count: { select: { booths: true } } },
  })

  return NextResponse.json({
    ok: true,
    fair: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      location: updated.location,
      city: updated.city,
      startDate: updated.startDate,
      endDate: updated.endDate,
      status: updated.status,
      createdAt: updated.createdAt,
      boothCount: updated._count.booths,
    },
  })
}

/**
 * DELETE /api/ferias/[id]  (ADMIN)
 */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await ctx.params

  const existing = await db.fair.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Feria no encontrada' }, { status: 404 })

  // Cascade borra los booths asociados
  await db.fair.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
