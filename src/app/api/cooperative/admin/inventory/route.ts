import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Inventario de bodega (admin)
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const inventory = await db.materialInventory.findMany({ orderBy: { materialType: 'asc' } })
  return NextResponse.json(inventory)
}
