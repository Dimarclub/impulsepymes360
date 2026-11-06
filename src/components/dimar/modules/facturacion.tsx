'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  Send,
  Copy,
  CheckCircle2,
  Loader2,
  DollarSign,
  TrendingUp,
  Clock,
  CalendarClock,
  Receipt,
  Printer,
  Share2,
  Mail,
  MessageCircle,
  ExternalLink,
  QrCode,
  CreditCard,
  X,
  AlertCircle,
} from 'lucide-react'
import type { CrmContact } from '@/lib/types'
import { useAppStore } from '@/lib/store'

// ---------- Tipos locales ----------

interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

interface InvoiceContact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
}

interface Invoice {
  id: string
  number: string
  userId: string
  contactId?: string | null
  contact?: InvoiceContact | null
  clientName?: string | null
  clientEmail?: string | null
  clientPhone?: string | null
  items: string // JSON
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  status: string
  paymentLink?: string | null
  notes?: string | null
  paidAt?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}

// ---------- Helpers ----------

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
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

const FILTERS = [
  { id: 'ALL', label: 'Todas' },
  { id: 'DRAFT', label: 'Borrador' },
  { id: 'SENT', label: 'Enviadas' },
  { id: 'PAID', label: 'Pagadas' },
  { id: 'OVERDUE', label: 'Vencidas' },
] as const

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n || 0)

