import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { estimatePrice, suggestVehicle } from '@/lib/services/whatsapp-parser'

// Listar solicitudes de envío
// Admin ve todas; proveedor ve las suyas; mensajero ve las asignadas
export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const role = (auth as { role: string }).role
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let where: Record<string, unknown> = {}
  if (role === 'ADMIN') {
    // admin ve todo
  } else if (role === 'SUPPLIER') {
    where.provider = { userId }
  } else if (role === 'COURIER') {
    where.courier = { userId }
  } else {
    return NextResponse.json([])
  }
  if (status) where.status = status

  const shipments = await db.shipmentRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      provider: { select: { companyName: true, logoUrl: true } },
      courier: { include: { user: { select: { name: true } } } },
    },
    take: 200,
  })
  return NextResponse.json(shipments)
}

// Crear solicitud de envío (proveedor desde su backoffice)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const role = (auth as { role: string }).role
  const body = await req.json()

  // Buscar provider del usuario (si es SUPPLIER)
  const provider = role === 'SUPPLIER' ? await db.provider.findFirst({ where: { userId } }) : null
  if (role === 'SUPPLIER' && !provider) {
    return NextResponse.json({ error: 'No tienes perfil de proveedor' }, { status: 403 })
  }

  const vehicle = body.vehicleRequired || suggestVehicle(body.packageWeight, body.packageSize)
  const price = estimatePrice(vehicle, body.serviceType)

  const shipment = await db.shipmentRequest.create({
    data: {
      providerId: provider?.id || null,
      senderName: body.senderName,
      senderPhone: body.senderPhone,
      senderAddress: body.senderAddress,
      recipientName: body.recipientName,
      recipientPhone: body.recipientPhone,
      recipientAddress: body.recipientAddress,
      recipientReference: body.recipientReference || null,
      city: body.city || 'Guayaquil',
      packageDescription: body.packageDescription || null,
      packageWeight: body.packageWeight || null,
      packageSize: body.packageSize || null,
      serviceType: body.serviceType || 'STANDARD',
      vehicleRequired: vehicle,
      estimatedPrice: price,
      status: 'PENDING',
      source: 'WEB',
      notes: body.notes || null,
    },
  })
  return NextResponse.json(shipment, { status: 201 })
}
