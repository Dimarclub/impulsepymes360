import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN', 'COURIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const delivery = await db.delivery.update({ where: { id }, data: body })
  // Si se asigna courier, marcar como ASSIGNED
  if (body.courierId) {
    await db.order.update({ where: { id: delivery.orderId }, data: { status: 'SHIPPED' } })
  }
  if (body.status === 'DELIVERED') {
    await db.order.update({ where: { id: delivery.orderId }, data: { status: 'DELIVERED' } })
  }
  return NextResponse.json(delivery)
}
