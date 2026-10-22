import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Lista todos los precios de materiales (admin)
export async function GET() {
  const prices = await db.materialPrice.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(prices)
}

// Crear precio (admin)
export async function POST(req: Request) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const price = await db.materialPrice.create({
    data: { materialType: body.materialType, name: body.name, unitPrice: body.unitPrice, unit: body.unit || 'libra' },
  })
  return NextResponse.json(price, { status: 201 })
}
