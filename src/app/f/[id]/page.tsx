import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { PublicPayButton } from '@/components/dimar/public-invoice/pay-button'
import { Receipt, CheckCircle2, Mail, Phone, QrCode } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

function parseItems(raw: string): InvoiceItem[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((it) => ({
        description: String(it.description ?? ''),
        quantity: Number(it.quantity ?? 0) || 0,
        price: Number(it.price ?? 0) || 0,
      }))
    }
  } catch {
    // ignore
  }
  return []
}

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n || 0)

const shortDate = (s?: string | Date | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Pendiente de pago',
  PAID: 'Pagada',
  VOID: 'Anulada',
  OVERDUE: 'Vencida',
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SENT: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-rose-100 text-rose-700',
}

const qrUrl = (data: string, size = 160) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await db.invoice.findUnique({
    where: { id },
    select: { number: true, issuer: { select: { name: true } } },
  })
  if (!invoice) return { title: 'Factura no encontrada' }
  return {
    title: `Factura ${invoice.number} · ${invoice.issuer.name}`,
    description: `Paga tu factura ${invoice.number} en línea de forma segura.`,
  }
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const invoice = await db.invoice.findUnique({
    where: { id },
    include: {
      issuer: { select: { name: true, email: true, phone: true } },
      contact: { select: { name: true, email: true, phone: true, company: true } },
    },
  })

  if (!invoice || invoice.status === 'VOID') {
    notFound()
  }

  const items = parseItems(invoice.items)
  const link = invoice.paymentLink || `/f/${invoice.id}`
  const clientName = invoice.clientName || invoice.contact?.name || 'Cliente'
  const clientEmail = invoice.clientEmail || invoice.contact?.email || null
  const clientPhone = invoice.clientPhone || invoice.contact?.phone || null
  const isPaid = invoice.status === 'PAID'

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
              D
            </div>
            <div>
              <p className="font-bold leading-tight">{invoice.issuer.name}</p>
              <p className="text-xs text-muted-foreground">DimarClub · ImpulsePymes360</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              STATUS_BADGE[invoice.status] || STATUS_BADGE.SENT
            }`}
          >
            {STATUS_LABELS[invoice.status] || invoice.status}
          </span>
        </header>

        <main className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          {/* Hero */}
          <div className="bg-primary/5 px-5 py-6 border-b">
            <div className="flex items-center gap-2 text-primary">
              <Receipt className="size-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Factura</span>
            </div>
            <h1 className="text-2xl font-bold font-mono mt-1 text-foreground">
              {invoice.number}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Emitida el {shortDate(invoice.createdAt)}
              {invoice.dueDate ? ` · Vence el ${shortDate(invoice.dueDate)}` : ''}
            </p>
          </div>

          {/* Cliente + Total */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
            <div className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Facturado a
              </p>
              <p className="text-sm font-semibold">{clientName}</p>
              {clientEmail && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="size-3" />
                  {clientEmail}
                </p>
              )}
              {clientPhone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="size-3" />
                  {clientPhone}
                </p>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Total a pagar
              </p>
              <p className="text-3xl font-bold text-emerald-600 tracking-tight">
                {usd(invoice.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subtotal {usd(invoice.subtotal)}
                {invoice.taxAmount > 0 && ` · Impuesto ${usd(invoice.taxAmount)}`}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Detalle
            </p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-2.5 font-medium text-muted-foreground">Concepto</th>
                    <th className="text-center p-2.5 font-medium text-muted-foreground w-14">Cant.</th>
                    <th className="text-right p-2.5 font-medium text-muted-foreground w-24">Precio</th>
                    <th className="text-right p-2.5 font-medium text-muted-foreground w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2.5 font-medium">{it.description}</td>
                      <td className="p-2.5 text-center text-muted-foreground">{it.quantity}</td>
                      <td className="p-2.5 text-right text-muted-foreground">{usd(it.price)}</td>
                      <td className="p-2.5 text-right font-semibold">{usd(it.quantity * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notas */}
          {invoice.notes && (
            <div className="px-5 pb-5">
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                <p className="text-sm whitespace-pre-line text-muted-foreground">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* CTA Pago */}
          <div className="p-5 pt-0">
            {isPaid ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-5 text-center">
                <CheckCircle2 className="size-10 mx-auto text-emerald-600 mb-2" />
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                  Factura pagada
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gracias por tu pago
                  {invoice.paidAt ? ` el ${shortDate(invoice.paidAt)}` : ''}.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="size-[120px] rounded-lg border bg-white p-2 shrink-0">
                    <img
                      src={qrUrl(link, 120)}
                      alt="QR de pago"
                      className="size-full object-contain"
                      width={120}
                      height={120}
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-semibold flex items-center gap-1 justify-center sm:justify-start">
                      <QrCode className="size-4 text-primary" />
                      Paga fácil con tu tarjeta
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Escanea el QR o pulsa el botón para pagar en línea de forma segura.
                    </p>
                  </div>
                </div>
                <PublicPayButton amount={usd(invoice.total)} number={invoice.number} />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-sm font-medium text-foreground">
            ¡Gracias por tu confianza!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Si tienes dudas sobre esta factura, contacta a{' '}
            <a
              href={`mailto:${invoice.issuer.email}`}
              className="text-primary hover:underline"
            >
              {invoice.issuer.email}
            </a>
            {invoice.issuer.phone && (
              <>
                {' '}o al{' '}
                <a
                  href={`tel:${invoice.issuer.phone}`}
                  className="text-primary hover:underline"
                >
                  {invoice.issuer.phone}
                </a>
              </>
            )}
            .
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            © {new Date().getFullYear()} DimarClub · ImpulsePymes360
          </p>
        </footer>
      </div>
    </div>
  )
}
