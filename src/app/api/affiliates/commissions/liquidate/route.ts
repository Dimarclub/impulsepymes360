import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Liquidar comisiones: marcar como PAID (una o varias)
// POST { commissionIds: string[] } → marca como PAID
// POST { all: true, userId?: string } → liquida todas las PENDING (opcionalmente de un usuario)
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()

  let where: Record<string, unknown> = { status: 'PENDING' }
  if (body.all) {
    if (body.userId) where.userId = body.userId
  } else if (Array.isArray(body.commissionIds)) {
    where = { id: { in: body.commissionIds }, status: 'PENDING' }
  } else {
    return NextResponse.json({ error: 'Especifica commissionIds o all:true' }, { status: 400 })
  }

  const result = await db.commission.updateMany({ where, data: { status: 'PAID' } })
  return NextResponse.json({ liquidated: result.count })
}

// Resumen de comisiones pendientes por usuario (para el panel de liquidación)
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'
  const commissions = await db.commission.findMany({
    where: { status },
    include: { user: { select: { name: true, email: true, affiliateCode: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  // Obtener nombres de usuarios origen por separado (evita relación sourceUser)
  const sourceIds = [...new Set(commissions.map((c) => c.sourceUserId).filter(Boolean))] as string[]
  const sourceUsers = sourceIds.length > 0
    ? await db.user.findMany({ where: { id: { in: sourceIds } }, select: { id: true, name: true } })
    : []
  const sourceMap = new Map(sourceUsers.map((u) => [u.id, u.name]))
  const commissionWithSource = commissions.map((c) => ({
    ...c,
    sourceUser: c.sourceUserId ? { name: sourceMap.get(c.sourceUserId) || 'Usuario' } : null,
  }))
  // Agrupar por usuario
  const byUser: Record<string, { name: string; email: string; affiliateCode: string; total: number; count: number }> = {}
  for (const c of commissionWithSource) {
    const key = c.userId
    if (!byUser[key]) byUser[key] = { name: c.user.name, email: c.user.email, affiliateCode: c.user.affiliateCode || '', total: 0, count: 0 }
    byUser[key].total += c.amount
    byUser[key].count++
  }
  return NextResponse.json({ commissions: commissionWithSource, byUser: Object.entries(byUser).map(([userId, v]) => ({ userId, ...v, total: +v.total.toFixed(2) })) })
}
