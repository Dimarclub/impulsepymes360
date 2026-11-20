import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin/phrases
 * Solo ADMIN. Lista TODAS las SearchPhrase del sistema con supplier info.
 * Filtros: ?status=ACTIVE|PAUSED&supplierId=X
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const supplierId = searchParams.get('supplierId')

  const where: any = {}
  if (status && ['ACTIVE', 'PAUSED'].includes(status)) {
    where.status = status
  }
  if (supplierId) {
    where.supplierId = supplierId
  }

  const phrases = await db.searchPhrase.findMany({
    where,
    include: {
      supplier: {
        select: {
          id: true,
          companyName: true,
          city: true,
          category: true,
          phone: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    ok: true,
    phrases: phrases.map((p) => ({
      id: p.id,
      supplierId: p.supplierId,
      phrase: p.phrase,
      category: p.category,
      isPremium: p.isPremium,
      status: p.status,
      monthlyPrice: p.monthlyPrice,
      paidUntil: p.paidUntil,
      searchCount: p.searchCount,
      clickCount: p.clickCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      supplier: p.supplier,
    })),
  })
}
