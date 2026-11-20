import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * GET /api/dima/admin/purchases
 * Solo ADMIN. Lista TODAS las PopPurchase del sistema con user info.
 * Filtros: ?status=ACTIVE|WITHDRAWN
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: any = {}
  if (status && ['ACTIVE', 'WITHDRAWN'].includes(status)) {
    where.status = status
  }

  const purchases = await db.popPurchase.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          city: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    ok: true,
    purchases: purchases.map((p) => ({
      id: p.id,
      userId: p.userId,
      amount: p.amount,
      items: p.items,
      monthlyRate: p.monthlyRate,
      currentBalance: p.currentBalance,
      totalEarned: p.totalEarned,
      lastCompoundAt: p.lastCompoundAt,
      qrCode: p.qrCode,
      scanCount: p.scanCount,
      downloadCount: p.downloadCount,
      status: p.status,
      orderId: p.orderId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: p.user,
    })),
  })
}
