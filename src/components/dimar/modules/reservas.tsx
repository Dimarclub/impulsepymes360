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
  Hotel, Car, Mountain, Wrench, Search, Calendar, Users, MapPin, Loader2, Plus,
  Star, Bed, Hash, Mail, Phone, StickyNote, X, CheckCircle2, Clock, XCircle,
  CalendarCheck2, QrCode, CalendarDays, RefreshCw, ShieldCheck, ChevronRight,
  Sparkles, Tag, CreditCard, Wallet, Banknote, ArrowRight, AlertCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- Constantes ----------
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
  NO_SHOW: 'No presentado',
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
  CANCELLED: X,
  NO_SHOW: XCircle,
  REJECTED: XCircle,
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Efectivo', Icon: Banknote },
  { value: 'CARD', label: 'Tarjeta', Icon: CreditCard },
  { value: 'TRANSFER', label: 'Transferencia', Icon: Wallet },
  { value: 'DEPOSIT', label: 'Depósito', Icon: Wallet },
]

const PLACEHOLDER_IMAGES: Record<string, string> = {
  HOTEL_ROOM: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70',
  CAR: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=70',
  TOUR: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=70',
  EQUIPMENT: 'https://images.unsplash.com/photo-1572981779307-09b8d0a3eb76?w=600&q=70',
}

// ---------- Helpers ----------
const fmtUsd = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0)

const fmtDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateLong = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-EC', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

const toDateInputValue = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

const todayDateInput = () => toDateInputValue(new Date())
const tomorrowDateInput = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return toDateInputValue(d)
}

const nightsBetween = (a: string, b: string) => {
  const da = new Date(a)
  const db = new Date(b)
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return 0
  return Math.max(0, Math.round((db.getTime() - da.getTime()) / 86400000))
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

// ---------- Tipos ----------
interface RoomSupplier {
  id: string
  companyName: string
  city?: string | null
  phone?: string | null
  address?: string | null
  user?: { provider?: { logoUrl?: string | null } | null } | null
}

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
  supplier?: RoomSupplier
  _count?: { bookings: number }
}

type SearchResultRoom = Room

interface SearchResult {
  room: SearchResultRoom
  supplier: RoomSupplier
  nights: number
  unitPrice: number
  subtotal: number
  serviceFee: number
  total: number
  available: number
}

interface BookingRoom {
  id: string
  name: string
  type: string
  imageUrl?: string | null
  city?: string | null
}

interface BookingSupplier {
  id: string
  companyName: string
  phone?: string | null
  city?: string | null
  user?: { provider?: { logoUrl?: string | null } | null } | null
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
  currency: string
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  qrCode?: string | null
  notes?: string | null
  affiliateCode?: string | null
  confirmedAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  room?: BookingRoom
  supplier?: BookingSupplier
}

