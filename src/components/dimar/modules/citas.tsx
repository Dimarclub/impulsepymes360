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
  CalendarDays, Calendar, Plus, RefreshCw, Clock, Check, CheckCircle2, X, XCircle,
  ChevronLeft, ChevronRight, Trash2, Loader2, User, Mail, Phone, StickyNote,
  Edit3, CalendarCheck2, AlertCircle, CalendarClock, ListChecks, Handshake,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- Constantes ----------
const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No asistió',
}

const STATUS_BADGES: Record<string, string> = {
  SCHEDULED: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  COMPLETED: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700',
  NO_SHOW: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  SCHEDULED: Clock,
  CONFIRMED: Check,
  COMPLETED: CheckCircle2,
  CANCELLED: X,
  NO_SHOW: XCircle,
}

const STATUS_BORDER_LEFT: Record<string, string> = {
  SCHEDULED: 'border-l-amber-400',
  CONFIRMED: 'border-l-emerald-500',
  COMPLETED: 'border-l-muted-foreground/40',
  CANCELLED: 'border-l-rose-400',
  NO_SHOW: 'border-l-red-500',
}

// ---------- Helpers ----------
function toDateTimeLocalValue(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const tz = date.getTimezoneOffset() * 60000
  const local = new Date(date.getTime() - tz)
  return local.toISOString().slice(0, 16)
}

function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt).getTime()
  const e = new Date(endsAt).getTime()
  const mins = Math.round((e - s) / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// ---------- Tipos ----------
interface ApptContact {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  stage?: string | null
  source?: string | null
}

interface Appointment {
  id: string
  userId: string
  contactId: string | null
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  service: string
  startsAt: string
  endsAt: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  contact?: ApptContact | null
}

interface CrmContactOption {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
}

interface ApptStats {
  total: number
  today: number
  upcoming: number
  completed: number
  cancelled: number
}

// ---------- Componente principal ----------
export function CitasModule() {
  const toast = useAppStore((s) => s.toast)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [contacts, setContacts] = useState<CrmContactOption[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ApptStats>({ total: 0, today: 0, upcoming: 0, completed: 0, cancelled: 0 })

  const [createOpen, setCreateOpen] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [detailApptId, setDetailApptId] = useState<string | null>(null)
  const [presetStart, setPresetStart] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)
      const [listRes, todayRes] = await Promise.all([
        fetch(`/api/citas?from=${from.toISOString()}&to=${to.toISOString()}`),
        fetch('/api/citas/today'),
      ])
      const listData = await listRes.json()
      const todayData = await todayRes.json()
      if (listRes.ok) {
        setAppointments(listData.appointments || [])
        setStats(listData.stats || { total: 0, today: 0, upcoming: 0, completed: 0, cancelled: 0 })
      }
      if (todayRes.ok) {
        setTodayAppointments(todayData.appointments || [])
      }
    } catch {
      setAppointments([])
      setTodayAppointments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/contacts')
      const d = await res.json()
      const list = Array.isArray(d) ? d : (d.contacts || [])
      setContacts(list.map((c: CrmContactOption) => ({
        id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company,
      })))
    } catch {
      setContacts([])
    }
  }, [])

  useEffect(() => {
    fetchAll()
    fetchContacts()
  }, [fetchAll, fetchContacts])

  const handleNew = (preset?: string) => {
    setPresetStart(preset ?? null)
    setEditingAppt(null)
    setCreateOpen(true)
  }

  const handleEdit = (appt: Appointment) => {
    setDetailApptId(null)
    setEditingAppt(appt)
    setPresetStart(null)
    setCreateOpen(true)
  }

  const handleCreated = () => {
    setCreateOpen(false)
    setEditingAppt(null)
    setPresetStart(null)
    fetchAll()
  }

  // Próximas 10 (excluyendo las de hoy y canceladas, ya vienen ordenadas asc)
  const now = new Date()
  const upcoming = useMemo(() => {
    return appointments
      .filter((a) => new Date(a.startsAt) > now && !isSameDay(new Date(a.startsAt), now) && a.status !== 'CANCELLED')
      .slice(0, 10)
  }, [appointments, now])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="size-7 text-primary" /> Citas / Calendario
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tus citas, agenda servicios y haz seguimiento de cada cliente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { void fetchAll() }} disabled={loading}>
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const el = document.getElementById('citas-calendar')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            toast('Mostrando el día de hoy', 'info')
          }}>
            <Calendar className="size-4" /> Hoy
          </Button>
          <Button size="sm" onClick={() => handleNew()}>
            <Plus className="size-4 mr-1.5" /> Nueva cita
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={CalendarDays}
          label="Total citas"
          value={stats.total}
          color="text-primary"
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          icon={CalendarClock}
          label="Hoy"
          value={stats.today}
          color="text-amber-700 dark:text-amber-300"
          iconColor="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
        />
        <StatCard
          icon={CalendarCheck2}
          label="Próximas 7 días"
          value={upcoming.length}
          color="text-emerald-700 dark:text-emerald-300"
          iconColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
        />
        <StatCard
          icon={ListChecks}
          label="Completadas"
          value={stats.completed}
          color="text-foreground"
          iconColor="bg-muted text-muted-foreground"
        />
      </div>

      {/* Layout principal */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <CalendarView
          id="citas-calendar"
          appointments={appointments}
          loading={loading}
          onSelectAppt={(id) => setDetailApptId(id)}
          onNewOnDate={(iso) => handleNew(iso)}
        />
        <UpcomingList
          todayAppointments={todayAppointments}
          upcoming={upcoming}
          loading={loading}
          onSelectAppt={(id) => setDetailApptId(id)}
          onNew={() => handleNew()}
        />
      </div>

      {/* Dialog crear / editar */}
      <AppointmentFormDialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) { setEditingAppt(null); setPresetStart(null) } }}
        editing={editingAppt}
        presetStart={presetStart}
        contacts={contacts}
        onSaved={handleCreated}
        toast={toast}
      />

      {/* Dialog detalle */}
      <AppointmentDetailDialog
        apptId={detailApptId}
        onOpenChange={(o) => !o && setDetailApptId(null)}
        onEdit={(appt) => handleEdit(appt)}
        onChanged={fetchAll}
        toast={toast}
      />
    </div>
  )
}

