import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import type { AffiliateNode } from '@/lib/types'

export async function GET(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { searchParams } = new URL(req.url)
  const rootId = searchParams.get('userId')

  // Si no se especifica, usar el admin (raíz de toda la red)
  let root = rootId
    ? await db.user.findUnique({ where: { id: rootId } })
    : await db.user.findFirst({ where: { role: 'ADMIN' } })

  if (!root) {
    root = await db.user.findFirst()
    if (!root) return NextResponse.json({ error: 'Sin usuarios' }, { status: 404 })
  }

  // Construir árbol recursivo hasta 3 niveles hacia abajo
  async function buildNode(userId: string, level: number): Promise<AffiliateNode> {
    const user = await db.user.findUnique({ where: { id: userId } })
    const referrals = await db.user.findMany({ where: { sponsorId: userId } })
    const sales = await db.order.aggregate({
      where: { userId },
      _sum: { total: true },
      _count: true,
    })
    const commissions = await db.commission.aggregate({
      where: { userId },
      _sum: { amount: true },
    })

    const children: AffiliateNode[] = []
    for (const r of referrals) {
      children.push(await buildNode(r.id, level + 1))
    }

    return {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      city: user!.city,
      affiliateCode: user!.affiliateCode,
      level,
      joinedAt: user!.createdAt.toISOString(),
      children,
      stats: {
        sales: sales._count,
        commissions: +(commissions._sum.amount ?? 0).toFixed(2),
        referrals: referrals.length,
      },
    }
  }

  const tree = await buildNode(root.id, 0)
  return NextResponse.json(tree)
}
