import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const role = (auth as { role: string }).role
  const { id } = await params
  const body = await req.json()
  const space = await db.gridSpace.findUnique({ where: { id }, include: { owner: true } })
  if (!space) return NextResponse.json({ error: 'Espacio no encontrado' }, { status: 404 })
  if (space.status === 'SOLD') return NextResponse.json({ error: 'Ya vendido' }, { status: 400 })
  const isOwner = space.ownerId === userId
  const isAdmin = role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const soldBy = isAdmin && !isOwner ? 'ADMIN' : 'OWNER'
  const updated = await db.gridSpace.update({
    where: { id },
    data: { status: 'SOLD', soldAt: new Date(), soldBy, buyerName: body.buyerName, buyerEmail: body.buyerEmail || null, buyerPhone: body.buyerPhone || null, salePrice: body.salePrice || 20, imageUrl: body.imageUrl || null, websiteSlug: body.websiteSlug || null, reimbursedToOwner: soldBy === 'ADMIN' && space.ownerId ? true : false },
  })
  if (space.ownerId) {
    const owner = await db.user.findUnique({ where: { id: space.ownerId } })
    if (owner) {
      let current = owner
      for (let lvl = 1; lvl <= 3; lvl++) {
        if (!current.sponsorId) break
        const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
        if (!sponsor) break
        await db.gridCommission.create({ data: { spaceId: id, userId: sponsor.id, level: lvl, amount: 1, rate: 5, status: 'PENDING', sourceUserId: space.ownerId } })
        current = sponsor
      }
    }
  }
  return NextResponse.json(updated)
}
