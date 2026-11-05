import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/products/mine
 * Devuelve todos los productos del supplier autenticado (cualquier estado, incluyendo DRAFT).
 * Usado por el POS y otros módulos del backoffice del proveedor.
 */
export async function GET(_req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const supplier = await db.supplier.findUnique({
    where: { userId: auth.id },
    select: { id: true },
  })
  if (!supplier) {
    return NextResponse.json({ error: 'No tienes proveedor asociado' }, { status: 403 })
  }

  const products = await db.product.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: 'desc' },
    include: { category: true },
    take: 500,
  })

  return NextResponse.json(products)
}
