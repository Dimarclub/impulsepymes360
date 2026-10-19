import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const rule = await db.automationRule.findUnique({ where: { id } })
  if (!rule) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, rule.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const body = await req.json()
  const update: Record<string, unknown> = { ...body }
  if (body.config) update.config = JSON.stringify(body.config)
  // Ejecutar manualmente: crea posts según la regla
  if (body.execute) {
    const config = JSON.parse(rule.config)
    const products = await db.product.findMany({
      where: { status: 'ACTIVE', ...(config.categoryId ? { categoryId: config.categoryId } : {}) },
      take: config.count || 2,
      orderBy: { featured: 'desc' },
    })
    const accounts = await db.socialAccount.findMany({ where: { userId: rule.userId, platform: { in: config.platforms } } })
    for (const p of products) {
      const post = await db.socialPost.create({
        data: {
          userId: rule.userId,
          caption: `✨ ${p.name} en Dimarclub!\n\n$${p.price.toFixed(2)} · Envío GRATIS 🚚\n\nCompra y gana comisiones 💚\n\n#Dimarclub`,
          mediaUrls: JSON.stringify([p.imageUrl].filter(Boolean)),
          mediaType: 'IMAGE',
          productId: p.id,
          status: 'DRAFT',
          accounts: accounts.length ? { create: accounts.map((a) => ({ accountId: a.id })) } : undefined,
        },
      })
      void post
    }
    await db.automationRule.update({ where: { id }, data: { lastRunAt: new Date(), postsCreated: { increment: products.length } } })
    return NextResponse.json({ executed: true, postsCreated: products.length })
  }
  const updated = await db.automationRule.update({ where: { id }, data: update })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const rule = await db.automationRule.findUnique({ where: { id } })
  if (!rule) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, rule.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  await db.automationRule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
