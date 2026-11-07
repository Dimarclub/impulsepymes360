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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Hotel, Car, Mountain, Wrench, Plus, RefreshCw, Loader2, Edit3, Trash2, CalendarDays,
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Bed, Hash, Mail, Phone,
  CheckCircle2, XCircle, Clock, X, QrCode, Search, Star, DollarSign, TrendingUp,
  CalendarCheck2, CalendarClock, ArrowRight, Ban, UserX, ScanLine, Eye, Percent,
  LayoutGrid, CalendarRange,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- Constantes ----------
const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ROOM_TYPES = [
  { value: 'HOTEL_ROOM', label: 'Hotel', Icon: Hotel },
  { value: 'CAR', label: 'Auto', Icon: Car },
  { value: 'TOUR', label: 'Tour', Icon: Mountain },
  { value: 'EQUIPMENT', label: 'Equipamiento', Icon: Wrench },
] as const

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No show',
  REJECTED: 'Rechazada',
}

const STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  CHECKED_IN: 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700',
  CHECKED_OUT: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700',
  NO_SHOW: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
  REJECTED: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  CHECKED_IN: CalendarCheck2,
  CHECKED_OUT: CheckCircle2,
  CANCELLED: Ban,
  NO_SHOW: UserX,
  REJECTED: XCircle,
}

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: 'Sin pagar',
  DEPOSIT: 'Depósito',
  PAID: 'Pagado',
  REFUNDED: 'Reembolsado',
}

const PAYMENT_BADGES: Record<string, string> = {
  UNPAID: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200',
  DEPOSIT: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200',
  REFUNDED: 'bg-muted text-muted-foreground border-border',
}

const FILTER_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'REJECTED']

// ---------- Helpers ----------
const fmtUsd = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0)

const fmtDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const toDateInputValue = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

const todayDateInput = () => toDateInputValue(new Date())

function startOfUTCDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const qrUrl = (code: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(code)}`

const typeMeta = (t: string) => ROOM_TYPES.find((r) => r.value === t) || ROOM_TYPES[0]

const parseAmenities = (raw: any): string[] => {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const p = JSON.parse(String(raw))
    return Array.isArray(p) ? p : []
  } catch {
    return String(raw).split(',').map((s) => s.trim()).filter(Boolean)
  }
}

const serializeAmenities = (arr: string[]) => JSON.stringify(arr)

// ---------- Tipos ----------
interface Room {
  id: string
  name: string
  type: string
  description?: string | null
  capacity: number
  pricePerNight: number
  quantity: number
  amenities?: string | null
  imageUrl?: string | null
  address?: string | null
  city?: string | null
  isActive: boolean
  createdAt: string
  _count?: { bookings: number; availability: number }
}

interface AvailabilityDay {
  date: string
  available: number
}

interface BookingRoom {
  id: string
  name: string
  type: string
  imageUrl?: string | null
  city?: string | null
}

interface BookingUser {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface Booking {
  id: string
  bookingCode: string
  roomId: string
  supplierId: string
  userId?: string | null
  guestName: string
  guestEmail: string
  guestPhone: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  quantity: number
  unitPrice: number
  subtotal: number
  serviceFee: number
  total: number
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  qrCode?: string | null
  notes?: string | null
  confirmedAt?: string | null
  cancelledAt?: string | null
  checkedInAt?: string | null
  checkedOutAt?: string | null
  createdAt: string
  room?: BookingRoom
  user?: BookingUser | null
}

interface MineStats {
  totalRooms: number
  totalBookings: number
  monthRevenue: number
  avgOccupation: number
}

interface BookingsStats {
  pending: number
  confirmed: number
  checkedIn: number
  checkedOut: number
  cancelled: number
  revenue: number
}

// ---------- Componente principal ----------
export function ReservasAdminModule() {
  const [tab, setTab] = useState<'rooms' | 'bookings' | 'calendar'>('rooms')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="size-7 text-primary" /> Gestión de Reservas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Administra tus recursos, reservas recibidas y calendario de ocupación.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'rooms' | 'bookings' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="rooms">
            <LayoutGrid className="size-4 mr-1.5" /> <span className="hidden sm:inline">Mis Recursos</span>
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <CalendarCheck2 className="size-4 mr-1.5" /> <span className="hidden sm:inline">Reservas Recibidas</span>
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarRange className="size-4 mr-1.5" /> <span className="hidden sm:inline">Calendario</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rooms" className="mt-4"><RoomsTab /></TabsContent>
        <TabsContent value="bookings" className="mt-4"><BookingsTab /></TabsContent>
        <TabsContent value="calendar" className="mt-4"><CalendarTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Tab 1: Mis Recursos ----------
function RoomsTab() {
  const toast = useAppStore((s) => s.toast)
  const [rooms, setRooms] = useState<Room[]>([])
  const [stats, setStats] = useState<MineStats>({ totalRooms: 0, totalBookings: 0, monthRevenue: 0, avgOccupation: 0 })
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [availRoom, setAvailRoom] = useState<Room | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)

  const fetchRooms = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reservas/mine')
      const d = await res.json()
      if (res.ok) {
        setRooms(d.rooms || [])
        setStats(d.stats || { totalRooms: 0, totalBookings: 0, monthRevenue: 0, avgOccupation: 0 })
      }
    } catch {
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/reservas/${deleteTarget.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (res.ok) {
        toast('Recurso eliminado', 'success')
        setDeleteTarget(null)
        fetchRooms()
      } else {
        toast(d.error || 'Error al eliminar', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    }
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={LayoutGrid} label="Total recursos" value={String(stats.totalRooms)} color="text-primary" iconColor="bg-primary/10 text-primary" />
        <StatCard icon={CalendarCheck2} label="Total reservas" value={String(stats.totalBookings)} color="text-amber-700 dark:text-amber-300" iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200" />
        <StatCard icon={DollarSign} label="Ingresos del mes" value={fmtUsd(stats.monthRevenue)} color="text-emerald-700 dark:text-emerald-300" iconColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" />
        <StatCard icon={Percent} label="Ocupación promedio" value={`${stats.avgOccupation}%`} color="text-cyan-700 dark:text-cyan-300" iconColor="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Cargando…' : `${rooms.length} recurso(s)`}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchRooms}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} /> Actualizar
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4 mr-1.5" /> Nuevo recurso
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-32 w-full rounded-b-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <LayoutGrid className="size-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium text-foreground mb-1">No tienes recursos</p>
            <p className="text-sm text-muted-foreground mb-4">Crea tu primer recurso de reserva (hotel, auto, tour o equipo).</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4 mr-1.5" /> Crear recurso
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomAdminCard
              key={room.id}
              room={room}
              onEdit={() => setEditing(room)}
              onAvailability={() => setAvailRoom(room)}
              onDelete={() => setDeleteTarget(room)}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <RoomFormDialog onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); fetchRooms() }} />
      )}
      {editing && (
        <RoomFormDialog room={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); fetchRooms() }} />
      )}
      {availRoom && (
        <AvailabilityDialog room={availRoom} onClose={() => setAvailRoom(null)} />
      )}
      {deleteTarget && (
        <ConfirmDeleteDialog room={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, color, iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
  iconColor: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('size-10 rounded-lg flex items-center justify-center shrink-0', iconColor)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn('font-bold text-lg truncate', color)}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function RoomAdminCard({
  room, onEdit, onAvailability, onDelete,
}: {
  room: Room
  onEdit: () => void
  onAvailability: () => void
  onDelete: () => void
}) {
  const meta = typeMeta(room.type)
  const Icon = meta.Icon
  const amenities = parseAmenities(room.amenities).slice(0, 3)

  return (
    <Card className="overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <div className="relative h-32 bg-muted overflow-hidden">
        {room.imageUrl ? (
          <img src={room.imageUrl} alt={room.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-amber-50 to-primary/5 dark:from-primary/10 dark:via-amber-950/20 dark:to-primary/5">
            <Icon className="size-10 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge className="bg-primary/90 text-primary-foreground border-0 gap-1">
            <Icon className="size-3" /> {meta.label}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className={cn('gap-1', room.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-muted text-muted-foreground')}>
            <span className={cn('size-1.5 rounded-full', room.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')} />
            {room.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col gap-2">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{room.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="size-3" /> {room.city || 'Sin ciudad'}
          </p>
        </div>

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.map((a) => (
              <span key={a} className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px]">{a}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="size-3" /> Cap. {room.capacity}</span>
          <span className="flex items-center gap-1"><Bed className="size-3" /> {room.quantity} unid.</span>
          <span className="flex items-center gap-1"><Hash className="size-3" /> {room._count?.bookings || 0} res.</span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-[10px] text-muted-foreground">Precio/noche</p>
            <p className="text-lg font-bold text-primary">{fmtUsd(room.pricePerNight)}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-1">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8">
            <Edit3 className="size-3.5 mr-1" /> Editar
          </Button>
          <Button variant="outline" size="sm" onClick={onAvailability} className="h-8">
            <Calendar className="size-3.5 mr-1" /> Disp.
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="h-8 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30">
            <Trash2 className="size-3.5 mr-1" /> Borrar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Form Dialog (Crear/Editar) ----------
function RoomFormDialog({
  room, onClose, onSaved,
}: {
  room?: Room
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [form, setForm] = useState({
    name: room?.name || '',
    type: room?.type || 'HOTEL_ROOM',
    description: room?.description || '',
    capacity: String(room?.capacity || 2),
    pricePerNight: String(room?.pricePerNight || 0),
    quantity: String(room?.quantity || 1),
    imageUrl: room?.imageUrl || '',
    address: room?.address || '',
    city: room?.city || '',
    isActive: room?.isActive ?? true,
  })
  const [amenityInput, setAmenityInput] = useState('')
  const [amenities, setAmenities] = useState<string[]>(room ? parseAmenities(room.amenities) : [])
  const [saving, setSaving] = useState(false)

  const isEdit = !!room

  const addAmenity = () => {
    const v = amenityInput.trim()
    if (v && !amenities.includes(v)) {
      setAmenities((a) => [...a, v])
      setAmenityInput('')
    }
  }

  const submit = async () => {
    if (!form.name.trim()) { toast('Nombre requerido', 'warning'); return }
    const cap = parseInt(form.capacity, 10)
    const price = parseFloat(form.pricePerNight)
    const qty = parseInt(form.quantity, 10)
    if (isNaN(cap) || cap < 1) { toast('Capacidad inválida', 'warning'); return }
    if (isNaN(price) || price < 0) { toast('Precio inválido', 'warning'); return }
    if (isNaN(qty) || qty < 1) { toast('Cantidad inválida', 'warning'); return }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
        capacity: cap,
        pricePerNight: price,
        quantity: qty,
        amenities: serializeAmenities(amenities),
        imageUrl: form.imageUrl.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        isActive: form.isActive,
      }
      const url = isEdit ? `/api/reservas/${room!.id}` : '/api/reservas'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (res.ok) {
        toast(isEdit ? 'Recurso actualizado' : 'Recurso creado + disponibilidad 90 días', 'success')
        onSaved()
      } else {
        toast(d.error || 'Error al guardar', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <><Edit3 className="size-5 text-primary" /> Editar recurso</> : <><Plus className="size-5 text-primary" /> Nuevo recurso</>}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Actualiza los campos del recurso.' : 'Crea un nuevo recurso e inicializa su disponibilidad para 90 días.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ej: Habitación Doble" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-1.5"><t.Icon className="size-3.5" /> {t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Detalles del recurso…" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Capacidad</Label>
              <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Precio/noche</Label>
              <Input type="number" min={0} step="0.01" value={form.pricePerNight} onChange={(e) => setForm((f) => ({ ...f, pricePerNight: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cantidad</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Comodidades</Label>
            <div className="flex gap-2">
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                placeholder="Ej: WiFi, A/C, Desayuno"
              />
              <Button type="button" variant="outline" onClick={addAmenity}><Plus className="size-4" /></Button>
            </div>
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {amenities.map((a) => (
                  <span key={a} className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                    {a}
                    <button onClick={() => setAmenities((arr) => arr.filter((x) => x !== a))} className="hover:text-rose-600">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">URL de imagen</Label>
            <Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Dirección</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ciudad</Label>
              <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Recurso activo</Label>
              <p className="text-xs text-muted-foreground">Si está inactivo, no aparece en búsquedas.</p>
            </div>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Guardando…</> : <><CheckCircle2 className="size-4 mr-1.5" /> {isEdit ? 'Guardar cambios' : 'Crear recurso'}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDeleteDialog({
  room, onCancel, onConfirm,
}: {
  room: Room
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <Trash2 className="size-5" /> Eliminar recurso
          </DialogTitle>
          <DialogDescription>Esta acción no se puede deshacer. Las reservas existentes se conservarán pero sin recurso asociado.</DialogDescription>
        </DialogHeader>
        <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
          <p className="font-medium">{room.name}</p>
          <p className="text-xs text-muted-foreground">{typeMeta(room.type).label} · {room.city || '—'}</p>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Cerrar</Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="size-4 mr-1" /> Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Availability Dialog (calendario mensual) ----------
function AvailabilityDialog({ room, onClose }: { room: Room; onClose: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [days, setDays] = useState<AvailabilityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [blockOpen, setBlockOpen] = useState(false)

  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    try {
      const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
      const res = await fetch(`/api/reservas/${room.id}/availability?from=${from.toISOString()}&to=${to.toISOString()}`)
      const d = await res.json()
      if (res.ok) setDays(d.days || [])
    } catch {
      setDays([])
    } finally {
      setLoading(false)
    }
  }, [room.id, cursor])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const dayMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of days) m.set(d.date.slice(0, 10), d.available)
    return m
  }, [days])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let firstWeekday = firstDay.getDay() - 1
  if (firstWeekday < 0) firstWeekday = 6
  const daysInMonth = lastDay.getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const colorForAvail = (avail: number) => {
    if (avail === 0) return 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
    if (avail >= room.quantity) return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
    return 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" /> Disponibilidad · {room.name}
          </DialogTitle>
          <DialogDescription>
            Capacidad total: {room.quantity}. Haz clic en un día para ajustar cupos manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}>Hoy</Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Siguiente">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBlockOpen(true)} className="border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-300">
              <Ban className="size-4 mr-1" /> Bloquear rango
            </Button>
          </div>
        </div>

        <p className="text-sm font-semibold text-primary">{MONTH_NAMES[month]} {year}</p>

        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square rounded-md bg-muted/20" />
              const isoKey = toDateInputValue(date)
              const avail = dayMap.get(isoKey) ?? room.quantity
              const isToday = isSameDay(date, today)
              const isPast = date < today
              return (
                <button
                  key={isoKey}
                  disabled={isPast}
                  onClick={() => setEditingDate(isoKey)}
                  className={cn(
                    'aspect-square rounded-md border p-1 flex flex-col items-center justify-center transition-all text-xs',
                    isPast ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary hover:scale-105 cursor-pointer',
                    isToday ? 'ring-2 ring-primary' : '',
                    colorForAvail(avail)
                  )}
                >
                  <span className="font-semibold leading-none">{date.getDate()}</span>
                  <span className="text-[10px] mt-0.5">{avail}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-emerald-200 dark:bg-emerald-900/60" /> Completo</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-amber-200 dark:bg-amber-900/60" /> Parcial</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded bg-rose-200 dark:bg-rose-900/60" /> Sin cupo</span>
        </div>

        {editingDate && (
          <EditDayDialog
            room={room}
            date={editingDate}
            currentAvail={dayMap.get(editingDate) ?? room.quantity}
            onClose={() => setEditingDate(null)}
            onSaved={() => { setEditingDate(null); fetchAvailability() }}
          />
        )}
        {blockOpen && (
          <BlockRangeDialog
            room={room}
            onClose={() => setBlockOpen(false)}
            onSaved={() => { setBlockOpen(false); fetchAvailability(); toast('Rango bloqueado', 'success') }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditDayDialog({
  room, date, currentAvail, onClose, onSaved,
}: {
  room: Room
  date: string
  currentAvail: number
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [value, setValue] = useState(String(currentAvail))
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const v = parseInt(value, 10)
    if (isNaN(v) || v < 0) { toast('Valor inválido', 'warning'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/reservas/${room.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, available: v }),
      })
      const d = await res.json()
      if (res.ok) { toast('Cupo actualizado', 'success'); onSaved() }
      else toast(d.error || 'Error', 'error')
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose() }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Cupo para {fmtDate(date)}</DialogTitle>
          <DialogDescription>Máximo: {room.quantity} unidades.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Disponibles</Label>
          <Input type="number" min={0} max={room.quantity} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <CheckCircle2 className="size-4 mr-1" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BlockRangeDialog({
  room, onClose, onSaved,
}: {
  room: Room
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [from, setFrom] = useState(todayDateInput())
  const [to, setTo] = useState(todayDateInput())
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!from || !to) { toast('Selecciona ambas fechas', 'warning'); return }
    if (new Date(to) < new Date(from)) { toast('Rango inválido', 'warning'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/reservas/${room.id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range: { from, to }, available: 0 }),
      })
      const d = await res.json()
      if (res.ok) onSaved()
      else toast(d.error || 'Error', 'error')
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !saving) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <Ban className="size-5" /> Bloquear rango
          </DialogTitle>
          <DialogDescription>Pone cupos en 0 para todos los días del rango.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Desde</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hasta</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="destructive" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Ban className="size-4 mr-1" />} Bloquear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Tab 2: Reservas Recibidas ----------
function BookingsTab() {
  const toast = useAppStore((s) => s.toast)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [stats, setStats] = useState<BookingsStats>({ pending: 0, confirmed: 0, checkedIn: 0, checkedOut: 0, cancelled: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null)
  const [scanOpen, setScanOpen] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const url = statusFilter !== 'ALL' ? `/api/reservas/supplier-bookings?status=${statusFilter}` : '/api/reservas/supplier-bookings'
      const res = await fetch(url)
      const d = await res.json()
      if (res.ok) {
        setBookings(d.bookings || [])
        setStats(d.stats || { pending: 0, confirmed: 0, checkedIn: 0, checkedOut: 0, cancelled: 0, revenue: 0 })
      }
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const filtered = useMemo(() => {
    if (!search.trim()) return bookings
    const q = search.toLowerCase().trim()
    return bookings.filter((b) =>
      b.bookingCode.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.guestEmail.toLowerCase().includes(q) ||
      b.room?.name?.toLowerCase().includes(q)
    )
  }, [bookings, search])

  const refreshDetail = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/reservas/bookings/${bookingId}`)
      const d = await res.json()
      if (res.ok) setDetailBooking(d.booking)
    } catch {}
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Pendientes" value={String(stats.pending)} color="text-amber-700 dark:text-amber-300" iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200" />
        <StatCard icon={CheckCircle2} label="Confirmadas" value={String(stats.confirmed)} color="text-emerald-700 dark:text-emerald-300" iconColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" />
        <StatCard icon={CalendarCheck2} label="En check-in" value={String(stats.checkedIn)} color="text-cyan-700 dark:text-cyan-300" iconColor="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200" />
        <StatCard icon={DollarSign} label="Ingresos" value={fmtUsd(stats.revenue)} color="text-primary" iconColor="bg-primary/10 text-primary" />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1">
              <Button variant={statusFilter === 'ALL' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('ALL')} className={statusFilter === 'ALL' ? 'bg-primary text-primary-foreground' : ''}>
                Todas ({stats.pending + stats.confirmed + stats.checkedIn + stats.checkedOut + stats.cancelled})
              </Button>
              {FILTER_STATUSES.map((s) => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className={statusFilter === s ? 'bg-primary text-primary-foreground' : ''}>
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código/huésped…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-full md:w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setScanOpen(true)} className="border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">
                <ScanLine className="size-4 mr-1" /> Escanear QR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      {loading ? (
        <Card><CardContent className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <CalendarCheck2 className="size-10 mx-auto mb-2 text-muted-foreground/30" />
          <p className="font-medium">No hay reservas con estos filtros</p>
          <p className="text-sm text-muted-foreground">Prueba cambiar el filtro de estado o la búsqueda.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Huésped</TableHead>
                    <TableHead className="text-xs">Recurso</TableHead>
                    <TableHead className="text-xs">Fechas</TableHead>
                    <TableHead className="text-xs text-center">Noches</TableHead>
                    <TableHead className="text-xs text-center">Unid.</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Pago</TableHead>
                    <TableHead className="text-xs text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => {
                    const meta = b.room ? typeMeta(b.room.type) : typeMeta('HOTEL_ROOM')
                    const StatusIcon = STATUS_ICONS[b.status] || Clock
                    return (
                      <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailBooking(b)}>
                        <TableCell className="font-mono text-xs">{b.bookingCode}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{b.guestName}</div>
                          <div className="text-[10px] text-muted-foreground">{b.guestEmail}</div>
                          <div className="text-[10px] text-muted-foreground">{b.guestPhone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <meta.Icon className="size-3.5 text-primary" />
                            <div>
                              <div className="text-sm line-clamp-1 max-w-[160px]">{b.room?.name || '—'}</div>
                              <div className="text-[10px] text-muted-foreground">{b.room?.city || ''}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{fmtDate(b.checkIn)}</div>
                          <div className="text-muted-foreground">→ {fmtDate(b.checkOut)}</div>
                        </TableCell>
                        <TableCell className="text-center text-xs">{b.nights}</TableCell>
                        <TableCell className="text-center text-xs">{b.quantity}</TableCell>
                        <TableCell className="text-right font-bold text-primary text-sm">{fmtUsd(b.total)}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGES[b.status]}>
                            <StatusIcon className="size-3 mr-1" /> {STATUS_LABELS[b.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={PAYMENT_BADGES[b.paymentStatus] || ''}>
                            {PAYMENT_LABELS[b.paymentStatus] || b.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDetailBooking(b) }}>
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {detailBooking && (
        <BookingDetailDialog
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onUpdated={() => { refreshDetail(detailBooking.id); fetchBookings() }}
        />
      )}

      {scanOpen && (
        <ScanDialog onClose={() => setScanOpen(false)} onScan={() => { setScanOpen(false); fetchBookings() }} />
      )}
    </div>
  )
}

function BookingDetailDialog({
  booking, onClose, onUpdated,
}: {
  booking: Booking
  onClose: () => void
  onUpdated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [acting, setActing] = useState(false)

  const patch = async (status: string, paymentStatus?: string) => {
    setActing(true)
    try {
      const res = await fetch(`/api/reservas/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentStatus }),
      })
      const d = await res.json()
      if (res.ok) {
        toast(`Estado actualizado: ${STATUS_LABELS[status]}`, 'success')
        onUpdated()
      } else {
        toast(d.error || 'Error', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setActing(false)
    }
  }

  const meta = booking.room ? typeMeta(booking.room.type) : typeMeta('HOTEL_ROOM')
  const StatusIcon = STATUS_ICONS[booking.status] || Clock

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !acting) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck2 className="size-5 text-primary" /> Reserva {booking.bookingCode}
          </DialogTitle>
          <DialogDescription>Creada el {fmtDate(booking.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recurso</p>
              <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-2">
                <meta.Icon className="size-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{booking.room?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{booking.room?.city || ''} · {meta.label}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{fmtDate(booking.checkIn)}</p></div>
              <div><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{fmtDate(booking.checkOut)}</p></div>
              <div><p className="text-xs text-muted-foreground">Noches</p><p className="font-medium">{booking.nights}</p></div>
              <div><p className="text-xs text-muted-foreground">Unidades</p><p className="font-medium">{booking.quantity}</p></div>
              <div><p className="text-xs text-muted-foreground">Huéspedes</p><p className="font-medium">{booking.guests}</p></div>
              <div><p className="text-xs text-muted-foreground">Pago</p><p className="font-medium">{PAYMENT_LABELS[booking.paymentStatus]}</p></div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Huésped</p>
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                <p className="font-medium flex items-center gap-1.5"><Users className="size-3.5" /> {booking.guestName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="size-3" /> {booking.guestEmail}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="size-3" /> {booking.guestPhone}</p>
                {booking.user && (
                  <p className="text-xs text-muted-foreground">Usuario: {booking.user.name}</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estado actual</p>
              <Badge className={STATUS_BADGES[booking.status]}>
                <StatusIcon className="size-3 mr-1" /> {STATUS_LABELS[booking.status]}
              </Badge>
            </div>
            {booking.qrCode && (
              <div className="flex items-center gap-3">
                <img src={qrUrl(booking.qrCode)} alt="QR" className="size-16 rounded border" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-mono">{booking.qrCode}</p>
                  <p>Usa el escáner para check-in/out</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtUsd(booking.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cargo servicio</span><span>{fmtUsd(booking.serviceFee)}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="font-semibold">Total</span><span className="font-bold text-primary text-base">{fmtUsd(booking.total)}</span></div>
        </div>

        {booking.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notas</p>
            <p className="text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">{booking.notes}</p>
          </div>
        )}

        {/* Acciones rápidas */}
        <Separator />
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Acciones rápidas</p>
          <div className="flex flex-wrap gap-2">
            {booking.status === 'PENDING' && (
              <>
                <Button size="sm" onClick={() => patch('CONFIRMED')} disabled={acting} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <CheckCircle2 className="size-4 mr-1" /> Confirmar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => patch('REJECTED')} disabled={acting}>
                  <XCircle className="size-4 mr-1" /> Rechazar
                </Button>
              </>
            )}
            {booking.status === 'CONFIRMED' && (
              <>
                <Button size="sm" onClick={() => patch('CHECKED_IN')} disabled={acting} className="bg-cyan-600 text-white hover:bg-cyan-700">
                  <CalendarCheck2 className="size-4 mr-1" /> Check-in
                </Button>
                <Button size="sm" variant="outline" onClick={() => patch('CANCELLED')} disabled={acting}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300">
                  <Ban className="size-4 mr-1" /> Cancelar
                </Button>
              </>
            )}
            {booking.status === 'CHECKED_IN' && (
              <Button size="sm" variant="outline" onClick={() => patch('CHECKED_OUT')} disabled={acting}>
                <CheckCircle2 className="size-4 mr-1" /> Check-out
              </Button>
            )}
            {booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN' ? (
              <Button size="sm" variant="destructive" onClick={() => patch('NO_SHOW')} disabled={acting}>
                <UserX className="size-4 mr-1" /> No-show
              </Button>
            ) : null}
            {booking.paymentStatus === 'UNPAID' && (
              <Button size="sm" variant="outline" onClick={() => patch(booking.status, 'PAID')} disabled={acting}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300">
                <DollarSign className="size-4 mr-1" /> Marcar pagado
              </Button>
            )}
            {(booking.status === 'CANCELLED' || booking.status === 'CHECKED_OUT' || booking.status === 'NO_SHOW' || booking.status === 'REJECTED') && (
              <p className="text-xs text-muted-foreground w-full">Reserva cerrada — sin más acciones disponibles.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={acting}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScanDialog({ onClose, onScan }: { onClose: () => void; onScan: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const [code, setCode] = useState('')
  const [result, setResult] = useState<{ action: string; booking: Booking } | null>(null)
  const [scanning, setScanning] = useState(false)

  const submit = async () => {
    if (!code.trim()) { toast('Ingresa el código QR', 'warning'); return }
    setScanning(true)
    setResult(null)
    try {
      const res = await fetch('/api/reservas/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: code.trim() }),
      })
      const d = await res.json()
      if (res.ok) {
        setResult({ action: d.action, booking: d.booking })
        toast(`Acción: ${d.action === 'CHECKED_IN' ? 'Check-in' : 'Check-out'}`, 'success')
        onScan()
      } else {
        toast(d.error || 'QR no encontrado', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setScanning(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !scanning) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-primary" /> Escanear QR
          </DialogTitle>
          <DialogDescription>Ingresa el código QR del cliente para hacer check-in o check-out.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">Código QR</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            placeholder="Ej: AB12CD34"
            className="font-mono"
            autoFocus
          />
        </div>

        {result && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-1">
            <Badge className="bg-emerald-600 text-white">
              {result.action === 'CHECKED_IN' ? 'Check-in realizado' : 'Check-out realizado'}
            </Badge>
            <p className="font-mono text-xs">{result.booking.bookingCode}</p>
            <p className="text-sm font-medium">{result.booking.guestName}</p>
            <p className="text-xs text-muted-foreground">{result.booking.room?.name}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={scanning}>Cerrar</Button>
          <Button onClick={submit} disabled={scanning} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {scanning ? <Loader2 className="size-4 mr-1 animate-spin" /> : <ScanLine className="size-4 mr-1" />} Escanear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Tab 3: Calendario ----------
function CalendarTab() {
  const toast = useAppStore((s) => s.toast)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [dayBookings, setDayBookings] = useState<{ date: string; bookings: Booking[] } | null>(null)

  // Cargar rooms
  useEffect(() => {
    fetch('/api/reservas/mine')
      .then((r) => r.json())
      .then((d) => {
        const list = d.rooms || []
        setRooms(list)
        if (list.length > 0 && !selectedRoomId) setSelectedRoomId(list[0].id)
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [selectedRoomId])

  // Cargar bookings del supplier
  useEffect(() => {
    fetch('/api/reservas/supplier-bookings')
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => setBookings([]))
  }, [])

  // Cargar disponibilidad del room seleccionado para el mes actual
  useEffect(() => {
    if (!selectedRoomId) return
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    fetch(`/api/reservas/${selectedRoomId}/availability?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((d) => setAvailability(d.days || []))
      .catch(() => setAvailability([]))
  }, [selectedRoomId, cursor])

  const room = rooms.find((r) => r.id === selectedRoomId)

  const availMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of availability) m.set(d.date.slice(0, 10), d.available)
    return m
  }, [availability])

  // Bookings por día (checkIn-checkOut overlap)
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const b of bookings) {
      if (b.status === 'CANCELLED' || b.status === 'REJECTED') continue
      const ci = new Date(b.checkIn)
      const co = new Date(b.checkOut)
      const cursor2 = new Date(ci.getFullYear(), ci.getMonth(), ci.getDate())
      while (cursor2 < co) {
        const key = toDateInputValue(cursor2)
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(b)
        cursor2.setDate(cursor2.getDate() + 1)
      }
    }
    return map
  }, [bookings])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let firstWeekday = firstDay.getDay() - 1
  if (firstWeekday < 0) firstWeekday = 6
  const daysInMonth = lastDay.getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (loading) {
    return <Card><CardContent className="p-4"><Skeleton className="h-96 w-full" /></CardContent></Card>
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CalendarRange className="size-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-foreground mb-1">No tienes recursos</p>
          <p className="text-sm text-muted-foreground">Crea un recurso para ver el calendario de ocupación.</p>
        </CardContent>
      </Card>
    )
  }

  const cellColor = (date: Date) => {
    const key = toDateInputValue(date)
    const total = room?.quantity || 1
    const bks = bookingsByDay.get(key) || []
    const units = bks.reduce((s, b) => s + b.quantity, 0)
    const pct = total > 0 ? (units / total) * 100 : 0
    if (pct === 0) return { bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' }
    if (pct <= 50) return { bg: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-200' }
    if (pct <= 80) return { bg: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-200' }
    return { bg: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700', text: 'text-rose-700 dark:text-rose-200' }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarRange className="size-5 text-primary" /> Calendario de ocupación
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Selecciona recurso" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-1.5">{typeMeta(r.type).Icon && (() => { const I = typeMeta(r.type).Icon; return <I className="size-3.5" /> })()} {r.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Anterior">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}>Hoy</Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Siguiente">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm font-semibold text-primary mt-1">{MONTH_NAMES[month]} {year}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square rounded-md bg-muted/20" />
              const key = toDateInputValue(date)
              const bks = bookingsByDay.get(key) || []
              const avail = availMap.get(key) ?? room?.quantity ?? 1
              const isToday = isSameDay(date, today)
              const isPast = date < today
              const c = cellColor(date)
              const total = room?.quantity || 1
              const occPct = total > 0 ? Math.min(100, Math.round((bks.reduce((s, b) => s + b.quantity, 0) / total) * 100)) : 0
              return (
                <button
                  key={key}
                  onClick={() => bks.length > 0 && setDayBookings({ date: key, bookings: bks })}
                  className={cn(
                    'aspect-square rounded-md border p-1 flex flex-col items-center justify-center transition-all text-xs',
                    isPast ? 'opacity-50' : 'hover:border-primary hover:scale-105',
                    isToday ? 'ring-2 ring-primary' : '',
                    bks.length > 0 ? cn(c.bg, c.text, 'cursor-pointer') : 'bg-card border-border/60 text-muted-foreground',
                  )}
                >
                  <span className="font-semibold leading-none">{date.getDate()}</span>
                  <span className="text-[9px] mt-0.5">{bks.length > 0 ? `${bks.length} res · ${occPct}%` : `Disp: ${avail}`}</span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 flex-wrap">
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-emerald-200 dark:bg-emerald-900/60" /> 0-50% ocupación</span>
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-amber-200 dark:bg-amber-900/60" /> 51-80%</span>
            <span className="flex items-center gap-1"><span className="size-3 rounded bg-rose-200 dark:bg-rose-900/60" /> 81-100%</span>
            <span className="flex items-center gap-1 ml-auto"><span className="size-3 rounded bg-card border" /> Sin reservas</span>
          </div>
        </CardContent>
      </Card>

      {dayBookings && (
        <DayBookingsDialog
          date={dayBookings.date}
          bookings={dayBookings.bookings}
          onClose={() => setDayBookings(null)}
        />
      )}
    </div>
  )
}

function DayBookingsDialog({
  date, bookings, onClose,
}: {
  date: string
  bookings: Booking[]
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" /> Reservas del día
          </DialogTitle>
          <DialogDescription>{fmtDate(date)} · {bookings.length} reserva(s)</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {bookings.map((b) => {
            const StatusIcon = STATUS_ICONS[b.status] || Clock
            return (
              <div key={b.id} className="bg-muted/40 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs">{b.bookingCode}</p>
                  <Badge className={STATUS_BADGES[b.status]}>
                    <StatusIcon className="size-3 mr-1" /> {STATUS_LABELS[b.status]}
                  </Badge>
                </div>
                <p className="font-medium text-sm">{b.guestName}</p>
                <p className="text-xs text-muted-foreground">{b.room?.name}</p>
                <div className="flex justify-between text-xs">
                  <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
                  <span className="font-semibold text-primary">{fmtUsd(b.total)}</span>
                </div>
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
