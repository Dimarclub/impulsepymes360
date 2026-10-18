import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const suppliers = await db.supplier.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true, city: true } },
      products: { select: { id: true, name: true, price: true, stock: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Crear usuario + proveedor
  const user = await db.user.create({
    data: {
      email: body.email,
      name: body.companyName,
      role: 'SUPPLIER',
      phone: body.phone,
      city: body.city,
      password: 'dimar123',
    },
  })
  const supplier = await db.supplier.create({
    data: {
      userId: user.id,
      companyName: body.companyName,
      taxId: body.taxId || null,
      phone: body.phone,
      address: body.address,
      city: body.city,
      category: body.category,
      verified: false,
    },
  })
  return NextResponse.json(supplier, { status: 201 })
}
