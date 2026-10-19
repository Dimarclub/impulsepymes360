import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const site = await db.websiteExpress.findUnique({ where: { id }, include: { provider: true } })
  if (!site) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (!isOwnerOrAdmin(auth, site.provider.userId)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const body = await req.json()
  const update: Record<string, unknown> = { ...body }
  if (body.businessHours && typeof body.businessHours === 'object') update.businessHours = JSON.stringify(body.businessHours)
  if (body.socialLinks && typeof body.socialLinks === 'object') update.socialLinks = JSON.stringify(body.socialLinks)
  if (body.featuredProducts && Array.isArray(body.featuredProducts)) update.featuredProducts = JSON.stringify(body.featuredProducts)
  const updated = await db.websiteExpress.update({ where: { id }, data: update })
  return NextResponse.json(updated)
}
