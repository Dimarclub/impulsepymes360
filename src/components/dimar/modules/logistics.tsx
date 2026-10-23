'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import type { Courier } from '@/lib/types'
import { VEHICLE_ICONS, VEHICLE_LABELS } from '@/lib/types'
import {
  Bike,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Star,
  Truck,
  User,
  Users,
  AlertTriangle,
  Eye,
  Hand,
  Inbox,
} from 'lucide-react'

// ---------- Tipos locales ----------
interface DeliveryOrder {
  orderNumber: string
  city?: string | null
  total?: number
  items?: { id: string; quantity: number }[]
  user?: { name: string } | null
}
interface DeliveryCourier {
  user: { name: string }
  vehicleType: string
}
interface Delivery {
  id: string
  orderId: string
  courierId?: string | null
  status: string
  taskType?: string
  amountToCollect?: number
  pickupAddress?: string | null
  deliveryAddress?: string | null
  distance?: number | null
  estimatedMinutes?: number | null
  notes?: string | null
  signatureName?: string | null
  incidentType?: string | null
  incidentDesc?: string | null
  deliveredAt?: string | null
  createdAt: string
  updatedAt?: string
  order?: DeliveryOrder | null
  courier?: DeliveryCourier | null
}

// ---------- Mapas de iconos de vehículo ----------
const VEHICLE_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Bike,
  Truck,
  Car,
}

// ---------- Estado + estilos ----------
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Por asignar',
  ASSIGNED: 'Asignado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  ASSIGNED: 'bg-sky-100 text-sky-700 border-sky-300',
  PICKED_UP: 'bg-violet-100 text-violet-700 border-violet-300',
  IN_TRANSIT: 'bg-orange-100 text-orange-700 border-orange-300',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
}

const TASK_TYPE_LABELS: Record<string, string> = {
  SOBRE: 'Sobre',
  EXPRESS: 'Express',
  MICRODISTRIBUCION: 'Microdist.',
}