// ---------- Componente principal ----------
export function ReservasModule() {
  const [tab, setTab] = useState<'search' | 'mine'>('search')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="size-7 text-primary" /> Reservas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hoteles, autos, tours y equipos. Busca disponibilidad y reserva en segundos.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'search' | 'mine')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="search">
            <Search className="size-4 mr-1.5" /> Buscar
          </TabsTrigger>
          <TabsTrigger value="mine">
            <CalendarCheck2 className="size-4 mr-1.5" /> Mis Reservas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-4">
          <SearchTab onGoToMine={() => setTab('mine')} />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <MyBookingsTab onGoToSearch={() => setTab('search')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Tab 1: Buscar ----------
function SearchTab({ onGoToMine }: { onGoToMine: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'ALL',
    city: '',
    checkIn: todayDateInput(),
    checkOut: tomorrowDateInput(),
    guests: '2',
  })
  const [searchMode, setSearchMode] = useState<'catalog' | 'availability'>('catalog')
  const [reserveRoom, setReserveRoom] = useState<Room | null>(null)

  const fetchCatalog = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type !== 'ALL') params.set('type', filters.type)
      if (filters.city.trim()) params.set('city', filters.city.trim())
      if (filters.guests) params.set('guests', filters.guests)
      const res = await fetch(`/api/reservas?${params.toString()}`)
      const d = await res.json()
      if (res.ok) setRooms(d.rooms || [])
      else toast(d.error || 'Error al cargar recursos', 'error')
    } catch {
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [filters.type, filters.city, filters.guests, toast])

  const runAvailabilitySearch = useCallback(async () => {
    if (!filters.checkIn || !filters.checkOut) {
      toast('Selecciona check-in y check-out', 'warning')
      return
    }
    if (new Date(filters.checkOut) <= new Date(filters.checkIn)) {
      toast('Check-out debe ser posterior a check-in', 'warning')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/reservas/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: filters.checkIn,
          checkOut: filters.checkOut,
          guests: parseInt(filters.guests, 10) || 1,
          city: filters.city.trim() || undefined,
          type: filters.type !== 'ALL' ? filters.type : undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setRooms((d.results || []).map((r: SearchResult) => r.room))
        setSearchMode('availability')
        toast(`${(d.results || []).length} recurso(s) disponibles`, 'success')
      } else {
        toast(d.error || 'Error en la búsqueda', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [filters.checkIn, filters.checkOut, filters.guests, filters.city, filters.type, toast])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  const handleReserveClick = (room: Room) => {
    if (searchMode !== 'availability' && (!filters.checkIn || !filters.checkOut)) {
      // Si no hay fechas válidas, asegúrate de pre-llenar defaults
      setFilters((f) => ({ ...f, checkIn: todayDateInput(), checkOut: tomorrowDateInput() }))
    }
    setReserveRoom(room)
  }

  return (
    <div className="space-y-5">
      <SearchCard
        filters={filters}
        setFilters={setFilters}
        onSearch={runAvailabilitySearch}
        onReset={() => {
          setSearchMode('catalog')
          fetchCatalog()
        }}
        mode={searchMode}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading
            ? 'Buscando…'
            : `${rooms.length} recurso(s) ${searchMode === 'availability' ? 'disponibles' : 'en catálogo'}`}
        </p>
        <Button variant="ghost" size="sm" onClick={() => (searchMode === 'availability' ? fetchCatalog() : fetchCatalog())}>
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} /> Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full rounded-b-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyCatalog onReset={() => { setSearchMode('catalog'); fetchCatalog() }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onReserve={() => handleReserveClick(room)}
              searchMode={searchMode}
              checkIn={filters.checkIn}
              checkOut={filters.checkOut}
              guests={parseInt(filters.guests, 10) || 1}
            />
          ))}
        </div>
      )}

      {reserveRoom && (
        <ReserveDialog
          room={reserveRoom}
          presetCheckIn={filters.checkIn}
          presetCheckOut={filters.checkOut}
          presetGuests={parseInt(filters.guests, 10) || 1}
          onClose={() => setReserveRoom(null)}
          onConfirmed={() => {
            setReserveRoom(null)
            onGoToMine()
          }}
        />
      )}
    </div>
  )
}

