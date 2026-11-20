'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Bot, RefreshCw, Loader2, Users, Star, Wallet, TrendingUp, Package, MapPin,
  Award, MessageSquare, ShieldCheck, Pause, Play, CheckCircle2, XCircle,
  Eye, Search, Crown, Building2, Download, Gift,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- Helpers ----------
const fmtUsd = (n: number) => `$${(n || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return String(iso)
  }
}
const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return String(iso)
  }
}

function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ---------- Types ----------
interface AdminStats {
  plusActive: number
  dimaFree: number
  proveedoresConFrases: number
  frasesActivas: number
  sucursalesActivas: number
  capitalTotalInvertido: number
  interesTotalPagado: number
  descargasAtribuidas: number
  starsOtorgadasMes: number
  resenasPendientes: number
  resenasPublicadas: number
  resenasOcultas: number
  promedioGlobal: number
  popPurchasesCount: number
  popPurchasesActive: number
  popPurchasesWithdrawn: number
  scansTotales: number
  referralsTotal: number
}

interface TopAffiliate {
  referrerId: string
  referrerName: string
  referrerEmail: string
  referrerAvatarUrl: string | null
  totalEarned: number
  monthlyRecurring: number
  referralsCount: number
}

interface TopSearcher {
  userId: string
  name: string
  email: string
  avatarUrl: string | null
  city: string | null
  starsMes: number
  countMes: number
  cashbackAcumulado: number
}

interface UserInfo {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
  city?: string | null
  role?: string
}

interface SubscriptionRow {
  id: string
  userId: string
  plan: string
  pricePerMonth: number
  billingCycle: string
  status: string
  investedAmount: number
  currentBalance: number
  totalEarned: number
  lastCompoundAt: string | null
  startedAt: string
  currentPeriodEnd: string | null
  cancelledAt: string | null
  referredBy: string | null
  createdAt: string
  updatedAt: string
  user: UserInfo
}

interface SupplierInfo {
  id: string
  companyName: string
  city?: string | null
  category?: string | null
  phone?: string | null
  verified?: boolean
  rating?: number
  userId?: string
}

interface PhraseRow {
  id: string
  supplierId: string
  phrase: string
  category: string | null
  isPremium: boolean
  status: string
  monthlyPrice: number
  paidUntil: string | null
  searchCount: number
  clickCount: number
  createdAt: string
  updatedAt: string
  supplier: SupplierInfo
}

interface BranchRow {
  id: string
  supplierId: string
  name: string
  city: string
  sector: string | null
  address: string
  phone: string | null
  whatsapp: string | null
  latitude: number | null
  longitude: number | null
  hours: string | null
  isMain: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  supplier: SupplierInfo
}

interface PurchaseRow {
  id: string
  userId: string
  amount: number
  items: string
  monthlyRate: number
  currentBalance: number
  totalEarned: number
  lastCompoundAt: string | null
  qrCode: string | null
  scanCount: number
  downloadCount: number
  status: string
  orderId: string | null
  createdAt: string
  updatedAt: string
  user: UserInfo
}

interface ReviewRow {
  id: string
  userId: string
  customerName: string
  customerEmail: string | null
  rating: number
  title: string | null
  comment: string | null
  source: string
  status: string
  response: string | null
  respondedAt: string | null
  createdAt: string
  user: UserInfo
  supplier: SupplierInfo | null
}

interface ReferralRow {
  id: string
  referrerId: string
  referredId: string
  level: number
  signupCommission: number
  monthlyCommission: number
  totalEarned: number
  lastPaidAt: string | null
  status: string
  createdAt: string
  updatedAt: string
  referrer: UserInfo
  referred: UserInfo
}

// ---------- Status badge styles ----------
const PLAN_BADGE: Record<string, string> = {
  FREE: 'bg-muted text-muted-foreground border border-border',
  PLUS: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
}

const SUB_STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  PAST_DUE: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  CANCELLED: 'bg-muted text-muted-foreground border border-border',
}

const PHRASE_STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  PAUSED: 'bg-muted text-muted-foreground border border-border',
}

const PURCHASE_STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  WITHDRAWN: 'bg-muted text-muted-foreground border border-border',
}

const REVIEW_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  PUBLISHED: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  HIDDEN: 'bg-muted text-muted-foreground border border-border',
}

const REFERRAL_LEVEL_BADGE: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  2: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  3: 'bg-cyan-100 text-cyan-700 border border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300',
}

const REFERRAL_STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  INACTIVE: 'bg-muted text-muted-foreground border border-border',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PAST_DUE: 'Vencida',
  CANCELLED: 'Cancelada',
  PAUSED: 'Pausada',
  WITHDRAWN: 'Retirada',
  PENDING: 'Pendiente',
  PUBLISHED: 'Publicada',
  HIDDEN: 'Ocultada',
  INACTIVE: 'Inactivo',
  FREE: 'Free',
  PLUS: 'Plus',
}

// ---------- Componente principal ----------
export function DimaAdminModule() {
  const [tab, setTab] = useState('dashboard')
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="w-auto h-auto flex-wrap gap-1">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <Bot className="size-3.5" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5">
              <Crown className="size-3.5" /> Suscripciones
            </TabsTrigger>
            <TabsTrigger value="phrases" className="gap-1.5">
              <Search className="size-3.5" /> Frases
            </TabsTrigger>
            <TabsTrigger value="branches" className="gap-1.5">
              <Building2 className="size-3.5" /> Sucursales
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1.5">
              <Package className="size-3.5" /> Inversión POP
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5">
              <MessageSquare className="size-3.5" /> Reseñas
            </TabsTrigger>
            <TabsTrigger value="referrals" className="gap-1.5">
              <Users className="size-3.5" /> Referidos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsTab />
        </TabsContent>
        <TabsContent value="phrases" className="mt-4">
          <PhrasesTab />
        </TabsContent>
        <TabsContent value="branches" className="mt-4">
          <BranchesTab />
        </TabsContent>
        <TabsContent value="purchases" className="mt-4">
          <PurchasesTab />
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          <ReviewsTab />
        </TabsContent>
        <TabsContent value="referrals" className="mt-4">
          <ReferralsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Stat Card ----------
function StatCard({
  icon: Icon,
  label,
  value,
  tint = 'emerald',
  hint,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  tint?: 'emerald' | 'amber' | 'cyan' | 'rose'
  hint?: string
}) {
  const tintMap: Record<string, string> = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    rose: 'text-rose-600 dark:text-rose-400',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold mt-1 truncate">{value}</p>
            {hint && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</p>}
          </div>
          <div className={cn('shrink-0 rounded-lg bg-muted/50 p-2', tintMap[tint])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Empty State ----------
function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Icon className="size-10 mx-auto opacity-40 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ---------- Loading ----------
function TableLoading() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

// ---------- Star rating display ----------
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de ${max} estrellas`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground'
          )}
        />
      ))}
      <span className="ml-1 text-xs font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

