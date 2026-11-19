import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// GET /api/dima/branches — lista SupplierBranch del supplier (o todas si ADMIN)
export async function GET(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { searchParams } = new URL(req.url)
  const supplierIdParam = searchParams.get('supplierId')

  let supplierId: string | null = null
  if (user.role === 'ADMIN' && supplierIdParam) {
    supplierId = supplierIdParam
  } else if (user.role === 'SUPPLIER') {
    const sup = await db.supplier.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!sup) return NextResponse.json({ error: 'No tienes perfil de proveedor.' }, { status: 404 })
    supplierId = sup.id
  } else if (user.role === 'ADMIN') {
    const branches = await db.supplierBranch.findMany({
      include: { supplier: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ ok: true, branches })
  }

  if (!supplierId) return NextResponse.json({ error: 'Falta supplierId' }, { status: 400 })

  const branches = await db.supplierBranch.findMany({
    where: { supplierId },
    orderBy: [{ isMain: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({
    ok: true,
    branches,
    stats: {
      total: branches.length,
      active: branches.filter((b) => b.isActive).length,
      cities: Array.from(new Set(branches.map((b) => b.city).filter(Boolean))).length,
    },
  })
}

// POST /api/dima/branches — crea nueva sucursal
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const body = await req.json().catch(() => ({}))
  const {
    name, city, sector, address, phone, whatsapp, latitude, longitude, hours, isMain,
  } = body as {
    name?: string
    city?: string
    sector?: string
    address?: string
    phone?: string
    whatsapp?: string
    latitude?: number
    longitude?: number
    hours?: string
    isMain?: boolean
  }

  if (!name || !city || !address) {
    return NextResponse.json({ error: 'Faltan campos requeridos (name, city, address)' }, { status: 400 })
  }

  let supplierId: string | null = null
  if (user.role === 'ADMIN') {
    // ADMIN puede especificar supplierId o usar el propio
    const { supplierId: explicit } = body as { supplierId?: string }
    if (explicit) supplierId = explicit
  }
  if (!supplierId) {
    const sup = await db.supplier.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!sup) return NextResponse.json({ error: 'No tienes perfil de proveedor.' }, { status: 404 })
    supplierId = sup.id
  }

  // Limitar a 5 sucursales
  const count = await db.supplierBranch.count({ where: { supplierId } })
  if (count >= 5) {
    return NextResponse.json({ error: 'Máximo 5 sucursales permitidas' }, { status: 400 })
  }

  const branch = await db.$transaction(async (tx) => {
    // Si isMain → desmarcar las otras
    if (isMain) {
      await tx.supplierBranch.updateMany({
        where: { supplierId },
        data: { isMain: false },
      })
    }
    return tx.supplierBranch.create({
      data: {
        supplierId,
        name,
        city,
        sector: sector || null,
        address,
        phone: phone || null,
        whatsapp: whatsapp || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        hours: hours || null,
        isMain: !!isMain,
        isActive: true,
      },
    })
  })

  return NextResponse.json({ ok: true, branch }, { status: 201 })
}