// ---------- Stat card ----------
function StatCard({
  icon: Icon, label, value, color, iconColor,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  iconColor: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('size-10 rounded-lg flex items-center justify-center', iconColor)}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className={cn('text-2xl font-bold leading-tight', color)}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Vista calendario mensual ----------
function CalendarView({
  id, appointments, loading, onSelectAppt, onNewOnDate,
}: {
  id?: string
  appointments: Appointment[]
  loading: boolean
  onSelectAppt: (id: string) => void
  onNewOnDate: (iso: string) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const monthAppts = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
    return appointments.filter((a) => {
      const s = new Date(a.startsAt)
      return s >= monthStart && s <= monthEnd
    })
  }, [appointments, cursor])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let firstWeekday = firstDay.getDay() - 1
  if (firstWeekday < 0) firstWeekday = 6
  const daysInMonth = lastDay.getDate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const apptsForDay = (date: Date) => {
    return monthAppts
      .filter((a) => isSameDay(new Date(a.startsAt), date))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  }

  return (
    <Card id={id}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" /> Calendario mensual
            </CardTitle>
            <CardDescription>Haz clic en una cita para ver detalle · clic en un día para crear</CardDescription>
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
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                {d}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="aspect-square rounded-md bg-muted/20" />
              const dayAppts = apptsForDay(date)
              const isToday = isSameDay(date, today)
              const visible = dayAppts.slice(0, 3)
              const extra = dayAppts.length - visible.length
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'aspect-square rounded-md border p-1 flex flex-col gap-0.5 overflow-hidden cursor-pointer transition-colors hover:border-primary/50',
                    isToday ? 'border-primary border-2' : 'border-border/60',
                    dayAppts.length > 0 ? 'bg-primary/5' : 'bg-card hover:bg-primary/5'
                  )}
                  onClick={() => {
                    // Crear a las 10:00 de ese día por defecto
                    const iso = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0, 0).toISOString()
                    onNewOnDate(iso)
                  }}
                  title={`Crear cita el ${date.toLocaleDateString('es-EC')}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[11px] font-semibold leading-none flex items-center justify-center size-5 rounded-full',
                        isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {dayAppts.length > 0 && (
                      <span className="text-[9px] text-muted-foreground">{dayAppts.length}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {visible.map((a) => {
                      const Icon = STATUS_ICONS[a.status] || Clock
                      return (
                        <button
                          key={a.id}
                          onClick={() => onSelectAppt(a.id)}
                          title={`${fmtTime(a.startsAt)} · ${a.clientName} — ${a.service}`}
                          className={cn(
                            'w-full text-left text-[9px] leading-tight px-1 py-0.5 rounded truncate flex items-center gap-0.5 transition-colors hover:opacity-80',
                            STATUS_BADGES[a.status] || 'bg-muted'
                          )}
                        >
                          <Icon className="size-2 shrink-0" />
                          <span className="truncate">{fmtTime(a.startsAt)} {a.clientName}</span>
                        </button>
                      )
                    })}
                    {extra > 0 && (
                      <p className="text-[9px] text-muted-foreground pl-1">+{extra} más</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Lista de próximas citas ----------
function UpcomingList({
  todayAppointments, upcoming, loading, onSelectAppt, onNew,
}: {
  todayAppointments: Appointment[]
  upcoming: Appointment[]
  loading: boolean
  onSelectAppt: (id: string) => void
  onNew: () => void
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" /> Próximas citas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const totalToday = todayAppointments.length
  const totalUpcoming = upcoming.length
  const empty = totalToday === 0 && totalUpcoming === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" /> Próximas citas
        </CardTitle>
        <CardDescription>
          {totalToday > 0
            ? `${totalToday} cita(s) para hoy · ${totalUpcoming} próxima(s)`
            : 'Sin citas para hoy'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            <CalendarDays className="size-12 mx-auto mb-3 opacity-25 text-primary" />
            <p className="font-medium text-foreground mb-1">No tienes citas</p>
            <p className="mb-4">Crea tu primera cita y empieza a organizar tu agenda.</p>
            <Button size="sm" onClick={onNew}>
              <Plus className="size-4 mr-1.5" /> Crear cita
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[34rem] overflow-y-auto pr-1 scroll-thin">
            {totalToday > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" /> Hoy ({totalToday})
                </h3>
                <div className="space-y-2">
                  {todayAppointments.map((a) => (
                    <AppointmentListItem key={a.id} appt={a} onClick={() => onSelectAppt(a.id)} />
                  ))}
                </div>
              </section>
            )}
            {totalUpcoming > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                  <CalendarCheck2 className="size-3.5" /> Próximas ({totalUpcoming})
                </h3>
                <div className="space-y-2">
                  {upcoming.map((a) => (
                    <AppointmentListItem key={a.id} appt={a} onClick={() => onSelectAppt(a.id)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Item de lista ----------
function AppointmentListItem({ appt, onClick }: { appt: Appointment; onClick: () => void }) {
  const Icon = STATUS_ICONS[appt.status] || Clock
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border border-l-4 p-3 hover:shadow-md hover:bg-primary/5 transition-all',
        STATUS_BORDER_LEFT[appt.status] || 'border-l-border'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-mono font-bold text-primary">
              {fmtTime(appt.startsAt)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              · {fmtDuration(appt.startsAt, appt.endsAt)}
            </span>
          </div>
          <p className="text-sm font-semibold truncate mt-0.5">{appt.clientName}</p>
          <p className="text-xs text-muted-foreground truncate">{appt.service}</p>
        </div>
        <Badge variant="outline" className={cn('shrink-0', STATUS_BADGES[appt.status] || '')}>
          <Icon className="size-3 mr-1" />
          {STATUS_LABELS[appt.status] || appt.status}
        </Badge>
      </div>
      {appt.clientPhone && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Phone className="size-3" /> {appt.clientPhone}
        </div>
      )}
    </button>
  )
}

// ---------- Dialog Crear / Editar ----------
function AppointmentFormDialog({
  open, onOpenChange, editing, presetStart, contacts, onSaved, toast,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Appointment | null
  presetStart: string | null
  contacts: CrmContactOption[]
  onSaved: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const isEdit = !!editing
  const defaultStart = presetStart || (editing ? editing.startsAt : new Date().toISOString())
  const defaultEnd = editing
    ? editing.endsAt
    : new Date(new Date(defaultStart).getTime() + 60 * 60 * 1000).toISOString()

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    service: '',
    startsAt: '',
    endsAt: '',
    notes: '',
    contactId: '',
    status: 'SCHEDULED',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Sincronizar form cuando cambia editing/presetStart
  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        clientName: editing.clientName,
        clientEmail: editing.clientEmail || '',
        clientPhone: editing.clientPhone || '',
        service: editing.service,
        startsAt: toDateTimeLocalValue(editing.startsAt),
        endsAt: toDateTimeLocalValue(editing.endsAt),
        notes: editing.notes || '',
        contactId: editing.contactId || '',
        status: editing.status,
      })
    } else {
      setForm({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        service: '',
        startsAt: toDateTimeLocalValue(presetStart || new Date()),
        endsAt: toDateTimeLocalValue(new Date(new Date(presetStart || Date.now()).getTime() + 60 * 60 * 1000)),
        notes: '',
        contactId: '',
        status: 'SCHEDULED',
      })
    }
  }, [open, editing, presetStart])

  const onContactSelect = (contactId: string) => {
    setForm((f) => {
      if (!contactId) return { ...f, contactId: '' }
      const c = contacts.find((x) => x.id === contactId)
      if (!c) return { ...f, contactId }
      return {
        ...f,
        contactId,
        clientName: f.clientName || c.name,
        clientEmail: f.clientEmail || c.email,
        clientPhone: f.clientPhone || (c.phone || ''),
      }
    })
  }

  const submit = async () => {
    if (!form.clientName.trim()) { toast('El nombre del cliente es obligatorio', 'error'); return }
    if (!form.service.trim()) { toast('El servicio es obligatorio', 'error'); return }
    if (!form.startsAt || !form.endsAt) { toast('Las fechas son obligatorias', 'error'); return }
    const s = new Date(form.startsAt)
    const e = new Date(form.endsAt)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) { toast('Fechas inválidas', 'error'); return }
    if (e <= s) { toast('La fecha fin debe ser posterior a la fecha inicio', 'error'); return }

    setSubmitting(true)
    try {
      const payload = {
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim() || undefined,
        clientPhone: form.clientPhone.trim() || undefined,
        service: form.service.trim(),
        startsAt: s.toISOString(),
        endsAt: e.toISOString(),
        notes: form.notes.trim() || undefined,
        contactId: form.contactId || undefined,
        status: isEdit ? form.status : undefined,
      }
      const url = isEdit ? `/api/citas/${editing!.id}` : '/api/citas'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al guardar la cita', 'error'); return }
      toast(isEdit ? 'Cita actualizada' : 'Cita creada con éxito', 'success')
      onSaved()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    if (!editing) return
    if (!confirm(`¿Eliminar la cita de "${editing.clientName}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/citas/${editing.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al eliminar', 'error'); return }
      toast('Cita eliminada', 'info')
      onSaved()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Edit3 className="size-5 text-primary" /> : <Plus className="size-5 text-primary" />}
            {isEdit ? 'Editar cita' : 'Nueva cita'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos de la cita o cambia su estado.'
              : 'Completa los datos del cliente y servicio para agendar.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Vincular contacto CRM */}
          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Handshake className="size-3.5 text-muted-foreground" /> Vincular contacto CRM (opcional)
              </Label>
              <Select value={form.contactId} onValueChange={onContactSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin vincular — autocompleta datos si seleccionas uno" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` · ${c.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Nombre del cliente *</Label>
            <Input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              placeholder="Ej: María Pérez"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="size-3.5 text-muted-foreground" /> Email
              </Label>
              <Input
                type="email"
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" /> Teléfono
              </Label>
              <Input
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                placeholder="099 123 4567"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Servicio *</Label>
            <Input
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="Ej: Consultoría de marketing · Sesión de fotos · Reunión comercial"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" /> Inicio *
              </Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" /> Fin *
              </Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const Icon = STATUS_ICONS[key]
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-1.5">
                          <Icon className="size-3.5" /> {label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <StickyNote className="size-3.5 text-muted-foreground" /> Notas
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas internas, dirección, recordatorios..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEdit && (
            <Button
              variant="outline"
              onClick={remove}
              disabled={deleting || submitting}
              className="mr-auto text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-950/40"
            >
              {deleting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Trash2 className="size-4 mr-1.5" />}
              Eliminar
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || deleting}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={submitting || deleting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {submitting ? (
              <><Loader2 className="size-4 mr-1.5 animate-spin" /> Guardando...</>
            ) : (
              <><Check className="size-4 mr-1.5" /> {isEdit ? 'Guardar cambios' : 'Crear cita'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Dialog Detalle ----------
function AppointmentDetailDialog({
  apptId, onOpenChange, onEdit, onChanged, toast,
}: {
  apptId: string | null
  onOpenChange: (o: boolean) => void
  onEdit: (appt: Appointment) => void
  onChanged: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [appt, setAppt] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const fetchAppt = useCallback(async () => {
    if (!apptId) { setAppt(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/citas/${apptId}`)
      const d = await res.json()
      if (res.ok) setAppt(d.appointment)
      else { setAppt(null); toast(d?.error || 'Error al cargar la cita', 'error') }
    } catch {
      setAppt(null)
    } finally {
      setLoading(false)
    }
  }, [apptId, toast])

  useEffect(() => {
    if (apptId) fetchAppt()
    else setAppt(null)
  }, [apptId, fetchAppt])

  const changeStatus = async (newStatus: string) => {
    if (!appt) return
    setBusy(true)
    try {
      const res = await fetch(`/api/citas/${appt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al actualizar estado', 'error'); return }
      toast(`Cita marcada como ${STATUS_LABELS[newStatus]}`, 'success')
      setAppt(d.appointment)
      onChanged()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!appt) return
    if (!confirm(`¿Eliminar la cita de "${appt.clientName}"?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/citas/${appt.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) { toast(d?.error || 'Error al eliminar', 'error'); return }
      toast('Cita eliminada', 'info')
      onOpenChange(false)
      onChanged()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!apptId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck2 className="size-5 text-primary" /> Detalle de la cita
          </DialogTitle>
          <DialogDescription>
            {appt ? `Creada el ${fmtDate(appt.createdAt)}` : 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !appt ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
            No se pudo cargar la cita.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estado actual */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn('px-2.5 py-1', STATUS_BADGES[appt.status])}>
                {(() => {
                  const Icon = STATUS_ICONS[appt.status] || Clock
                  return <><Icon className="size-3.5 mr-1.5" /> {STATUS_LABELS[appt.status] || appt.status}</>
                })()}
              </Badge>
              <span className="text-xs text-muted-foreground">{fmtDuration(appt.startsAt, appt.endsAt)}</span>
            </div>

            {/* Cliente y servicio */}
            <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
              <p className="text-base font-semibold flex items-center gap-1.5">
                <User className="size-4 text-primary" /> {appt.clientName}
              </p>
              <p className="text-sm text-muted-foreground">{appt.service}</p>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Fecha</p>
                <p className="font-medium">{fmtDate(appt.startsAt)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">Hora</p>
                <p className="font-medium font-mono">
                  {fmtTime(appt.startsAt)} – {fmtTime(appt.endsAt)}
                </p>
              </div>
            </div>

            {/* Contacto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {appt.clientEmail && (
                <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{appt.clientEmail}</span>
                </div>
              )}
              {appt.clientPhone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5 shrink-0" /> {appt.clientPhone}
                </div>
              )}
            </div>

            {/* Notas */}
            {appt.notes && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/50 p-3">
                <p className="text-[11px] uppercase font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                  <StickyNote className="size-3.5" /> Notas
                </p>
                <p className="text-sm whitespace-pre-wrap">{appt.notes}</p>
              </div>
            )}

            {/* Contacto CRM vinculado */}
            {appt.contact && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/50 p-3">
                <p className="text-[11px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 mb-1.5 flex items-center gap-1">
                  <Handshake className="size-3.5" /> Contacto CRM vinculado
                </p>
                <div className="text-sm">
                  <p className="font-semibold">{appt.contact.name}</p>
                  {appt.contact.company && (
                    <p className="text-xs text-muted-foreground">{appt.contact.company}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="size-3" /> {appt.contact.email}
                    </span>
                    {appt.contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3" /> {appt.contact.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Acciones rápidas de estado */}
            <div>
              <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">
                Cambiar estado
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || appt.status === 'CONFIRMED'}
                  onClick={() => changeStatus('CONFIRMED')}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <Check className="size-3.5 mr-1" /> Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || appt.status === 'COMPLETED'}
                  onClick={() => changeStatus('COMPLETED')}
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Completar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || appt.status === 'CANCELLED'}
                  onClick={() => changeStatus('CANCELLED')}
                  className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  <X className="size-3.5 mr-1" /> Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || appt.status === 'NO_SHOW'}
                  onClick={() => changeStatus('NO_SHOW')}
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  <XCircle className="size-3.5 mr-1" /> No-show
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={remove}
                disabled={busy}
                className="mr-auto text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-300 dark:border-rose-700 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="size-4 mr-1.5" /> Eliminar
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cerrar
              </Button>
              <Button
                onClick={() => onEdit(appt)}
                disabled={busy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Edit3 className="size-4 mr-1.5" /> Editar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CitasModule
