import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const couriers = await db.courier.findMany({
    include: { user: { select: { name: true, email: true, phone: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(couriers)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const user = await db.user.create({
    data: { email: body.email, name: body.name, role: 'COURIER', phone: body.phone, city: body.zone, password: await bcrypt.hash(body.password || 'dimar123', 10) },
  })
  const courier = await db.courier.create({
    data: {
      userId: user.id,
      vehicleType: body.vehicleType,
      vehicleModel: body.vehicleModel || body.vehicleType,
      licensePlate: body.licensePlate || null,
      licenseNumber: body.licenseNumber || 'PEND-' + Date.now(),
      available: body.available ?? true,
      zone: body.zone,
    },
  })
  return NextResponse.json(courier, { status: 201 })
}
