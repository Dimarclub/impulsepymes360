import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireRole('ADMIN', 'COURIER')
  if (auth instanceof NextResponse) return auth
  const deliveries = await db.delivery.findMany({
    include: {
      order: { include: { user: { select: { name: true } } } },
      courier: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
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
