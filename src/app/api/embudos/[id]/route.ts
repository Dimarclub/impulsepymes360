import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

type Ctx = { params: Promise<{ id: string }> }

/**
 * GET /api/embudos/[id]
 * Devuelve el funnel con stages ordenadas + deals por stage (incluye contact).
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const funnel = await db.funnel.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: { order: 'asc' },
        include: {
          deals: {
            include: {
              contact: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  })

  if (!funnel) {
    return NextResponse.json({ error: 'Embudo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, funnel.userId)) {
    return NextResponse.json({ error: 'Sin permisos sobre este embudo' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, funnel })
}

/**
 * PATCH /api/embudos/[id]
 * Actualiza name y/o description. Solo el dueño (o admin).
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const funnel = await db.funnel.findUnique({ where: { id }, select: { userId: true } })
  if (!funnel) {
    return NextResponse.json({ error: 'Embudo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, funnel.userId)) {
    return NextResponse.json({ error: 'Sin permisos sobre este embudo' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const data: { name?: string; description?: string | null } = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (body.description !== undefined) {
    data.description = typeof body.description === 'string' ? body.description.trim() || null : null
  }

  const updated = await db.funnel.update({
    where: { id },
    data,
  })

  return NextResponse.json({ ok: true, funnel: updated })
}

/**
 * DELETE /api/embudos/[id]
 * Elimina el funnel (cascade stages + deals por onDelete: Cascade).
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const funnel = await db.funnel.findUnique({ where: { id }, select: { userId: true } })
  if (!funnel) {
    return NextResponse.json({ error: 'Embudo no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, funnel.userId)) {
    return NextResponse.json({ error: 'Sin permisos sobre este embudo' }, { status: 403 })
  }

  await db.funnel.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
