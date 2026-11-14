'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Calendar, Plus, MapPin, Store, Loader2, ChevronLeft, ChevronRight,
  Trash2, CheckCircle2, Clock, XCircle, PlayCircle, Building2, DollarSign,
  LayoutGrid, RefreshCw, Hand,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

const FAIR_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

const FAIR_STATUS_BADGES: Record<string, string> = {
  SCHEDULED: 'bg-amber-100 text-amber-700 border-amber-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  COMPLETED: 'bg-sky-100 text-sky-700 border-sky-300',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
}

const FAIR_STATUS_ICONS: Record<string, React.ElementType> = {
  SCHEDULED: Clock,
  ACTIVE: PlayCircle,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
}

const BOOTH_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  CONFIRMED: 'Confirmado',
}

const BOOTH_STATUS_BADGES: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  RESERVED: 'bg-amber-50 text-amber-700 border-amber-300',
  CONFIRMED: 'bg-violet-50 text-violet-700 border-violet-300',
}

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toDateInputValue(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

interface FairListItem {
  id: string
  name: string
  description: string | null
  location: string | null
  city: string | null
  startDate: string
  endDate: string
  status: string
  createdAt: string
  booths: { total: number; available: number; reserved: number; confirmed: number }
}

interface BoothItem {
  id: string
  boothNumber: string | null
  status: string
  supplierId: string | null
  supplier: {
    id: string
    companyName: string
    city: string | null
    phone: string | null
    category: string | null
  } | null
}

interface FairDetail extends FairListItem {
  booths: BoothItem[]
  revenue: number
}

export function FeriasModule() {
  const toast = useAppStore((s) => s.toast)
  const [fairs, setFairs] = useState<FairListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedFairId, setSelectedFairId] = useState<string | null>(null)

  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, revenue: 0 })

  const fetchFairs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ferias?includePast=true')
      const d = await res.json()
      if (res.ok) setFairs(d.fairs || [])
      else setFairs([])
    } catch {
      setFairs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFairs() }, [fetchFairs])

  // Calcular stats locales
  useEffect(() => {
    const now = new Date()
    const active = fairs.filter((f) => {
      const start = new Date(f.startDate)
      const end = new Date(f.endDate)
      return f.status === 'ACTIVE' || (start <= now && end >= now)
    }).length
    const completed = fairs.filter((f) => f.status === 'COMPLETED' || new Date(f.endDate) < now).length
    setStats({
      total: fairs.length,
      active,
      completed,
      revenue: 0, // se llena desde el detail si se solicita
    })
  }, [fairs])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="size-7 text-primary" /> Calendario de Ferias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona ferias, asigna stands a proveedores y mide el impacto comercial.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFairs} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} /> Actualizar
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1.5" /> Crear feria
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <LayoutGrid className="size-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Feria(s) totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <PlayCircle className="size-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="size-5 mx-auto text-sky-600 mb-1" />
            <p className="text-2xl font-bold text-sky-700">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="size-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold text-amber-700">{fmtUsd(stats.revenue)}</p>
            <p className="text-xs text-muted-foreground">Ventas POS en ferias</p>
          </CardContent>
        </Card>
      </div>

      {/* Vista calendario + lista */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <CalendarView fairs={fairs} onSelectFair={(id) => setSelectedFairId(id)} />
        <FairsList
          fairs={fairs}
          loading={loading}
          onSelectFair={(id) => setSelectedFairId(id)}
        />
      </div>

      {/* Dialog crear feria */}
      <CreateFairDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => { setCreateOpen(false); fetchFairs() }}
        toast={toast}
      />

      {/* Dialog detalle de feria */}
      <FairDetailDialog
        fairId={selectedFairId}
        onOpenChange={(o) => !o && setSelectedFairId(null)}
        onChanged={() => fetchFairs()}
        toast={toast}
      />
    </div>
  )
}