const shortDate = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const parseItems = (raw: string): InvoiceItem[] => {
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

const qrUrl = (data: string, size = 150) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`

// ---------- Componente principal ----------

export function FacturacionModule() {
  const toast = useAppStore((s) => s.toast)
  const [tab, setTab] = useState<'list' | 'new' | 'template'>('list')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [detail, setDetail] = useState<Invoice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState(false)
  // Factura recién creada (abre el dialog de éxito con QR)
  const [justCreated, setJustCreated] = useState<Invoice | null>(null)
  // Última factura para la pestaña Plantilla
  const [templateInvoice, setTemplateInvoice] = useState<Invoice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [invRes, conRes] = await Promise.all([
        fetch('/api/facturacion', { cache: 'no-store' }),
        fetch('/api/crm/contacts', { cache: 'no-store' }).catch(() => null),
      ])
      if (!invRes.ok) throw new Error('No se pudieron cargar las facturas')
      const data = await invRes.json()
      const list: Invoice[] = data.invoices || []
      setInvoices(list)
      if (conRes && conRes.ok) {
        const c = await conRes.json()
        setContacts(Array.isArray(c) ? c : [])
      }
    } catch (err) {
      toast((err as Error).message || 'Error al cargar facturación', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return invoices
    return invoices.filter((i) => i.status === filter)
  }, [invoices, filter])

  const stats = useMemo(() => {
    const total = invoices.length
    const emitted = invoices.filter((i) => i.status !== 'VOID').reduce((s, i) => s + i.total, 0)
    const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
    const pending = invoices
      .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE' || i.status === 'DRAFT')
      .reduce((s, i) => s + i.total, 0)
    return { total, emitted, paid, pending }
  }, [invoices])

  const handleCreated = (inv: Invoice) => {
    setJustCreated(inv)
    setTemplateInvoice(inv)
    setTab('list')
    load()
  }

  const handleSend = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/facturacion/${inv.id}/send`, { method: 'POST' })
      if (!res.ok) throw new Error('No se pudo generar el mensaje')
      const data = await res.json()
      const urls: string[] = []
      if (data.whatsappUrl) urls.push('WhatsApp')
      if (data.emailUrl) urls.push('Email')
      toast(`Factura lista para compartir vía ${urls.join(' y ') || 'enlace'}`)
      load()
      // Refrescar el detalle si está abierto
      if (detail && detail.id === inv.id) {
        setDetail((prev) => (prev ? { ...prev, status: data.status || prev.status } : prev))
      }
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleMarkPaid = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/facturacion/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      if (!res.ok) throw new Error('No se pudo marcar como pagada')
      const data = await res.json()
      toast(`Factura ${inv.number} marcada como pagada`)
      setDetail(data.invoice || null)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleCopyLink = async (inv: Invoice) => {
    const link = inv.paymentLink || `${window.location.origin}/f/${inv.id}`
    try {
      await navigator.clipboard.writeText(link)
      toast('Enlace de pago copiado al portapapeles')
    } catch {
      toast('No se pudo copiar. Cópialo manualmente: ' + link, 'info')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/facturacion/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar la factura')
      toast('Factura eliminada')
      setDeleteTarget(null)
      if (detail?.id === deleteTarget.id) setDetail(null)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="size-5" />
            </span>
            Facturación
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crea facturas, comparte enlaces de pago y cobra en línea.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>
          <Button size="sm" onClick={() => setTab('new')}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nueva factura</span>
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="list">
            <FileText className="size-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="new">
            <Plus className="size-4" />
            Nueva Factura
          </TabsTrigger>
          <TabsTrigger value="template">
            <Printer className="size-4" />
            Plantilla
          </TabsTrigger>
        </TabsList>

        {/* TAB 1 — Facturas */}
        <TabsContent value="list" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Receipt}
              label="Total facturas"
              value={String(stats.total)}
              tone="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="Monto emitido"
              value={usd(stats.emitted)}
              tone="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label="Cobrado"
              value={usd(stats.paid)}
              tone="emerald"
            />
            <StatCard
              icon={Clock}
              label="Pendiente"
              value={usd(stats.pending)}
              tone="rose"
            />
          </div>

          {/* Filtro */}
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filter === f.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabla */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Facturas</CardTitle>
              <CardDescription className="text-xs">
                {filtered.length} {filtered.length === 1 ? 'factura' : 'facturas'}
                {filter !== 'ALL' ? ` · filtro: ${FILTERS.find((f) => f.id === filter)?.label}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Receipt className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Sin facturas todavía</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Crea tu primera factura desde la pestaña "Nueva Factura" para empezar a cobrar.
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => setTab('new')}>
                    <Plus className="size-4" />
                    Crear factura
                  </Button>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto scroll-thin">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="pl-4">Número</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right pr-4">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="cursor-pointer"
                          onClick={() => setDetail(inv)}
                        >
                          <TableCell className="pl-4 font-mono text-xs font-semibold">
                            {inv.number}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="truncate font-medium">
                              {inv.clientName || inv.contact?.name || 'Cliente sin nombre'}
                            </div>
                            {inv.clientEmail && (
                              <div className="text-xs text-muted-foreground truncate">
                                {inv.clientEmail}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {shortDate(inv.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {shortDate(inv.dueDate)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {usd(inv.total)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`border-transparent ${STATUS_BADGE[inv.status] || STATUS_BADGE.DRAFT}`}
                            >
                              {STATUS_LABELS[inv.status] || inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-8"
                                      onClick={() => setDetail(inv)}
                                    >
                                      <Eye className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver detalle</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-8"
                                      onClick={() => handleSend(inv)}
                                    >
                                      <Send className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Enviar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-8"
                                      onClick={() => handleCopyLink(inv)}
                                    >
                                      <Copy className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copiar enlace</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteTarget(inv)}
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 — Nueva Factura */}
        <TabsContent value="new">
          <InvoiceForm
            contacts={contacts}
            onCreated={handleCreated}
            onToast={toast}
          />
        </TabsContent>

        {/* TAB 3 — Plantilla */}
        <TabsContent value="template">
          <PrintTemplate invoice={templateInvoice || invoices[0] || null} />
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <InvoiceDetailDialog
        invoice={detail}
        onClose={() => setDetail(null)}
        onSend={handleSend}
        onMarkPaid={handleMarkPaid}
        onCopyLink={handleCopyLink}
        onDelete={(inv) => {
          setDetail(null)
          setDeleteTarget(inv)
        }}
      />

      {/* Dialog de factura recién creada */}
      <SuccessDialog
        invoice={justCreated}
        onClose={() => setJustCreated(null)}
        onToast={toast}
      />

      {/* Confirmación de eliminar */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar permanentemente la factura{' '}
              <span className="font-mono font-semibold">{deleteTarget?.number}</span>. Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar factura'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- StatCard ----------

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Receipt
  label: string
  value: string
  tone: 'emerald' | 'amber' | 'rose'
}) {
  const toneClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-lg font-bold tracking-tight truncate">{value}</p>
          </div>
          <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${toneClasses[tone]}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Formulario de nueva factura ----------

interface InvoiceFormProps {
  contacts: CrmContact[]
  onCreated: (inv: Invoice) => void
  onToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

function InvoiceForm({ contacts, onCreated, onToast }: InvoiceFormProps) {
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [contactId, setContactId] = useState<string>('none')
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, price: 0 },
  ])
  const [taxRate, setTaxRate] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [payOnline, setPayOnline] = useState(true)
  const [saving, setSaving] = useState(false)

  const selectContact = (id: string) => {
    setContactId(id)
    if (id === 'none') return
    const c = contacts.find((x) => x.id === id)
    if (c) {
      setClientName(c.name)
      setClientEmail(c.email)
      setClientPhone(c.phone || '')
    }
  }

  const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    )
  }

  const addItem = () =>
    setItems((prev) => [...prev, { description: '', quantity: 1, price: 0 }])

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0),
    [items],
  )
  const taxAmount = useMemo(() => +(subtotal * (Number(taxRate) / 100)).toFixed(2), [subtotal, taxRate])
  const total = useMemo(() => +(subtotal + taxAmount).toFixed(2), [subtotal, taxAmount])

  const valid = useMemo(
    () =>
      items.some((it) => it.description.trim() && Number(it.quantity) > 0 && Number(it.price) >= 0),
    [items],
  )

  const handleSubmit = async () => {
    if (!valid) {
      onToast('Agrega al menos un concepto válido (descripción, cantidad y precio)', 'error')
      return
    }
    setSaving(true)
    try {
      const cleanItems = items
        .filter((it) => it.description.trim() && Number(it.quantity) > 0)
        .map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity),
          price: Number(it.price),
        }))
      const payload: Record<string, unknown> = {
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        contactId: contactId !== 'none' ? contactId : null,
        items: cleanItems,
        taxRate: Number(taxRate) || 0,
        dueDate: dueDate || null,
        notes: notes || null,
        status: 'DRAFT',
      }
      void payOnline // siempre on, solo visual
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'No se pudo crear la factura')
      }
      const data = await res.json()
      onToast(`Factura ${data.invoice.number} creada correctamente`)
      // Reset form
      setClientName('')
      setClientEmail('')
      setClientPhone('')
      setContactId('none')
      setItems([{ description: '', quantity: 1, price: 0 }])
      setTaxRate(0)
      setDueDate('')
      setNotes('')
      onCreated(data.invoice as Invoice)
    } catch (err) {
      onToast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-4">
        {/* Datos del cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="size-4 text-primary" />
              Datos del cliente
            </CardTitle>
            <CardDescription className="text-xs">
              Opcionalmente vincula un contacto del CRM.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="contact" className="text-xs">Vincular contacto CRM</Label>
                <Select value={contactId} onValueChange={selectContact}>
                  <SelectTrigger id="contact">
                    <SelectValue placeholder="Sin contacto vinculado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin contacto</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `· ${c.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs">Nombre</Label>
                <Input
                  id="clientName"
                  placeholder="Ej. Pedro López"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clientEmail" className="text-xs">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="cliente@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="clientPhone" className="text-xs">Teléfono / WhatsApp</Label>
                <Input
                  id="clientPhone"
                  placeholder="099 123 4567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="size-4 text-primary" />
                  Conceptos
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Agrega cada producto o servicio facturado.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="size-4" />
                Añadir concepto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Descripción</span>
              <span className="text-center">Cant.</span>
              <span className="text-right">Precio</span>
              <span className="text-right">Subtotal</span>
              <span></span>
            </div>
            {items.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-2 md:grid-cols-[1fr_80px_120px_120px_40px] gap-2 items-center"
              >
                <Input
                  className="col-span-2 md:col-span-1"
                  placeholder="Descripción del concepto"
                  value={it.description}
                  onChange={(e) => updateItem(idx, 'description', e.target.value)}
                />
                <Input
                  className="text-center"
                  type="number"
                  min="1"
                  step="1"
                  value={it.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                />
                <Input
                  className="text-right"
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.price}
                  onChange={(e) => updateItem(idx, 'price', Number(e.target.value))}
                />
                <div className="text-right text-sm font-semibold px-2 hidden md:block">
                  {usd((Number(it.quantity) || 0) * (Number(it.price) || 0))}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive size-9"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vencimiento + Notas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              Vencimiento y notas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs">Fecha de vencimiento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxRate" className="text-xs">Impuesto (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notas (opcional)</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Notas visibles para el cliente, condiciones de pago, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Pago en línea habilitado</p>
                  <p className="text-xs text-muted-foreground">
                    El cliente podrá pagar desde el enlace público.
                  </p>
                </div>
              </div>
              <Switch checked={payOnline} onCheckedChange={setPayOnline} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen sticky */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen</CardTitle>
            <CardDescription className="text-xs">
              Totales calculados automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{usd(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Impuesto ({Number(taxRate)}%)</span>
              <span className="font-medium">{usd(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold text-emerald-600">{usd(total)}</span>
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
              onClick={handleSubmit}
              disabled={saving || !valid}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Receipt className="size-4" />
                  Generar Factura
                </>
              )}
            </Button>
            {!valid && (
              <p className="text-xs text-muted-foreground text-center">
                Agrega al menos un concepto con descripción, cantidad y precio.
              </p>
            )}
          </CardContent>
          <CardFooter className="border-t pt-3">
            <p className="text-xs text-muted-foreground">
              <AlertCircle className="size-3 inline-block mr-1" />
              Se generará un número único tipo <span className="font-mono">INV-2026-XXX</span> y un enlace de pago público.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// ---------- Dialog de detalle ----------

interface InvoiceDetailDialogProps {
  invoice: Invoice | null
  onClose: () => void
  onSend: (inv: Invoice) => void
  onMarkPaid: (inv: Invoice) => void
  onCopyLink: (inv: Invoice) => void
  onDelete: (inv: Invoice) => void
}

function InvoiceDetailDialog({
  invoice,
  onClose,
  onSend,
  onMarkPaid,
  onCopyLink,
  onDelete,
}: InvoiceDetailDialogProps) {
  if (!invoice) return null
  const items = parseItems(invoice.items)
  const link = invoice.paymentLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${invoice.id}`

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5 text-primary" />
            <span className="font-mono">{invoice.number}</span>
            <Badge
              variant="outline"
              className={`border-transparent ml-auto ${STATUS_BADGE[invoice.status] || STATUS_BADGE.DRAFT}`}
            >
              {STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Emitida el {shortDate(invoice.createdAt)}
            {invoice.dueDate ? ` · vence el ${shortDate(invoice.dueDate)}` : ''}
            {invoice.paidAt ? ` · pagada el ${shortDate(invoice.paidAt)}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cliente */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="bg-muted/30">
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Cliente</p>
                <p className="text-sm font-semibold">
                  {invoice.clientName || invoice.contact?.name || 'Cliente sin nombre'}
                </p>
                {invoice.clientEmail && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3" />
                    {invoice.clientEmail}
                  </p>
                )}
                {invoice.clientPhone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="size-3" />
                    {invoice.clientPhone}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Enlace de pago</p>
                <p className="text-xs font-mono break-all line-clamp-2">{link}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 mt-1"
                  onClick={() => onCopyLink(invoice)}
                >
                  <Copy className="size-3" />
                  Copiar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Items */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{it.description}</TableCell>
                    <TableCell className="text-center">{it.quantity}</TableCell>
                    <TableCell className="text-right">{usd(it.price)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {usd(it.quantity * it.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">{usd(invoice.subtotal)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    Impuesto ({invoice.taxRate}%)
                  </TableCell>
                  <TableCell className="text-right font-medium">{usd(invoice.taxAmount)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    {usd(invoice.total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {invoice.notes && (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
              <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Acciones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSend(invoice)}
              disabled={invoice.status === 'VOID'}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSend(invoice)}
              disabled={invoice.status === 'VOID'}
            >
              <Mail className="size-4" />
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopyLink(invoice)}
            >
              <Copy className="size-4" />
              Copiar link
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onMarkPaid(invoice)}
              disabled={invoice.status === 'PAID' || invoice.status === 'VOID'}
            >
              <CheckCircle2 className="size-4" />
              {invoice.status === 'PAID' ? 'Pagada' : 'Marcar pagada'}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(invoice)}
            >
              <Trash2 className="size-4" />
              Eliminar factura
            </Button>
            <a href={link} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost">
                <ExternalLink className="size-4" />
                Ver factura pública
              </Button>
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Dialog de éxito al crear ----------

interface SuccessDialogProps {
  invoice: Invoice | null
  onClose: () => void
  onToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

function SuccessDialog({ invoice, onClose, onToast }: SuccessDialogProps) {
  if (!invoice) return null
  const link = invoice.paymentLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${invoice.id}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      onToast('Enlace copiado')
    } catch {
      onToast('No se pudo copiar', 'error')
    }
  }

  const message = `Estimado/a ${invoice.clientName || 'Cliente'}, su factura ${invoice.number} por ${usd(invoice.total)} está lista. Pague aquí: ${link}`

  const openWhatsApp = () => {
    const phone = (invoice.clientPhone || '').replace(/[^0-9]/g, '')
    let p = phone
    if (phone.length === 10 && !phone.startsWith('0')) p = `593${phone}`
    const url = `https://wa.me/${p}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener')
  }

  const openEmail = () => {
    const subject = `Factura ${invoice.number}`
    const url = `mailto:${invoice.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    window.location.href = url
  }

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="size-7" />
          </div>
          <DialogTitle className="text-center">¡Factura creada!</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Comparte el enlace de pago con tu cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-center space-y-1">
            <p className="text-xs text-muted-foreground">Número de factura</p>
            <p className="text-lg font-mono font-bold text-foreground">{invoice.number}</p>
            <p className="text-2xl font-bold text-emerald-600">{usd(invoice.total)}</p>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-2">
            <div className="size-[150px] rounded-lg border bg-white p-2">
              <img
                src={qrUrl(link)}
                alt={`QR para ${link}`}
                className="size-full object-contain"
                width={150}
                height={150}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <QrCode className="size-3" />
              Escanea para abrir la factura
            </p>
          </div>

          <div className="space-y-2">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openWhatsApp}>
              <Share2 className="size-4" />
              Compartir por WhatsApp
            </Button>
            <Button className="w-full" variant="outline" onClick={openEmail}>
              <Mail className="size-4" />
              Compartir por Email
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="size-4" />
                Copiar enlace
              </Button>
              <a href={link} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="size-4" />
                  Ver pública
                </Button>
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Plantilla imprimible ----------

function PrintTemplate({ invoice }: { invoice: Invoice | null }) {
  if (!invoice) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Printer className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No hay facturas para previsualizar</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crea una factura para ver aquí la plantilla imprimible.
          </p>
        </CardContent>
      </Card>
    )
  }
  const items = parseItems(invoice.items)
  const link = invoice.paymentLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${invoice.id}`

  return (
    <div className="space-y-3 print-area">
      <div className="flex justify-end no-print">
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>
      <div className="bg-white text-foreground rounded-lg border shadow-sm p-6 md:p-8 max-w-3xl mx-auto print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
              D
            </div>
            <div>
              <p className="text-lg font-bold">DimarClub</p>
              <p className="text-xs text-muted-foreground">ImpulsePymes360</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary tracking-tight">FACTURA</p>
            <p className="text-sm font-mono mt-1">{invoice.number}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {shortDate(invoice.createdAt)}
            </p>
          </div>
        </div>

        {/* Cliente + Vencimiento */}
        <div className="grid sm:grid-cols-2 gap-4 py-4 border-b">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Facturar a
            </p>
            <p className="text-sm font-semibold">
              {invoice.clientName || invoice.contact?.name || 'Cliente'}
            </p>
            {invoice.clientEmail && (
              <p className="text-xs text-muted-foreground">{invoice.clientEmail}</p>
            )}
            {invoice.clientPhone && (
              <p className="text-xs text-muted-foreground">{invoice.clientPhone}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Vencimiento
            </p>
            <p className="text-sm font-semibold">{shortDate(invoice.dueDate)}</p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-2 mb-1">
              Estado
            </p>
            <Badge
              variant="outline"
              className={`border-transparent ${STATUS_BADGE[invoice.status] || STATUS_BADGE.DRAFT}`}
            >
              {STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
          </div>
        </div>

        {/* Items */}
        <div className="py-4">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 bg-muted/30">
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{it.description}</TableCell>
                  <TableCell className="text-center">{it.quantity}</TableCell>
                  <TableCell className="text-right">{usd(it.price)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {usd(it.quantity * it.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totales */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{usd(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuesto ({invoice.taxRate}%)</span>
              <span className="font-medium">{usd(invoice.taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">{usd(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Pago + QR */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4 items-center border-t pt-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Pagar en línea
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Escanea el QR o visita el enlace para pagar esta factura.
            </p>
            <p className="text-sm font-mono break-all bg-muted/40 rounded p-2">{link}</p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <div className="size-[120px] rounded border bg-white p-1.5">
              <img
                src={qrUrl(link, 120)}
                alt="QR de pago"
                className="size-full object-contain"
                width={120}
                height={120}
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        {invoice.notes && (
          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Notas
            </p>
            <p className="text-sm whitespace-pre-line text-muted-foreground">{invoice.notes}</p>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground border-t pt-4">
          <p>Gracias por su confianza. Esta factura fue emitida electrónicamente.</p>
        </div>
      </div>
    </div>
  )
}
