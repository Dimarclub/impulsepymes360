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
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  MailPlus,
  Send,
  Trash2,
  Users,
  MailCheck,
  MousePointerClick,
  Plus,
  RefreshCw,
  CalendarClock,
  CheckCircle2,
  Pencil,
  Eye,
} from 'lucide-react'
import type { EmailCampaign } from '@/lib/types'
import { useAppStore } from '@/lib/store'

interface Subscriber {
  id: string
  email: string
  name?: string | null
  segment: string
  active: boolean
  createdAt: string
}

const TEMPLATES: Record<string, string> = {
  PROMOTION: 'Promoción',
  NEW_MEMBER: 'Nuevo miembro',
  COMMISSION: 'Comisión',
  NEWSLETTER: 'Newsletter',
}
const AUDIENCES: Record<string, string> = {
  ALL: 'Todos',
  CLIENTS: 'Clientes',
  AFFILIATES: 'Afiliados',
  SUPPLIERS: 'Proveedores',
  PARTNERS: 'Socios',
}
const SEGMENTS: Record<string, string> = AUDIENCES

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SCHEDULED: 'bg-amber-100 text-amber-700',
  SENT: 'bg-emerald-100 text-emerald-700',
}
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  SENT: 'Enviada',
}

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

export function EmailModule() {
  const toast = useAppStore((s) => s.toast)
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EmailCampaign | null>(null)
  const [subOpen, setSubOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        fetch('/api/email/campaigns', { cache: 'no-store' }),
        fetch('/api/email/subscribers', { cache: 'no-store' }),
      ])
      if (cRes.ok) setCampaigns(await cRes.json())
      if (sRes.ok) setSubscribers(await sRes.json())
    } catch {
      toast('Error al cargar email marketing', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const total = campaigns.length
    const sent = campaigns.filter((c) => c.status === 'SENT')
    const sentCount = sent.length
    const totalRecipients = sent.reduce((s, c) => s + (c.recipientCount || 0), 0)
    const totalOpens = sent.reduce((s, c) => s + (c.openCount || 0), 0)
    const avgOpen = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0
    return {
      total,
      sentCount,
      subscribers: subscribers.length,
      avgOpen,
    }
  }, [campaigns, subscribers])

  const handleCreate = async (form: Record<string, string>) => {
    try {
      const res = await fetch('/api/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          subject: form.subject,
          content: form.content,
          template: form.template || 'PROMOTION',
          audience: form.audience || 'ALL',
          status: form.status || 'DRAFT',
          scheduledAt: form.scheduledAt || null,
        }),
      })
      if (!res.ok) throw new Error('No se pudo crear la campaña')
      toast('Campaña creada correctamente')
      setCreateOpen(false)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleSend = async (c: EmailCampaign) => {
    try {
      const res = await fetch(`/api/email/campaigns/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT', recipientCount: c.recipientCount }),
      })
      if (!res.ok) throw new Error('No se pudo enviar la campaña')
      toast(`Campaña "${c.name}" enviada a ${c.recipientCount} destinatarios`)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleDelete = async (c: EmailCampaign) => {
    try {
      const res = await fetch(`/api/email/campaigns/${c.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar la campaña')
      toast('Campaña eliminada')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleAddSubscriber = async (form: { email: string; name: string; segment: string }) => {
    try {
      const res = await fetch('/api/email/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('No se pudo agregar el suscriptor')
      toast('Suscriptor agregado')
      setSubOpen(false)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const toggleSubscriber = (sub: Subscriber) => {
    // El API actual solo soporta POST (upsert activando). Mostramos feedback.
    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, active: !s.active } : s))
    )
    toast(
      sub.active
        ? 'Suscriptor desactivado (demo local)'
        : 'Suscriptor reactivado (demo local)',
      'info'
    )
  }

  return (
    <div className="space-y-6">
      <Header loading={loading} onReload={load} onNew={() => setCreateOpen(true)} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Mail} label="Total campañas" value={String(stats.total)} tone="emerald" />
        <StatCard icon={Send} label="Enviadas" value={String(stats.sentCount)} tone="emerald" />
        <StatCard icon={Users} label="Suscriptores" value={String(stats.subscribers)} tone="amber" />
        <StatCard icon={MailCheck} label="Open rate promedio" value={`${stats.avgOpen.toFixed(1)}%`} tone="amber" />
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="size-4" />
            Campañas ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="size-4" />
            Suscriptores ({subscribers.length})
          </TabsTrigger>
        </TabsList>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="space-y-3">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 w-full rounded-xl" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <Mail className="size-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">No hay campañas todavía</p>
              <p className="text-sm text-muted-foreground mb-3">
                Crea tu primera campaña de email marketing.
              </p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus /> Nueva campaña
              </Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  onSend={() => handleSend(c)}
                  onDelete={() => setDeleteTarget(c)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscribers */}
        <TabsContent value="subscribers">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Suscriptores</CardTitle>
                <CardDescription className="text-xs">
                  Lista de contactos suscritos a tu boletín y comunicaciones.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setSubOpen(true)}>
                <MailPlus /> Agregar suscriptor
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Aún no hay suscriptores registrados.
                </div>
              ) : (
                <div className="max-h-[28rem] overflow-y-auto scroll-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Segmento</TableHead>
                        <TableHead className="text-center">Activo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium truncate max-w-[16rem]">{s.email}</TableCell>
                          <TableCell className="text-muted-foreground truncate max-w-[12rem]">
                            {s.name || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {SEGMENTS[s.segment] || s.segment}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch checked={s.active} onCheckedChange={() => toggleSubscriber(s)} />
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
      </Tabs>

      {/* Create campaign */}
      <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />

      {/* Add subscriber */}
      <AddSubscriberDialog open={subOpen} onOpenChange={setSubOpen} onSubmit={handleAddSubscriber} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La campaña
              <span className="font-medium"> {deleteTarget?.name} </span>
              se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              <Trash2 className="size-4" /> Eliminar
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
          Email Marketing
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea, programa y mide tus campañas de correo.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Refrescar
        </Button>
        <Button size="sm" onClick={onNew}>
          <Plus /> Nueva campaña
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
  icon: typeof Mail
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

/* ---------------- Campaign card ---------------- */

function CampaignCard({
  campaign,
  onSend,
  onDelete,
}: {
  campaign: EmailCampaign
  onSend: () => void
  onDelete: () => void
}) {
  const status = campaign.status
  const openRate =
    campaign.recipientCount > 0 ? (campaign.openCount / campaign.recipientCount) * 100 : 0
  const clickRate =
    campaign.recipientCount > 0 ? (campaign.clickCount / campaign.recipientCount) * 100 : 0
  const isSent = status === 'SENT'
  const isDraft = status === 'DRAFT'

  return (
    <Card className="gap-0 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm truncate">{campaign.name}</CardTitle>
            <CardDescription className="text-xs truncate">{campaign.subject}</CardDescription>
          </div>
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {AUDIENCES[campaign.audience] || campaign.audience}
          </Badge>
          {campaign.template && (
            <Badge variant="secondary" className="text-[10px]">
              {TEMPLATES[campaign.template] || campaign.template}
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Destinatarios" value={String(campaign.recipientCount)} />
          <Metric label="Open rate" value={`${openRate.toFixed(0)}%`} icon={MailCheck} />
          <Metric label="Click rate" value={`${clickRate.toFixed(0)}%`} icon={MousePointerClick} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span className="flex items-center gap-1">
            {isSent ? (
              <>
                <CheckCircle2 className="size-3 text-emerald-600" /> Enviada {shortDate(campaign.sentAt)}
              </>
            ) : campaign.scheduledAt ? (
              <>
                <CalendarClock className="size-3 text-amber-600" /> Programada {shortDate(campaign.scheduledAt)}
              </>
            ) : (
              <>
                <Pencil className="size-3" /> Borrador · {shortDate(campaign.createdAt)}
              </>
            )}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 pt-0 pb-4 px-6">
        <Button
          size="sm"
          variant="default"
          className="flex-1"
          onClick={onSend}
          disabled={!isDraft && status !== 'SCHEDULED'}
        >
          <Send className="size-3.5" /> Enviar ahora
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof MailCheck
}) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

/* ---------------- Create campaign dialog ---------------- */

function CreateCampaignDialog({
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
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>Nueva campaña</DialogTitle>
          <DialogDescription>
            Configura el contenido y la audiencia. La vista previa se actualiza en vivo.
          </DialogDescription>
        </DialogHeader>
        <CreateCampaignFormBody
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CreateCampaignFormBody({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: Record<string, string>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    subject: '',
    content: '',
    template: 'PROMOTION',
    audience: 'ALL',
    status: 'DRAFT',
    scheduledAt: '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.subject.trim() && form.content.trim()

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4 py-1">
        {/* Form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="e-name">Nombre *</Label>
            <Input
              id="e-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Promo de fin de mes"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-subject">Asunto *</Label>
            <Input
              id="e-subject"
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="Aprovecha 20% off en marketplace"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-template">Plantilla</Label>
              <Select value={form.template} onValueChange={(v) => set('template', v)}>
                <SelectTrigger id="e-template" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-audience">Audiencia</Label>
              <Select value={form.audience} onValueChange={(v) => set('audience', v)}>
                <SelectTrigger id="e-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AUDIENCES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-status">Estado</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger id="e-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="SCHEDULED">Programada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-when">Programar para</Label>
              <Input
                id="e-when"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => set('scheduledAt', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-content">Contenido *</Label>
            <Textarea
              id="e-content"
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              placeholder="Hola {nombre}, te traemos una oferta especial…"
              rows={5}
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs">
            <Eye className="size-3" /> Vista previa
          </Label>
          <EmailPreview
            subject={form.subject}
            content={form.content}
            template={form.template}
            audience={form.audience}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!valid} onClick={() => onSubmit(form)}>
          <Plus /> Crear campaña
        </Button>
      </DialogFooter>
    </>
  )
}

function EmailPreview({
  subject,
  content,
  template,
  audience,
}: {
  subject: string
  content: string
  template: string
  audience: string
}) {
  const headerBg =
    template === 'PROMOTION'
      ? 'from-emerald-600 to-emerald-500'
      : template === 'NEW_MEMBER'
      ? 'from-amber-500 to-amber-400'
      : template === 'COMMISSION'
      ? 'from-emerald-700 to-amber-500'
      : 'from-emerald-500 to-teal-500'
  return (
    <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
      <div className={`bg-gradient-to-r ${headerBg} text-white p-3`}>
        <p className="text-[10px] uppercase tracking-wider opacity-80">Dimarclub · {TEMPLATES[template]}</p>
        <p className="text-sm font-semibold leading-tight mt-0.5 line-clamp-2">
          {subject || 'Asunto de tu campaña'}
        </p>
      </div>
      <div className="p-3">
        <p className="text-[11px] text-muted-foreground mb-2">
          Para: {AUDIENCES[audience] || 'Todos'} · hola@dimarclub.com
        </p>
        <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed min-h-[8rem]">
          {content || 'La vista previa de tu contenido aparecerá aquí a medida que escribas…'}
        </div>
        <div className="mt-3 pt-2 border-t text-[10px] text-muted-foreground">
          © Dimarclub — Marketplace con comunidad. Cancela tu suscripción cuando quieras.
        </div>
      </div>
    </div>
  )
}

/* ---------------- Add subscriber dialog ---------------- */

function AddSubscriberDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (form: { email: string; name: string; segment: string }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Agregar suscriptor</DialogTitle>
          <DialogDescription>
            Si el email ya existe, se actualizará su nombre y segmento.
          </DialogDescription>
        </DialogHeader>
        <AddSubscriberFormBody
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function AddSubscriberFormBody({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: { email: string; name: string; segment: string }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ email: '', name: '', segment: 'ALL' })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const valid = /\S+@\S+\.\S+/.test(form.email)

  return (
    <>
      <div className="space-y-3 py-1">
        <div className="space-y-1.5">
          <Label htmlFor="s-email">Email *</Label>
          <Input
            id="s-email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="cliente@correo.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Nombre</Label>
          <Input
            id="s-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="María González"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-segment">Segmento</Label>
          <Select value={form.segment} onValueChange={(v) => set('segment', v)}>
            <SelectTrigger id="s-segment" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SEGMENTS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!valid} onClick={() => onSubmit(form)}>
          <Plus /> Agregar
        </Button>
      </DialogFooter>
    </>
  )
}