// ============ CALENDARIO MENSUAL ============
function CalendarView({ fairs, onSelectFair }: { fairs: FairListItem[]; onSelectFair: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const monthFairs = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    return fairs.filter((f) => {
      const start = new Date(f.startDate)
      const end = new Date(f.endDate)
      // feria intersecta el mes si start <= último día del mes y end >= primer día del mes
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
      return start <= monthEnd && end >= monthStart
    })
  }, [fairs, cursor])

  // Calcular días del mes
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Lunes = 0
  let firstWeekday = firstDay.getDay() - 1
  if (firstWeekday < 0) firstWeekday = 6
  const daysInMonth = lastDay.getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const fairsForDay = (date: Date) => {
    return monthFairs.filter((f) => {
      const start = new Date(f.startDate)
      const end = new Date(f.endDate)
      end.setHours(23, 59, 59)
      return date >= start && date <= end
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-5 text-primary" /> Calendario
            </CardTitle>
            <CardDescription>Ferias programadas y activas</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const d = new Date()
                setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
              }}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm font-semibold text-primary mt-1">
          {MONTH_NAMES[month]} {year}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="aspect-square rounded-md" />
            const dayFairs = fairsForDay(date)
            const isToday = date.getTime() === today.getTime()
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  'aspect-square rounded-md border p-1 flex flex-col gap-0.5 overflow-hidden',
                  isToday ? 'border-primary border-2' : 'border-border/60',
                  dayFairs.length > 0 ? 'bg-primary/5' : 'bg-card'
                )}
              >
                <span className={cn(
                  'text-[10px] font-semibold',
                  isToday ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {date.getDate()}
                </span>
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {dayFairs.slice(0, 2).map((f) => {
                    const Icon = FAIR_STATUS_ICONS[f.status] || Clock
                    return (
                      <button
                        key={f.id}
                        onClick={() => onSelectFair(f.id)}
                        title={f.name}
                        className={cn(
                          'w-full text-left text-[9px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-0.5 transition-colors hover:opacity-80',
                          FAIR_STATUS_BADGES[f.status] || 'bg-muted'
                        )}
                      >
                        <Icon className="size-2 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    )
                  })}
                  {dayFairs.length > 2 && (
                    <p className="text-[9px] text-muted-foreground pl-1">+{dayFairs.length - 2} más</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============ LISTA DE FERIAS ============
function FairsList({
  fairs, loading, onSelectFair,
}: { fairs: FairListItem[]; loading: boolean; onSelectFair: (id: string) => void }) {
  const upcoming = [...fairs].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LayoutGrid className="size-5 text-primary" /> Próximas ferias ({fairs.length})
        </CardTitle>
        <CardDescription>Lista completa — haz clic para ver detalle</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <Calendar className="size-10 mx-auto mb-2 opacity-30" />
            No hay ferias registradas.
            <br />Crea la primera con el botón "Crear feria".
          </div>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 scroll-thin">
            {upcoming.map((f) => {
              const Icon = FAIR_STATUS_ICONS[f.status] || Clock
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFair(f.id)}
                  className="w-full text-left rounded-lg border p-3 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="size-3" />
                        {new Date(f.startDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                        {' → '}
                        {new Date(f.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0', FAIR_STATUS_BADGES[f.status] || '')}>
                      <Icon className="size-3 mr-1" />
                      {FAIR_STATUS_LABELS[f.status] || f.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {f.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {f.location}{f.city ? `, ${f.city}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Store className="size-3" /> {f.booths.confirmed}/{f.booths.total} stands confirmados
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" /> {f.booths.available} disponibles
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============ DIALOG CREAR FERIA ============
function CreateFairDialog({
  open, onOpenChange, onCreated, toast,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreated: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    startDate: toDateInputValue(new Date()),
    endDate: toDateInputValue(new Date(Date.now() + 2 * 86400000)),
    boothCount: '10',
  })
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!form.name.trim()) { toast('El nombre es obligatorio', 'error'); return }
    if (!form.startDate || !form.endDate) { toast('Las fechas son obligatorias', 'error'); return }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast('La fecha fin debe ser posterior a la fecha inicio', 'error'); return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/ferias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          location: form.location.trim() || undefined,
          city: form.city.trim() || undefined,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          boothCount: Number(form.boothCount) || 0,
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al crear la feria', 'error'); return }
      toast(`Feria "${form.name}" creada con ${form.boothCount} stands`, 'success')
      setForm({
        name: '', description: '', location: '', city: '',
        startDate: toDateInputValue(new Date()),
        endDate: toDateInputValue(new Date(Date.now() + 2 * 86400000)),
        boothCount: '10',
      })
      onCreated()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" /> Crear nueva feria
          </DialogTitle>
          <DialogDescription>
            Completa los datos y genera stands automáticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nombre de la feria *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Feria de Emprendedores Guayaquil"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalles de la feria, objetivo, público esperado..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" /> Ubicación
              </Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Dirección o recinto"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-muted-foreground" /> Ciudad
              </Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ej: Guayaquil"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Fecha inicio *
              </Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-muted-foreground" /> Fecha fin *
              </Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Store className="size-3.5 text-muted-foreground" /> Cantidad de stands a generar
            </Label>
            <Input
              type="number"
              min="0"
              max="500"
              value={form.boothCount}
              onChange={(e) => setForm({ ...form, boothCount: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Se crearán {form.boothCount || 0} stands numerados automáticamente (Stand A-1, A-2, ...).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {submitting ? (
              <><Loader2 className="size-4 mr-1.5 animate-spin" /> Creando...</>
            ) : (
              <><Plus className="size-4 mr-1.5" /> Crear feria</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ DIALOG DETALLE DE FERIA ============
function FairDetailDialog({
  fairId, onOpenChange, onChanged, toast,
}: {
  fairId: string | null
  onOpenChange: (o: boolean) => void
  onChanged: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [fair, setFair] = useState<FairDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; companyName: string; city: string | null }[]>([])
  const [assigningBoothId, setAssigningBoothId] = useState<string | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [deleting, setDeleting] = useState(false)

  const fetchFair = useCallback(async () => {
    if (!fairId) { setFair(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/ferias/${fairId}?withRevenue=true`)
      const d = await res.json()
      if (res.ok) setFair(d.fair)
      else { setFair(null); toast(d?.error || 'Error al cargar la feria', 'error') }
    } catch {
      setFair(null)
    } finally {
      setLoading(false)
    }
  }, [fairId, toast])

  useEffect(() => {
    if (fairId) fetchFair()
    else setFair(null)
  }, [fairId, fetchFair])

  // Cargar lista de suppliers disponibles (solo cuando se abra el dialog)
  useEffect(() => {
    if (!fairId) return
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : (d.suppliers || [])
        setSuppliers(list.map((s: any) => ({ id: s.id, companyName: s.companyName, city: s.city })))
      })
      .catch(() => setSuppliers([]))
  }, [fairId])

  const assignSupplier = async (boothId: string) => {
    if (!selectedSupplierId) {
      toast('Selecciona un proveedor', 'error')
      return
    }
    setAssigningBoothId(boothId)
    try {
      const res = await fetch(`/api/ferias/${fairId}/booths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boothId, supplierId: selectedSupplierId }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al asignar', 'error'); return }
      toast(`Proveedor asignado al stand`, 'success')
      setSelectedSupplierId('')
      fetchFair()
      onChanged()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setAssigningBoothId(null)
    }
  }

  const releaseBooth = async (boothId: string) => {
    setAssigningBoothId(boothId)
    try {
      const res = await fetch(`/api/ferias/${fairId}/booths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boothId, supplierId: null }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al liberar', 'error'); return }
      toast('Stand liberado', 'info')
      fetchFair()
      onChanged()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setAssigningBoothId(null)
    }
  }

  const deleteFair = async () => {
    if (!fair) return
    if (!confirm(`¿Eliminar la feria "${fair.name}"? Se borrarán todos los stands asociados.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/ferias/${fairId}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al eliminar', 'error'); return }
      toast('Feria eliminada', 'info')
      onOpenChange(false)
      onChanged()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!fair) return
    try {
      const res = await fetch(`/api/ferias/${fairId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al actualizar', 'error'); return }
      toast(`Feria marcada como ${FAIR_STATUS_LABELS[newStatus]}`, 'success')
      fetchFair()
      onChanged()
    } catch {
      toast('Error de red', 'error')
    }
  }

  return (
    <Dialog open={!!fairId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" /> Detalle de feria
          </DialogTitle>
          <DialogDescription>
            Gestiona stands y proveedores asignados
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !fair ? (
          <div className="text-center py-8 text-muted-foreground">
            No se pudo cargar la feria.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-lg">{fair.name}</h3>
                <Badge variant="outline" className={cn(FAIR_STATUS_BADGES[fair.status] || '')}>
                  {FAIR_STATUS_LABELS[fair.status] || fair.status}
                </Badge>
              </div>
              {fair.description && (
                <p className="text-sm text-muted-foreground">{fair.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(fair.startDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' → '}
                  {new Date(fair.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {fair.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {fair.location}{fair.city ? `, ${fair.city}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                  <DollarSign className="size-3" /> Ventas POS: {fmtUsd(fair.revenue)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant={fair.status === st ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => updateStatus(st)}
                    disabled={fair.status === st}
                  >
                    {FAIR_STATUS_LABELS[st]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stands */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Store className="size-4 text-primary" /> Stands ({fair.booths.length})
                </h4>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline" className={BOOTH_STATUS_BADGES.AVAILABLE}>
                    {fair.booths.filter((b) => b.status === 'AVAILABLE').length} disponibles
                  </Badge>
                  <Badge variant="outline" className={BOOTH_STATUS_BADGES.CONFIRMED}>
                    {fair.booths.filter((b) => b.status === 'CONFIRMED').length} confirmados
                  </Badge>
                </div>
              </div>

              {fair.booths.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-lg">
                  <Store className="size-8 mx-auto mb-1 opacity-30" />
                  Esta feria no tiene stands.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 scroll-thin">
                  {fair.booths.map((b) => (
                    <div
                      key={b.id}
                      className={cn(
                        'rounded-lg border p-3 space-y-2',
                        b.status === 'AVAILABLE' && 'bg-emerald-50/30 border-emerald-200',
                        b.status === 'CONFIRMED' && 'bg-violet-50/30 border-violet-200',
                        b.status === 'RESERVED' && 'bg-amber-50/30 border-amber-200'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{b.boothNumber || 'Sin número'}</p>
                          {b.supplier ? (
                            <div className="mt-1 text-xs space-y-0.5">
                              <p className="font-medium truncate">{b.supplier.companyName}</p>
                              <p className="text-muted-foreground">
                                {b.supplier.category || 'Sin rubro'}
                                {b.supplier.city ? ` · ${b.supplier.city}` : ''}
                              </p>
                              {b.supplier.phone && (
                                <p className="text-muted-foreground">{b.supplier.phone}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">Sin asignar</p>
                          )}
                        </div>
                        <Badge variant="outline" className={cn('shrink-0', BOOTH_STATUS_BADGES[b.status] || '')}>
                          {BOOTH_STATUS_LABELS[b.status] || b.status}
                        </Badge>
                      </div>

                      {b.status === 'AVAILABLE' ? (
                        <div className="flex gap-1.5">
                          <Select
                            value={selectedSupplierId}
                            onValueChange={setSelectedSupplierId}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Proveedor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.companyName}{s.city ? ` (${s.city})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={assigningBoothId === b.id || !selectedSupplierId}
                            onClick={() => assignSupplier(b.id)}
                          >
                            {assigningBoothId === b.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <><Hand className="size-3.5 mr-1" /> Asignar</>
                            )}
                          </Button>
                        </div>
                      ) : b.supplier ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-full text-red-600 hover:bg-red-50 text-xs"
                          disabled={assigningBoothId === b.id}
                          onClick={() => releaseBooth(b.id)}
                        >
                          {assigningBoothId === b.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <><Trash2 className="size-3.5 mr-1" /> Liberar stand</>
                          )}
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Eliminar */}
            <div className="flex justify-end pt-3 border-t">
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={deleteFair}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="size-4 mr-1.5" />
                )}
                Eliminar feria
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