const INCIDENT_LABELS: Record<string, string> = {
  DIRECCION_INCORRECTA: 'Dirección incorrecta',
  CLIENTE_AUSENTE: 'Cliente ausente',
  DAÑO: 'Daño',
  OTRO: 'Otro',
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function timeSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ---------- Componentes auxiliares ----------
function RatingStars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value || 0))
  return (
    <div className="flex items-center gap-0.5" aria-label={`Calificación ${v} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < Math.round(v) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">{v.toFixed(1)}</span>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'amber' | 'rose' | 'sky'
}) {
  const ring =
    accent === 'emerald'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : accent === 'amber'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : accent === 'rose'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
  return (
    <Card className="flex-1 min-w-[150px]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-lg shrink-0 ${ring}`}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function NewCourierDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleType: 'MOTORCYCLE',
    licensePlate: '',
    zone: '',
  })
  const toast = useAppStore((s) => s.toast)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast('Nombre y email son obligatorios', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          vehicleType: form.vehicleType,
          licensePlate: form.licensePlate || undefined,
          zone: form.zone || undefined,
        }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Mensajero registrado con éxito')
      setForm({ name: '', email: '', phone: '', vehicleType: 'MOTORCYCLE', licensePlate: '', zone: '' })
      setOpen(false)
      onCreated()
    } catch {
      toast('No se pudo registrar el mensajero', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Plus className="size-4" />
        Registrar mensajero
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar mensajero</DialogTitle>
          <DialogDescription>Datos del courier y su vehículo asignado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nc-name">Nombre completo</Label>
            <Input id="nc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-email">Email</Label>
              <Input id="nc-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="mensajero@dimarclub.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-phone">Teléfono</Label>
              <Input id="nc-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="099111222" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-vehicle">Tipo de vehículo</Label>
              <Select value={form.vehicleType} onValueChange={(v) => setForm({ ...form, vehicleType: v })}>
                <SelectTrigger id="nc-vehicle" className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-plate">Placa</Label>
              <Input id="nc-plate" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} placeholder="GYE-1234" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-zone">Zona de operación</Label>
            <Input id="nc-zone" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} placeholder="Norte de Guayaquil" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Registrar mensajero
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Tarjeta "Por asignar" (draggable) ----------
function PendingDeliveryCard({
  delivery,
  onAssign,
  busy,
}: {
  delivery: Delivery
  onAssign: (deliveryId: string, courierId: string) => void
  busy: boolean
}) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [localBusy, setLocalBusy] = useState(false)
  const isBusy = busy || localBusy
  const orderItems = delivery.order?.items?.length || 0
  const totalQty = delivery.order?.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', delivery.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable={!isBusy}
      onDragStart={onDragStart}
      className={`group rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${isBusy ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
          #{delivery.order?.orderNumber || '—'}
        </span>
        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
          {TASK_TYPE_LABELS[delivery.taskType || 'SOBRE'] || 'Sobre'}
        </Badge>
      </div>

      <div className="mt-2 text-sm font-semibold truncate">
        {delivery.order?.user?.name || 'Cliente'}
      </div>

      <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0 mt-0.5" />
        <span className="line-clamp-2">{delivery.deliveryAddress || delivery.order?.city || 'Dirección pendiente'}</span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Items</span>
          <span className="font-medium">{orderItems} ({totalQty}u)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">${(delivery.order?.total || 0).toFixed(2)}</span>
        </div>
        {delivery.amountToCollect > 0 && (
          <div className="col-span-2 flex items-center justify-between text-amber-700 dark:text-amber-300 font-medium">
            <span className="flex items-center gap-1"><AlertTriangle className="size-3" /> A cobrar contra entrega</span>
            <span>${delivery.amountToCollect.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="size-3" />
          {timeSince(delivery.createdAt)}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30 lg:hidden"
          onClick={() => setAssignOpen(true)}
          disabled={isBusy}
        >
          {localBusy && <Loader2 className="size-3 animate-spin" />} Asignar
        </Button>
      </div>

      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        deliveryId={delivery.id}
        onAssign={onAssign}
        onBusyChange={setLocalBusy}
      />
    </div>
  )
}

function AssignDialog({
  open,
  onOpenChange,
  deliveryId,
  onAssign,
  onBusyChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  deliveryId: string
  onAssign: (deliveryId: string, courierId: string) => void
  onBusyChange: (b: boolean) => void
}) {
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useAppStore((s) => s.toast)

  useEffect(() => {
    if (!open) return
    fetch('/api/couriers')
      .then((r) => (r.ok ? r.json() : []))
      .then((c: Courier[]) => setCouriers(c.filter((x) => x.available)))
      .catch(() => setCouriers([]))
  }, [open])

  const submit = async (courierId: string) => {
    if (!courierId) return
    setLoading(true)
    onBusyChange(true)
    try {
      await onAssign(deliveryId, courierId)
      onOpenChange(false)
    } finally {
      setLoading(false)
      onBusyChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar mensajero</DialogTitle>
          <DialogDescription>Selecciona un mensajero disponible para esta entrega.</DialogDescription>
        </DialogHeader>
        {couriers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay mensajeros disponibles.</p>
        ) : (
          <Select onValueChange={submit} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un mensajero" />
            </SelectTrigger>
            <SelectContent>
              {couriers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.user.name} · {VEHICLE_LABELS[c.vehicleType] || c.vehicleType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Tarjeta de mensajero (drop target) ----------
function CourierDropCard({
  courier,
  activeCount,
  onDrop,
  dragOver,
  onDragOver,
  onDragLeave,
  onToggle,
}: {
  courier: Courier
  activeCount: number
  onDrop: (courierId: string, deliveryId: string) => void
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onToggle: (id: string, available: boolean) => void
}) {
  const iconName = VEHICLE_ICONS[courier.vehicleType] || 'Truck'
  const Icon = VEHICLE_ICON_COMPONENTS[iconName] || Truck

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        const deliveryId = e.dataTransfer.getData('text/plain')
        if (deliveryId) onDrop(courier.id, deliveryId)
      }}
      className={`rounded-lg border-2 p-4 transition-all ${
        dragOver
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.02]'
          : 'border-emerald-200 dark:border-emerald-900/50 bg-card hover:border-emerald-400'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{courier.user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{VEHICLE_LABELS[courier.vehicleType] || courier.vehicleType}</p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300">
          {activeCount} activo{activeCount === 1 ? '' : 's'}
        </Badge>
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5" /> Zona
          </span>
          <span className="font-medium truncate ml-2">{courier.zone || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Route className="size-3.5" /> Placa
          </span>
          <span className="font-medium font-mono uppercase">{courier.licensePlate || '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="size-3.5" /> Teléfono
          </span>
          <span className="font-medium">{courier.user.phone || '—'}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-2">
        <RatingStars value={courier.rating} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{courier.available ? 'Disponible' : 'No disponible'}</span>
          <Switch
            checked={courier.available}
            onCheckedChange={(v) => onToggle(courier.id, v)}
            aria-label="Toggle disponibilidad"
          />
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-emerald-700 dark:text-emerald-300 hidden lg:flex items-center justify-center gap-1">
        <Hand className="size-3" /> Arrastra aquí un sobre para asignar
      </div>
    </div>
  )
}

// ---------- Componente principal ----------
export function LogisticsModule() {
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [dragOverCourier, setDragOverCourier] = useState<string | null>(null)
  const [managingOpen, setManagingOpen] = useState(false)
  const toast = useAppStore((s) => s.toast)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    try {
      const [c, d] = await Promise.all([
        fetch('/api/couriers').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/deliveries').then((r) => (r.ok ? r.json() : [])),
      ])
      setCouriers(c)
      setDeliveries(d)
    } catch {
      toast('Error al cargar datos de logística', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    load()
    // Refrescar cada 30s en silencio
    const t = setInterval(() => load(true), 30000)
    return () => clearInterval(t)
  }, [load])

  const toggleAvailable = async (id: string, available: boolean) => {
    setCouriers((prev) => prev.map((c) => (c.id === id ? { ...c, available } : c)))
    try {
      const r = await fetch(`/api/couriers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available }),
      })
      if (!r.ok) throw new Error('request failed')
      toast(`Mensajero ${available ? 'disponible' : 'no disponible'}`, 'info')
    } catch {
      setCouriers((prev) => prev.map((c) => (c.id === id ? { ...c, available: !available } : c)))
      toast('No se pudo actualizar el mensajero', 'error')
    }
  }

  const assignCourier = async (deliveryId: string, courierId: string) => {
    setBusyIds((p) => new Set(p).add(deliveryId))
    try {
      const courier = couriers.find((c) => c.id === courierId)
      const r = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', courierId }),
      })
      if (!r.ok) throw new Error('request failed')
      toast(`Sobre asignado a ${courier?.user?.name || 'mensajero'}`)
      await load(true)
    } catch {
      toast('No se pudo asignar el mensajero', 'error')
    } finally {
      setBusyIds((p) => {
        const n = new Set(p)
        n.delete(deliveryId)
        return n
      })
    }
  }

  const releaseCourier = async (deliveryId: string) => {
    try {
      const r = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release' }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Mensajero liberado', 'info')
      await load(true)
    } catch {
      toast('No se pudo liberar el mensajero', 'error')
    }
  }

  // ---------- Estadísticas ----------
  const stats = useMemo(() => {
    const today = new Date()
    const pending = deliveries.filter((d) => d.status === 'PENDING').length
    const inRoute = deliveries.filter((d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT').length
    const deliveredToday = deliveries.filter((d) => {
      if (d.status !== 'DELIVERED') return false
      const ref = d.deliveredAt ? new Date(d.deliveredAt) : d.updatedAt ? new Date(d.updatedAt) : new Date(d.createdAt)
      return isSameDay(ref, today)
    }).length
    const incidents = deliveries.filter((d) => d.status === 'FAILED' || d.incidentType).length
    return { pending, inRoute, deliveredToday, incidents }
  }, [deliveries])

  const pendingDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === 'PENDING'),
    [deliveries]
  )
  const availableCouriers = useMemo(
    () => couriers.filter((c) => c.available),
    [couriers]
  )
  const inProgress = useMemo(
    () => deliveries.filter((d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT'),
    [deliveries]
  )
  const recentHistory = useMemo(
    () => deliveries
      .filter((d) => d.status === 'DELIVERED' || d.status === 'FAILED')
      .slice(0, 20),
    [deliveries]
  )

  const activeCountByCourier = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of deliveries) {
      if (!d.courierId) continue
      if (d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT') {
        map.set(d.courierId, (map.get(d.courierId) || 0) + 1)
      }
    }
    return map
  }, [deliveries])

  const handleDrop = async (courierId: string, deliveryId: string) => {
    setDragOverCourier(null)
    await assignCourier(deliveryId, courierId)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Logística Fuerza Delta</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Arrastra los sobres a un mensajero disponible para asignar la entrega.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => load(true)} disabled={refreshing}>
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Actualizar
          </Button>
          <NewCourierDialog onCreated={() => load(true)} />
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Por asignar" value={stats.pending} icon={Inbox} accent="amber" />
        <StatCard label="En ruta" value={stats.inRoute} icon={Route} accent="sky" />
        <StatCard label="Entregados hoy" value={stats.deliveredToday} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Incidencias" value={stats.incidents} icon={AlertTriangle} accent="rose" />
      </div>

      {/* Tablero drag-and-drop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna izquierda: Por asignar */}
        <Card className="border-amber-200 dark:border-amber-900/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-amber-500" />
                <CardTitle className="text-base">Por asignar</CardTitle>
              </div>
              <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                {pendingDeliveries.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Arrastra cada sobre a un mensajero disponible
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : pendingDeliveries.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Inbox className="size-10 mx-auto mb-2 opacity-30" />
                No hay sobres pendientes. ¡Todo al día!
              </div>
            ) : (
              <ScrollArea className="max-h-[640px] pr-3">
                <div className="space-y-3">
                  {pendingDeliveries.map((d) => (
                    <PendingDeliveryCard
                      key={d.id}
                      delivery={d}
                      onAssign={assignCourier}
                      busy={busyIds.has(d.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Columna derecha: Mensajeros disponibles */}
        <Card className="border-emerald-200 dark:border-emerald-900/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-emerald-500" />
                <CardTitle className="text-base">Mensajeros disponibles</CardTitle>
              </div>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300">
                {availableCouriers.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Suelta aquí el sobre para asignarlo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : availableCouriers.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Users className="size-10 mx-auto mb-2 opacity-30" />
                No hay mensajeros disponibles en este momento.
              </div>
            ) : (
              <ScrollArea className="max-h-[640px] pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableCouriers.map((c) => (
                    <CourierDropCard
                      key={c.id}
                      courier={c}
                      activeCount={activeCountByCourier.get(c.id) || 0}
                      onDrop={handleDrop}
                      dragOver={dragOverCourier === c.id}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setDragOverCourier(c.id)
                      }}
                      onDragLeave={() => setDragOverCourier((cur) => (cur === c.id ? null : cur))}
                      onToggle={toggleAvailable}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entregas en curso */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-sky-600" />
              <CardTitle className="text-base">Entregas en curso</CardTitle>
            </div>
            <Badge variant="secondary">{inProgress.length}</Badge>
          </div>
          <CardDescription className="text-xs">
            Pedidos ya asignados o en tránsito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inProgress.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No hay entregas en curso.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3 font-medium">Pedido</th>
                    <th className="py-2 pr-3 font-medium">Cliente</th>
                    <th className="py-2 pr-3 font-medium">Mensajero</th>
                    <th className="py-2 pr-3 font-medium">Estado</th>
                    <th className="py-2 pr-3 font-medium hidden md:table-cell">Tiempo</th>
                    <th className="py-2 pr-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inProgress.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-3 font-mono text-xs font-semibold">
                        #{d.order?.orderNumber || '—'}
                      </td>
                      <td className="py-2.5 pr-3 truncate max-w-[140px]">
                        {d.order?.user?.name || '—'}
                      </td>
                      <td className="py-2.5 pr-3 truncate max-w-[140px]">
                        {d.courier?.user?.name || '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge variant="outline" className={STATUS_BADGES[d.status] || 'bg-muted'}>
                          {STATUS_LABELS[d.status] || d.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 hidden md:table-cell text-xs text-muted-foreground">
                        {timeSince(d.createdAt)}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => toast(`Pedido ${d.order?.orderNumber} — ${STATUS_LABELS[d.status]}`, 'info')}
                          >
                            <Eye className="size-3.5" /> Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600 hover:text-red-700"
                            onClick={() => releaseCourier(d.id)}
                          >
                            Liberar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial reciente */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <CardTitle className="text-base">Historial reciente</CardTitle>
            </div>
            <Badge variant="secondary">{recentHistory.length}</Badge>
          </div>
          <CardDescription className="text-xs">
            Últimas {recentHistory.length} entregas completadas o fallidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aún no hay entregas completadas.
            </div>
          ) : (
            <ScrollArea className="max-h-[420px]">
              <div className="space-y-2">
                {recentHistory.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                          d.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {d.status === 'DELIVERED' ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          #{d.order?.orderNumber || '—'} · {d.order?.user?.name || 'Cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.courier?.user?.name ? `Mensajero: ${d.courier.user.name}` : 'Sin mensajero'}
                          {d.signatureName && ` · Firmado por ${d.signatureName}`}
                          {d.incidentType && ` · ${INCIDENT_LABELS[d.incidentType] || d.incidentType}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className={STATUS_BADGES[d.status]}>
                        {STATUS_LABELS[d.status]}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{fmtDate(d.deliveredAt || d.updatedAt || d.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Gestionar mensajeros (colapsable) */}
      <Collapsible open={managingOpen} onOpenChange={setManagingOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full text-left">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-emerald-600" />
                    <CardTitle className="text-base">Gestionar mensajeros</CardTitle>
                    <Badge variant="secondary">{couriers.length}</Badge>
                  </div>
                  <ChevronDown
                    className={`size-5 text-muted-foreground transition-transform ${managingOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                <CardDescription className="text-xs">
                  Ver y administrar toda la flota de mensajeros
                </CardDescription>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full rounded-lg" />
              ) : couriers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No hay mensajeros registrados. Crea el primero con el botón <strong>Registrar mensajero</strong>.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b">
                        <th className="py-2 pr-3 font-medium">Mensajero</th>
                        <th className="py-2 pr-3 font-medium">Vehículo</th>
                        <th className="py-2 pr-3 font-medium hidden md:table-cell">Zona</th>
                        <th className="py-2 pr-3 font-medium hidden md:table-cell">Placa</th>
                        <th className="py-2 pr-3 font-medium hidden lg:table-cell">Rating</th>
                        <th className="py-2 pr-3 font-medium text-right">Disponible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couriers.map((c) => {
                        const iconName = VEHICLE_ICONS[c.vehicleType] || 'Truck'
                        const Icon = VEHICLE_ICON_COMPONENTS[iconName] || Truck
                        return (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
                                  <Icon className="size-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{c.user.name}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{c.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 text-xs">
                              {VEHICLE_LABELS[c.vehicleType] || c.vehicleType}
                            </td>
                            <td className="py-2.5 pr-3 hidden md:table-cell text-xs">
                              {c.zone || '—'}
                            </td>
                            <td className="py-2.5 pr-3 hidden md:table-cell text-xs font-mono uppercase">
                              {c.licensePlate || '—'}
                            </td>
                            <td className="py-2.5 pr-3 hidden lg:table-cell">
                              <RatingStars value={c.rating} />
                            </td>
                            <td className="py-2.5 pr-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  {c.available ? 'Sí' : 'No'}
                                </span>
                                <Switch
                                  checked={c.available}
                                  onCheckedChange={(v) => toggleAvailable(c.id, v)}
                                  aria-label="Toggle disponibilidad"
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
