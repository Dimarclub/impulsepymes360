import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

/**
 * POST /api/facturacion/[id]/send
 * "Envía" la factura por email o WhatsApp (simulado — solo genera los URLs
 * pre-rellenados para que el cliente los abra en su app preferida).
 * Si la factura estaba en DRAFT, marca como SENT.
 *
 * Retorna:
 *  - message: texto pre-rellenado con la info de la factura.
 *  - shareUrl: enlace público de pago.
 *  - whatsappUrl: https://wa.me/<phone>?text=...  (solo si hay teléfono)
 *  - emailUrl: mailto:<email>?subject=...&body=...  (solo si hay email)
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('SUPPLIER')
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      issuer: { select: { name: true } },
      contact: { select: { name: true, email: true, phone: true } },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, invoice.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
  }

  // Marcado a SENT si estaba DRAFT
  let updatedStatus = invoice.status
  if (invoice.status === 'DRAFT') {
    updatedStatus = 'SENT'
    await db.invoice.update({ where: { id }, data: { status: 'SENT' } })
  }

  const clientName = invoice.clientName || invoice.contact?.name || 'Cliente'
  const clientEmail = invoice.clientEmail || invoice.contact?.email || ''
  const clientPhone = invoice.clientPhone || invoice.contact?.phone || ''
  const issuerName = invoice.issuer.name
  const totalUsd = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(invoice.total)

  const shareUrl = invoice.paymentLink || ''
  const message = `Estimado/a ${clientName}, su factura ${invoice.number} por ${totalUsd} de ${issuerName} está lista. Pague aquí: ${shareUrl}`

  let whatsappUrl: string | null = null
  if (clientPhone) {
    // Limpia el teléfono (solo dígitos) y asume prefijo internacional si no lo tiene
    let phone = clientPhone.replace(/[^0-9]/g, '')
    if (phone.length === 10 && !phone.startsWith('0')) {
      // Asumir Ecuador (593) para números locales sin prefijo
      phone = `593${phone.replace(/^0/, '')}`
    }
    whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  let emailUrl: string | null = null
  if (clientEmail) {
    const subject = `Factura ${invoice.number} de ${issuerName}`
    emailUrl = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
  }

  return NextResponse.json({
    ok: true,
    status: updatedStatus,
    message,
    shareUrl,
    whatsappUrl,
    emailUrl,
  })
}
