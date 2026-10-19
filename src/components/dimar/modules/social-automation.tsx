'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Zap,
  Plus,
  Play,
  Pause,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Hash,
  Layers,
  CalendarClock,
  Sparkles,
  Package,
  Repeat,
  Newspaper,
  CheckCircle2,
  TrendingUp,
  TimerReset,
  Instagram,
  Facebook,
  Music2,
  Twitter,
  Rocket,
} from 'lucide-react'
import type { AutomationRule, Category } from '@/lib/types'
import { useAppStore } from '@/lib/store'

// ---------- Tipos locales ----------

interface RuleConfig {
  categoryId?: string | null
  count?: number
  platforms?: string[]
  template?: string
  frequency?: string
}

interface QuickTemplate {
  key: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  preset: {
    name: string
    type: 'BULK_PRODUCT' | 'RECURRING' | 'DAILY_DIGEST'
    config: RuleConfig
  }
}

// ---------- Mapas de labels / colors ----------

const TYPE_LABELS: Record<string, string> = {
  BULK_PRODUCT: 'Productos masivos',
  RECURRING: 'Recurrente',
  DAILY_DIGEST: 'Resumen diario',
}

const TYPE_BADGES: Record<string, string> = {
  BULK_PRODUCT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  RECURRING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DAILY_DIGEST: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BULK_PRODUCT: Package,
  RECURRING: Repeat,
  DAILY_DIGEST: Newspaper,
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
}

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PAUSED: 'bg-muted text-muted-foreground',
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
}

const TEMPLATE_LABELS: Record<string, string> = {
  featured: 'Destacados',
  'new-arrivals': 'Nuevos productos',
  discount: 'Con descuento',
}

const PLATFORMS = [
  { key: 'INSTAGRAM', label: 'Instagram', icon: Instagram },
  { key: 'FACEBOOK', label: 'Facebook', icon: Facebook },
  { key: 'TIKTOK', label: 'TikTok', icon: Music2 },
  { key: 'X', label: 'X', icon: Twitter },
] as const

// ---------- Plantillas rápidas ----------

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    key: 'daily-featured',
    name: 'Producto destacado diario',
    description: 'Crea 1 post por día desde productos destacados en Instagram y Facebook.',
    icon: TrendingUp,
    preset: {
      name: 'Producto destacado diario',
      type: 'DAILY_DIGEST',
      config: {
        count: 1,
        platforms: ['INSTAGRAM', 'FACEBOOK'],
        template: 'featured',
        frequency: 'DAILY',
      },
    },
  },
  {
    key: 'weekly-benefits',
    name: 'Beneficios semanales',
    description: 'Post semanal de beneficios en TikTok e Instagram cada lunes.',
    icon: CalendarClock,
    preset: {
      name: 'Beneficios semanales',
      type: 'RECURRING',
      config: {
        count: 1,
        platforms: ['TIKTOK', 'INSTAGRAM'],
        template: 'featured',
        frequency: 'WEEKLY',
      },
    },
  },
  {
    key: 'new-arrivals',
    name: 'Nuevos productos',
    description: 'Post semanal con los productos más nuevos en todas las plataformas.',
    icon: Sparkles,
    preset: {
      name: 'Nuevos productos',
      type: 'BULK_PRODUCT',
      config: {
        count: 3,
        platforms: ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'X'],
        template: 'new-arrivals',
        frequency: 'WEEKLY',
      },
    },
  },
]

// ---------- Helpers ----------

function safeParseConfig(raw: string | null | undefined): RuleConfig {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as RuleConfig
    return {}
  } catch {
    return {}
  }
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(d))
  } catch {
    return '—'
  }
}

// ---------- Componente principal ----------

