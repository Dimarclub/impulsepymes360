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
import { useAppStore } from '@/lib/store'
import type { Courier, Delivery } from '@/lib/types'
import { VEHICLE_ICONS, VEHICLE_LABELS } from '@/lib/types'
import {
  Bike,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  Plus,
  Route,
  Star,
  Truck,
  User,
  Users,
} from 'lucide-react'

// Mapa de iconos de vehículo (string → componente Lucide)
const VEHICLE_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Bike,
  Truck,
  Car,
}

// Etiquetas de estados de entrega
const DELIVERY_STATUSES = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'] as const
type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  ASSIGNED: 'Asignado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
}

const STATUS_NEXT: Record<DeliveryStatus, DeliveryStatus | null> = {
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
  DELIVERED: null,
}

const STATUS_ACCENT: Record<DeliveryStatus, string> = {
  ASSIGNED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PICKED_UP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  IN_TRANSIT: 'bg-emerald-200/60 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  DELIVERED: 'bg-emerald-600 text-white',
}

// El API devuelve updatedAt (include sin select)
interface DeliveryWithUpdated extends Delivery {
  updatedAt?: string
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function RatingStars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value || 0))
  return (
    <div className="flex items-center gap-0.5" aria-label={`Calificación ${v} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < Math.round(v) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{v.toFixed(1)}</span>
    </div>
  )
}

function StatPill({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'amber'
}) {
  const ring =
    accent === 'emerald'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 flex-1 min-w-[180px]">
      <div className={`p-2 rounded-lg shrink-0 ${ring}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
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

function CourierCard({
  courier,
  onToggle,
}: {
  courier: Courier
  onToggle: (id: string, available: boolean) => void
}) {
  const iconName = VEHICLE_ICONS[courier.vehicleType] || 'Truck'
  const Icon = VEHICLE_ICON_COMPONENTS[iconName] || Truck
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{courier.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{courier.user.email}</p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {VEHICLE_LABELS[courier.vehicleType] || courier.vehicleType}
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

        <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
          <RatingStars value={courier.rating} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {courier.available ? 'Disponible' : 'No disponible'}
            </span>
            <Switch
              checked={courier.available}
              onCheckedChange={(v) => onToggle(courier.id, v)}
              aria-label="Toggle disponibilidad"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DeliveryKanbanCard({
  delivery,
  couriers,
  onAssign,
  onAdvance,
}: {
  delivery: DeliveryWithUpdated
  couriers: Courier[]
  onAssign: (id: string, courierId: string) => void
  onAdvance: (id: string, next: DeliveryStatus) => void
}) {
  const [assigning, setAssigning] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const courierName = delivery.courier?.user?.name || null
  const next = STATUS_NEXT[delivery.status as DeliveryStatus]
  const availableCouriers = couriers.filter((c) => c.available)

  const handleAssign = async (courierId: string) => {
    setAssigning(true)
    try {
      await onAssign(delivery.id, courierId)
    } finally {
      setAssigning(false)
    }
  }

  const handleAdvance = async () => {
    if (!next) return
    setAdvancing(true)
    try {
      await onAdvance(delivery.id, next)
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          #{delivery.order?.orderNumber || '—'}
        </span>
        {delivery.estimatedMinutes ? (
          <Badge variant="outline" className="text-amber-700 border-amber-300 font-normal">
            <Clock className="size-3 mr-1" />
            ETA {delivery.estimatedMinutes} min
          </Badge>
        ) : null}
      </div>

      <div className="text-sm font-medium truncate">
        {delivery.order?.user?.name || 'Cliente'}
      </div>

      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0 mt-0.5" />
        <span className="line-clamp-2">{delivery.deliveryAddress || delivery.order?.city || 'Dirección no registrada'}</span>
      </div>

      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-muted-foreground">Mensajero</span>
        {courierName ? (
          <span className="font-medium truncate ml-2">{courierName}</span>
        ) : (
          <span className="text-muted-foreground italic">Sin asignar</span>
        )}
      </div>

      {typeof delivery.distance === 'number' && delivery.distance > 0 ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Distancia</span>
          <span className="font-medium">{delivery.distance.toFixed(1)} km</span>
        </div>
      ) : null}

      {/* Asignar mensajero */}
      {!courierName && delivery.status !== 'DELIVERED' ? (
        <Select onValueChange={handleAssign} disabled={assigning || availableCouriers.length === 0}>
          <SelectTrigger className="h-8 w-full text-xs" size="sm">
            <SelectValue placeholder={availableCouriers.length === 0 ? 'Sin disponibles' : 'Asignar mensajero'} />
          </SelectTrigger>
          <SelectContent>
            {availableCouriers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.user.name} · {VEHICLE_LABELS[c.vehicleType] || c.vehicleType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {/* Avanzar estado */}
      {next ? (
        <Button
          onClick={handleAdvance}
          disabled={advancing}
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          {advancing && <Loader2 className="size-3 animate-spin" />}
          Avanzar a {STATUS_LABELS[next]}
        </Button>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 py-1 font-medium">
          <CheckCircle2 className="size-4" />
          Entrega completada
        </div>
      )}
    </div>
  )
}

export function LogisticsModule() {
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryWithUpdated[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useAppStore((s) => s.toast)

  const load = useCallback(async () => {
    setLoading(true)
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
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const toggleAvailable = async (id: string, available: boolean) => {
    // Optimistic update
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
      // Revert
      setCouriers((prev) => prev.map((c) => (c.id === id ? { ...c, available: !available } : c)))
      toast('No se pudo actualizar el mensajero', 'error')
    }
  }

  const assignCourier = async (id: string, courierId: string) => {
    try {
      const r = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierId }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Mensajero asignado con éxito')
      load()
    } catch {
      toast('No se pudo asignar el mensajero', 'error')
    }
  }

  const advanceStatus = async (id: string, status: DeliveryStatus) => {
    try {
      const r = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!r.ok) throw new Error('request failed')
      toast(`Estado actualizado a ${STATUS_LABELS[status]}`)
      load()
    } catch {
      toast('No se pudo actualizar el estado', 'error')
    }
  }

  const stats = useMemo(() => {
    const today = new Date()
    const inTransit = deliveries.filter((d) => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP').length
    const deliveredToday = deliveries.filter((d) => {
      if (d.status !== 'DELIVERED') return false
      const ref = d.updatedAt ? new Date(d.updatedAt) : new Date(d.createdAt)
      return isSameDay(ref, today)
    }).length
    const availableCouriers = couriers.filter((c) => c.available).length
    return {
      total: deliveries.length,
      inTransit,
      deliveredToday,
      availableCouriers,
    }
  }, [deliveries, couriers])

  const columns = useMemo(() => {
    return DELIVERY_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      items: deliveries.filter((d) => (d.status || 'ASSIGNED') === status),
    }))
  }, [deliveries])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Mensajería &amp; Logística</h1>
          <p className="text-muted-foreground text-sm mt-1">Flota de mensajeros y seguimiento de entregas en tiempo real</p>
        </div>
        <NewCourierDialog onCreated={load} />
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total entregas" value={stats.total} icon={Package} accent="emerald" />
        <StatPill label="En tránsito" value={stats.inTransit} icon={Route} accent="amber" />
        <StatPill label="Entregados hoy" value={stats.deliveredToday} icon={CheckCircle2} accent="emerald" />
        <StatPill label="Mensajeros disponibles" value={stats.availableCouriers} icon={Users} accent="amber" />
      </div>

      {/* Flota de mensajeros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Flota de mensajeros</CardTitle>
              <CardDescription>{couriers.length} mensajeros registrados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          ) : couriers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No hay mensajeros registrados. Crea el primero con el botón <strong>Registrar mensajero</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {couriers.map((c) => (
                <CourierCard key={c.id} courier={c} onToggle={toggleAvailable} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban de entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Tablero de entregas</CardTitle>
          <CardDescription>Arrastra el scroll horizontal para ver todas las columnas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto scroll-thin pb-2">
              {DELIVERY_STATUSES.map((_, i) => (
                <Skeleton key={i} className="h-64 min-w-64 flex-1 rounded-lg" />
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No hay entregas registradas todavía.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto scroll-thin pb-2">
              {columns.map((col) => (
                <div key={col.status} className="min-w-64 max-w-72 flex-1 shrink-0">
                  <div className="flex items-center justify-between gap-2 mb-3 sticky top-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block size-2.5 rounded-full ${col.status === 'DELIVERED' ? 'bg-emerald-600' : col.status === 'IN_TRANSIT' ? 'bg-emerald-400' : col.status === 'PICKED_UP' ? 'bg-emerald-300' : 'bg-amber-400'}`} />
                      <h3 className="font-semibold text-sm">{col.label}</h3>
                    </div>
                    <Badge variant="secondary" className="font-mono">{col.items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {col.items.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Sin entregas
                      </div>
                    ) : (
                      col.items.map((d) => (
                        <DeliveryKanbanCard
                          key={d.id}
                          delivery={d}
                          couriers={couriers}
                          onAssign={assignCourier}
                          onAdvance={advanceStatus}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
