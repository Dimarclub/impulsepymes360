import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const form = await db.formTemplate.findUnique({ where: { id } })
  if (!form) {
    return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: auth.role, name: '', email: '' }, form.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  const responses = await db.formResponse.findMany({
    where: { formId: id },
    orderBy: { createdAt: 'desc' },
  })
  const parsed = responses.map((r) => {
    let data: Record<string, unknown> = {}
    try {
      data = JSON.parse(r.data) as Record<string, unknown>
    } catch {
      data = {}
    }
    return {
      id: r.id,
      contactId: r.contactId,
      data,
      createdAt: r.createdAt,
    }
  })
  return NextResponse.json({ ok: true, responses: parsed })
}
