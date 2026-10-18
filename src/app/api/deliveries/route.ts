import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
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
