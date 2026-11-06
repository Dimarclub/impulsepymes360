import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

function parseFields(raw: string): FormField[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as FormField[]
  } catch {
    return []
  }
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.map(asString).join(', ')
  return String(v)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const form = await db.formTemplate.findUnique({ where: { id } })
  if (!form) {
    return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 })
  }
  if (!form.isActive) {
    return NextResponse.json({ error: 'Este formulario no está activo' }, { status: 410 })
  }
  const fields = parseFields(form.fields)
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = body && typeof body === 'object' ? body : {}

  // Validar campos requeridos
  for (const f of fields) {
    const v = data[f.name]
    const present = v !== undefined && v !== null && asString(v).trim() !== ''
    if (f.required && !present) {
      return NextResponse.json(
        { error: `El campo "${f.label}" es obligatorio` },
        { status: 400 }
      )
    }
  }

  // Auto lead capture: si hay email, crear/actualizar CrmContact
  let contactId: string | null = null
  const emailField = fields.find((f) => f.type === 'email')
  const email = emailField ? asString(data[emailField.name]).trim() : ''
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const nameField = fields.find((f) => f.type === 'text')
    const phoneField = fields.find((f) => f.type === 'tel')
    const name = nameField ? asString(data[nameField.name]).trim() : ''
    const phone = phoneField ? asString(data[phoneField.name]).trim() : null
    const existing = await db.crmContact.findFirst({ where: { email } })
    if (existing) {
      contactId = existing.id
      // Actualizamos teléfono si vino y el contacto no tenía
      if (phone && !existing.phone) {
        await db.crmContact.update({
          where: { id: existing.id },
          data: { phone },
        })
      }
    } else {
      const created = await db.crmContact.create({
        data: {
          name: name || email,
          email,
          phone: phone || null,
          stage: 'LEAD',
          source: 'WEB',
          notes: `Capturado vía formulario "${form.name}"`,
        },
      })
      contactId = created.id
    }
  }

  const response = await db.formResponse.create({
    data: {
      formId: id,
      data: JSON.stringify(data),
      contactId,
    },
  })

  const message =
    form.successMessage?.trim() || '¡Gracias por tu respuesta!'

  return NextResponse.json(
    { ok: true, message, responseId: response.id },
    { status: 201 }
  )
}
