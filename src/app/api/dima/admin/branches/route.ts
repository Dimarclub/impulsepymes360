import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin/branches
 * Solo ADMIN. Lista TODAS las SupplierBranch del sistema con supplier info.
 * Filtros: ?city=X&supplierId=X&active=true
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const supplierId = searchParams.get('supplierId')
  const active = searchParams.get('active')

  const where: any = {}
  if (city) where.city = city
  if (supplierId) where.supplierId = supplierId
  if (active === 'true') where.isActive = true
  if (active === 'false') where.isActive = false

  const branches = await db.supplierBranch.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          companyName: true,
          city: true,
          category: true,
          phone: true,
          verified: true,
          rating: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })

  return NextResponse.json({
    ok: true,
    branches: branches.map((b) => ({
      id: b.id,
      supplierId: b.supplierId,
      name: b.name,
      city: b.city,
      sector: b.sector,
      address: b.address,
      phone: b.phone,
      whatsapp: b.whatsapp,
      latitude: b.latitude,
      longitude: b.longitude,
      hours: b.hours,
      isMain: b.isMain,
      isActive: b.isActive,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      supplier: b.supplier,
    })),
  })
}
