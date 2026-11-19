import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

async function getBranchOwnerId(branchId: string): Promise<{ supplierId: string; userId: string } | null> {
  const b = await db.supplierBranch.findUnique({
    where: { id: branchId },
    select: { supplier: { select: { id: true, userId: true } } },
  })
  if (!b) return null
  return { supplierId: b.supplier.id, userId: b.supplier.userId }
}

// PATCH /api/dima/branches/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { id } = await params
  const owner = await getBranchOwnerId(id)
  if (!owner) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
  if (user.role !== 'ADMIN' && owner.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const {
    name, city, sector, address, phone, whatsapp, latitude, longitude, hours, isMain, isActive,
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
    isActive?: boolean
  }

  const data: any = {}
  if (typeof name === 'string') data.name = name
  if (typeof city === 'string') data.city = city
  if (sector !== undefined) data.sector = sector || null
  if (typeof address === 'string') data.address = address
  if (phone !== undefined) data.phone = phone || null
  if (whatsapp !== undefined) data.whatsapp = whatsapp || null
  if (latitude !== undefined) data.latitude = latitude
  if (longitude !== undefined) data.longitude = longitude
  if (hours !== undefined) data.hours = hours || null
  if (typeof isActive === 'boolean') data.isActive = isActive

  if (isMain) {
    await db.supplierBranch.updateMany({
      where: { supplierId: owner.supplierId },
      data: { isMain: false },
    })
    data.isMain = true
  }

  const updated = await db.supplierBranch.update({ where: { id }, data })
  return NextResponse.json({ ok: true, branch: updated })
}

// DELETE /api/dima/branches/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { id } = await params
  const owner = await getBranchOwnerId(id)
  if (!owner) return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 })
  if (user.role !== 'ADMIN' && owner.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await db.supplierBranch.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
