import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

const VALID_FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'number',
  'date',
] as const

type FieldType = (typeof VALID_FIELD_TYPES)[number]

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

function sanitizeFields(raw: unknown): FormField[] {
  if (!Array.isArray(raw)) return []
  const out: FormField[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const f = item as Record<string, unknown>
    const name = String(f.name ?? '').trim()
    const label = String(f.label ?? '').trim()
    const type = String(f.type ?? 'text')
    if (!name || !label) continue
    if (!VALID_FIELD_TYPES.includes(type as FieldType)) continue
    const field: FormField = {
      name,
      label,
      type,
      required: Boolean(f.required),
    }
    if (typeof f.placeholder === 'string' && f.placeholder.trim()) {
      field.placeholder = f.placeholder.trim()
    }
    if (
      (type === 'select' || type === 'radio' || type === 'checkbox') &&
      Array.isArray(f.options)
    ) {
      field.options = (f.options as unknown[])
        .map((o) => String(o).trim())
        .filter(Boolean)
    }
    out.push(field)
  }
  return out
}

async function getOwnedForm(id: string, userId: string, role: string) {
  const form = await db.formTemplate.findUnique({
    where: { id },
    include: {
      responses: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!form) return null
  if (!isOwnerOrAdmin({ id: userId, role, name: '', email: '' }, form.userId)) {
    return 'forbidden' as const
  }
  return form
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const form = await getOwnedForm(id, auth.id, auth.role)
  if (!form) {
    return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  }
  if (form === 'forbidden') {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, form })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.formTemplate.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: auth.role, name: '', email: '' }, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim()
  }
  if (typeof body.description === 'string') {
    data.description = body.description.trim() || null
  }
  if (typeof body.submitLabel === 'string' && body.submitLabel.trim()) {
    data.submitLabel = body.submitLabel.trim()
  }
  if (typeof body.successMessage === 'string') {
    data.successMessage = body.successMessage.trim() || null
  }
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive
  }
  if (Array.isArray(body.fields)) {
    const fields = sanitizeFields(body.fields)
    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Agrega al menos un campo válido' },
        { status: 400 }
      )
    }
    data.fields = JSON.stringify(fields)
  }
  const updated = await db.formTemplate.update({ where: { id }, data })
  return NextResponse.json({ ok: true, form: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.formTemplate.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: auth.role, name: '', email: '' }, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  await db.formTemplate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
