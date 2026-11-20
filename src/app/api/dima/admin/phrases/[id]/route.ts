import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * PATCH /api/dima/admin/phrases/[id]
 * Solo ADMIN. Cambiar status de una frase (ACTIVE/PAUSED).
 * Usado para deshabilitar frases de proveedores que no pagaron.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  const existing = await db.searchPhrase.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'Frase no encontrada' },
      { status: 404 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { status } = body as { status?: 'ACTIVE' | 'PAUSED' }

  if (status !== 'ACTIVE' && status !== 'PAUSED') {
    return NextResponse.json(
      { ok: false, error: 'status debe ser ACTIVE o PAUSED' },
      { status: 400 }
    )
  }

  const updated = await db.searchPhrase.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json({ ok: true, phrase: updated })
}
