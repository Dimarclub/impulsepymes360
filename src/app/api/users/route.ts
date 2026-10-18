import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Lista de usuarios (solo admin)
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const users = await db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, city: true, phone: true, affiliateCode: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
  return NextResponse.json(users)
}
