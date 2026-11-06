import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

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

export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const forms = await db.formTemplate.findMany({
    where: { userId: auth.id },
    include: { _count: { select: { responses: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ ok: true, forms })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const name = String(body.name ?? '').trim()
  if (!name) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }
  const fields = sanitizeFields(body.fields)
  if (fields.length === 0) {
    return NextResponse.json(
      { error: 'Agrega al menos un campo válido' },
      { status: 400 }
    )
  }
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : null
  const submitLabel =
    typeof body.submitLabel === 'string' && body.submitLabel.trim()
      ? body.submitLabel.trim()
      : 'Enviar'
  const successMessage =
    typeof body.successMessage === 'string' && body.successMessage.trim()
      ? body.successMessage.trim()
      : null

  const form = await db.formTemplate.create({
    data: {
      userId: auth.id,
      name,
      description,
      fields: JSON.stringify(fields),
      submitLabel,
      successMessage,
      isActive: body.isActive !== false,
    },
  })
  return NextResponse.json({ ok: true, form }, { status: 201 })
}
