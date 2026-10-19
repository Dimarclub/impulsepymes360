import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// Publicar (o simular publicación) de un post programado/draft
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const post = await db.socialPost.findUnique({ where: { id }, include: { accounts: true } })
  if (!post) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, post.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Simular publicación: generar métricas aleatorias y marcar como PUBLISHED
  const reach = Math.floor(Math.random() * 8000) + 500
  const updated = await db.socialPost.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      reach,
      likes: Math.floor(reach * (0.03 + Math.random() * 0.05)),
      comments: Math.floor(reach * (0.005 + Math.random() * 0.01)),
      shares: Math.floor(reach * (0.01 + Math.random() * 0.02)),
      clicks: Math.floor(reach * (0.02 + Math.random() * 0.03)),
      attributedOrders: Math.floor(Math.random() * 8),
      attributedRevenue: Math.random() * 400,
    },
  })

  // Marcar cada cuenta como publicada con permalink simulado
  for (const pa of post.accounts) {
    const permalink = `https://${(await db.socialAccount.findUnique({ where: { id: pa.accountId } }))?.platform.toLowerCase()}.com/dimarclub/post${id.slice(-6)}`
    await db.socialPostAccount.update({ where: { id: pa.id }, data: { status: 'PUBLISHED', permalink } })
  }

  return NextResponse.json(updated)
}
