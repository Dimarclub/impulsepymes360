'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Store,
  Bike,
  Handshake,
  Plus,
  RefreshCw,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  FileText,
  Inbox,
} from 'lucide-react'
import type { Application } from '@/lib/types'
import { VEHICLE_LABELS } from '@/lib/types'
import { useAppStore } from '@/lib/store'

const TYPE_META: Record<
  string,
  { label: string; icon: typeof Store; tone: string }
> = {
  SUPPLIER: { label: 'Proveedores', icon: Store, tone: 'emerald' },
  COURIER: { label: 'Mensajeros', icon: Bike, tone: 'amber' },
  PARTNER: { label: 'Socios', icon: Handshake, tone: 'emerald' },
}

const STATUS_META: Record<
  string,
  { label: string; cls: string; icon: typeof Clock }
> = {
  PENDING: {
    label: 'Pendiente',
    cls: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  APPROVED: {
    label: 'Aprobada',
    cls: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rechazada',
    cls: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
}

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
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

const parseDetails = (raw?: string | null): Record<string, unknown> => {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function ApplicationsModule() {
  const toast = useAppStore((s) => s.toast)
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ app: Application; action: 'APPROVED' | 'REJECTED' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applications', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar solicitudes')
      setApps(await res.json())
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const pending = apps.filter((a) => a.status === 'PENDING').length
    const approved = apps.filter((a) => a.status === 'APPROVED').length
    const rejected = apps.filter((a) => a.status === 'REJECTED').length
    return { pending, approved, rejected, total: apps.length }
  }, [apps])

  const byType = useMemo(() => {
    const map: Record<string, Application[]> = { SUPPLIER: [], COURIER: [], PARTNER: [] }
    for (const a of apps) {
      if (!map[a.type]) map[a.type] = []
      map[a.type].push(a)
    }
    return map
  }, [apps])

  const handleAction = async () => {
    if (!confirm) return
    const { app, action } = confirm
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (!res.ok) throw new Error('No se pudo procesar la solicitud')
      if (action === 'APPROVED') {
        toast('¡Solicitud aprobada! Entidad creada.')
      } else {
        toast(`Solicitud de ${app.name} rechazada`, 'info')
      }
      setConfirm(null)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleCreate = async (type: string, base: { name: string; email: string; phone: string }, details: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...base, details }),
      })
      if (!res.ok) throw new Error('No se pudo crear la solicitud')
      toast('Solicitud enviada correctamente')
      setCreateOpen(false)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Header loading={loading} onReload={load} onNew={() => setCreateOpen(true)} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Pendientes" value={String(stats.pending)} tone="amber" />
        <StatCard icon={CheckCircle2} label="Aprobadas" value={String(stats.approved)} tone="emerald" />
        <StatCard icon={XCircle} label="Rechazadas" value={String(stats.rejected)} tone="red" />
        <StatCard icon={FileText} label="Total" value={String(stats.total)} tone="emerald" />
      </div>

      {/* 3 columns by type */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(TYPE_META).map(([type, meta]) => (
            <TypeColumn
              key={type}
              type={type}
              label={meta.label}
              icon={meta.icon}
              tone={meta.tone}
              apps={byType[type] || []}
              onApprove={(app) => setConfirm({ app, action: 'APPROVED' })}
              onReject={(app) => setConfirm({ app, action: 'REJECTED' })}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateApplicationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Confirm AlertDialog */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === 'APPROVED'
                ? '¿Aprobar solicitud?'
                : '¿Rechazar solicitud?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === 'APPROVED' ? (
                <>
                  Se aprobará la solicitud de
                  <span className="font-medium"> {confirm?.app.name} </span>
                  y se creará la entidad correspondiente ({TYPE_META[confirm?.app.type || '']?.label}).
                </>
              ) : (
                <>
                  Se rechazará la solicitud de
                  <span className="font-medium"> {confirm?.app.name}</span>. Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirm?.action === 'APPROVED'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-destructive text-white hover:bg-destructive/90'
              }
              onClick={handleAction}
            >
              {confirm?.action === 'APPROVED' ? (
                <>
                  <Check className="size-4" /> Aprobar
                </>
              ) : (
                <>
                  <X className="size-4" /> Rechazar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ---------------- Header ---------------- */

function Header({
  loading,
  onReload,
  onNew,
}: {
  loading: boolean
  onReload: () => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gradient">
          Solicitudes de registro
        </h2>
        <p className="text-sm text-muted-foreground">
          Proveedores, mensajeros y socios que quieren unirse a Dimarclub.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Refrescar
        </Button>
        <Button size="sm" onClick={onNew}>
          <Plus /> Nueva solicitud
        </Button>
      </div>
    </div>
  )
}

/* ---------------- Stat card ---------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock
  label: string
  value: string
  tone: 'emerald' | 'amber' | 'red'
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
      : tone === 'amber'
      ? 'bg-amber-50 text-amber-700 ring-amber-200/60'
      : 'bg-red-50 text-red-700 ring-red-200/60'
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-lg flex items-center justify-center ring-1 ${toneCls}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold leading-tight truncate">{value}</p>
        </div>
      </div>
    </Card>
  )
}

/* ---------------- Type column ---------------- */

function TypeColumn({
  type,
  label,
  icon: Icon,
  tone,
  apps,
  onApprove,
  onReject,
}: {
  type: string
  label: string
  icon: typeof Store
  tone: string
  apps: Application[]
  onApprove: (a: Application) => void
  onReject: (a: Application) => void
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
      : 'bg-amber-50 text-amber-700 ring-amber-200/60'
  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`size-8 rounded-lg flex items-center justify-center ring-1 ${toneCls}`}>
              <Icon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm">{label}</CardTitle>
              <CardDescription className="text-xs">
                {apps.length} {apps.length === 1 ? 'solicitud' : 'solicitudes'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-xs text-muted-foreground border border-dashed rounded-md">
            <Inbox className="size-5 mb-1 opacity-60" />
            Sin solicitudes
          </div>
        ) : (
          <div className="space-y-2 max-h-[40rem] overflow-y-auto scroll-thin pr-1 -mr-1">
            {apps.map((a) => (
              <ApplicationCard
                key={a.id}
                app={a}
                onApprove={() => onApprove(a)}
                onReject={() => onReject(a)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ---------------- Application card ---------------- */

function ApplicationCard({
  app,
  onApprove,
  onReject,
}: {
  app: Application
  onApprove: () => void
  onReject: () => void
}) {
  const details = parseDetails(app.details)
  const status = STATUS_META[app.status] || STATUS_META.PENDING
  const StatusIcon = status.icon
  const isPending = app.status === 'PENDING'

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{app.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Mail className="size-3 shrink-0" /> {app.email}
          </p>
          {app.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Phone className="size-3 shrink-0" /> {app.phone}
            </p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium shrink-0 ${status.cls}`}>
          <StatusIcon className="size-3" />
          {status.label}
        </span>
      </div>

      {/* Details */}
      {Object.keys(details).length > 0 && (
        <div className="rounded-md bg-muted/50 p-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          {Object.entries(details).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <span className="text-muted-foreground capitalize">{labelFor(k)}: </span>
              <span className="font-medium truncate">
                {k === 'amount' ? usd(Number(v)) : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t">
        <span className="text-[10px] text-muted-foreground">{shortDate(app.createdAt)}</span>
        {isPending ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="default"
              className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={onApprove}
            >
              <Check className="size-3.5" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={onReject}
            >
              <X className="size-3.5" />
              Rechazar
            </Button>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Resuelta</span>
        )}
      </div>
    </div>
  )
}

function labelFor(key: string): string {
  const map: Record<string, string> = {
    category: 'Categoría',
    city: 'Ciudad',
    taxId: 'RUC',
    companyName: 'Empresa',
    vehicleType: 'Vehículo',
    vehicleModel: 'Modelo',
    licensePlate: 'Placa',
    zone: 'Zona',
    amount: 'Aporte',
    expectedReturn: 'Rendimiento esp.',
  }
  return map[key] || key
}

/* ---------------- Create application dialog ---------------- */

function CreateApplicationDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (
    type: string,
    base: { name: string; email: string; phone: string },
    details: Record<string, unknown>
  ) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>Nueva solicitud</DialogTitle>
          <DialogDescription>
            Registra una postulación de proveedor, mensajero o socio.
          </DialogDescription>
        </DialogHeader>
        <CreateApplicationFormBody
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateApplicationFormBody({
  onSubmit,
  onCancel,
}: {
  onSubmit: (
    type: string,
    base: { name: string; email: string; phone: string },
    details: Record<string, unknown>
  ) => void
  onCancel: () => void
}) {
  const [type, setType] = useState('SUPPLIER')
  const [base, setBase] = useState({ name: '', email: '', phone: '' })
  const [details, setDetails] = useState<Record<string, string>>({})

  const setDetail = (k: string, v: string) =>
    setDetails((d) => ({ ...d, [k]: v }))

  const valid = base.name.trim() && /\S+@\S+\.\S+/.test(base.email)

  const submit = () => {
    if (!valid) return
    const cleanDetails: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(details)) {
      if (v.trim()) {
        cleanDetails[k] = k === 'amount' ? Number(v) : v
      }
    }
    onSubmit(type, base, cleanDetails)
  }

  return (
    <>
      <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Tipo de solicitud *</Label>
            <Select value={type} onValueChange={(v) => { setType(v); setDetails({}) }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPPLIER">
                  <Store className="size-4" /> Proveedor
                </SelectItem>
                <SelectItem value="COURIER">
                  <Bike className="size-4" /> Mensajero
                </SelectItem>
                <SelectItem value="PARTNER">
                  <Handshake className="size-4" /> Socio
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-name">Nombre *</Label>
              <Input
                id="a-name"
                value={base.name}
                onChange={(e) => setBase((b) => ({ ...b, name: e.target.value }))}
                placeholder="Nombre completo o empresa"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-phone">Teléfono</Label>
              <Input
                id="a-phone"
                value={base.phone}
                onChange={(e) => setBase((b) => ({ ...b, phone: e.target.value }))}
                placeholder="099 123 4567"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-email">Email *</Label>
            <Input
              id="a-email"
              type="email"
              value={base.email}
              onChange={(e) => setBase((b) => ({ ...b, email: e.target.value }))}
              placeholder="postulante@correo.com"
            />
          </div>

          {/* Dynamic fields */}
          {type === 'SUPPLIER' && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-company">Empresa</Label>
                <Input
                  id="d-company"
                  value={details.companyName || ''}
                  onChange={(e) => setDetail('companyName', e.target.value)}
                  placeholder="Distribuidora XYZ"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-taxid">RUC</Label>
                <Input
                  id="d-taxid"
                  value={details.taxId || ''}
                  onChange={(e) => setDetail('taxId', e.target.value)}
                  placeholder="09XXXXXXXXXX001"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-city">Ciudad</Label>
                <Input
                  id="d-city"
                  value={details.city || ''}
                  onChange={(e) => setDetail('city', e.target.value)}
                  placeholder="Guayaquil"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-cat">Categoría / Rubro</Label>
                <Input
                  id="d-cat"
                  value={details.category || ''}
                  onChange={(e) => setDetail('category', e.target.value)}
                  placeholder="Tecnología"
                />
              </div>
            </div>
          )}

          {type === 'COURIER' && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-vehicle">Vehículo</Label>
                <Select
                  value={details.vehicleType || 'MOTORCYCLE'}
                  onValueChange={(v) => setDetail('vehicleType', v)}
                >
                  <SelectTrigger id="d-vehicle" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-zone">Zona</Label>
                <Input
                  id="d-zone"
                  value={details.zone || ''}
                  onChange={(e) => setDetail('zone', e.target.value)}
                  placeholder="Norte de Quito"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-model">Modelo</Label>
                <Input
                  id="d-model"
                  value={details.vehicleModel || ''}
                  onChange={(e) => setDetail('vehicleModel', e.target.value)}
                  placeholder="Honda CG 150"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-plate">Placa</Label>
                <Input
                  id="d-plate"
                  value={details.licensePlate || ''}
                  onChange={(e) => setDetail('licensePlate', e.target.value)}
                  placeholder="ABC-1234"
                />
              </div>
            </div>
          )}

          {type === 'PARTNER' && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="d-amount">Aporte (USD)</Label>
                <Input
                  id="d-amount"
                  inputMode="numeric"
                  value={details.amount || ''}
                  onChange={(e) => setDetail('amount', e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="300"
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Rendimiento mensual</Label>
                <Input
                  value={details.amount ? `${(Number(details.amount) * 0.03).toFixed(2)} USD (3%)` : '—'}
                  readOnly
                  className="bg-muted/40 text-emerald-700 font-medium"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="d-exp">Experiencia / comentarios</Label>
                <Textarea
                  id="d-exp"
                  value={details.notes || ''}
                  onChange={(e) => setDetail('notes', e.target.value)}
                  rows={2}
                  placeholder="Cuéntanos sobre tu interés en ser socio…"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!valid} onClick={submit}>
            <Plus /> Enviar solicitud
          </Button>
        </DialogFooter>
    </>
  )
}
