import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { getRecentEvents, getEventStats } from '@/lib/services/automation'

// Eventos de automatización (admin ve todos, proveedor ve los suyos)
export async function GET() {
  const auth = await requireRole('ADMIN', 'SUPPLIER', 'AFFILIATE')
  if (auth instanceof NextResponse) return auth
  const role = (auth as { role: string }).role
  const userId = (auth as { id: string }).id

  let where = {}
  if (role === 'SUPPLIER') {
    const provider = await db.provider.findFirst({ where: { userId } })
    where = { providerId: provider?.id }
  }
  // Admin ve todos
  const [events, stats] = await Promise.all([
    db.eventLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        provider: { select: { companyName: true, logoUrl: true } },
        product: { select: { name: true, imageUrl: true, price: true } },
      },
    }),
    role === 'ADMIN' ? getEventStats() : Promise.resolve(null),
  ])
  return NextResponse.json({ events, stats })
}
