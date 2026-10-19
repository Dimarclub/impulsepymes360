import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Catálogo de planes (público)
export async function GET() {
  const plans = await db.plan.findMany({ orderBy: { price: 'asc' } })
  return NextResponse.json(plans)
}
