import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Lista de usuarios para el selector de "iniciar sesión como"
export async function GET() {
  const users = await db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, city: true, phone: true, affiliateCode: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
  return NextResponse.json(users)
}
