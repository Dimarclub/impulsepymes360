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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserPlus,
  TrendingUp,
  Trophy,
  Percent,
  Mail,
  Phone,
  Building2,
  StickyNote,
  ChevronDown,
  CalendarDays,
  PhoneCall,
  Send,
  CalendarClock,
  Plus,
  RefreshCw,
  DollarSign,
  Inbox,
} from 'lucide-react'
import type { CrmContact } from '@/lib/types'
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/types'
import { useAppStore } from '@/lib/store'

interface CrmActivity {
  id: string
  contactId: string
  type: string
  subject: string
  description?: string | null
  dueDate?: string | null
  done: boolean
  createdAt: string
}

interface CrmContactWithActivities extends CrmContact {
  activities?: CrmActivity[]
}

const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
const SOURCES: Record<string, string> = {
  WEB: 'Web',
  REFERRAL: 'Referido',
  MARKETING: 'Marketing',
  MARKETPLACE: 'Marketplace',
}
const ACTIVITY_TYPES: Record<string, string> = {
  CALL: 'Llamada',
  EMAIL: 'Correo',
  MEETING: 'Reunión',
  NOTE: 'Nota',
  TASK: 'Tarea',
}
const ACTIVITY_ICONS: Record<string, typeof PhoneCall> = {
  CALL: PhoneCall,
  EMAIL: Send,
  MEETING: CalendarClock,
  NOTE: StickyNote,
  TASK: CalendarDays,
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

export function CrmModule() {
  const toast = useAppStore((s) => s.toast)
  const [contacts, setContacts] = useState<CrmContactWithActivities[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailContact, setDetailContact] = useState<CrmContactWithActivities | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/contacts', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar contactos')
      const data = await res.json()
      setContacts(data)
    } catch (err) {
      toast((err as Error).message || 'Error al cargar CRM', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const total = contacts.length
    const won = contacts.filter((c) => c.stage === 'WON')
    const lost = contacts.filter((c) => c.stage === 'LOST')
    const activePipeline = contacts.filter(
      (c) => c.stage !== 'WON' && c.stage !== 'LOST'
    )
    const pipelineValue = activePipeline.reduce((s, c) => s + (c.value || 0), 0)
    const wonValue = won.reduce((s, c) => s + (c.value || 0), 0)
    const closed = won.length + lost.length
    const conversion = closed > 0 ? (won.length / closed) * 100 : 0
    return { total, won: won.length, pipelineValue, wonValue, conversion }
  }, [contacts])

  const contactsByStage = useMemo(() => {
    const map: Record<string, CrmContactWithActivities[]> = {}
    for (const s of STAGES) map[s] = []
    for (const c of contacts) {
      const stage = STAGES.includes(c.stage) ? c.stage : 'LEAD'
      map[stage].push(c)
    }
    return map
  }, [contacts])

  const handleCreate = async (form: Record<string, string>) => {
    try {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          company: form.company || null,
          stage: form.stage || 'LEAD',
          value: Number(form.value) || 0,
          source: form.source || 'WEB',
          notes: form.notes || null,
        }),
      })
      if (!res.ok) throw new Error('No se pudo crear el contacto')
      toast('Contacto creado correctamente')
      setCreateOpen(false)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleStageChange = async (contactId: string, stage: string) => {
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar la etapa')
      toast(`Etapa actualizada a "${STAGE_LABELS[stage]}"`)
      // optimización local + refresh
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, stage } : c))
      )
      setDetailContact((prev) =>
        prev && prev.id === contactId ? { ...prev, stage } : prev
      )
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleAddActivity = async (
    contactId: string,
    form: { type: string; subject: string; description: string; dueDate: string }
  ) => {
    try {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          type: form.type,
          subject: form.subject,
          description: form.description || null,
          dueDate: form.dueDate || null,
        }),
      })
      if (!res.ok) throw new Error('No se pudo agregar la actividad')
      toast('Actividad agregada')
      // recargar actividades del contacto abierto + lista
      load()
      const updated = await fetch('/api/crm/contacts', { cache: 'no-store' })
      if (updated.ok) {
        const list = await updated.json()
        setContacts(list)
        const fresh = list.find((c: CrmContactWithActivities) => c.id === contactId)
        if (fresh) setDetailContact(fresh)
      }
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        loading={loading}
        onReload={load}
        onNew={() => setCreateOpen(true)}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Total contactos"
          value={String(stats.total)}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Valor pipeline"
          value={usd(stats.pipelineValue)}
          tone="amber"
        />
        <StatCard
          icon={Trophy}
          label="Ganados (WON)"
          value={`${stats.won} · ${usd(stats.wonValue)}`}
          tone="emerald"
        />
        <StatCard
          icon={Percent}
          label="Tasa conversión"
          value={`${stats.conversion.toFixed(1)}%`}
          tone="amber"
        />
      </div>

      {/* Kanban */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-base">Pipeline de ventas</CardTitle>
          <CardDescription className="text-xs">
            Arrastra mentalmente tus contactos por etapa. Clic en una tarjeta para ver detalles y actividades.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex gap-4 overflow-x-auto scroll-thin p-4 min-h-[28rem]">
            {loading
              ? STAGES.map((s) => (
                  <div key={s} className="min-w-72 flex-shrink-0">
                    <KanbanColumnSkeleton stageKey={s} />
                  </div>
                ))
              : STAGES.map((stage) => (
                  <KanbanColumn
                    key={stage}
                    stage={stage}
                    contacts={contactsByStage[stage]}
                    onCardClick={(c) => setDetailContact(c)}
                  />
                ))}
          </div>
        </CardContent>
      </Card>

      {/* Create dialog */}
      <CreateContactDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Detail dialog */}
      <ContactDetailDialog
        key={detailContact?.id ?? 'none'}
        contact={detailContact}
        onOpenChange={(open) => !open && setDetailContact(null)}
        onStageChange={handleStageChange}
        onAddActivity={handleAddActivity}
      />
    </div>
  )
}

