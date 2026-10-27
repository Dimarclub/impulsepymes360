import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Actualizar estado de una solicitud de envío (avanzar pipeline)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const shipment = await db.shipmentRequest.findUnique({ where: { id } })
  if (!shipment) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const update: Record<string, unknown> = { ...body }
  const now = new Date()
  if (body.status === 'PICKED_UP') update.pickedUpAt = now
  if (body.status === 'DELIVERED') {
    update.deliveredAt = now
    update.finalPrice = shipment.estimatedPrice
  }

  const updated = await db.shipmentRequest.update({ where: { id }, data: update })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  await db.shipmentRequest.update({ where: { id }, data: { status: 'CANCELLED' } })
  return NextResponse.json({ ok: true })
}
