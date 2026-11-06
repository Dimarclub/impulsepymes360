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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Star,
  Plus,
  RefreshCw,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Clock,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Send,
  Copy,
  Share2,
  Search,
  Inbox,
  ExternalLink,
  Sparkles,
  TrendingUp,
  ChevronDown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ------------------------------------------------------------------ */
/* Tipos locales                                                       */
/* ------------------------------------------------------------------ */

interface Review {
  id: string
  userId: string
  customerName: string
  customerEmail?: string | null
  rating: number
  title?: string | null
  comment?: string | null
  source: string
  status: string
  response?: string | null
  respondedAt?: string | null
  createdAt: string
}

interface ReviewStats {
  total: number
  average: number
  distribution: Record<number, number>
  responded: number
  pending: number
}

const SOURCE_LABELS: Record<string, string> = {
  INTERNAL: 'Interna',
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
}

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: 'Publicada',
  PENDING: 'Pendiente',
  HIDDEN: 'Oculta',
}

function statusBadge(status: string) {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
    case 'HIDDEN':
      return 'bg-muted text-muted-foreground ring-1 ring-border'
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-border'
  }
}

function sourceBadge(source: string) {
  switch (source) {
    case 'GOOGLE':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'FACEBOOK':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-border'
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

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

const relativeTime = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'hace un momento'
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const days = Math.floor(hr / 24)
  if (days < 7) return `hace ${days} d`
  return shortDate(s)
}

function initials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColor(name: string): string {
  const palette = [
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
    'bg-lime-100 text-lime-700',
    'bg-orange-100 text-orange-700',
    'bg-cyan-100 text-cyan-700',
    'bg-fuchsia-100 text-fuchsia-700',
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

/* ------------------------------------------------------------------ */
/* Stars component reutilizable                                       */
/* ------------------------------------------------------------------ */

function Stars({
  rating,
  size = 'md',
  className = '',
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeCls = size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-6' : 'size-4'
  const stars = [1, 2, 3, 4, 5]
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} de 5 estrellas`}>
      {stars.map((n) => (
        <Star
          key={n}
          className={`${sizeCls} ${
            n <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-muted-foreground/40'
          }`}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Módulo principal                                                   */
/* ------------------------------------------------------------------ */

export function ResenasModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [respondOpen, setRespondOpen] = useState(false)
  const [activeReview, setActiveReview] = useState<Review | null>(null)
  const [solicitarOpen, setSolicitarOpen] = useState(false)
  const [crearOpen, setCrearOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/resenas', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar reseñas')
      const data = await res.json()
      setReviews(data.reviews || [])
      setStats(data.stats || null)
    } catch (err) {
      toast((err as Error).message || 'Error al cargar reseñas', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filterRating !== 'all' && r.rating !== Number(filterRating)) return false
      if (filterStatus !== 'all' && r.status !== filterStatus) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${r.customerName} ${r.customerEmail || ''} ${r.title || ''} ${r.comment || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [reviews, filterRating, filterStatus, search])

  const respondRate =
    stats && stats.total > 0
      ? Math.round((stats.responded / stats.total) * 100)
      : 0

  const recent = useMemo(() => reviews.slice(0, 3), [reviews])

  const handleRespondClick = (review: Review) => {
    setActiveReview(review)
    setRespondOpen(true)
  }

  const handleStatusChange = async (reviewId: string, status: string) => {
    try {
      const res = await fetch(`/api/resenas/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar el estado')
      toast(`Reseña marcada como "${STATUS_LABELS[status] || status}"`)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/resenas/${reviewId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      toast('Reseña eliminada')
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleSendResponse = async (text: string) => {
    if (!activeReview) return
    try {
      const res = await fetch(`/api/resenas/${activeReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: text }),
      })
      if (!res.ok) throw new Error('No se pudo enviar la respuesta')
      toast('Respuesta publicada')
      setRespondOpen(false)
      setActiveReview(null)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleCreate = async (form: {
    customerName: string
    customerEmail?: string
    rating: number
    title?: string
    comment?: string
    source: string
  }) => {
    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'No se pudo crear la reseña')
      }
      toast('Reseña registrada')
      setCrearOpen(false)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        loading={loading}
        onReload={load}
        onSolicitar={() => setSolicitarOpen(true)}
        onCrear={() => setCrearOpen(true)}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={Star}
          label="Promedio"
          value={stats ? stats.average.toFixed(1) : '—'}
          tone="amber"
          subtitle={stats ? `${stats.total} reseñas` : ''}
          big
        />
        <StatCard
          icon={MessageCircle}
          label="Total reseñas"
          value={stats ? String(stats.total) : '—'}
          tone="emerald"
        />
        <Card className="p-4 gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" />
            <span>Distribución</span>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = stats?.distribution?.[n] || 0
              const total = stats?.total || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-[10px] w-3 text-muted-foreground">{n}</span>
                  <Star className="size-2.5 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right tabular-nums">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
        <StatCard
          icon={CheckCircle2}
          label="Respondidas"
          value={`${respondRate}%`}
          tone="emerald"
          subtitle={stats ? `${stats.responded} de ${stats.total}` : ''}
        />
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={stats ? String(stats.pending) : '—'}
          tone="amber"
        />
      </div>

      {/* Layout principal */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
        {/* Columna izquierda: filtros + lista */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="px-4 py-3 border-b">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente, título o comentario…"
                  className="pl-8 h-9"
                />
              </div>
              <Select value={filterRating} onValueChange={setFilterRating}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="5">5 ★</SelectItem>
                  <SelectItem value="4">4 ★</SelectItem>
                  <SelectItem value="3">3 ★</SelectItem>
                  <SelectItem value="2">2 ★</SelectItem>
                  <SelectItem value="1">1 ★</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="PUBLISHED">Publicadas</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="HIDDEN">Ocultas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto scroll-thin">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-sm text-muted-foreground">
                  <Inbox className="size-8 mb-2 opacity-50" />
                  <p className="font-medium">Sin reseñas para mostrar</p>
                  <p className="text-xs mt-1">
                    {reviews.length === 0
                      ? 'Solicita tu primera reseña a tus clientes.'
                      : 'Ajusta los filtros para ver más resultados.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((r) => (
                    <ReviewCard
                      key={r.id}
                      review={r}
                      onRespond={() => handleRespondClick(r)}
                      onStatusChange={(s) => handleStatusChange(r.id, s)}
                      onDelete={() => handleDelete(r.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: widget */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Promedio general */}
          <Card className="p-5 gap-3 bg-gradient-to-br from-emerald-50/60 to-amber-50/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Promedio general</CardTitle>
              <Badge variant="outline" className="bg-background/70">
                {stats?.total || 0} reseñas
              </Badge>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold tabular-nums leading-none">
                {stats ? stats.average.toFixed(1) : '—'}
              </span>
              <div className="flex flex-col gap-1 pb-1">
                <Stars rating={Math.round(stats?.average || 0)} size="md" />
                <span className="text-xs text-muted-foreground">de 5.0</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = stats?.distribution?.[n] || 0
                const total = stats?.total || 1
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs w-8 flex items-center gap-0.5">
                      {n} <Star className="size-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
                      {count} · {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Solicitar reseña */}
          <Card className="p-5 gap-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
                <Share2 className="size-4 text-emerald-700" />
              </div>
              <div>
                <CardTitle className="text-sm">Solicitar reseña</CardTitle>
                <CardDescription className="text-xs">
                  Comparte tu enlace público con tus clientes
                </CardDescription>
              </div>
            </div>
            <Button
              variant="default"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setSolicitarOpen(true)}
            >
              <Share2 className="size-4" />
              Generar enlace
            </Button>
          </Card>

          {/* Reseñas recientes */}
          <Card className="p-5 gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Reseñas recientes
            </CardTitle>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                Aún no hay reseñas.
              </p>
            ) : (
              <div className="space-y-2">
                {recent.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border bg-muted/30 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">
                        {r.customerName}
                      </span>
                      <Stars rating={r.rating} size="sm" />
                    </div>
                    {r.title && (
                      <p className="text-xs font-medium line-clamp-1">{r.title}</p>
                    )}
                    {r.comment && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {r.comment}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {relativeTime(r.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Dialog responder */}
      <RespondDialog
        key={activeReview?.id ?? 'none'}
        open={respondOpen}
        onOpenChange={(o) => {
          setRespondOpen(o)
          if (!o) setActiveReview(null)
        }}
        review={activeReview}
        onSubmit={handleSendResponse}
      />

      {/* Dialog solicitar reseña */}
      <SolicitarDialog
        open={solicitarOpen}
        onOpenChange={setSolicitarOpen}
        userId={currentUser?.id || ''}
      />

      {/* Dialog crear manual */}
      <CrearDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function ModuleHeader({
  loading,
  onReload,
  onSolicitar,
  onCrear,
}: {
  loading: boolean
  onReload: () => void
  onSolicitar: () => void
  onCrear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gradient">
          Reseñas
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestiona tu reputación: responde, modera y comparte reseñas de tus clientes.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
        <Button variant="outline" size="sm" onClick={onCrear}>
          <Plus />
          Nueva reseña
        </Button>
        <Button
          size="sm"
          onClick={onSolicitar}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Share2 />
          Solicitar reseña
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  subtitle,
  big,
}: {
  icon: typeof Star
  label: string
  value: string
  tone: 'emerald' | 'amber'
  subtitle?: string
  big?: boolean
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
      : 'bg-amber-50 text-amber-700 ring-amber-200/60'
  return (
    <Card className="p-4 gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`size-6 rounded-md flex items-center justify-center ring-1 ${toneCls}`}>
          <Icon className="size-3.5" />
        </div>
        <span className="truncate">{label}</span>
      </div>
      <p className={`${big ? 'text-3xl' : 'text-2xl'} font-bold leading-none tabular-nums`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Review card                                                        */
/* ------------------------------------------------------------------ */

function ReviewCard({
  review,
  onRespond,
  onStatusChange,
  onDelete,
}: {
  review: Review
  onRespond: () => void
  onStatusChange: (status: string) => void
  onDelete: () => void
}) {
  const hasResponse = !!review.response && review.response.trim() !== ''
  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className={`size-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(
            review.customerName
          )}`}
        >
          {initials(review.customerName)}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header: nombre + email + fecha + badges */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-sm">{review.customerName}</span>
            {review.customerEmail && (
              <span className="text-xs text-muted-foreground">
                · {review.customerEmail}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {shortDate(review.createdAt)}
            </span>
          </div>
          {/* Rating + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} size="sm" />
            <Badge variant="outline" className={`text-[10px] ${sourceBadge(review.source)}`}>
              {SOURCE_LABELS[review.source] || review.source}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${statusBadge(review.status)}`}>
              {STATUS_LABELS[review.status] || review.status}
            </Badge>
          </div>
          {/* Title + comment */}
          {review.title && (
            <p className="text-sm font-semibold">{review.title}</p>
          )}
          {review.comment && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {review.comment}
            </p>
          )}
          {/* Response block */}
          {hasResponse && (
            <div className="mt-2 rounded-lg border border-emerald-200/60 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="size-3.5 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-700">
                  Respuesta del negocio
                </span>
                {review.respondedAt && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {shortDate(review.respondedAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                {review.response}
              </p>
            </div>
          )}
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!hasResponse && (
              <Button size="sm" variant="outline" onClick={onRespond} className="h-7 text-xs">
                <MessageSquare className="size-3" />
                Responder
              </Button>
            )}
            {hasResponse && (
              <Button size="sm" variant="ghost" onClick={onRespond} className="h-7 text-xs">
                <MessageSquare className="size-3" />
                Editar respuesta
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  <Eye className="size-3" />
                  Estado
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onStatusChange('PUBLISHED')}>
                  <Eye className="size-3.5 text-emerald-600" />
                  Publicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('PENDING')}>
                  <Clock className="size-3.5 text-amber-600" />
                  Marcar pendiente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStatusChange('HIDDEN')}>
                  <EyeOff className="size-3.5 text-muted-foreground" />
                  Ocultar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-rose-600 focus:text-rose-700">
                  <Trash2 className="size-3.5" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="size-3" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dialog responder                                                   */
/* ------------------------------------------------------------------ */

function RespondDialog({
  open,
  onOpenChange,
  review,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  review: Review | null
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState(() => review?.response || '')
  const toast = useAppStore((s) => s.toast)

  const handleSubmit = () => {
    if (!text.trim()) {
      toast('Escribe una respuesta antes de enviar', 'warning')
      return
    }
    onSubmit(text)
  }

  const sugerir = () => {
    if (!review) return
    const plantillas = [
      `¡Gracias ${review.customerName} por tomarte el tiempo de compartir tu experiencia! Valoramos mucho tu opinión y seguimos trabajando para brindarte el mejor servicio. ¡Vuelve pronto!`,
      `Hola ${review.customerName}, agradecemos mucho tus comentarios. Nos alegra saber que tu experiencia con nosotros fue positiva. Estamos a tu disposición para cualquier consulta.`,
      `¡Mil gracias ${review.customerName}! Tu reseña nos motiva a seguir mejorando cada día. Esperamos atenderte nuevamente pronto.`,
    ]
    const idx = review.rating >= 4 ? Math.floor(Math.random() * 2) : 2
    setText(plantillas[idx])
    toast('Sugerencia cargada. Revísala antes de enviar.')
  }

  if (!review) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Responder reseña</DialogTitle>
          <DialogDescription>
            Tu respuesta será visible públicamente junto con la reseña.
          </DialogDescription>
        </DialogHeader>

        {/* Preview de la reseña */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColor(
                review.customerName
              )}`}
            >
              {initials(review.customerName)}
            </div>
            <span className="text-sm font-medium">{review.customerName}</span>
            <Stars rating={review.rating} size="sm" className="ml-auto" />
          </div>
          {review.title && <p className="text-sm font-semibold">{review.title}</p>}
          {review.comment && (
            <p className="text-xs text-muted-foreground">{review.comment}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="response">Tu respuesta</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
              onClick={sugerir}
            >
              <Sparkles className="size-3" />
              Sugerir respuesta
            </Button>
          </div>
          <Textarea
            id="response"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe una respuesta amable y profesional…"
            rows={5}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {text.length}/2000
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="size-4" />
            Enviar respuesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Dialog solicitar reseña                                            */
/* ------------------------------------------------------------------ */

function SolicitarDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  userId: string
}) {
  const toast = useAppStore((s) => s.toast)
  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''

  const publicLink = userId ? `${origin}/reviews/${userId}` : ''
  const widgetLink = userId ? `${origin}/api/resenas/public?userId=${userId}` : ''
  const whatsappText = `¡Gracias por tu compra! Te invito a dejar una reseña sobre tu experiencia: ${publicLink}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      toast('Enlace copiado al portapapeles')
    } catch {
      toast('No se pudo copiar. Cópialo manualmente.', 'error')
    }
  }

  const copyWidget = async () => {
    try {
      await navigator.clipboard.writeText(widgetLink)
      toast('URL del widget copiada')
    } catch {
      toast('No se pudo copiar.', 'error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar reseña</DialogTitle>
          <DialogDescription>
            Comparte este enlace con tus clientes para que dejen una reseña pública.
            Las reseñas se crean con estado <span className="font-medium">Pendiente</span> y
            tú decides cuándo publicarlas.
          </DialogDescription>
        </DialogHeader>

        {!userId ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Necesitas iniciar sesión para generar tu enlace personal de reseñas.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tu enlace público</Label>
              <div className="flex gap-2">
                <Input readOnly value={publicLink} className="text-xs font-mono" />
                <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
                  <Copy className="size-3.5" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Mensaje para WhatsApp</Label>
              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                {whatsappText}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Share2 className="size-3.5" />
                    Compartir por WhatsApp
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="size-3.5" />
                  Copiar enlace
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-xs">Widget de reseñas (API pública)</Label>
              <div className="flex gap-2">
                <Input readOnly value={widgetLink} className="text-xs font-mono" />
                <Button size="sm" variant="ghost" onClick={copyWidget} className="shrink-0 text-xs">
                  <Copy className="size-3.5" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Usa esta URL para integrar tus reseñas en tu sitio web.
              </p>
            </div>

            <a
              href={publicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
            >
              <ExternalLink className="size-3" />
              Vista previa pública
            </a>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Dialog crear manual                                                */
/* ------------------------------------------------------------------ */

function CrearDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (form: {
    customerName: string
    customerEmail?: string
    rating: number
    title?: string
    comment?: string
    source: string
  }) => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [source, setSource] = useState('INTERNAL')

  const reset = () => {
    setCustomerName('')
    setCustomerEmail('')
    setRating(5)
    setTitle('')
    setComment('')
    setSource('INTERNAL')
  }

  const handleSubmit = () => {
    if (!customerName.trim()) return
    onSubmit({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
      source,
    })
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar reseña</DialogTitle>
          <DialogDescription>
            Crea una reseña manualmente (por ejemplo, una reseña recibida por
            otro canal que quieres centralizar aquí).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-name">Cliente *</Label>
              <Input
                id="r-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-email">Email</Label>
              <Input
                id="r-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rating *</Label>
              <div className="flex items-center gap-1 h-9">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`${n} estrellas`}
                  >
                    <Star
                      className={`size-6 ${
                        n <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-transparent text-muted-foreground/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Origen</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNAL">Interna</SelectItem>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-title">Título</Label>
            <Input
              id="r-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resumen breve"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-comment">Comentario</Label>
            <Textarea
              id="r-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Texto completo de la reseña…"
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!customerName.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <ThumbsUp className="size-4" />
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ResenasModule
