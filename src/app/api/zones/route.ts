import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Listar zonas (público para couriers y proveedores)
export async function GET() {
  const zones = await db.zone.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    include: { _count: { select: { couriers: true } } },
  })
  return NextResponse.json(zones.map(z => ({ ...z, couriersCount: z._count.couriers })))
}

// Crear zona (admin)
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const zone = await db.zone.create({
    data: {
      name: body.name,
      city: body.city || 'Quito',
      description: body.description || null,
      order: body.order || 0,
    },
  })
  return NextResponse.json(zone, { status: 201 })
}
