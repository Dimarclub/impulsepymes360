import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/facturacion/public/[id]
 * Vista pública de una factura: sin auth. Sirve para que el cliente final
 * pueda revisar la factura desde el enlace de pago sin iniciar sesión.
 * Solo retorna la info necesaria para renderizar (no incluye datos sensibles
 * del emisor más allá del nombre).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      issuer: { select: { name: true, email: true, phone: true } },
      contact: { select: { name: true, email: true, phone: true, company: true } },
    },
  })

  if (!invoice) {
    return NextResponse.json({ ok: false, error: 'Factura no encontrada.' }, { status: 404 })
  }

  // Solo se puede ver públicamente si no está en VOID (anulada)
  if (invoice.status === 'VOID') {
    return NextResponse.json({ ok: false, error: 'Esta factura ha sido anulada.' }, { status: 410 })
  }

  return NextResponse.json({
    ok: true,
    invoice: {
      id: invoice.id,
      number: invoice.number,
      clientName: invoice.clientName || invoice.contact?.name || null,
      clientEmail: invoice.clientEmail || invoice.contact?.email || null,
      clientPhone: invoice.clientPhone || invoice.contact?.phone || null,
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
      notes: invoice.notes,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      paymentLink: invoice.paymentLink,
      issuer: {
        name: invoice.issuer.name,
        email: invoice.issuer.email,
        phone: invoice.issuer.phone,
      },
    },
  })
}