function SearchCard({
  filters, setFilters, onSearch, onReset, mode,
}: {
  filters: { type: string; city: string; checkIn: string; checkOut: string; guests: string }
  setFilters: React.Dispatch<React.SetStateAction<{ type: string; city: string; checkIn: string; checkOut: string; guests: string }>>
  onSearch: () => void
  onReset: () => void
  mode: 'catalog' | 'availability'
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search className="size-5 text-primary" /> Buscar disponibilidad
        </CardTitle>
        <CardDescription>
          Filtra por tipo, ciudad y fechas para encontrar recursos disponibles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="size-3" /> Tipo</Label>
            <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {ROOM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-1.5"><t.Icon className="size-3.5" /> {t.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Ciudad</Label>
            <Input
              placeholder="Ej: Guayaquil"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Check-in</Label>
            <Input
              type="date"
              value={filters.checkIn}
              onChange={(e) => setFilters((f) => ({ ...f, checkIn: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Check-out</Label>
            <Input
              type="date"
              value={filters.checkOut}
              onChange={(e) => setFilters((f) => ({ ...f, checkOut: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="size-3" /> Huéspedes</Label>
            <Input
              type="number"
              min={1}
              value={filters.guests}
              onChange={(e) => setFilters((f) => ({ ...f, guests: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {mode === 'availability' && (
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-200">
                <CheckCircle2 className="size-3 mr-1" /> Filtrando por disponibilidad
              </Badge>
            )}
            {mode === 'catalog' && (
              <span className="text-muted-foreground/70">Catálogo completo (sin filtro de fechas)</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              <X className="size-4 mr-1" /> Limpiar
            </Button>
            <Button size="sm" onClick={onSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Search className="size-4 mr-1.5" /> Buscar disponibilidad
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RoomCard({
  room, onReserve, searchMode, checkIn, checkOut, guests,
}: {
  room: Room
  onReserve: () => void
  searchMode: 'catalog' | 'availability'
  checkIn: string
  checkOut: string
  guests: number
}) {
  const meta = typeMeta(room.type)
  const Icon = meta.Icon
  const amenities = parseAmenities(room.amenities).slice(0, 4)
  const nights = nightsBetween(checkIn, checkOut)
  const showPrice = searchMode === 'availability' && nights > 0
  const subtotal = nights * room.pricePerNight
  const total = subtotal * 1.05

  return (
    <Card className="overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-muted overflow-hidden">
        {room.imageUrl ? (
          <img src={room.imageUrl} alt={room.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-amber-50 to-primary/5 dark:from-primary/10 dark:via-amber-950/20 dark:to-primary/5">
            <Icon className="size-12 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge className="bg-primary/90 text-primary-foreground border-0 gap-1">
            <Icon className="size-3" /> {meta.label}
          </Badge>
        </div>
        {room._count && room._count.bookings > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-white/90 dark:bg-black/70 text-foreground gap-1">
              <Star className="size-3 text-amber-500 fill-amber-500" /> {room._count.bookings} reservas
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-base line-clamp-1">{room.name}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="size-3" /> {room.city || 'Sin ciudad'} · {room.supplier?.companyName || 'Proveedor'}
          </p>
        </div>

        {room.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
        )}

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {amenities.map((a) => (
              <span key={a} className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px]">
                {a}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="size-3" /> Hasta {room.capacity}</span>
          <span className="flex items-center gap-1"><Bed className="size-3" /> {room.quantity} unidad(es)</span>
        </div>

        <Separator />

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Desde</p>
            <p className="text-xl font-bold text-primary">{fmtUsd(room.pricePerNight)}<span className="text-xs font-normal text-muted-foreground">/noche</span></p>
            {showPrice && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {nights} noche(s) × {fmtUsd(room.pricePerNight)} = {fmtUsd(total)} <span className="text-primary">total</span>
              </p>
            )}
          </div>
          <Button size="sm" onClick={onReserve} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Reservar <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyCatalog({ onReset }: { onReset: () => void }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Search className="size-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="font-medium text-foreground mb-1">No encontramos recursos</p>
        <p className="text-sm text-muted-foreground mb-4">
          Prueba cambiar los filtros o limpiar la búsqueda para ver todo el catálogo.
        </p>
        <Button variant="outline" size="sm" onClick={onReset}>
          <X className="size-4 mr-1" /> Limpiar filtros
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------- Dialog de Reserva ----------
function ReserveDialog({
  room, presetCheckIn, presetCheckOut, presetGuests, onClose, onConfirmed,
}: {
  room: Room
  presetCheckIn: string
  presetCheckOut: string
  presetGuests: number
  onClose: () => void
  onConfirmed: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [form, setForm] = useState({
    checkIn: presetCheckIn || todayDateInput(),
    checkOut: presetCheckOut || tomorrowDateInput(),
    quantity: '1',
    guests: String(presetGuests || 1),
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    notes: '',
    paymentMethod: 'CASH',
    affiliateCode: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<Booking | null>(null)

  const nights = nightsBetween(form.checkIn, form.checkOut)
  const qty = Math.max(1, parseInt(form.quantity, 10) || 1)
  const subtotal = nights * room.pricePerNight * qty
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  const canSubmit =
    nights > 0 &&
    form.guestName.trim() &&
    form.guestEmail.trim() &&
    form.guestPhone.trim() &&
    qty >= 1 &&
    qty <= room.quantity

  const submit = async () => {
    if (!canSubmit) {
      toast('Completa todos los campos requeridos', 'warning')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservas/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: parseInt(form.guests, 10) || 1,
          quantity: qty,
          guestName: form.guestName.trim(),
          guestEmail: form.guestEmail.trim(),
          guestPhone: form.guestPhone.trim(),
          notes: form.notes.trim() || undefined,
          paymentMethod: form.paymentMethod,
          affiliateCode: form.affiliateCode.trim() || undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setSuccess(d.booking)
        toast('Reserva registrada. Pendiente de confirmación.', 'success')
      } else {
        toast(d.error || 'Error al reservar', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return <BookingSuccessDialog booking={success} onClose={onConfirmed} />
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !submitting) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck2 className="size-5 text-primary" /> Reservar · {room.name}
          </DialogTitle>
          <DialogDescription>
            {typeMeta(room.type).label} · {room.supplier?.companyName || 'Proveedor'} · {room.city || '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Calendar className="size-3" /> Check-in</Label>
            <Input type="date" value={form.checkIn} onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Calendar className="size-3" /> Check-out</Label>
            <Input type="date" value={form.checkOut} onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Hash className="size-3" /> Unidades (max {room.quantity})</Label>
            <Input type="number" min={1} max={room.quantity} value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Users className="size-3" /> Huéspedes</Label>
            <Input type="number" min={1} max={room.capacity * qty} value={form.guests}
              onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))} />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Users className="size-3" /> Nombre</Label>
            <Input placeholder="Tu nombre" value={form.guestName}
              onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Mail className="size-3" /> Email</Label>
            <Input type="email" placeholder="tucorreo@ejemplo.com" value={form.guestEmail}
              onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Phone className="size-3" /> Teléfono</Label>
            <Input placeholder="099 999 9999" value={form.guestPhone}
              onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><CreditCard className="size-3" /> Método de pago</Label>
            <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className="flex items-center gap-1.5"><p.Icon className="size-3.5" /> {p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><Tag className="size-3" /> Código afiliado (opcional)</Label>
            <Input placeholder="Ej: ANA-002" value={form.affiliateCode}
              onChange={(e) => setForm((f) => ({ ...f, affiliateCode: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><StickyNote className="size-3" /> Notas</Label>
          <Textarea placeholder="Peticiones especiales, hora de llegada, etc." rows={2} value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>

        <Separator />

        {/* Resumen dinámico */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{nights} noche(s) × {fmtUsd(room.pricePerNight)} × {qty} unidad(es)</span>
            <span className="font-medium">{fmtUsd(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cargo por servicio (5%)</span>
            <span className="font-medium">{fmtUsd(serviceFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary text-lg">{fmtUsd(total)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSubmit || submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Procesando…</> : <><CheckCircle2 className="size-4 mr-1.5" /> Confirmar reserva</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BookingSuccessDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-6" /> ¡Reserva registrada!
          </DialogTitle>
          <DialogDescription>Tu solicitud fue creada. Pendiente de confirmación por el proveedor.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="rounded-lg border-2 border-primary/30 p-2 bg-white">
            <img src={qrUrl(booking.qrCode || booking.bookingCode)} alt="QR" className="size-36" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Código de reserva</p>
            <p className="font-mono text-lg font-bold tracking-wide text-primary">{booking.bookingCode}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>{booking.room?.name}</p>
            <p className="mt-0.5">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights} noche(s)</p>
            <p className="mt-0.5 font-semibold text-foreground">Total: {fmtUsd(booking.total)}</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700">
            <Clock className="size-3 mr-1" /> Pendiente de confirmación
          </Badge>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Ver mis reservas <ArrowRight className="size-4 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Tab 2: Mis Reservas ----------
function MyBookingsTab({ onGoToSearch }: { onGoToSearch: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [qrBooking, setQrBooking] = useState<Booking | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reservas/my-bookings')
      const d = await res.json()
      if (res.ok) setBookings(d.bookings || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancel = async (booking: Booking) => {
    try {
      const res = await fetch(`/api/reservas/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      const d = await res.json()
      if (res.ok) {
        toast('Reserva cancelada. Los cupos fueron liberados.', 'success')
        setCancelTarget(null)
        fetchBookings()
      } else {
        toast(d.error || 'Error al cancelar', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <CalendarDays className="size-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-foreground mb-1">No tienes reservas</p>
          <p className="text-sm text-muted-foreground mb-4">¡Busca tu próxima escapada!</p>
          <Button onClick={onGoToSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Search className="size-4 mr-1.5" /> Explorar recursos
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Ordenar: próximas primero (checkIn >= hoy), luego pasadas
  const now = new Date()
  const upcoming = bookings
    .filter((b) => new Date(b.checkOut) >= now && b.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
  const past = bookings
    .filter((b) => new Date(b.checkOut) < now || b.status === 'CANCELLED')
    .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{bookings.length} reserva(s) en total</p>
        <Button variant="outline" size="sm" onClick={fetchBookings}>
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} /> Actualizar
        </Button>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
            <Sparkles className="size-3.5" /> Próximas ({upcoming.length})
          </h3>
          <div className="space-y-3">
            {upcoming.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={() => setCancelTarget(b)}
                onShowQr={() => setQrBooking(b)}
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="size-3.5" /> Historial ({past.length})
          </h3>
          <div className="space-y-3">
            {past.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={() => setCancelTarget(b)}
                onShowQr={() => setQrBooking(b)}
                dimmed
              />
            ))}
          </div>
        </section>
      )}

      {cancelTarget && (
        <ConfirmCancelDialog
          booking={cancelTarget}
          onCancel={() => setCancelTarget(null)}
          onConfirm={() => handleCancel(cancelTarget)}
        />
      )}

      {qrBooking && (
        <QrShowDialog booking={qrBooking} onClose={() => setQrBooking(null)} />
      )}
    </div>
  )
}

function BookingCard({
  booking, onCancel, onShowQr, dimmed,
}: {
  booking: Booking
  onCancel: () => void
  onShowQr: () => void
  dimmed?: boolean
}) {
  const meta = booking.room ? typeMeta(booking.room.type) : typeMeta('HOTEL_ROOM')
  const Icon = meta.Icon
  const StatusIcon = STATUS_ICONS[booking.status] || Clock
  const canCancel = booking.status === 'PENDING' || booking.status === 'CONFIRMED'
  const canShowQr = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN'

  return (
    <Card className={cn('overflow-hidden', dimmed && 'opacity-70')}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Imagen */}
          <div className="relative h-24 sm:h-24 sm:w-32 shrink-0 rounded-md overflow-hidden bg-muted">
            {booking.room?.imageUrl ? (
              <img src={booking.room.imageUrl} alt={booking.room.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-amber-50 dark:from-primary/10 dark:to-amber-950/20">
                <Icon className="size-8 text-primary/40" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{booking.bookingCode}</p>
                <h4 className="font-semibold text-base leading-tight line-clamp-1">{booking.room?.name || 'Recurso eliminado'}</h4>
                <p className="text-xs text-muted-foreground">{booking.supplier?.companyName || '—'} · {booking.room?.city || ''}</p>
              </div>
              <Badge className={STATUS_BADGES[booking.status]}>
                <StatusIcon className="size-3 mr-1" /> {STATUS_LABELS[booking.status] || booking.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="size-3" /> {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}</span>
              <span className="flex items-center gap-1"><Clock className="size-3" /> {booking.nights} noche(s)</span>
              <span className="flex items-center gap-1"><Users className="size-3" /> {booking.guests} huésped(es)</span>
              <span className="flex items-center gap-1"><Hash className="size-3" /> {booking.quantity} unidad(es)</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-base font-bold text-primary">{fmtUsd(booking.total)}</p>
              </div>
              <div className="flex gap-2">
                {booking.status === 'PENDING' && (
                  <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-200">
                    <Clock className="size-3 mr-1" /> Pendiente de confirmación
                  </Badge>
                )}
                {canShowQr && (
                  <Button variant="outline" size="sm" onClick={onShowQr}>
                    <QrCode className="size-4 mr-1" /> Ver QR
                  </Button>
                )}
                {canCancel && (
                  <Button variant="outline" size="sm" onClick={onCancel}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/30">
                    <X className="size-4 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QrShowDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" /> Tu QR de check-in
          </DialogTitle>
          <DialogDescription>Muestra este código al proveedor al llegar.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="rounded-lg border-2 border-primary/30 p-2 bg-white">
            <img src={qrUrl(booking.qrCode || booking.bookingCode)} alt="QR" className="size-40" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Código</p>
            <p className="font-mono text-lg font-bold text-primary">{booking.bookingCode}</p>
          </div>
          <div className="text-sm text-center text-muted-foreground">
            <p className="font-medium text-foreground">{booking.room?.name}</p>
            <p className="mt-0.5">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="size-3.5" /> Muestra este QR en el check-in
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmCancelDialog({
  booking, onCancel, onConfirm,
}: {
  booking: Booking
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <AlertCircle className="size-5" /> Cancelar reserva
          </DialogTitle>
          <DialogDescription>Esta acción liberará los cupos reservados y no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm py-2">
          <p className="text-muted-foreground">Estás por cancelar:</p>
          <div className="bg-muted/40 rounded-lg p-3 space-y-1">
            <p className="font-medium">{booking.room?.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{booking.bookingCode}</p>
            <p className="text-xs">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}</p>
            <p className="text-sm font-semibold text-foreground">Total: {fmtUsd(booking.total)}</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Cerrar</Button>
          <Button variant="destructive" onClick={onConfirm}>
            <X className="size-4 mr-1" /> Sí, cancelar reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