/* ---------------- Header ---------------- */

function ModuleHeader({
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
          CRM &amp; Pipeline
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestiona contactos de proveedores, socios y afiliados potenciales.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Refrescar
        </Button>
        <Button size="sm" onClick={onNew}>
          <UserPlus />
          Nuevo contacto
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
  icon: typeof Users
  label: string
  value: string
  tone: 'emerald' | 'amber'
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
      : 'bg-amber-50 text-amber-700 ring-amber-200/60'
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

/* ---------------- Kanban column ---------------- */

function KanbanColumn({
  stage,
  contacts,
  onCardClick,
}: {
  stage: string
  contacts: CrmContactWithActivities[]
  onCardClick: (c: CrmContactWithActivities) => void
}) {
  const total = contacts.reduce((s, c) => s + (c.value || 0), 0)
  const badgeCls = STAGE_COLORS[stage] || STAGE_COLORS.LEAD
  return (
    <div className="min-w-72 flex-shrink-0 flex flex-col">
      <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-2 h-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
              {STAGE_LABELS[stage]}
            </span>
            <span className="text-xs text-muted-foreground">
              {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="size-3" />
          <span className="font-medium text-foreground">{usd(total)}</span>
          <span>· valor total</span>
        </div>
        <div className="flex flex-col gap-2 mt-1 max-h-[34rem] overflow-y-auto scroll-thin pr-1 -mr-1">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8 text-xs text-muted-foreground border border-dashed rounded-md">
              <Inbox className="size-5 mb-1 opacity-60" />
              Sin contactos
            </div>
          ) : (
            contacts.map((c) => (
              <ContactCard key={c.id} contact={c} onClick={() => onCardClick(c)} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function KanbanColumnSkeleton({ stageKey }: { stageKey: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col gap-2 mt-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <span className="sr-only">{stageKey}</span>
    </div>
  )
}

/* ---------------- Contact card ---------------- */

function ContactCard({
  contact,
  onClick,
}: {
  contact: CrmContactWithActivities
  onClick: () => void
}) {
  const source = contact.source ? SOURCES[contact.source] || contact.source : null
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-card rounded-lg border p-3 hover:border-primary/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {contact.name}
          </p>
          {contact.company && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="size-3" />
              {contact.company}
            </p>
          )}
        </div>
        {source && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {source}
          </Badge>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-emerald-700">
          {usd(contact.value)}
        </span>
        {contact.activities && contact.activities.length > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <StickyNote className="size-3" />
            {contact.activities.length} act.
          </span>
        )}
      </div>
    </button>
  )
}

/* ---------------- Create dialog ---------------- */

function CreateContactDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (form: Record<string, string>) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>Nuevo contacto CRM</DialogTitle>
          <DialogDescription>
            Agrega un lead, proveedor, socio o afiliado potencial al pipeline.
          </DialogDescription>
        </DialogHeader>
        <CreateContactFormBody
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateContactFormBody({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: Record<string, string>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'LEAD',
    value: '',
    source: 'WEB',
    notes: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.email.trim()

  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label htmlFor="c-name">Nombre *</Label>
            <Input
              id="c-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label htmlFor="c-company">Empresa</Label>
            <Input
              id="c-company"
              value={form.company}
              onChange={(e) => set('company', e.target.value)}
              placeholder="Distribuidora XYZ"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label htmlFor="c-email">Email *</Label>
            <Input
              id="c-email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="juan@empresa.com"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <Label htmlFor="c-phone">Teléfono</Label>
            <Input
              id="c-phone"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="099 123 4567"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-stage">Etapa</Label>
            <Select value={form.stage} onValueChange={(v) => set('stage', v)}>
              <SelectTrigger id="c-stage" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-source">Origen</Label>
            <Select value={form.source} onValueChange={(v) => set('source', v)}>
              <SelectTrigger id="c-source" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-value">Valor potencial (USD)</Label>
          <Input
            id="c-value"
            inputMode="numeric"
            value={form.value}
            onChange={(e) => set('value', e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="1500"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-notes">Notas</Label>
          <Textarea
            id="c-notes"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Contexto, intereses, próximos pasos…"
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!valid} onClick={() => onSubmit(form)}>
          <Plus />
          Crear contacto
        </Button>
      </DialogFooter>
    </>
  )
}

/* ---------------- Detail dialog ---------------- */

function ContactDetailDialog({
  contact,
  onOpenChange,
  onStageChange,
  onAddActivity,
}: {
  contact: CrmContactWithActivities | null
  onOpenChange: (v: boolean) => void
  onStageChange: (id: string, stage: string) => void
  onAddActivity: (
    id: string,
    form: { type: string; subject: string; description: string; dueDate: string }
  ) => void
}) {
  const [actForm, setActForm] = useState({
    type: 'NOTE',
    subject: '',
    description: '',
    dueDate: '',
  })

  if (!contact) return null
  const stageBadge = STAGE_COLORS[contact.stage] || STAGE_COLORS.LEAD
  const activities = contact.activities || []

  const submitActivity = () => {
    if (!actForm.subject.trim()) return
    onAddActivity(contact.id, actForm)
    setActForm({ type: 'NOTE', subject: '', description: '', dueDate: '' })
  }

  return (
    <Dialog open={!!contact} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="min-w-0">
              <DialogTitle className="truncate">{contact.name}</DialogTitle>
              <DialogDescription className="truncate">
                {contact.company || 'Sin empresa'} · creado {shortDate(contact.createdAt)}
              </DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${stageBadge}`}>
                    {STAGE_LABELS[contact.stage] || contact.stage}
                  </span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Cambiar etapa</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STAGES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onStageChange(contact.id, s)}
                    disabled={s === contact.stage}
                  >
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${STAGE_COLORS[s]}`}>
                      {STAGE_LABELS[s]}
                    </span>
                    {s === contact.stage && <span className="ml-auto text-xs text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={Mail} label="Email" value={contact.email} />
            <InfoTile icon={Phone} label="Teléfono" value={contact.phone || '—'} />
            <InfoTile icon={Building2} label="Empresa" value={contact.company || '—'} />
            <InfoTile icon={DollarSign} label="Valor potencial" value={usd(contact.value)} accent="emerald" />
          </div>

          {contact.notes && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <StickyNote className="size-3" /> Notas
              </p>
              <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
            </div>
          )}

          {/* Activities timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Actividades ({activities.length})</h4>
            </div>
            {activities.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Aún no hay actividades registradas.
              </div>
            ) : (
              <ol className="space-y-2 max-h-64 overflow-y-auto scroll-thin pr-1">
                {activities.map((a) => {
                  const Icon = ACTIVITY_ICONS[a.type] || StickyNote
                  return (
                    <li key={a.id} className="flex gap-3 rounded-lg border p-2.5 bg-card">
                      <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{a.subject}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {shortDate(a.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {a.description || ACTIVITY_TYPES[a.type] || a.type}
                        </p>
                        {a.dueDate && (
                          <p className="text-[10px] mt-1 text-amber-700 flex items-center gap-1">
                            <CalendarDays className="size-3" /> Vence: {shortDate(a.dueDate)}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>

          {/* Add activity form */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <h4 className="text-sm font-semibold">Agregar actividad</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="a-type" className="text-xs">Tipo</Label>
                <Select value={actForm.type} onValueChange={(v) => setActForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger id="a-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-due" className="text-xs">Fecha límite</Label>
                <Input
                  id="a-due"
                  type="date"
                  value={actForm.dueDate}
                  onChange={(e) => setActForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-subject" className="text-xs">Asunto *</Label>
              <Input
                id="a-subject"
                value={actForm.subject}
                onChange={(e) => setActForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Llamar para confirmar reunión"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-desc" className="text-xs">Descripción</Label>
              <Textarea
                id="a-desc"
                value={actForm.description}
                onChange={(e) => setActForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Detalles de la actividad…"
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" disabled={!actForm.subject.trim()} onClick={submitActivity}>
                <Plus /> Agregar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Mail
  label: string
  value: string
  accent?: 'emerald'
}) {
  return (
    <div className="rounded-lg border p-2.5 bg-card">
      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
        <Icon className="size-3" /> {label}
      </p>
      <p className={`text-sm font-medium truncate ${accent === 'emerald' ? 'text-emerald-700' : ''}`}>
        {value}
      </p>
    </div>
  )
}
