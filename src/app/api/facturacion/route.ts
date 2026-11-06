import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

const VALID_STATUSES = ['DRAFT', 'SENT', 'PAID', 'VOID', 'OVERDUE']

/**
 * Genera un número único de factura con formato INV-{AÑO}-{SECUENCIA:3}
 * La secuencia se calcula contando las facturas del año actual + 1.
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`)

  const count = await db.invoice.count({
    where: {
      createdAt: { gte: startOfYear, lte: endOfYear },
    },
  })

  const seq = String(count + 1).padStart(3, '0')
  let candidate = `INV-${year}-${seq}`

  // Evitar colisión teórica (defensivo): si ya existe, sumar hasta encontrar uno libre.
  let attempts = 0
  while (attempts < 50) {
    const exists = await db.invoice.findUnique({ where: { number: candidate }, select: { id: true } })
    if (!exists) break
    const newSeq = String(count + 2 + attempts).padStart(3, '0')
    candidate = `INV-${year}-${newSeq}`
    attempts += 1
  }

  return candidate
}

/**
 * GET /api/facturacion
 * Lista las facturas del usuario actual (SUPPLIER o ADMIN).
 * Filtros opcionales: ?status=SENT|PAID|DRAFT|VOID|OVERDUE
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const userId = auth.id

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  const where: Record<string, unknown> = { userId }
  if (status && VALID_STATUSES.includes(status)) {
    where.status = status
  }

  // Si es ADMIN sin filtro explícito, mostramos igualmente solo las propias
  // (el módulo es personal por proveedor). Podría extenderse con ?all=true.
  const invoices = await db.invoice.findMany({
    where,
    include: {
      contact: {
        select: { id: true, name: true, email: true, phone: true, company: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, invoices })
}

/**
 * POST /api/facturacion
 * Crea una nueva factura con cálculo automático de subtotal, impuesto y total,
 * genera número único y enlace de pago público.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const userId = auth.id

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  // Validar items
  const rawItems = body.items
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'Debe incluir al menos un ítem.' }, { status: 400 })
  }

  const items: InvoiceItem[] = rawItems
    .map((it) => {
      const item = it as Record<string, unknown>
      const description = String(item.description ?? '').trim()
      const quantity = Number(item.quantity ?? 0)
      const price = Number(item.price ?? 0)
      return { description, quantity, price }
    })
    .filter((it) => it.description && it.quantity > 0 && it.price >= 0)

  if (items.length === 0) {
    return NextResponse.json(
      { error: 'Los ítems requieren descripción, cantidad > 0 y precio válido.' },
      { status: 400 },
    )
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.price, 0)
  const taxRate = Math.max(0, Math.min(100, Number(body.taxRate ?? 0) || 0))
  const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2)
  const total = +(subtotal + taxAmount).toFixed(2)

  const status =
    typeof body.status === 'string' && VALID_STATUSES.includes(body.status)
      ? body.status
      : 'DRAFT'

  const dueDate = body.dueDate ? new Date(String(body.dueDate)) : null
  if (dueDate && isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: 'Fecha de vencimiento inválida.' }, { status: 400 })
  }

  const number = await generateInvoiceNumber()

  // El enlace público requiere el id que se generará al crear.
  // Hacemos create sin paymentLink y luego update con el link construido.
  const created = await db.invoice.create({
    data: {
      number,
      userId,
      contactId: typeof body.contactId === 'string' && body.contactId ? body.contactId : null,
      clientName: typeof body.clientName === 'string' ? body.clientName : null,
      clientEmail: typeof body.clientEmail === 'string' ? body.clientEmail : null,
      clientPhone: typeof body.clientPhone === 'string' ? body.clientPhone : null,
      items: JSON.stringify(items),
      subtotal,
      taxRate,
      taxAmount,
      total,
      currency: 'USD',
      status,
      notes: typeof body.notes === 'string' ? body.notes : null,
      dueDate,
      paidAt: status === 'PAID' ? new Date() : null,
    },
  })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const paymentLink = `${appUrl}/f/${created.id}`

  const updated = await db.invoice.update({
    where: { id: created.id },
    data: { paymentLink },
    include: {
      contact: {
        select: { id: true, name: true, email: true, phone: true, company: true },
      },
    },
  })

  return NextResponse.json({ ok: true, invoice: updated }, { status: 201 })
}
