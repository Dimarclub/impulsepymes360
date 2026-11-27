import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireRole('ADMIN', 'COURIER')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  // Un mensajero solo ve sus propias entregas; el admin (Delta Master) ve todas
  let where: Record<string, unknown> = {}
  if (user.role === 'COURIER') {
    const me = await db.courier.findUnique({ where: { userId: user.id }, select: { id: true } })
    if (!me) return NextResponse.json([])
    where = { courierId: me.id }
  }

  const deliveries = await db.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          user: { select: { name: true } },
          items: { select: { id: true, quantity: true } },
        },
      },
      courier: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(deliveries)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const delivery = await db.delivery.create({
    data: {
      orderId: body.orderId,
      courierId: body.courierId || null,
      status: body.status || 'ASSIGNED',
      pickupAddress: body.pickupAddress,
      deliveryAddress: body.deliveryAddress,
      distance: body.distance,
      estimatedMinutes: body.estimatedMinutes,
      notes: body.notes,
    },
  })
  return NextResponse.json(delivery, { status: 201 })
}
