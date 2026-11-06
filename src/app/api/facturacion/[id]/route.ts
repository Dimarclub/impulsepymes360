import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

const VALID_STATUSES = ['DRAFT', 'SENT', 'PAID', 'VOID', 'OVERDUE']

/**
 * GET /api/facturacion/[id]
 * Detalle de una factura (owner o admin).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      contact: {
        select: { id: true, name: true, email: true, phone: true, company: true },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  }

  if (!isOwnerOrAdmin(auth, invoice.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  return NextResponse.json({ ok: true, invoice })
}

/**
 * PATCH /api/facturacion/[id]
 * Actualiza campos de una factura (owner o admin).
 * Si status=PAID y no tenía paidAt, lo setea a now.
 * Si se actualizan items/taxRate, recalcula subtotal, taxAmount, total.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const existing = await db.invoice.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) {
    return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (typeof body.clientName === 'string') data.clientName = body.clientName
  if (typeof body.clientEmail === 'string') data.clientEmail = body.clientEmail
  if (typeof body.clientPhone === 'string') data.clientPhone = body.clientPhone
  if (typeof body.contactId === 'string') {
    data.contactId = body.contactId || null
  }
  if (typeof body.notes === 'string') data.notes = body.notes
  if (typeof body.taxRate === 'number') {
    data.taxRate = Math.max(0, Math.min(100, body.taxRate))
  }
  if (body.dueDate !== undefined) {
    const due = body.dueDate ? new Date(String(body.dueDate)) : null
    if (due && isNaN(due.getTime())) {
      return NextResponse.json({ error: 'Fecha de vencimiento inválida.' }, { status: 400 })
    }
    data.dueDate = due
  }
  if (typeof body.status === 'string' && VALID_STATUSES.includes(body.status)) {
    data.status = body.status
    if (body.status === 'PAID') {
      data.paidAt = new Date()
    } else if (body.status !== 'PAID') {
      // Si cambia a un estado no pagado, mantenemos el paidAt que ya tenía
      // (no se borra para preservar historial, a menos que explícitamente se quiera).
    }
  }
  if (typeof body.paidAt !== 'undefined') {
    data.paidAt = body.paidAt ? new Date(String(body.paidAt)) : null
  }

  // Recalcular totales si vienen items
  if (Array.isArray(body.items)) {
    const items: InvoiceItem[] = (body.items as Record<string, unknown>[])
      .map((it) => ({
        description: String(it.description ?? '').trim(),
        quantity: Number(it.quantity ?? 0),
        price: Number(it.price ?? 0),
      }))
      .filter((it) => it.description && it.quantity > 0 && it.price >= 0)

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Los ítems requieren descripción, cantidad > 0 y precio válido.' },
        { status: 400 },
      )
    }

    const subtotal = items.reduce((s, it) => s + it.quantity * it.price, 0)
    const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0
    const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2)
    const total = +(subtotal + taxAmount).toFixed(2)

    data.items = JSON.stringify(items)
    data.subtotal = subtotal
    data.taxAmount = taxAmount
    data.total = total
  } else if (typeof data.taxRate === 'number') {
    // Recalcular taxAmount con los items existentes
    const current = await db.invoice.findUnique({ where: { id }, select: { items: true, subtotal: true } })
    if (current) {
      const subtotal = current.subtotal
      const taxAmount = +(subtotal * ((data.taxRate as number) / 100)).toFixed(2)
      data.taxAmount = taxAmount
      data.total = +(subtotal + taxAmount).toFixed(2)
    }
  }

  const updated = await db.invoice.update({
    where: { id },
    data,
    include: {
      contact: {
        select: { id: true, name: true, email: true, phone: true, company: true },
      },
    },
  })

  return NextResponse.json({ ok: true, invoice: updated })
}

/**
 * DELETE /api/facturacion/[id]
 * Elimina una factura (owner o admin).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const existing = await db.invoice.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) {
    return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  await db.invoice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