// =================================================================
// Tab 1: Dashboard
// =================================================================
function DashboardTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([])
  const [topSearchers, setTopSearchers] = useState<TopSearcher[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dima/admin')
      const d = await res.json()
      if (res.ok && d.ok) {
        setStats(d.stats)
        setTopAffiliates(d.topAffiliates || [])
        setTopSearchers(d.topSearchers || [])
      } else {
        toast(d.error || 'Error al cargar dashboard', 'error')
      }
    } catch {
      toast('Error de red al cargar dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Badge className="bg-primary/15 text-primary border-primary/20 w-fit">
            <ShieldCheck className="size-3 mr-1" /> Administración global
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 flex items-center gap-2">
            Dima · Admin Global
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Panel completo del sistema Dima: suscripciones, frases, sucursales, inversiones,
            reseñas y referidos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats grid (8 cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Crown} label="Usuarios Dima Plus activos" value={stats.plusActive} tint="emerald" />
            <StatCard icon={Users} label="Usuarios Dima Free" value={stats.dimaFree} tint="cyan" />
            <StatCard icon={Search} label="Proveedores con frases" value={stats.proveedoresConFrases} tint="amber" />
            <StatCard icon={Search} label="Frases activas totales" value={stats.frasesActivas} tint="emerald" />
            <StatCard icon={Wallet} label="Capital total invertido" value={fmtUsd(stats.capitalTotalInvertido)} tint="emerald" hint="Subs + POP" />
            <StatCard icon={TrendingUp} label="Interés total pagado" value={fmtUsd(stats.interesTotalPagado)} tint="amber" />
            <StatCard icon={Download} label="Descargas atribuidas" value={stats.descargasAtribuidas} tint="cyan" />
            <StatCard icon={Star} label="Stars otorgadas este mes" value={stats.starsOtorgadasMes} tint="amber" />
          </div>

          {/* Top tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 10 Afiliados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="size-4 text-amber-600" /> Top 10 Afiliados por comisiones
                </CardTitle>
                <CardDescription>Quién más ha ganado comisiones en la red Dima</CardDescription>
              </CardHeader>
              <CardContent>
                {topAffiliates.length === 0 ? (
                  <EmptyState icon={Award} message="Aún no hay afiliados con comisiones." />
                ) : (
                  <div className="max-h-96 overflow-y-auto scroll-thin -mx-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9">#</TableHead>
                          <TableHead className="h-9">Usuario</TableHead>
                          <TableHead className="h-9 text-right">Referidos</TableHead>
                          <TableHead className="h-9 text-right">Ganado</TableHead>
                          <TableHead className="h-9 text-right">Recurrente/mes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topAffiliates.map((a, idx) => (
                          <TableRow key={a.referrerId}>
                            <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="size-7 shrink-0">
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                    {initials(a.referrerName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{a.referrerName}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{a.referrerEmail}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">{a.referralsCount}</TableCell>
                            <TableCell className="text-right text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              {fmtUsd(a.totalEarned)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-amber-700 dark:text-amber-400">
                              {fmtUsd(a.monthlyRecurring)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 Buscadores */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="size-4 text-amber-600" /> Top 10 Buscadores del mes
                </CardTitle>
                <CardDescription>Usuarios con más Dima Stars este mes</CardDescription>
              </CardHeader>
              <CardContent>
                {topSearchers.length === 0 ? (
                  <EmptyState icon={Star} message="Aún no hay buscadores con stars este mes." />
                ) : (
                  <div className="max-h-96 overflow-y-auto scroll-thin -mx-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9">#</TableHead>
                          <TableHead className="h-9">Usuario</TableHead>
                          <TableHead className="h-9 text-right">Stars mes</TableHead>
                          <TableHead className="h-9 text-right">Cashback acum.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topSearchers.map((u, idx) => (
                          <TableRow key={u.userId}>
                            <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="size-7 shrink-0">
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                    {initials(u.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{u.name}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {u.email}
                                    {u.city ? ` · ${u.city}` : ''}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-amber-700 dark:text-amber-400">
                              <Star className="inline size-3 mr-0.5 fill-amber-400 text-amber-400" />
                              {u.starsMes}
                            </TableCell>
                            <TableCell className="text-right text-sm text-emerald-700 dark:text-emerald-400">
                              {fmtUsd(u.cashbackAcumulado)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Building2} label="Sucursales activas" value={stats.sucursalesActivas} tint="emerald" />
            <StatCard icon={MessageSquare} label="Reseñas pendientes" value={stats.resenasPendientes} tint="amber" />
            <StatCard icon={MessageSquare} label="Reseñas publicadas" value={stats.resenasPublicadas} tint="emerald" />
            <StatCard icon={Users} label="Referidos totales" value={stats.referralsTotal} tint="cyan" />
          </div>
        </>
      ) : (
        <EmptyState icon={Bot} message="No se pudo cargar el dashboard." />
      )}
    </div>
  )
}

// =================================================================
// Tab 2: Suscripciones
// =================================================================
function SubscriptionsTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<SubscriptionRow[]>([])
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED'>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SubscriptionRow | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dima/admin/subscriptions')
      const d = await res.json()
      if (res.ok && d.ok) {
        setAll(d.subscriptions || [])
      } else {
        toast(d.error || 'Error al cargar suscripciones', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filtered = all.filter((s) => {
    if (filter !== 'ALL' && s.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.user?.email?.toLowerCase().includes(q) ||
        s.user?.name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const filterButtons: Array<{ label: string; value: 'ALL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' }> = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Activas', value: 'ACTIVE' },
    { label: 'Vencidas', value: 'PAST_DUE' },
    { label: 'Canceladas', value: 'CANCELLED' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Crown className="size-5 text-primary" /> Suscripciones Dima
          </h2>
          <p className="text-sm text-muted-foreground">Todas las suscripciones del sistema.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-1">
          {filterButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setFilter(b.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                filter === b.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {all.length}</span>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableLoading /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Crown} message="No hay suscripciones con los filtros aplicados." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Usuario</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Invertido</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Ganado</TableHead>
                    <TableHead>Próximo cobro</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(s)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials(s.user?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{s.user?.name || '—'}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{s.user?.email || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', PLAN_BADGE[s.plan] || PLAN_BADGE.FREE)}>
                          {STATUS_LABELS[s.plan] || s.plan}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', SUB_STATUS_BADGE[s.status] || 'bg-muted text-muted-foreground')}>
                          {STATUS_LABELS[s.status] || s.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fmtUsd(s.investedAmount)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtUsd(s.currentBalance)}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-700 dark:text-emerald-400">{fmtUsd(s.totalEarned)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(s.currentPeriodEnd)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(s.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog detalle */}
      {selected && (
        <SubscriptionDetailDialog
          subscription={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function SubscriptionDetailDialog({
  subscription,
  onClose,
}: {
  subscription: SubscriptionRow
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="size-5 text-primary" /> Detalle de suscripción
          </DialogTitle>
          <DialogDescription>
            {subscription.user?.name || '—'} · {subscription.user?.email || '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', PLAN_BADGE[subscription.plan] || PLAN_BADGE.FREE)}>
              {STATUS_LABELS[subscription.plan] || subscription.plan}
            </span>
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', SUB_STATUS_BADGE[subscription.status] || 'bg-muted text-muted-foreground')}>
              {STATUS_LABELS[subscription.status] || subscription.status}
            </span>
            <span className="text-xs text-muted-foreground">
              {subscription.billingCycle === 'ANNUAL' ? 'Anual' : 'Mensual'} · {fmtUsd(subscription.pricePerMonth)}/mes
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Invertido</p>
              <p className="text-lg font-bold">{fmtUsd(subscription.investedAmount)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Balance actual</p>
              <p className="text-lg font-bold">{fmtUsd(subscription.currentBalance)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Interés total ganado</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtUsd(subscription.totalEarned)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Último compounding</p>
              <p className="text-sm font-medium">{fmtDateTime(subscription.lastCompoundAt)}</p>
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Inicio:</span><span className="font-medium">{fmtDate(subscription.startedAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Próximo cobro:</span><span className="font-medium">{fmtDate(subscription.currentPeriodEnd)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cancelada:</span><span className="font-medium">{fmtDate(subscription.cancelledAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Referido por:</span><span className="font-mono text-xs">{subscription.referredBy || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Creada:</span><span className="font-medium">{fmtDate(subscription.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Actualizada:</span><span className="font-medium">{fmtDate(subscription.updatedAt)}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// Tab 3: Frases
// =================================================================
function PhrasesTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<PhraseRow[]>([])
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL')
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dima/admin/phrases')
      const d = await res.json()
      if (res.ok && d.ok) {
        setAll(d.phrases || [])
      } else {
        toast(d.error || 'Error al cargar frases', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filtered = all.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.phrase?.toLowerCase().includes(q) ||
        p.supplier?.companyName?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const toggleStatus = async (phrase: PhraseRow) => {
    setTogglingId(phrase.id)
    const newStatus = phrase.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/dima/admin/phrases/${phrase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (res.ok && d.ok) {
        toast(`Frase ${newStatus === 'ACTIVE' ? 'activada' : 'pausada'}`, 'success')
        fetchAll()
      } else {
        toast(d.error || 'Error al actualizar', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const filterButtons: Array<{ label: string; value: 'ALL' | 'ACTIVE' | 'PAUSED' }> = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Activas', value: 'ACTIVE' },
    { label: 'Pausadas', value: 'PAUSED' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Search className="size-5 text-primary" /> Frases de búsqueda
          </h2>
          <p className="text-sm text-muted-foreground">Frases de posicionamiento de proveedores.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-1">
          {filterButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setFilter(b.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                filter === b.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar frase o supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {all.length}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableLoading /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Search} message="No hay frases con los filtros aplicados." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Proveedor</TableHead>
                    <TableHead className="min-w-[220px]">Frase</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Premium</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">$mes</TableHead>
                    <TableHead>Paga hasta</TableHead>
                    <TableHead className="text-right">Búsquedas</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.supplier?.companyName || '—'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.supplier?.city || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[280px]">{p.phrase}</p>
                      </TableCell>
                      <TableCell>
                        {p.category ? (
                          <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.isPremium ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]">Sí</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', PHRASE_STATUS_BADGE[p.status] || 'bg-muted text-muted-foreground')}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {p.monthlyPrice > 0 ? fmtUsd(p.monthlyPrice) : <span className="text-muted-foreground text-xs">incluida</span>}
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(p.paidUntil)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{p.searchCount}</TableCell>
                      <TableCell className="text-right text-sm">{p.clickCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            disabled={togglingId === p.id}
                            onClick={() => toggleStatus(p)}
                          >
                            {togglingId === p.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : p.status === 'ACTIVE' ? (
                              <><Pause className="size-3.5 mr-1" />Pausar</>
                            ) : (
                              <><Play className="size-3.5 mr-1" />Activar</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => toast(`Proveedor: ${p.supplier?.companyName} (${p.supplier?.city || '—'}) · ${p.supplier?.phone || 'sin teléfono'}`, 'info')}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// =================================================================
// Tab 4: Sucursales
// =================================================================
function BranchesTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<BranchRow[]>([])
  const [cityFilter, setCityFilter] = useState<string>('')
  const [supplierFilter, setSupplierFilter] = useState<string>('')
  const [selected, setSelected] = useState<BranchRow | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dima/admin/branches')
      const d = await res.json()
      if (res.ok && d.ok) {
        setAll(d.branches || [])
      } else {
        toast(d.error || 'Error al cargar sucursales', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const cities = Array.from(new Set(all.map((b) => b.city).filter(Boolean))).sort()
  const suppliers = Array.from(
    new Map(
      all.map((b) => [b.supplier?.id, b.supplier?.companyName]).filter((x): x is [string, string] => !!x[0] && !!x[1])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]))

  const filtered = all.filter((b) => {
    if (cityFilter && b.city !== cityFilter) return false
    if (supplierFilter && b.supplierId !== supplierFilter) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="size-5 text-primary" /> Sucursales
          </h2>
          <p className="text-sm text-muted-foreground">Todas las sucursales de proveedores.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-9 text-sm rounded-md border bg-background px-3"
        >
          <option value="">Todas las ciudades</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="h-9 text-sm rounded-md border bg-background px-3 max-w-[220px]"
        >
          <option value="">Todos los proveedores</option>
          {suppliers.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {all.length}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableLoading /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Building2} message="No hay sucursales con los filtros aplicados." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Proveedor</TableHead>
                    <TableHead className="min-w-[160px]">Nombre</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="min-w-[220px]">Dirección</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-center">Principal</TableHead>
                    <TableHead className="text-center">Activa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow
                      key={b.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(b)}
                    >
                      <TableCell>
                        <p className="text-sm font-medium truncate">{b.supplier?.companyName || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate">{b.name}</p>
                      </TableCell>
                      <TableCell className="text-sm">{b.city}</TableCell>
                      <TableCell className="text-sm">{b.sector || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{b.address}</TableCell>
                      <TableCell className="text-xs">{b.phone || '—'}</TableCell>
                      <TableCell className="text-center">
                        {b.isMain ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[10px]">Sí</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          'text-xs font-semibold px-2 py-0.5 rounded',
                          b.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {b.isActive ? 'Sí' : 'No'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <BranchDetailDialog branch={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function BranchDetailDialog({
  branch,
  onClose,
}: {
  branch: BranchRow
  onClose: () => void
}) {
  const mapUrl = branch.latitude && branch.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${branch.longitude - 0.01}%2C${branch.latitude - 0.01}%2C${branch.longitude + 0.01}%2C${branch.latitude + 0.01}&layer=mapnik&marker=${branch.latitude}%2C${branch.longitude}`
    : null

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" /> {branch.name}
          </DialogTitle>
          <DialogDescription>
            {branch.supplier?.companyName || '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              <MapPin className="size-3 mr-1" /> {branch.city}
            </Badge>
            {branch.sector && <Badge variant="outline" className="text-xs">{branch.sector}</Badge>}
            {branch.isMain && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs">Sucursal principal</Badge>
            )}
            <span className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded',
              branch.isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            )}>
              {branch.isActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div className="rounded-lg border p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Dirección:</span><span className="font-medium">{branch.address}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Teléfono:</span><span className="font-medium">{branch.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp:</span><span className="font-medium">{branch.whatsapp || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Horario:</span><span className="font-medium">{branch.hours || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Coordenadas:</span><span className="font-mono text-xs">{branch.latitude && branch.longitude ? `${branch.latitude.toFixed(4)}, ${branch.longitude.toFixed(4)}` : '—'}</span></div>
          </div>
          {mapUrl ? (
            <div className="rounded-lg border overflow-hidden h-48 bg-muted">
              <iframe
                title="Mapa de la sucursal"
                src={mapUrl}
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="rounded-lg border h-48 flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
              <MapPin className="size-8 opacity-40 mb-2 mr-2" />
              Sin coordenadas registradas
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// Tab 5: Inversión POP
// =================================================================
function PurchasesTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<PurchaseRow[]>([])
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'WITHDRAWN'>('ALL')
  const [selected, setSelected] = useState<PurchaseRow | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dima/admin/purchases')
      const d = await res.json()
      if (res.ok && d.ok) {
        setAll(d.purchases || [])
      } else {
        toast(d.error || 'Error al cargar compras POP', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filtered = all.filter((p) => filter === 'ALL' || p.status === filter)

  const totalCompras = all.length
  const capitalTotal = all.reduce((s, p) => s + p.amount, 0)
  const interesTotal = all.reduce((s, p) => s + p.totalEarned, 0)
  const scansTotal = all.reduce((s, p) => s + p.scanCount, 0)
  const descargasTotal = all.reduce((s, p) => s + p.downloadCount, 0)

  const filterButtons: Array<{ label: string; value: 'ALL' | 'ACTIVE' | 'WITHDRAWN' }> = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Activas', value: 'ACTIVE' },
    { label: 'Retiradas', value: 'WITHDRAWN' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="size-5 text-primary" /> Inversión POP
          </h2>
          <p className="text-sm text-muted-foreground">Compras de material POP con inversión compuesta.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Package} label="Total compras POP" value={totalCompras} tint="emerald" />
        <StatCard icon={Wallet} label="Capital invertido" value={fmtUsd(capitalTotal)} tint="amber" />
        <StatCard icon={TrendingUp} label="Interés total ganado" value={fmtUsd(interesTotal)} tint="emerald" />
        <StatCard icon={Search} label="Scans totales" value={scansTotal} tint="cyan" />
        <StatCard icon={Download} label="Descargas atribuidas" value={descargasTotal} tint="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-1">
          {filterButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setFilter(b.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                filter === b.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {all.length}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableLoading /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} message="No hay compras POP con los filtros aplicados." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Usuario</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Ganado</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="text-right">Descargas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(p)}
                    >
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.user?.name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{p.user?.email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fmtUsd(p.amount)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{fmtUsd(p.currentBalance)}</TableCell>
                      <TableCell className="text-right text-sm text-emerald-700 dark:text-emerald-400">{fmtUsd(p.totalEarned)}</TableCell>
                      <TableCell className="text-right text-sm">{p.scanCount}</TableCell>
                      <TableCell className="text-right text-sm">{p.downloadCount}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', PURCHASE_STATUS_BADGE[p.status] || 'bg-muted text-muted-foreground')}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(p.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <PurchaseDetailDialog purchase={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function PurchaseDetailDialog({
  purchase,
  onClose,
}: {
  purchase: PurchaseRow
  onClose: () => void
}) {
  let items: Array<{ type: string; quantity: number; unitPrice: number }> = []
  try {
    items = JSON.parse(purchase.items || '[]')
  } catch {
    items = []
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5 text-primary" /> Detalle de compra POP
          </DialogTitle>
          <DialogDescription>
            {purchase.user?.name || '—'} · {purchase.user?.email || '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', PURCHASE_STATUS_BADGE[purchase.status] || 'bg-muted text-muted-foreground')}>
              {STATUS_LABELS[purchase.status] || purchase.status}
            </span>
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="size-3 mr-1" />
              {((purchase.monthlyRate || 0) * 100).toFixed(1)}% / mes
            </Badge>
            {purchase.qrCode && (
              <Badge variant="outline" className="text-xs font-mono">{purchase.qrCode}</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Monto inicial</p>
              <p className="text-lg font-bold">{fmtUsd(purchase.amount)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Balance actual</p>
              <p className="text-lg font-bold">{fmtUsd(purchase.currentBalance)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Interés total ganado</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtUsd(purchase.totalEarned)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Último compounding</p>
              <p className="text-sm font-medium">{fmtDateTime(purchase.lastCompoundAt)}</p>
            </div>
          </div>
          <div className="rounded-lg border p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Scans totales:</span><span className="font-medium">{purchase.scanCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Descargas atribuidas:</span><span className="font-medium">{purchase.downloadCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Order ID:</span><span className="font-mono text-xs">{purchase.orderId || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Creada:</span><span className="font-medium">{fmtDate(purchase.createdAt)}</span></div>
          </div>
          {items.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Package className="size-4" /> Items comprados
              </p>
              <div className="rounded-lg border divide-y">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{it.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity} × {fmtUsd(it.unitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold">{fmtUsd(it.quantity * it.unitPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// Tab 6: Reseñas (moderación)
// =================================================================
function ReviewsTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<ReviewRow[]>([])
  const [filter, setFilter] = useState<'PENDING' | 'PUBLISHED' | 'HIDDEN'>('PENDING')
  const [selected, setSelected] = useState<ReviewRow | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchAll = useCallback(async (status: 'PENDING' | 'PUBLISHED' | 'HIDDEN') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dima/admin/reviews?status=${status}`)
      const d = await res.json()
      if (res.ok && d.ok) {
        setAll(d.reviews || [])
      } else {
        toast(d.error || 'Error al cargar reseñas', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll(filter)
  }, [filter, fetchAll])

  const pendingCount = filter === 'PENDING' ? all.length : null
  const publishedCount = filter === 'PUBLISHED' ? all.length : null
  const hiddenCount = filter === 'HIDDEN' ? all.length : null

  const updateStatus = async (review: ReviewRow, newStatus: 'PUBLISHED' | 'HIDDEN') => {
    setActingId(review.id)
    try {
      const res = await fetch(`/api/dima/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const d = await res.json()
      if (res.ok && d.ok) {
        toast(
          newStatus === 'PUBLISHED' ? 'Reseña aprobada y publicada' : 'Reseña rechazada y ocultada',
          newStatus === 'PUBLISHED' ? 'success' : 'info'
        )
        fetchAll(filter)
      } else {
        toast(d.error || 'Error al actualizar', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setActingId(null)
    }
  }

  const filterButtons: Array<{ label: string; value: 'PENDING' | 'PUBLISHED' | 'HIDDEN' }> = [
    { label: 'Pendientes', value: 'PENDING' },
    { label: 'Publicadas', value: 'PUBLISHED' },
    { label: 'Ocultas', value: 'HIDDEN' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" /> Moderación de reseñas
          </h2>
          <p className="text-sm text-muted-foreground">Aprueba o rechaza reseñas de proveedores.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAll(filter)}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={MessageSquare} label="Pendientes" value={pendingCount ?? '—'} tint="amber" />
        <StatCard icon={CheckCircle2} label="Publicadas" value={publishedCount ?? '—'} tint="emerald" />
        <StatCard icon={XCircle} label="Ocultas" value={hiddenCount ?? '—'} tint="rose" />
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cambia el filtro para ver los conteos</p>
            <p className="text-[11px] text-muted-foreground mt-1">Las stats reflejan el filtro activo</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-muted/50 p-1">
          {filterButtons.map((b) => (
            <button
              key={b.value}
              onClick={() => setFilter(b.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                filter === b.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{all.length} reseñas</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableLoading /></div>
          ) : all.length === 0 ? (
            <EmptyState icon={MessageSquare} message="No hay reseñas con el filtro aplicado." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Proveedor</TableHead>
                    <TableHead className="min-w-[160px]">Cliente</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="min-w-[200px]">Reseña</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell>
                        <p className="text-sm font-medium truncate">{r.supplier?.companyName || r.user?.name || '—'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.supplier?.city || ''}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate">{r.customerName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{r.customerEmail || ''}</p>
                      </TableCell>
                      <TableCell><StarRating rating={r.rating} /></TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-[200px]">{r.title || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.comment || ''}</p>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', REVIEW_STATUS_BADGE[r.status] || 'bg-muted text-muted-foreground')}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(r.createdAt)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {r.status === 'PENDING' && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                              disabled={actingId === r.id}
                              onClick={() => updateStatus(r, 'PUBLISHED')}
                            >
                              {actingId === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <><CheckCircle2 className="size-3.5 mr-1" />Aprobar</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                              disabled={actingId === r.id}
                              onClick={() => updateStatus(r, 'HIDDEN')}
                            >
                              <XCircle className="size-3.5 mr-1" />Rechazar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <ReviewDetailDialog
          review={selected}
          onClose={() => setSelected(null)}
          onApprove={() => {
            updateStatus(selected, 'PUBLISHED')
            setSelected(null)
          }}
          onReject={() => {
            updateStatus(selected, 'HIDDEN')
            setSelected(null)
          }}
          acting={actingId === selected.id}
        />
      )}
    </div>
  )
}

function ReviewDetailDialog({
  review,
  onClose,
  onApprove,
  onReject,
  acting,
}: {
  review: ReviewRow
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  acting: boolean
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" /> Detalle de reseña
          </DialogTitle>
          <DialogDescription>
            {review.supplier?.companyName || review.user?.name || '—'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StarRating rating={review.rating} />
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', REVIEW_STATUS_BADGE[review.status] || 'bg-muted text-muted-foreground')}>
              {STATUS_LABELS[review.status] || review.status}
            </span>
            <Badge variant="outline" className="text-xs">{review.source}</Badge>
          </div>
          <div className="rounded-lg border p-3 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium">{review.customerName}</p>
              <p className="text-xs text-muted-foreground">{review.customerEmail || '—'}</p>
            </div>
            {review.title && (
              <div>
                <p className="text-xs text-muted-foreground">Título</p>
                <p className="text-sm font-medium">{review.title}</p>
              </div>
            )}
            {review.comment && (
              <div>
                <p className="text-xs text-muted-foreground">Comentario</p>
                <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
              </div>
            )}
            {review.response && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">Respuesta del proveedor</p>
                <p className="text-sm italic text-muted-foreground">{review.response}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{fmtDateTime(review.respondedAt)}</p>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Creada: {fmtDateTime(review.createdAt)}
          </div>
        </div>
        {review.status === 'PENDING' && (
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/30"
              onClick={onReject}
              disabled={acting}
            >
              {acting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <XCircle className="size-4 mr-1.5" />}
              Rechazar
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onApprove}
              disabled={acting}
            >
              {acting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="size-4 mr-1.5" />}
              Aprobar y publicar
            </Button>
          </DialogFooter>
        )}
        {review.status !== 'PENDING' && (
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// Tab 7: Referidos
// =================================================================
function ReferralsTab() {
  const toast = useAppStore((s) => s.toast)
  const [loading, setLoading] = useState(true)
  const [all, setAll] = useState<ReferralRow[]>([])
  const [search, setSearch] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dima/admin/referrals')
      const d = await res.json()
      if (res.ok && d.ok) {
        setAll(d.referrals || [])
      } else {
        toast(d.error || 'Error al cargar referidos', 'error')
      }
    } catch {
      toast('Error de red', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const filtered = all.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.referrer?.name?.toLowerCase().includes(q) ||
      r.referrer?.email?.toLowerCase().includes(q) ||
      r.referred?.name?.toLowerCase().includes(q) ||
      r.referred?.email?.toLowerCase().includes(q)
    )
  })

  const totalReferrals = all.length
  const totalSignup = all.reduce((s, r) => s + r.signupCommission, 0)
  const totalMonthly = all
    .filter((r) => r.status === 'ACTIVE')
    .reduce((s, r) => s + r.monthlyCommission, 0)
  const totalPaid = all.reduce((s, r) => s + r.totalEarned, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="size-5 text-primary" /> Referidos Dima
          </h2>
          <p className="text-sm text-muted-foreground">Comisiones de la red N1/N2/N3 de la app Dima.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Referidos totales" value={totalReferrals} tint="emerald" />
        <StatCard icon={Gift} label="Comisiones signup" value={fmtUsd(totalSignup)} tint="amber" />
        <StatCard icon={TrendingUp} label="Recurrente / mes" value={fmtUsd(totalMonthly)} tint="emerald" />
        <StatCard icon={Wallet} label="Total pagado" value={fmtUsd(totalPaid)} tint="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por referrer o referido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {all.length}</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4"><TableLoading /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} message="No hay referidos que mostrar." />
          ) : (
            <div className="max-h-[70vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Referrer</TableHead>
                    <TableHead className="min-w-[180px]">Referido</TableHead>
                    <TableHead className="text-center">Nivel</TableHead>
                    <TableHead className="text-right">Signup</TableHead>
                    <TableHead className="text-right">Mensual</TableHead>
                    <TableHead className="text-right">Total ganado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-7 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              {initials(r.referrer?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{r.referrer?.name || '—'}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{r.referrer?.email || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.referred?.name || '—'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{r.referred?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', REFERRAL_LEVEL_BADGE[r.level] || 'bg-muted text-muted-foreground')}>
                          N{r.level}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{fmtUsd(r.signupCommission)}</TableCell>
                      <TableCell className="text-right text-sm text-amber-700 dark:text-amber-400">{fmtUsd(r.monthlyCommission)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-emerald-700 dark:text-emerald-400">{fmtUsd(r.totalEarned)}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', REFERRAL_STATUS_BADGE[r.status] || 'bg-muted text-muted-foreground')}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(r.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
