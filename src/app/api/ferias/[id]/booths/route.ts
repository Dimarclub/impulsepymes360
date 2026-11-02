import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/ferias/[id]/booths
 * Admin asigna (o libera) un supplier a un stand.
 * Body: { boothId, supplierId? }
 *  - supplierId presente → status CONFIRMED + supplierId
 *  - supplierId null/vacío → libera el stand (AVAILABLE + supplierId null)
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await ctx.params

  const body = await req.json().catch(() => null)
  if (!body || !body.boothId) {
    return NextResponse.json({ error: 'boothId es obligatorio' }, { status: 400 })
  }

  const { boothId, supplierId } = body as { boothId: string; supplierId?: string | null }

  const fair = await db.fair.findUnique({ where: { id }, select: { id: true } })
  if (!fair) return NextResponse.json({ error: 'Feria no encontrada' }, { status: 404 })

  const booth = await db.fairBooth.findUnique({ where: { id: boothId } })
  if (!booth || booth.fairId !== id) {
    return NextResponse.json({ error: 'El stand no pertenece a esta feria' }, { status: 400 })
  }

  // Si supplierId viene, validar que exista
  if (supplierId && supplierId.trim()) {
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, companyName: true },
    })
    if (!supplier) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 })
    }
    const updated = await db.fairBooth.update({
      where: { id: boothId },
      data: { supplierId: supplier.id, status: 'CONFIRMED' },
      include: { supplier: { select: { id: true, companyName: true, city: true, phone: true, category: true } } },
    })

    // Notificar al supplier que se le asignó un stand
    try {
      const supplierUser = await db.supplier.findUnique({
        where: { id: supplier.id },
        select: { userId: true },
      })
      if (supplierUser) {
        await db.notification.create({
          data: {
            userId: supplierUser.userId,
            type: 'BOOTH_ASSIGNED',
            title: `Stand asignado en feria`,
            message: `Se te asignó el stand "${booth.boothNumber || 'sin número'}". ¡Prepara tu catálogo para la feria!`,
            link: '/?module=supplier-backoffice',
          },
        })
      }
    } catch (e) {
      console.error('[ferias booths] notif error:', e)
    }

    return NextResponse.json({
      ok: true,
      booth: {
        id: updated.id,
        boothNumber: updated.boothNumber,
        status: updated.status,
        supplier: updated.supplier ? {
          id: updated.supplier.id,
          companyName: updated.supplier.companyName,
          city: updated.supplier.city,
          phone: updated.supplier.phone,
          category: updated.supplier.category,
        } : null,
      },
    })
  }

  // Liberar stand
  const updated = await db.fairBooth.update({
    where: { id: boothId },
    data: { supplierId: null, status: 'AVAILABLE' },
  })

  return NextResponse.json({
    ok: true,
    booth: {
      id: updated.id,
      boothNumber: updated.boothNumber,
      status: updated.status,
      supplier: null,
    },
  })
}

/**
 * GET /api/ferias/[id]/booths
 * Lista los stands de una feria (alias rápido).
 */
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const fair = await db.fair.findUnique({
    where: { id },
    select: {
      id: true,
      booths: {
        orderBy: { boothNumber: 'asc' },
        include: {
          supplier: {
            select: { id: true, companyName: true, city: true, phone: true, category: true },
          },
        },
      },
    },
  })
  if (!fair) return NextResponse.json({ error: 'Feria no encontrada' }, { status: 404 })

  return NextResponse.json({
    ok: true,
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
  })
}
