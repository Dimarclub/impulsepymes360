'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Card, CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { useAppStore } from '@/lib/store'
import { VEHICLE_LABELS } from '@/lib/types'
import {
  Bike, Truck, Car, Package, MapPin, Clock, CheckCircle2, AlertTriangle,
  Bell, Signature, ChevronRight, DollarSign, Route, Star, LogIn,
  Navigation, PlayCircle, AlertCircle,
} from 'lucide-react'

// ---------- Paleta oscura ----------
const C = {
  bg: '#0B1120',
  card: '#15203A',
  card2: '#1A2647',
  border: '#243352',
  borderLight: '#2F3F66',
  emerald: '#00D4AA',
  emeraldDark: '#00A886',
  gold: '#F5A623',
  purple: '#A855F7',
  text: '#E8EDF5',
  textDim: '#A0AEC8',
  muted: '#6B7FA0',
  success: '#22C55E',
  rose: '#F43F5E',
  amber: '#F59E0B',
}

const VEHICLE_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string; color?: string }>> = {
  Bike, Truck, Car,
}

// ---------- Tipos ----------
interface CourierUser { name: string; email: string; phone?: string | null; city?: string | null }
interface Courier {
  id: string
  userId: string
  vehicleType: string
  vehicleModel?: string | null
  licensePlate?: string | null
  available: boolean
  rating: number
  zone?: string | null
  user: CourierUser
}
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
interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string | null
}

// ---------- Etiquetas ----------
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: C.amber,
  ASSIGNED: '#38BDF8',
  PICKED_UP: C.purple,
  IN_TRANSIT: C.gold,
  DELIVERED: C.emerald,
  FAILED: C.rose,
}

const TASK_TYPE_LABELS: Record<string, string> = {
  SOBRE: 'Sobre',
  EXPRESS: 'Express',
  MICRODISTRIBUCION: 'Microdist.',
}

const INCIDENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'DIRECCION_INCORRECTA', label: 'Dirección incorrecta' },
  { value: 'CLIENTE_AUSENTE', label: 'Cliente ausente' },
  { value: 'DAÑO', label: 'Daño' },
  { value: 'OTRO', label: 'Otro' },
]

