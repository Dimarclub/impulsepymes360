import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// Listar sitios Web Express del usuario actual (o todos si admin)
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const userRole = (auth as { role: string }).role
  const where = userRole === 'ADMIN' ? {} : { provider: { userId } }
  const websites = await db.websiteExpress.findMany({
    where,
    include: { provider: { select: { companyName: true, category: true, city: true, logoUrl: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(websites)
}
