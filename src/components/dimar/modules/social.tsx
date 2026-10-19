'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Eye, Heart, MousePointerClick, DollarSign, Send, CalendarClock,
  Link2, Users, Plus, Loader2, Sparkles, TrendingUp, Hash, Instagram,
  Facebook, Music2, Twitter, MessageCircle, Linkedin, Youtube, Send as SendIcon,
  Image as ImageIcon, AtSign, type LucideIcon,
} from 'lucide-react'
import {
  SOCIAL_PLATFORM_ICONS, SOCIAL_PLATFORM_LABELS,
  POST_STATUS_LABELS, POST_STATUS_COLORS,
  type SocialAccount, type SocialPost,
} from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- tipos locales ----------
interface AnalyticsStats {
  accounts: number
  totalPosts: number
  publishedPosts: number
  automations: number
  bioPages: number
  totalReach: number
  totalLikes: number
  totalComments: number
  totalClicks: number
  totalAttributedOrders: number
  totalAttributedRevenue: number
  bioViews: number
  bioClicks: number
  engagementRate: number
}
interface PostsByPlatform { platform: string; count: number }
interface EngagementByDay { date: string; reach: number; likes: number; clicks: number }
interface TopPost {
  id: string
  caption: string
  reach: number
  likes: number
  attributedOrders: number
}
interface AnalyticsData {
  stats: AnalyticsStats
  postsByPlatform: PostsByPlatform[]
  engagementByDay: EngagementByDay[]
  topPosts: TopPost[]
}
interface PlatformOption {
  id: string
  name: string
  icon: string
  color: string
  maxCaption: number
  supports: string[]
}

// ---------- helpers ----------
const usd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtNum = (n: number) => (n || 0).toLocaleString('es-EC')
const fmtShortDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit',
    })
  } catch {
    return iso
  }
}
const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-EC', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const PRIMARY = 'oklch(0.6 0.13 162)'
const ACCENT = 'oklch(0.75 0.15 75)'

// Mapa de iconos de Lucide por nombre (usado por SOCIAL_PLATFORM_ICONS)
const ICON_MAP: Record<string, LucideIcon> = {
  Instagram,
  Facebook,
  Music2,
  Twitter,
  MessageCircle,
  Linkedin,
  Youtube,
  Send: SendIcon,
  Image: ImageIcon,
  AtSign,
}

function PlatformIcon({
  platform,
  className,
}: {
  platform: string
  className?: string
}) {
  const name = SOCIAL_PLATFORM_ICONS[platform] || 'MessageCircle'
  const Icon = ICON_MAP[name] || MessageCircle
  return <Icon className={className} />
}

// ---------- StatCard ----------
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  accent?: 'primary' | 'accent' | 'muted'
}

function StatCard({ icon, label, value, hint, accent = 'primary' }: StatCardProps) {
  const accentBg =
    accent === 'primary'
      ? 'bg-primary/10 text-primary'
      : accent === 'accent'
        ? 'bg-accent/20 text-accent-foreground'
        : 'bg-muted text-muted-foreground'
  return (
    <Card className="p-5 gap-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-bold text-foreground truncate">
            {value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('shrink-0 grid place-items-center size-11 rounded-xl', accentBg)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ---------- tooltips personalizados ----------
function EngagementTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs space-y-1">
      <p className="font-medium text-foreground">{fmtShortDate(label)}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

function PlatformTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0]
  const label = SOCIAL_PLATFORM_LABELS[p.payload.platform] || p.payload.platform
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-1 text-primary font-semibold">{fmtNum(p.value)} posts</p>
    </div>
  )
}

// ---------- skeleton ----------
function SocialSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="size-11 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20 mt-2" />
          </Card>
        ))}
      </div>
      <Card className="p-0">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-0">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---------- diálogo conectar cuenta ----------
function ConnectAccountDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [platforms, setPlatforms] = useState<PlatformOption[]>([])
  const [platform, setPlatform] = useState('INSTAGRAM')
  const [handle, setHandle] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch('/api/social/platforms')
      .then((r) => r.json())
      .then(setPlatforms)
      .catch(() => {})
  }, [open])

  const reset = () => {
    setPlatform('INSTAGRAM')
    setHandle('')
    setDisplayName('')
    setSaving(false)
  }

  const handleSubmit = async () => {
    if (!handle.trim()) {
      toast('Ingresa tu usuario/handle', 'warning')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/social/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          handle: handle.replace(/^@/, ''),
          displayName: displayName || handle.replace(/^@/, ''),
          followerCount: 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'No se pudo conectar')
      }
      toast('¡Cuenta conectada!')
      onCreated()
      reset()
      onOpenChange(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al conectar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-primary" />
            Conectar cuenta social
          </DialogTitle>
          <DialogDescription>
            Selecciona la plataforma y registra tu handle. (OAuth simulado para demostración.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Plataforma</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una plataforma" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <PlatformIcon platform={p.id} className="size-4" />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Usuario / Handle</label>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@dimarclub"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre visible (opcional)</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dimarclub Oficial"
            />
          </div>

          <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="size-3.5 shrink-0 mt-0.5 text-primary" />
            <span>
              En producción se abriría el flujo OAuth de la plataforma elegida.
              Por ahora se crea la cuenta en estado <strong>conectado</strong>.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Conectar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- componente principal ----------
export function SocialModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [connectOpen, setConnectOpen] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, accRes, pRes] = await Promise.all([
        fetch('/api/social/analytics'),
        fetch('/api/social/accounts'),
        fetch('/api/social/posts?limit=8'),
      ])
      // Solo parsear si la respuesta es OK (evita crash al acceder propiedades de error 401)
      if (!aRes.ok || !accRes.ok || !pRes.ok) {
        setAnalytics(null)
        setAccounts([])
        setRecentPosts([])
        return
      }
      const a = await aRes.json()
      const acc = await accRes.json()
      const p = await pRes.json()
      setAnalytics(a)
      setAccounts(acc)
      setRecentPosts(p)
    } catch {
      toast('Error al cargar el panel social', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll, currentUser?.id])

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dimarclub Social</h1>
          <p className="text-muted-foreground text-sm">Cargando métricas…</p>
        </div>
        {!loading && !analytics && (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Inicia sesión para ver tu panel social</p>
              <p className="text-sm text-muted-foreground mt-1">Conecta tus redes y automatiza tu contenido</p>
            </CardContent>
          </Card>
        )}
        {loading && <SocialSkeleton />}
      </div>
    )
  }

  const { stats, postsByPlatform, engagementByDay, topPosts } = analytics
  const engagements = stats.totalLikes + stats.totalComments
  const platformBarData = postsByPlatform.map((p) => ({
    platform: p.platform,
    count: p.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dimarclub Social</h1>
        <p className="text-muted-foreground text-sm">
          Programa y publica contenido en tus redes sociales con IA
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="size-5" />}
          label="Alcance total"
          value={fmtNum(stats.totalReach)}
          hint={`${stats.publishedPosts} posts publicados`}
          accent="primary"
        />
        <StatCard
          icon={<Heart className="size-5" />}
          label="Engagements"
          value={fmtNum(engagements)}
          hint={`Likes ${fmtNum(stats.totalLikes)} · Coments ${fmtNum(stats.totalComments)}`}
          accent="accent"
        />
        <StatCard
          icon={<MousePointerClick className="size-5" />}
          label="Clics"
          value={fmtNum(stats.totalClicks)}
          hint={`Tasa engagement ${stats.engagementRate.toFixed(1)}%`}
          accent="primary"
        />
        <StatCard
          icon={<DollarSign className="size-5" />}
          label="Ventas atribuidas"
          value={usd(stats.totalAttributedRevenue)}
          hint={`${stats.totalAttributedOrders} pedidos atribuidos`}
          accent="accent"
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Send className="size-5" />}
          label="Posts publicados"
          value={fmtNum(stats.publishedPosts)}
          accent="primary"
        />
        <StatCard
          icon={<CalendarClock className="size-5" />}
          label="Posts programados"
          value={fmtNum(stats.totalPosts - stats.publishedPosts)}
          accent="accent"
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Cuentas conectadas"
          value={fmtNum(accounts.length)}
          accent="primary"
        />
        <StatCard
          icon={<Link2 className="size-5" />}
          label="Bio pages views"
          value={fmtNum(stats.bioViews)}
          hint={`${stats.bioClicks} clics en enlaces`}
          accent="accent"
        />
      </div>

      {/* Engagement chart */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Engagement últimos 14 días</CardTitle>
          <CardDescription>
            Alcance, likes y clics por día · Tasa de engagement {stats.engagementRate.toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={engagementByDay}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="likesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.65 0.1 200)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.65 0.1 200)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 130)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtShortDate}
                  tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 160)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmtNum(v)}
                  tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 160)' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<EngagementTooltip />} />
                <Area
                  type="monotone"
                  dataKey="reach"
                  name="Alcance"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#reachGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="likes"
                  name="Likes"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  fill="url(#likesGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  name="Clics"
                  stroke="oklch(0.65 0.1 200)"
                  strokeWidth={2}
                  fill="url(#clicksGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ background: PRIMARY }} />
              <span className="text-muted-foreground">Alcance</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ background: ACCENT }} />
              <span className="text-muted-foreground">Likes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm" style={{ background: 'oklch(0.65 0.1 200)' }} />
              <span className="text-muted-foreground">Clics</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Dos columnas: posts por plataforma + cuentas conectadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts por plataforma */}
        <Card className="p-0">
          <CardHeader>
            <CardTitle>Posts por plataforma</CardTitle>
            <CardDescription>
              Distribución de publicaciones por red social
            </CardDescription>
          </CardHeader>
          <CardContent>
            {platformBarData.length === 0 ? (
              <div className="grid place-items-center h-[280px] text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Hash className="size-8 text-muted-foreground/50" />
                  <span>Aún no hay posts publicados</span>
                </div>
              </div>
            ) : (
              <div className="w-full" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={platformBarData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 130)" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => fmtNum(v)}
                      tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 160)' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="platform"
                      width={110}
                      tickFormatter={(v) => SOCIAL_PLATFORM_LABELS[v] || v}
                      tick={{ fontSize: 11, fill: 'oklch(0.3 0.02 160)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<PlatformTooltip />} cursor={{ fill: 'oklch(0.52 0.13 162 / 0.05)' }} />
                    <Bar
                      dataKey="count"
                      name="Posts"
                      fill={PRIMARY}
                      radius={[0, 6, 6, 0]}
                      barSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cuentas conectadas */}
        <Card className="p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Cuentas conectadas</CardTitle>
              <CardDescription>
                {accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setConnectOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Conectar cuenta</span>
              <span className="sm:hidden">Conectar</span>
            </Button>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="grid place-items-center py-10 text-sm text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="grid place-items-center size-12 rounded-full bg-primary/10 text-primary">
                    <Users className="size-6" />
                  </div>
                  <p>Aún no tienes cuentas conectadas</p>
                  <Button size="sm" variant="outline" onClick={() => setConnectOpen(true)} className="gap-1.5">
                    <Plus className="size-4" /> Conectar la primera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto scroll-thin pr-1">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <PlatformIcon platform={acc.platform} className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {acc.displayName || acc.handle}
                        </p>
                        {acc.connected && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                            <span className="size-1.5 rounded-full bg-emerald-500 mr-1" />
                            Conectada
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{acc.handle} · {SOCIAL_PLATFORM_LABELS[acc.platform] || acc.platform}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{fmtNum(acc.followerCount)}</p>
                      <p className="text-[10px] text-muted-foreground">seguidores</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top posts */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Posts con mejor rendimiento</CardTitle>
          <CardDescription>Top 5 por alcance · últimos 30 días</CardDescription>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <TrendingUp className="size-8 mx-auto mb-2 text-muted-foreground/50" />
              Aún no hay posts publicados con métricas.
            </div>
          ) : (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 min-w-[200px]">Caption</TableHead>
                    <TableHead className="px-4 text-right">Alcance</TableHead>
                    <TableHead className="px-4 text-right">Likes</TableHead>
                    <TableHead className="px-4 text-right">Pedidos</TableHead>
                    <TableHead className="px-4 text-right">Ingresos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPosts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-4 max-w-xs">
                        <p className="text-sm text-foreground line-clamp-2">{p.caption}</p>
                      </TableCell>
                      <TableCell className="px-4 text-right font-medium">{fmtNum(p.reach)}</TableCell>
                      <TableCell className="px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <Heart className="size-3 text-accent-foreground/70" />
                          {fmtNum(p.likes)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 text-right">{fmtNum(p.attributedOrders)}</TableCell>
                      <TableCell className="px-4 text-right font-semibold text-primary">
                        {usd(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent posts horizontal scroll */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Posts recientes</CardTitle>
          <CardDescription>Últimas publicaciones y borradores</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aún no has creado posts. Ve al Content Studio para empezar.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scroll-thin pb-2 -mx-1 px-1">
              {recentPosts.map((post) => {
                const mediaUrls: string[] = post.mediaUrls
                  ? (() => {
                      try {
                        return JSON.parse(post.mediaUrls) as string[]
                      } catch {
                        return []
                      }
                    })()
                  : []
                const platforms =
                  post.accounts?.map((a) => a.account.platform).filter(Boolean) || []
                return (
                  <div
                    key={post.id}
                    className="shrink-0 w-64 rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {mediaUrls[0] ? (
                         
                        <img
                          src={mediaUrls[0]}
                          alt={post.caption.slice(0, 40)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="grid place-items-center w-full h-full text-muted-foreground">
                          <ImageIcon className="size-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            POST_STATUS_COLORS[post.status] ||
                              'bg-muted text-muted-foreground',
                          )}
                        >
                          {POST_STATUS_LABELS[post.status] || post.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-foreground line-clamp-2 min-h-[2rem]">
                        {post.caption}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {platforms.slice(0, 3).map((p, i) => (
                            <span
                              key={i}
                              className="grid place-items-center size-5 rounded-full bg-primary/10 text-primary"
                            >
                              <PlatformIcon platform={p} className="size-3" />
                            </span>
                          ))}
                          {platforms.length === 0 && (
                            <span className="text-[10px] text-muted-foreground">Sin cuentas</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {post.publishedAt
                            ? fmtDateTime(post.publishedAt)
                            : post.scheduledAt
                              ? `Prog. ${fmtDateTime(post.scheduledAt)}`
                              : fmtDateTime(post.createdAt)}
                        </span>
                      </div>
                      {post.status === 'PUBLISHED' && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t">
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Eye className="size-3" /> {fmtNum(post.reach)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Heart className="size-3" /> {fmtNum(post.likes)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MousePointerClick className="size-3" /> {fmtNum(post.clicks)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectAccountDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onCreated={fetchAll}
      />
    </div>
  )
}

export default SocialModule