// ---------- Utilidades ----------
function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ---------- Modal de firma ----------
function SignModal({
  open, onOpenChange, delivery, onSigned,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  delivery: Delivery | null
  onSigned: () => void
}) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useAppStore((s) => s.toast)

  useEffect(() => {
    if (open) setName('')
  }, [open, delivery?.id])

  const submit = async () => {
    if (!delivery || !name.trim()) {
      toast('Escribe el nombre de quien recibe', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign', signatureName: name.trim() }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Entrega confirmada ✅')
      onOpenChange(false)
      onSigned()
    } catch {
      toast('No se pudo confirmar la entrega', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: C.text }}>
            <Signature className="size-5" style={{ color: C.emerald }} />
            Firmar entrega
          </DialogTitle>
          <DialogDescription style={{ color: C.textDim }}>
            Confirma la entrega del pedido #{delivery?.order?.orderNumber || '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sign-name" style={{ color: C.textDim }}>Nombre de quien recibe</Label>
            <Input
              id="sign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: María Pérez (titular)"
              autoFocus
              style={{ backgroundColor: C.card2, borderColor: C.borderLight, color: C.text }}
            />
          </div>
          {delivery?.amountToCollect ? (
            <div
              className="rounded-lg p-3 text-sm flex items-center gap-2"
              style={{ backgroundColor: 'rgba(245,166,35,0.1)', border: `1px solid ${C.gold}`, color: C.gold }}
            >
              <DollarSign className="size-4" />
              Cobrar contra entrega: <strong>${delivery.amountToCollect.toFixed(2)}</strong>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving}
            style={{ backgroundColor: C.emerald, color: '#06231D' }}
          >
            {saving ? 'Confirmando...' : 'Confirmar entrega'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Modal de incidencia ----------
function IncidentModal({
  open, onOpenChange, delivery, onReported,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  delivery: Delivery | null
  onReported: () => void
}) {
  const [type, setType] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useAppStore((s) => s.toast)

  useEffect(() => {
    if (open) {
      setType('')
      setDesc('')
    }
  }, [open, delivery?.id])

  const submit = async () => {
    if (!delivery || !type) {
      toast('Selecciona el tipo de incidencia', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'incident', incidentType: type, incidentDesc: desc || undefined }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Incidencia reportada')
      onOpenChange(false)
      onReported()
    } catch {
      toast('No se pudo reportar la incidencia', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: C.text }}>
            <AlertTriangle className="size-5" style={{ color: C.rose }} />
            Reportar incidencia
          </DialogTitle>
          <DialogDescription style={{ color: C.textDim }}>
            Pedido #{delivery?.order?.orderNumber || '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="inc-type" style={{ color: C.textDim }}>Tipo de incidencia</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="inc-type" style={{ backgroundColor: C.card2, borderColor: C.borderLight, color: C.text }}>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inc-desc" style={{ color: C.textDim }}>Descripción (opcional)</Label>
            <Textarea
              id="inc-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Cuéntanos qué pasó..."
              rows={3}
              style={{ backgroundColor: C.card2, borderColor: C.borderLight, color: C.text }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={saving}
            style={{ backgroundColor: C.rose, color: '#FFFFFF' }}
          >
            {saving ? 'Guardando...' : 'Guardar incidencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- App principal ----------
export function CourierAppModule() {
  const { data: session, status } = useSession()
  const toast = useAppStore((s) => s.toast)
  const setModule = useAppStore((s) => s.setModule)

  const [courier, setCourier] = useState<Courier | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notCourier, setNotCourier] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [signDelivery, setSignDelivery] = useState<Delivery | null>(null)
  const [incidentDelivery, setIncidentDelivery] = useState<Delivery | null>(null)
  const [bellOpen, setBellOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const meRes = await fetch('/api/couriers/me')
      if (meRes.status === 401) {
        setNotCourier(true)
        setLoading(false)
        return
      }
      if (meRes.status === 404) {
        setNotCourier(true)
        setLoading(false)
        return
      }
      if (!meRes.ok) {
        setNotCourier(true)
        setLoading(false)
        return
      }
      const me: Courier = await meRes.json()
      setCourier(me)
      setNotCourier(false)

      const [dRes, nRes] = await Promise.all([
        fetch('/api/deliveries'),
        fetch('/api/notifications'),
      ])
      const allDeliveries: Delivery[] = dRes.ok ? await dRes.json() : []
      const mine = allDeliveries.filter((x) => x.courierId === me.id)
      setDeliveries(mine)
      if (nRes.ok) {
        const nd = await nRes.json()
        setNotifications(nd.notifications || [])
      }
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      setNotCourier(true)
      setLoading(false)
      return
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [status, load])

  const updateStatus = async (deliveryId: string, newStatus: string) => {
    setBusyId(deliveryId)
    try {
      const r = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', status: newStatus }),
      })
      if (!r.ok) throw new Error('request failed')
      toast(`Estado: ${STATUS_LABELS[newStatus] || newStatus}`)
      await load()
    } catch {
      toast('No se pudo actualizar el estado', 'error')
    } finally {
      setBusyId(null)
    }
  }

  // ---------- KPIs ----------
  const kpis = useMemo(() => {
    const pending = deliveries.filter(
      (d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT'
    ).length
    const completed = deliveries.filter((d) => d.status === 'DELIVERED').length
    const today = new Date()
    const deliveredToday = deliveries.filter((d) => {
      if (d.status !== 'DELIVERED') return false
      const ref = d.deliveredAt ? new Date(d.deliveredAt) : d.updatedAt ? new Date(d.updatedAt) : new Date(d.createdAt)
      return ref.getFullYear() === today.getFullYear() && ref.getMonth() === today.getMonth() && ref.getDate() === today.getDate()
    }).length
    const earnings = completed * 1 // $1 por entrega (flat)
    return { pending, completed, deliveredToday, earnings }
  }, [deliveries])

  // ---------- Listas ----------
  const pendingTasks = useMemo(
    () => deliveries
      .filter((d) => d.status === 'ASSIGNED' || d.status === 'PICKED_UP' || d.status === 'IN_TRANSIT')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [deliveries]
  )
  const history = useMemo(
    () => deliveries
      .filter((d) => d.status === 'DELIVERED' || d.status === 'FAILED')
      .sort((a, b) => {
        const da = new Date(a.deliveredAt || a.updatedAt || a.createdAt).getTime()
        const db = new Date(b.deliveredAt || b.updatedAt || b.createdAt).getTime()
        return db - da
      }),
    [deliveries]
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  // ---------- Estado del courier ----------
  const courierStatus = useMemo(() => {
    if (kpis.pending > 0) {
      return { label: 'En ruta', color: C.gold, dot: C.gold }
    }
    if (courier?.available) {
      return { label: 'Disponible', color: C.emerald, dot: C.emerald }
    }
    return { label: 'En alerta', color: C.rose, dot: C.rose }
  }, [kpis.pending, courier?.available])

  // ---------- Render ----------
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (notCourier || !courier) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: C.bg }}>
        <Card
          className="max-w-md w-full text-center"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
        >
          <CardContent className="p-8 space-y-4">
            <div
              className="mx-auto size-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(244,63,94,0.15)' }}
            >
              <LogIn className="size-7" style={{ color: C.rose }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: C.text }}>
              Esta app es solo para mensajeros
            </h2>
            <p className="text-sm" style={{ color: C.textDim }}>
              Inicia sesión con tu cuenta <strong>Courier</strong> para acceder a tus tareas de entrega.
            </p>
            <Button
              onClick={() => setModule('marketplace')}
              style={{ backgroundColor: C.emerald, color: '#06231D' }}
              className="w-full"
            >
              Volver al marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const iconName = courier.vehicleType === 'MOTORCYCLE' || courier.vehicleType === 'BICYCLE'
    ? 'Bike'
    : courier.vehicleType === 'TAXI'
    ? 'Car'
    : 'Truck'
  const VehicleIcon = VEHICLE_ICON_COMPONENTS[iconName] || Bike

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg, color: C.text }}>
      <div className="max-w-2xl mx-auto pb-16">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="size-9 rounded-lg flex items-center justify-center font-black text-lg"
              style={{ backgroundColor: C.emerald, color: '#06231D' }}
            >
              D
            </div>
            <div>
              <p className="text-sm font-bold leading-none" style={{ color: C.text }}>
                App <span style={{ color: C.emerald }}>Delta</span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>
                {courier.user.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: `${courierStatus.color}22`, color: courierStatus.color }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: courierStatus.dot }} />
              {courierStatus.label}
            </div>
            <Popover open={bellOpen} onOpenChange={setBellOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  style={{ color: C.textDim }}
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 size-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: C.rose, color: '#FFFFFF' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0"
                align="end"
                style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
              >
                <div
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: C.textDim, borderBottom: `1px solid ${C.border}` }}
                >
                  Notificaciones
                </div>
                <ScrollArea className="h-72">
                  {notifications.length === 0 ? (
                    <p className="text-center text-sm py-8" style={{ color: C.muted }}>
                      Sin notificaciones
                    </p>
                  ) : (
                    <div className="divide-y" style={{ borderColor: C.border }}>
                      {notifications.slice(0, 20).map((n) => (
                        <div key={n.id} className="p-3" style={{ borderColor: C.border }}>
                          <p className="text-sm font-medium" style={{ color: C.text }}>{n.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.textDim }}>{n.message}</p>
                          <p className="text-[10px] mt-1" style={{ color: C.muted }}>{fmtRelative(n.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <div className="px-4 py-4 space-y-4">
          {/* Profile card */}
          <Card style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="size-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${C.emerald}22` }}
                >
                  <VehicleIcon className="size-6" color={C.emerald} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: C.text }}>{courier.user.name}</p>
                  <p className="text-xs" style={{ color: C.textDim }}>
                    {VEHICLE_LABELS[courier.vehicleType] || courier.vehicleType}
                    {courier.licensePlate ? ` · ${courier.licensePlate}` : ''}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {courier.zone && (
                      <span className="text-[11px] flex items-center gap-0.5" style={{ color: C.muted }}>
                        <MapPin className="size-3" /> {courier.zone}
                      </span>
                    )}
                    <span className="text-[11px] flex items-center gap-0.5 ml-1" style={{ color: C.gold }}>
                      <Star className="size-3 fill-current" /> {courier.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <KpiBox label="Pendientes" value={kpis.pending} color={C.gold} icon={Clock} />
                <KpiBox label="Realizados" value={kpis.completed} color={C.emerald} icon={CheckCircle2} />
                <KpiBox label="Hoy" value={kpis.deliveredToday} color={C.purple} icon={Package} />
                <KpiBox label="Ganancia" value={`$${kpis.earnings}`} color={C.amber} icon={DollarSign} />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="w-full">
            <TabsList
              className="grid grid-cols-2 w-full"
              style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
            >
              <TabsTrigger
                value="pending"
                className="data-[state=active]:text-white"
                style={{ color: C.textDim }}
              >
                Tareas Pendientes ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:text-white"
                style={{ color: C.textDim }}
              >
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-3">
              {pendingTasks.length === 0 ? (
                <Card style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <CardContent className="p-8 text-center space-y-3">
                    <div
                      className="mx-auto size-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${C.emerald}22` }}
                    >
                      <CheckCircle2 className="size-7" color={C.emerald} />
                    </div>
                    <p className="font-semibold" style={{ color: C.text }}>¡Excelente! No tienes tareas pendientes.</p>
                    <p className="text-sm" style={{ color: C.textDim }}>
                      Cuando el administrador te asigne un sobre, aparecerá aquí.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingTasks.map((d) => (
                  <Card key={d.id} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold" style={{ color: C.emerald }}>
                          #{d.order?.orderNumber || '—'}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold border-0"
                          style={{
                            backgroundColor: `${STATUS_COLORS[d.status]}22`,
                            color: STATUS_COLORS[d.status],
                          }}
                        >
                          {STATUS_LABELS[d.status] || d.status}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: C.muted }}>Tipo</span>
                          <span className="font-medium" style={{ color: C.text }}>
                            {TASK_TYPE_LABELS[d.taskType || 'SOBRE'] || 'Sobre'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: C.muted }}>Cliente</span>
                          <span className="font-medium truncate max-w-[200px]" style={{ color: C.text }}>
                            {d.order?.user?.name || 'Cliente'}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin className="size-3.5 shrink-0 mt-0.5" color={C.muted} />
                          <span className="text-xs flex-1" style={{ color: C.textDim }}>
                            {d.deliveryAddress || d.order?.city || 'Dirección pendiente'}
                          </span>
                        </div>
                        {d.amountToCollect > 0 && (
                          <div
                            className="flex items-center justify-between rounded-md px-2 py-1 mt-1"
                            style={{ backgroundColor: `${C.gold}22` }}
                          >
                            <span className="text-xs flex items-center gap-1" style={{ color: C.gold }}>
                              <DollarSign className="size-3" /> A cobrar
                            </span>
                            <span className="text-sm font-bold" style={{ color: C.gold }}>
                              ${d.amountToCollect.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {d.status === 'ASSIGNED' && (
                          <ActionButton
                            label="Iniciar"
                            icon={PlayCircle}
                            color={C.emerald}
                            onClick={() => updateStatus(d.id, 'PICKED_UP')}
                            disabled={busyId === d.id}
                            full
                          />
                        )}
                        {d.status === 'PICKED_UP' && (
                          <ActionButton
                            label="En camino"
                            icon={Navigation}
                            color={C.gold}
                            onClick={() => updateStatus(d.id, 'IN_TRANSIT')}
                            disabled={busyId === d.id}
                            full
                          />
                        )}
                        {d.status === 'IN_TRANSIT' && (
                          <ActionButton
                            label="Entregar"
                            icon={Signature}
                            color={C.emerald}
                            onClick={() => setSignDelivery(d)}
                            disabled={busyId === d.id}
                          />
                        )}
                        <ActionButton
                          label="Incidencia"
                          icon={AlertCircle}
                          color={C.rose}
                          variant="outline"
                          onClick={() => setIncidentDelivery(d)}
                          disabled={busyId === d.id}
                          full={d.status !== 'IN_TRANSIT'}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-3">
              {history.length === 0 ? (
                <Card style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <CardContent className="p-8 text-center" style={{ color: C.muted }}>
                    <Route className="size-10 mx-auto mb-2 opacity-30" />
                    Aún no tienes entregas en el historial.
                  </CardContent>
                </Card>
              ) : (
                history.map((d) => (
                  <Card key={d.id} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="size-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor:
                              d.status === 'DELIVERED' ? `${C.emerald}22` : `${C.rose}22`,
                          }}
                        >
                          {d.status === 'DELIVERED' ? (
                            <CheckCircle2 className="size-4" color={C.emerald} />
                          ) : (
                            <AlertTriangle className="size-4" color={C.rose} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: C.text }}>
                            #{d.order?.orderNumber || '—'} · {d.order?.user?.name || 'Cliente'}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: C.muted }}>
                            {d.signatureName && `Firmado: ${d.signatureName} · `}
                            {d.incidentType && `Incidencia · `}
                            {fmtDate(d.deliveredAt || d.updatedAt || d.createdAt)}
                          </p>
                          {d.status === 'DELIVERED' && (
                            <p className="text-[11px] font-semibold mt-0.5" style={{ color: C.emerald }}>
                              + $1.00 ganado
                            </p>
                          )}
                          {d.incidentType && (
                            <p className="text-[11px] mt-0.5" style={{ color: C.rose }}>
                              {INCIDENT_OPTIONS.find((o) => o.value === d.incidentType)?.label || d.incidentType}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-0 shrink-0"
                        style={{
                          backgroundColor: `${STATUS_COLORS[d.status]}22`,
                          color: STATUS_COLORS[d.status],
                        }}
                      >
                        {STATUS_LABELS[d.status]}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Footer info */}
          <div className="pt-4 text-center">
            <button
              onClick={() => setModule('marketplace')}
              className="text-xs inline-flex items-center gap-1 hover:underline"
              style={{ color: C.muted }}
            >
              Volver al marketplace
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SignModal
        open={!!signDelivery}
        onOpenChange={(v) => !v && setSignDelivery(null)}
        delivery={signDelivery}
        onSigned={load}
      />
      <IncidentModal
        open={!!incidentDelivery}
        onOpenChange={(v) => !v && setIncidentDelivery(null)}
        delivery={incidentDelivery}
        onReported={load}
      />
    </div>
  )
}

// ---------- KPI box (dark) ----------
function KpiBox({
  label, value, color, icon: Icon,
}: {
  label: string
  value: string | number
  color: string
  icon: React.ComponentType<{ className?: string; color?: string }>
}) {
  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{ backgroundColor: C.card2, border: `1px solid ${C.border}` }}
    >
      <Icon className="size-3.5 mx-auto mb-1" color={color} />
      <p className="text-base font-bold leading-none" style={{ color: C.text }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: C.muted }}>{label}</p>
    </div>
  )
}

// ---------- Action button (dark) ----------
function ActionButton({
  label, icon: Icon, color, onClick, disabled, variant, full,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  onClick: () => void
  disabled?: boolean
  variant?: 'outline' | 'solid'
  full?: boolean
}) {
  const isOutline = variant === 'outline'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${full ? 'col-span-2' : ''}`}
      style={
        isOutline
          ? { backgroundColor: 'transparent', border: `1px solid ${color}66`, color }
          : { backgroundColor: color, color: '#06231D' }
      }
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  )
}
