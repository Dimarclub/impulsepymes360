import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { notifyShipmentAssigned } from '@/lib/services/notifications'

// Admin asigna un mensajero a una solicitud
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const { courierId } = body as { courierId: string }

  const courier = await db.courier.findUnique({ where: { id: courierId } })
  if (!courier) return NextResponse.json({ error: 'Mensajero no encontrado' }, { status: 404 })

  const updated = await db.shipmentRequest.update({
    where: { id },
    data: { courierId, status: 'ASSIGNED', assignedAt: new Date() },
    include: { courier: { include: { user: { select: { name: true, phone: true } } } } },
  })

  // Notificar al mensajero
  notifyShipmentAssigned(
    courier.userId,
    id,
    updated.recipientName,
    updated.recipientAddress,
    updated.estimatedPrice
  ).catch(() => {})

  return NextResponse.json(updated)
}