export function SocialAutomationModule() {
  const toast = useAppStore((s) => s.toast)

  const [rules, setRules] = useState<AutomationRule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AutomationRule | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState<'BULK_PRODUCT' | 'RECURRING' | 'DAILY_DIGEST'>('BULK_PRODUCT')
  const [categoryId, setCategoryId] = useState<string>('')
  const [count, setCount] = useState(2)
  const [template, setTemplate] = useState('featured')
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM', 'FACEBOOK'])
  const [frequency, setFrequency] = useState('DAILY')

  // Flatten categories for select (parent + children)
  const flatCategories = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = []
    for (const c of categories) {
      out.push({ id: c.id, name: c.name, depth: 0 })
      if (c.children) {
        for (const ch of c.children) {
          out.push({ id: ch.id, name: ch.name, depth: 1 })
        }
      }
    }
    return out
  }, [categories])

  // Stats
  const stats = useMemo(() => {
    const active = rules.filter((r) => r.status === 'ACTIVE').length
    const totalPosts = rules.reduce((s, r) => s + (r.postsCreated ?? 0), 0)
    const lastRun = rules
      .map((r) => r.lastRunAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]
    return { active, totalPosts, lastRun }
  }, [rules])

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, catRes] = await Promise.all([
        fetch('/api/social/automation'),
        fetch('/api/categories'),
      ])
      if (!rulesRes.ok) throw new Error('rules')
      const data = (await rulesRes.json()) as AutomationRule[]
      setRules(data)
      if (catRes.ok) {
        const cats = (await catRes.json()) as Category[]
        setCategories(cats)
      }
    } catch {
      toast('Error al cargar las reglas', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void fetchRules()
  }, [fetchRules])

  // ---------- Handlers ----------

  const resetForm = () => {
    setName('')
    setType('BULK_PRODUCT')
    setCategoryId('')
    setCount(2)
    setTemplate('featured')
    setPlatforms(['INSTAGRAM', 'FACEBOOK'])
    setFrequency('DAILY')
    setEditId(null)
  }

  const openCreate = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (rule: AutomationRule) => {
    const cfg = safeParseConfig(rule.config)
    setName(rule.name)
    setType(rule.type as typeof type)
    setCategoryId(cfg.categoryId ?? '')
    setCount(cfg.count ?? 2)
    setTemplate(cfg.template ?? 'featured')
    setPlatforms(cfg.platforms ?? ['INSTAGRAM'])
    setFrequency(cfg.frequency ?? 'DAILY')
    setEditId(rule.id)
    setDialogOpen(true)
  }

  const applyTemplate = (t: QuickTemplate) => {
    setName(t.preset.name)
    setType(t.preset.type)
    setCategoryId('')
    setCount(t.preset.config.count ?? 2)
    setTemplate(t.preset.config.template ?? 'featured')
    setPlatforms(t.preset.config.platforms ?? ['INSTAGRAM'])
    setFrequency(t.preset.config.frequency ?? 'DAILY')
    setEditId(null)
    setDialogOpen(true)
  }

  const togglePlatform = (key: string) => {
    setPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    )
  }

  const submit = async () => {
    if (!name.trim()) {
      toast('El nombre es obligatorio', 'error')
      return
    }
    if (platforms.length === 0) {
      toast('Selecciona al menos una plataforma', 'error')
      return
    }
    setSaving(true)
    const payload = {
      name: name.trim(),
      type,
      config: {
        categoryId: type === 'BULK_PRODUCT' ? categoryId || null : null,
        count,
        platforms,
        template,
        frequency,
      },
      status: 'ACTIVE' as const,
    }
    try {
      if (editId) {
        const res = await fetch(`/api/social/automation/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('update')
        const updated = (await res.json()) as AutomationRule
        setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
        toast('¡Regla actualizada!')
      } else {
        const res = await fetch('/api/social/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('create')
        const created = (await res.json()) as AutomationRule
        setRules((prev) => [created, ...prev])
        toast('¡Regla creada!')
      }
      setDialogOpen(false)
      resetForm()
    } catch {
      toast('Error al guardar la regla', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (rule: AutomationRule) => {
    const next = rule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    // Optimistic
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, status: next } : r)),
    )
    try {
      const res = await fetch(`/api/social/automation/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error('status')
      toast(next === 'ACTIVE' ? 'Regla activada' : 'Regla pausada', 'info')
    } catch {
      // rollback
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, status: rule.status } : r)),
      )
      toast('Error al cambiar estado', 'error')
    }
  }

  const executeNow = async (rule: AutomationRule) => {
    setExecutingId(rule.id)
    try {
      const res = await fetch(`/api/social/automation/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ execute: true }),
      })
      if (!res.ok) throw new Error('execute')
      const data = (await res.json()) as { executed: boolean; postsCreated: number }
      toast(`¡${data.postsCreated} post${data.postsCreated === 1 ? '' : 's'} creado${data.postsCreated === 1 ? '' : 's'}!`)
      // Refrescar reglas para ver lastRunAt y postsCreated actualizados
      void fetchRules()
    } catch {
      toast('Error al ejecutar la regla', 'error')
    } finally {
      setExecutingId(null)
    }
  }

  const askDelete = (rule: AutomationRule) => {
    setDeleteTarget(rule)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/social/automation/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete')
      setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      toast('Regla eliminada', 'info')
    } catch {
      toast('Error al eliminar', 'error')
    } finally {
      setDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-accent/80 text-primary-foreground">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
              <Zap className="size-3.5" />
              Dimarclub Social · Automatización
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Automatización de contenido
            </h1>
            <p className="text-primary-foreground/80 text-sm sm:text-base">
              Convierte tu catálogo en posts automáticos. Configura reglas una vez y deja que Dimarclub genere borradores por ti.
            </p>
          </div>
          <Button
            onClick={openCreate}
            variant="secondary"
            size="lg"
            className="bg-white text-primary hover:bg-white/90 shrink-0"
          >
            <Plus className="size-4" />
            Crear regla
          </Button>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Rocket className="size-5" />}
          label="Reglas activas"
          value={stats.active}
          tone="emerald"
        />
        <StatCard
          icon={<Hash className="size-5" />}
          label="Posts generados totales"
          value={stats.totalPosts}
          tone="amber"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Última ejecución"
          value={fmtDate(stats.lastRun)}
          tone="muted"
          isText
        />
      </div>

      {/* Quick templates */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Plantillas rápidas
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUICK_TEMPLATES.map((t) => {
            const Icon = t.icon
            return (
              <Card
                key={t.key}
                className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                onClick={() => applyTemplate(t)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary flex items-center justify-center group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground transition-colors">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {TYPE_LABELS[t.preset.type]}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold leading-tight">{t.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {t.preset.config.platforms?.map((p) => {
                      const Pi = PLATFORMS.find((x) => x.key === p)?.icon ?? Hash
                      return (
                        <span
                          key={p}
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                        >
                          <Pi className="size-2.5" />
                          {p}
                        </span>
                      )
                    })}
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                      <CalendarClock className="size-2.5" />
                      {FREQUENCY_LABELS[t.preset.config.frequency ?? 'DAILY']}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                    Usar plantilla
                    <Plus className="size-3" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tus reglas ({rules.length})
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Nueva regla
          </Button>
        </div>

        {rules.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-14 flex flex-col items-center text-center gap-4">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                <Zap className="size-7 text-primary" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-lg font-semibold">No tienes reglas de automatización</h3>
                <p className="text-sm text-muted-foreground">
                  Crea tu primera regla o usa una plantilla rápida para empezar a generar posts automáticamente.
                </p>
              </div>
              <Button onClick={openCreate} size="lg">
                <Plus className="size-4" />
                Crear mi primera regla
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                categories={flatCategories}
                executing={executingId === rule.id}
                onExecute={() => executeNow(rule)}
                onToggle={() => toggleStatus(rule)}
                onEdit={() => openEdit(rule)}
                onDelete={() => askDelete(rule)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) resetForm()
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-5 text-primary" />
              {editId ? 'Editar regla' : 'Nueva regla de automatización'}
            </DialogTitle>
            <DialogDescription>
              Configura cómo se generarán los posts automáticamente desde tu catálogo.
            </DialogDescription>
          </DialogHeader>

          <RuleFormBody
            name={name}
            setName={setName}
            type={type}
            setType={(v) => setType(v as typeof type)}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            count={count}
            setCount={setCount}
            template={template}
            setTemplate={setTemplate}
            platforms={platforms}
            togglePlatform={togglePlatform}
            frequency={frequency}
            setFrequency={setFrequency}
            categories={flatCategories}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {editId ? 'Guardar cambios' : 'Crear regla'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta regla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la regla <strong>{deleteTarget?.name}</strong>. Los posts ya
              generados no se verán afectados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar regla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Sub-component: StatCard ----------

function StatCard({
  icon,
  label,
  value,
  tone,
  isText,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  tone: 'emerald' | 'amber' | 'muted'
  isText?: boolean
}) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-primary/10 text-primary'
      : tone === 'amber'
        ? 'bg-accent/15 text-accent-foreground'
        : 'bg-muted text-muted-foreground'
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`size-11 rounded-xl flex items-center justify-center ${toneClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {label}
          </p>
          <p className={`font-bold leading-tight ${isText ? 'text-base' : 'text-2xl'}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Sub-component: RuleCard ----------

function RuleCard({
  rule,
  categories,
  executing,
  onExecute,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule
  categories: { id: string; name: string; depth: number }[]
  executing: boolean
  onExecute: () => void
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const cfg = safeParseConfig(rule.config)
  const TypeIcon = TYPE_ICONS[rule.type] ?? Zap
  const isActive = rule.status === 'ACTIVE'
  const categoryName = cfg.categoryId
    ? categories.find((c) => c.id === cfg.categoryId)?.name
    : null

  return (
    <Card className={isActive ? '' : 'opacity-75'}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_BADGES[rule.type] ?? 'bg-muted'}`}>
              <TypeIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight truncate">
                {rule.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_BADGES[rule.type] ?? ''}`}>
                  {TYPE_LABELS[rule.type] ?? rule.type}
                </span>
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGES[rule.status] ?? ''}`}>
                  {STATUS_LABELS[rule.status] ?? rule.status}
                </span>
              </CardDescription>
            </div>
          </div>
          <Switch checked={isActive} onCheckedChange={onToggle} aria-label="Activar/pausar" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        {/* Config summary */}
        <div className="space-y-2">
          {/* Platforms */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium w-16">
              Plataformas
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {(cfg.platforms ?? []).map((p) => {
                const Pi = PLATFORMS.find((x) => x.key === p)?.icon ?? Hash
                return (
                  <Badge key={p} variant="secondary" className="text-[10px] gap-1">
                    <Pi className="size-2.5" />
                    {p}
                  </Badge>
                )
              })}
              {(!cfg.platforms || cfg.platforms.length === 0) && (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* Frequency */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium w-16">
              Frecuencia
            </span>
            <Badge variant="outline" className="text-[10px] gap-1">
              <TimerReset className="size-2.5" />
              {FREQUENCY_LABELS[cfg.frequency ?? 'DAILY'] ?? cfg.frequency}
            </Badge>
            {cfg.count != null && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Hash className="size-2.5" />
                {cfg.count} post{cfg.count === 1 ? '' : 's'}
              </Badge>
            )}
          </div>

          {/* Category + template */}
          {(categoryName || cfg.template) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium w-16">
                Detalle
              </span>
              {categoryName && (
                <Badge variant="outline" className="text-[10px]">
                  {categoryName}
                </Badge>
              )}
              {cfg.template && (
                <Badge variant="outline" className="text-[10px]">
                  {TEMPLATE_LABELS[cfg.template] ?? cfg.template}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Run info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Última ejecución
            </p>
            <p className="font-medium mt-0.5 flex items-center gap-1">
              <Clock className="size-3 text-muted-foreground" />
              {fmtDate(rule.lastRunAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Posts creados
            </p>
            <p className="font-medium mt-0.5 flex items-center gap-1">
              <Hash className="size-3 text-muted-foreground" />
              {rule.postsCreated ?? 0}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center gap-2 border-t pt-4">
        <Button
          size="sm"
          variant="default"
          onClick={onExecute}
          disabled={executing}
          className="flex-1"
        >
          {executing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Ejecutando…
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Ejecutar ahora
            </>
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={onToggle} disabled={executing}>
          {isActive ? (
            <>
              <Pause className="size-3.5" />
              Pausar
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              Activar
            </>
          )}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit} disabled={executing} aria-label="Editar">
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={executing}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Eliminar"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

// ---------- Sub-component: RuleFormBody ----------

function RuleFormBody({
  name,
  setName,
  type,
  setType,
  categoryId,
  setCategoryId,
  count,
  setCount,
  template,
  setTemplate,
  platforms,
  togglePlatform,
  frequency,
  setFrequency,
  categories,
}: {
  name: string
  setName: (v: string) => void
  type: 'BULK_PRODUCT' | 'RECURRING' | 'DAILY_DIGEST'
  setType: (v: string) => void
  categoryId: string
  setCategoryId: (v: string) => void
  count: number
  setCount: (v: number) => void
  template: string
  setTemplate: (v: string) => void
  platforms: string[]
  togglePlatform: (key: string) => void
  frequency: string
  setFrequency: (v: string) => void
  categories: { id: string; name: string; depth: number }[]
}) {
  return (
    <div className="space-y-4 py-2">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="rule-name">Nombre *</Label>
        <Input
          id="rule-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Productos destacados diarios"
          maxLength={80}
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label>Tipo de automatización</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BULK_PRODUCT">
              <span className="flex items-center gap-2">
                <Package className="size-4 text-amber-600" />
                Productos masivos
              </span>
            </SelectItem>
            <SelectItem value="RECURRING">
              <span className="flex items-center gap-2">
                <Repeat className="size-4 text-emerald-600" />
                Recurrente
              </span>
            </SelectItem>
            <SelectItem value="DAILY_DIGEST">
              <span className="flex items-center gap-2">
                <Newspaper className="size-4 text-sky-600" />
                Resumen diario
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {type === 'BULK_PRODUCT' && 'Genera posts desde productos de una categoría.'}
          {type === 'RECURRING' && 'Genera el mismo post recurrentemente (beneficios, promos).'}
          {type === 'DAILY_DIGEST' && 'Genera un resumen diario de productos destacados.'}
        </p>
      </div>

      {/* Conditional BULK_PRODUCT fields */}
      {type === 'BULK_PRODUCT' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select value={categoryId || 'all'} onValueChange={(v) => setCategoryId(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className={c.depth === 1 ? 'pl-3' : ''}>
                      {c.depth === 1 ? '↳ ' : ''}
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-count">Cantidad (1-10)</Label>
            <Input
              id="rule-count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (isNaN(v)) setCount(1)
                else setCount(Math.max(1, Math.min(10, v)))
              }}
            />
          </div>
        </div>
      )}

      {/* Template */}
      <div className="space-y-1.5">
        <Label>Plantilla de contenido</Label>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Destacados</SelectItem>
            <SelectItem value="new-arrivals">Nuevos productos</SelectItem>
            <SelectItem value="discount">Con descuento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Platforms */}
      <div className="space-y-2">
        <Label>Plataformas *</Label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map((p) => {
            const selected = platforms.includes(p.key)
            const Icon = p.icon
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePlatform(p.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{p.label}</span>
                {selected && <CheckCircle2 className="size-3.5 ml-auto" />}
              </button>
            )
          })}
        </div>
        {platforms.length === 0 && (
          <p className="text-xs text-destructive">Selecciona al menos una plataforma.</p>
        )}
      </div>

      {/* Frequency */}
      <div className="space-y-1.5">
        <Label>Frecuencia</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">Diario</SelectItem>
            <SelectItem value="WEEKLY">Semanal</SelectItem>
            <SelectItem value="MONTHLY">Mensual</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default SocialAutomationModule
