'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  PiggyBank, Wallet, TrendingUp, ShoppingBag, RefreshCw, Loader2, ChevronDown,
  ChevronRight, Sparkles, Network, Calendar, ArrowDownCircle, Info, Calculator,
  Trophy, AlertTriangle, CheckCircle2, Clock, Gift, ArrowRight, BookOpen,
  ShieldCheck, Banknote,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- Tipos locales ----------
interface CompoundEntry {
  id: string
  periodStart: string
  periodEnd: string
  startingBalance: number
  interestEarned: number
  endingBalance: number
  appliedAt: string
}

interface Investment {
  id: string
  comboQuantity: number
  amount: number
  monthlyRate: number
  currentBalance: number
  lastCompoundAt: string | null
  totalEarned: number
  orderId: string | null
  status: string // ACTIVE, WITHDRAWN, CANCELLED
  createdAt: string
  updatedAt: string
  compoundings: CompoundEntry[]
}

interface Stats {
  totalInvested: number
  totalBalance: number
  totalEarned: number
  projected12: number
  activeCount: number
  withdrawnCount: number
  totalCount: number
  nextCompoundAt: string | null
}

interface DataResponse {
  ok: boolean
  eligible: boolean
  user: { name: string; email: string; role: string } | null
  investments: Investment[]
  stats: Stats
}

// ---------- Helpers ----------
const fmtUsd = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0)

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateLong = (d: string | Date | null | undefined) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-EC', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  WITHDRAWN: 'Retirada',
  CANCELLED: 'Cancelada',
}
const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  WITHDRAWN: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
}

// ---------- Componente principal ----------
export function BagInvestmentModule() {
  const toast = useAppStore((s) => s.toast)
  const setModule = useAppStore((s) => s.setModule)
  const [tab, setTab] = useState<'investments' | 'calculator' | 'admin'>('investments')

  const [data, setData] = useState<DataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [compounding, setCompounding] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role === 'ADMIN'

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bag-investment')
      if (!res.ok) { setData(null); return }
      const json = await res.json()
      setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const fetchAdmin = useCallback(async () => {
    if (!isAdmin) return
    setAdminLoading(true)
    try {
      const res = await fetch('/api/bag-investment/admin')
      if (!res.ok) { setAdminData(null); return }
      setAdminData(await res.json())
    } catch {
      setAdminData(null)
    } finally {
      setAdminLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (tab === 'admin') fetchAdmin()
  }, [tab, fetchAdmin])

  const handleCompound = async () => {
    setCompounding(true)
    try {
      const res = await fetch('/api/bag-investment/compound', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.message || d?.error || 'No se pudo aplicar el interés compuesto', 'warning')
        return
      }
      toast(d.message || `Interés compuesto aplicado a ${d.updated} inversión(es)`, 'success')
      fetchAll()
    } catch {
      toast('Error de conexión', 'error')
    } finally {
      setCompounding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const eligible = data?.eligible ?? false
  const stats = data?.stats ?? {
    totalInvested: 0, totalBalance: 0, totalEarned: 0, projected12: 0,
    activeCount: 0, withdrawnCount: 0, totalCount: 0, nextCompoundAt: null,
  }
  const investments = data?.investments ?? []
  const hasInvestments = investments.length > 0

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <PiggyBank className="size-7 text-primary" />
            Aporte en Bolsos PubliBags
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tu aporte en combos PubliBags participa del resultado real de la cooperativa. El rendimiento no está garantizado y varía cada periodo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCompound}
            disabled={compounding}
          >
            {compounding
              ? <Loader2 className="size-4 mr-1 animate-spin" />
              : <RefreshCw className="size-4 mr-1" />}
            Actualizar interés
          </Button>
          <Button size="sm" onClick={() => setModule('marketplace')}>
            <ShoppingBag className="size-4 mr-1" />
            Comprar Combo PubliBags
          </Button>
        </div>
      </div>

      {/* ---------- Tabs ---------- */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="investments">
            <Wallet className="size-4 mr-1" /> Mis Inversiones
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <Calculator className="size-4 mr-1" /> Calculadora
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin">
              <ShieldCheck className="size-4 mr-1" /> Admin Global
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="investments" className="space-y-6 mt-4">
          {/* ---------- Hero card ---------- */}
          <Card className="overflow-hidden border-0 shadow-md">
            <div className="bg-gradient-to-br from-primary via-emerald-600 to-accent p-6 md:p-8 text-primary-foreground relative">
              {/* Patrón decorativo */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-xs md:text-sm opacity-90 uppercase tracking-wide font-medium">
                    Balance total actual
                  </p>
                  <p className="text-4xl md:text-6xl font-bold mt-2 tracking-tight">
                    {fmtUsd(stats.totalBalance)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 text-sm">
                    <div>
                      <span className="opacity-75">Invertido:</span>{' '}
                      <span className="font-semibold">{fmtUsd(stats.totalInvested)}</span>
                    </div>
                    <div>
                      <span className="opacity-75">Interés ganado:</span>{' '}
                      <span className="font-semibold text-amber-100">{fmtUsd(stats.totalEarned)}</span>
                    </div>
                    <div>
                      <span className="opacity-75">Proy. referencial 12m:</span>{' '}
                      <span className="font-semibold">{fmtUsd(stats.projected12)}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  {eligible ? (
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm px-3 py-1.5 text-sm">
                      <Network className="size-3.5 mr-1" />
                      N1/N2 — ganas interés
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-400/30 text-amber-50 border-0 backdrop-blur-sm px-3 py-1.5 text-sm">
                      <AlertTriangle className="size-3.5 mr-1" />
                      N3 — construye tu red para ganar
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ---------- Stats cards ---------- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              icon={Trophy}
              label="Inversiones activas"
              value={String(stats.activeCount)}
              sub={stats.withdrawnCount > 0 ? `${stats.withdrawnCount} retirada(s)` : 'Sin retiros'}
              tone="emerald"
            />
            <StatCard
              icon={Wallet}
              label="Balance total"
              value={fmtUsd(stats.totalBalance)}
              sub={`${fmtUsd(stats.totalInvested)} invertido`}
              tone="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="Interés ganado"
              value={fmtUsd(stats.totalEarned)}
              sub={`Según resultado publicado del periodo`}
              tone="amber"
            />
            <StatCard
              icon={Clock}
              label="Próximo compound"
              value={fmtDate(stats.nextCompoundAt)}
              sub={stats.nextCompoundAt ? 'en ~30 días' : '—'}
              tone="amber"
            />
          </div>

          {/* ---------- Lista de inversiones ---------- */}
          {hasInvestments ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PiggyBank className="size-5 text-primary" />
                  Mis inversiones ({investments.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                {investments.map((inv) => (
                  <InvestmentCard
                    key={inv.id}
                    inv={inv}
                    eligible={eligible}
                    toast={toast}
                    onWithdrawn={fetchAll}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              toast={toast}
              onGoToMarketplace={() => setModule('marketplace')}
            />
          )}

          {/* ---------- Sección educativa ---------- */}
          <EducationalSection />
        </TabsContent>

        <TabsContent value="calculator" className="mt-4">
          <CompoundCalculator />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="mt-4 space-y-6">
            <AdminPanel data={adminData} loading={adminLoading} onRefresh={fetchAdmin} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ---------- StatCard ----------
function StatCard({
  icon: Icon, label, value, sub, tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  tone: 'emerald' | 'amber'
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={cn(
              'text-xl md:text-2xl font-bold mt-1 truncate',
              tone === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
              tone === 'amber' && 'text-amber-600 dark:text-amber-400',
            )}>{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
          </div>
          <div className={cn(
            'size-9 rounded-lg flex items-center justify-center shrink-0',
            tone === 'emerald' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            tone === 'amber' && 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          )}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- InvestmentCard ----------
function InvestmentCard({
  inv, eligible, toast, onWithdrawn,
}: {
  inv: Investment
  eligible: boolean
  toast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void
  onWithdrawn: () => void
}) {
  const [open, setOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const isActive = inv.status === 'ACTIVE'
  const hasCompoundings = inv.compoundings.length > 0

  return (
    <Card className={cn(
      'overflow-hidden transition-shadow hover:shadow-md',
      !isActive && 'opacity-80',
    )}>
      <CardHeader className="pb-2 bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <ShoppingBag className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">
                  {inv.comboQuantity} combo{inv.comboQuantity > 1 ? 's' : ''} PubliBags
                </CardTitle>
                <CardDescription className="text-xs">
                  Creada el {fmtDate(inv.createdAt)}
                </CardDescription>
              </div>
            </div>
          </div>
          <Badge className={cn('border shrink-0', STATUS_BADGES[inv.status] || STATUS_BADGES.ACTIVE)}>
            {STATUS_LABELS[inv.status] || inv.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {/* Montos */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invertido</p>
            <p className="text-sm font-semibold mt-0.5">{fmtUsd(inv.amount)}</p>
          </div>
          <div className="border-x">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance actual</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {fmtUsd(inv.currentBalance)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Interés ganado</p>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              {fmtUsd(inv.totalEarned)}
            </p>
          </div>
        </div>

        {/* Progreso del balance vs proyección 12m */}
        {isActive && inv.monthlyRate > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progreso hacia proyección referencial 12m</span>
              <span className="font-medium">
                {fmtUsd(inv.currentBalance)} / {fmtUsd(inv.amount * Math.pow(1 + inv.monthlyRate, 12))}
              </span>
            </div>
            <Progress
              value={Math.min(100, (inv.currentBalance / (inv.amount * Math.pow(1 + inv.monthlyRate, 12))) * 100)}
              className="h-1.5"
            />
          </div>
        )}

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Último compound</p>
              <p className="font-medium truncate">{fmtDate(inv.lastCompoundAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="size-3 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Tasa del periodo</p>
              <p className="font-medium">{inv.monthlyRate > 0 ? `${(inv.monthlyRate * 100).toFixed(2)}%` : 'Sin publicar'}</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-2">
          {isActive && (
            <Button
              size="sm"
              variant="default"
              disabled={!eligible}
              onClick={() => setWithdrawOpen(true)}
              className="flex-1 min-w-32"
            >
              <Banknote className="size-3.5 mr-1" />
              Retirar a billetera
            </Button>
          )}
          {hasCompoundings && (
            <Collapsible open={open} onOpenChange={setOpen} className="flex-1 min-w-32">
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                  {open
                    ? <ChevronDown className="size-3.5 mr-1" />
                    : <ChevronRight className="size-3.5 mr-1" />}
                  Ver historial ({inv.compoundings.length})
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>

        {/* Historial de compoundings */}
        {hasCompoundings && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleContent className="space-y-2 pt-2">
              <Separator />
              <p className="text-xs font-medium text-muted-foreground pt-1">
                Historial de interés compuesto aplicado
              </p>
              <div className="max-h-64 overflow-y-auto scroll-thin space-y-1.5">
                {inv.compoundings.map((c) => (
                  <div key={c.id} className="rounded-md border bg-muted/20 p-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">
                        {fmtDate(c.periodStart)} → {fmtDate(c.periodEnd)}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700 border text-[10px]">
                        +{fmtUsd(c.interestEarned)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-1.5 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Inicio:</span>{' '}
                        <span className="font-medium">{fmtUsd(c.startingBalance)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interés:</span>{' '}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{fmtUsd(c.interestEarned)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Final:</span>{' '}
                        <span className="font-semibold">{fmtUsd(c.endingBalance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      {/* Dialog de retiro */}
      {withdrawOpen && (
        <WithdrawDialog
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          inv={inv}
          toast={toast}
          onWithdrawn={() => {
            setWithdrawOpen(false)
            onWithdrawn()
          }}
        />
      )}
    </Card>
  )
}

// ---------- WithdrawDialog (body extraído para evitar setState en effect) ----------
function WithdrawDialog({
  open, onOpenChange, inv, toast, onWithdrawn,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  inv: Investment
  toast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void
  onWithdrawn: () => void
}) {
  const [processing, setProcessing] = useState(false)

  const confirm = async () => {
    setProcessing(true)
    try {
      const res = await fetch('/api/bag-investment/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investmentId: inv.id }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al retirar', 'error')
        return
      }
      toast(`Retiro de ${fmtUsd(d.amount)} procesado a tu billetera cooperativa`, 'success')
      onWithdrawn()
    } catch {
      toast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="size-5 text-primary" />
            Retirar inversión a billetera cooperativa
          </DialogTitle>
          <DialogDescription>
            El balance total se transferirá a tu billetera cooperativa. La inversión
            quedará marcada como retirada y dejará de generar interés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inversión:</span>
              <span className="font-medium">
                {inv.comboQuantity} combo{inv.comboQuantity > 1 ? 's' : ''} PubliBags
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invertido:</span>
              <span className="font-medium">{fmtUsd(inv.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Interés ganado:</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {fmtUsd(inv.totalEarned)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-base">
              <span className="font-semibold">A transferir:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {fmtUsd(inv.currentBalance)}
              </span>
            </div>
          </div>

          <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <p>
              Una vez retirada, la inversión no puede reactivarse y dejará de
              generar interés compuesto mensual.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={processing}>
            {processing
              ? <Loader2 className="size-4 mr-1 animate-spin" />
              : <Banknote className="size-4 mr-1" />}
            Confirmar retiro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- EmptyState ----------
function EmptyState({
  toast, onGoToMarketplace,
}: {
  toast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void
  onGoToMarketplace: () => void
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-8 md:p-12 text-center">
        <div className="mx-auto size-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
          <PiggyBank className="size-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          Aún no has invertido en bolsos PubliBags
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          Compra tu primer Combo PubliBags y participa del resultado real de la
          cooperativa. El rendimiento no está garantizado.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={onGoToMarketplace}>
            <ShoppingBag className="size-4 mr-2" />
            Comprar Combo PubliBags $44
          </Button>
          <Button
            variant="outline"
            onClick={() => toast('Ve al marketplace y busca "Combo PubliBags"', 'info')}
          >
            <Info className="size-4 mr-2" />
            Cómo funciona
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Gift className="size-4 text-emerald-600" />
              <p className="text-xs font-semibold">2 bolsos reutilizables</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bolsos ecológicos con códigos QR integrados
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="size-4 text-amber-600" />
              <p className="text-xs font-semibold">2 calendarios-directorio</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tu marca visible todo el año en cada hogar
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BookOpen className="size-4 text-emerald-600" />
              <p className="text-xs font-semibold">2 empastados</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Empastados escolares con tu espacio publicitario
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- EducationalSection ----------
function EducationalSection() {
  const steps = [
    {
      Icon: ShoppingBag,
      title: '1. Compra el Combo PubliBags',
      body: 'Cada combo cuesta $44 e incluye 2 bolsos reutilizables + 2 calendarios-directorio + 2 empastados escolares.',
      tone: 'emerald' as const,
    },
    {
      Icon: Network,
      title: '2. Construye tu red',
      body: 'Refiere a otras personas con tu código de afiliado. Conviértete en N1 o N2 para desbloquear el interés compuesto.',
      tone: 'amber' as const,
    },
    {
      Icon: TrendingUp,
      title: '3. Participa del resultado del periodo',
      body: 'Cada periodo la cooperativa publica su resultado real (reciclaje y ventas). Si hay resultado, se suma a tu capital; si no, tu capital se mantiene. No hay tasa garantizada.',
      tone: 'emerald' as const,
    },
    {
      Icon: Banknote,
      title: '4. Retira cuando quieras',
      body: 'Transfiere tu balance total a tu billetera cooperativa y úsalo en cualquier momento.',
      tone: 'amber' as const,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-primary" />
          ¿Cómo funciona la inversión en bolsos?
        </CardTitle>
        <CardDescription>
          Cuatro pasos simples para hacer crecer tu inversión en el ecosistema PubliBags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pasos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg border p-4 transition-shadow hover:shadow-sm',
                s.tone === 'emerald'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
              )}
            >
              <div className={cn(
                'size-10 rounded-lg flex items-center justify-center mb-2.5',
                s.tone === 'emerald'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
              )}>
                <s.Icon className="size-5" />
              </div>
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* InfoBox diferencia inversión vs marketplace */}
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4">
          <div className="flex gap-3">
            <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Info className="size-4.5" />
            </div>
            <div className="space-y-2 min-w-0">
              <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
                Diferencia entre inversión y marketplace
              </p>
              <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1.5">
                <li className="flex items-start gap-2">
                  <ArrowRight className="size-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Compras en marketplace</strong> = 1% de comisión a N1+N2+N3 (3% total) —
                    fluyen a la red de afiliados.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="size-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    <strong>Compras de Combo PubliBags</strong> = aporte de capital que participa del
                    resultado real publicado de la cooperativa (sin tasa garantizada).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- CompoundCalculator ----------
function CompoundCalculator() {
  const [amount, setAmount] = useState(44)
  const [months, setMonths] = useState(12)
  const [ratePct, setRatePct] = useState(2)
  const monthlyRate = Math.min(Math.max(ratePct, 0), 5) / 100

  // Cálculo de la proyección
  const rows = useMemo(() => {
    const out: { month: number; balance: number; interest: number; cumulative: number }[] = []
    let balance = amount
    let cumulative = 0
    for (let m = 1; m <= months; m++) {
      const interest = +(balance * monthlyRate).toFixed(4)
      balance = +(balance + interest).toFixed(4)
      cumulative = +(cumulative + interest).toFixed(4)
      out.push({ month: m, balance, interest, cumulative })
    }
    return out
  }, [amount, months, monthlyRate])

  const finalBalance = rows.length > 0 ? rows[rows.length - 1].balance : amount
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0)
  const maxBarHeight = 160 // px
  const maxBalance = Math.max(...rows.map((r) => r.balance), amount)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="size-5 text-primary" />
          Calculadora de proyección
        </CardTitle>
        <CardDescription>
          Simulación con una tasa hipotética que tú eliges. No es una promesa: el rendimiento real depende del resultado publicado de la cooperativa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="calc-amount">
              Monto a invertir (USD)
            </Label>
            <Input
              id="calc-amount"
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
            />
            <p className="text-xs text-muted-foreground">
              1 combo PubliBags = $44 (puedes simular cualquier monto)
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[44, 88, 132, 220].map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => setAmount(v)}
                >
                  {v === 44 ? '1 combo · ' : v === 88 ? '2 combos · ' : v === 132 ? '3 combos · ' : '5 combos · '}
                  {fmtUsd(v)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="calc-months">Meses</Label>
              <span className="text-sm font-semibold text-primary">{months} mes{months > 1 ? 'es' : ''}</span>
            </div>
            <Slider
              id="calc-months"
              min={1}
              max={60}
              step={1}
              value={[months]}
              onValueChange={(v) => setMonths(v[0])}
            />
            <p className="text-xs text-muted-foreground">
              Arrastra para elegir entre 1 y 60 meses.
            </p>
            <Label htmlFor="calc-rate" className="pt-2 block">Tasa mensual hipotética (%)</Label>
            <Input
              id="calc-rate"
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={ratePct}
              onChange={(e) => setRatePct(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
            />
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invertido</p>
            <p className="text-lg font-bold mt-0.5">{fmtUsd(amount)}</p>
          </div>
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Interés total</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              +{fmtUsd(totalInterest)}
            </p>
          </div>
          <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance final</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {fmtUsd(finalBalance)}
            </p>
          </div>
        </div>

        {/* Gráfico de barras CSS */}
        <div className="rounded-lg border p-4 bg-muted/20">
          <p className="text-sm font-medium mb-3">Crecimiento del balance (mes a mes)</p>
          <div className="flex items-end gap-1 h-44 overflow-x-auto scroll-thin pb-2"
            style={{ minWidth: 0 }}
          >
            {/* Barra inicial = monto invertido */}
            <div className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 28 }}>
              <div className="text-[9px] text-muted-foreground font-medium">0</div>
              <div
                className="w-6 rounded-t bg-gradient-to-t from-muted-foreground/40 to-muted-foreground/60"
                style={{ height: Math.max(4, (amount / maxBalance) * maxBarHeight) }}
              />
              <div className="text-[9px] text-muted-foreground">ini</div>
            </div>
            {rows.map((r) => (
              <div key={r.month} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 28 }}>
                <div className="text-[9px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {r.month % 3 === 0 || r.month === rows.length ? `${r.balance.toFixed(0)}` : ''}
                </div>
                <div
                  className="w-6 rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300 hover:from-primary hover:to-emerald-400 transition-colors"
                  style={{ height: Math.max(4, (r.balance / maxBalance) * maxBarHeight) }}
                  title={`Mes ${r.month}: ${fmtUsd(r.balance)}`}
                />
                <div className="text-[9px] text-muted-foreground">{r.month}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Eje X: meses · Eje Y: balance · Pasa el cursor por cada barra para ver el monto.
          </p>
        </div>

        {/* Tabla de proyección */}
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto scroll-thin max-h-80">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-16">Mes</TableHead>
                  <TableHead className="text-right">Balance inicio</TableHead>
                  <TableHead className="text-right">Interés ganado</TableHead>
                  <TableHead className="text-right">Balance final</TableHead>
                  <TableHead className="text-right">Interés acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={r.month} className={cn(i % 2 === 1 && 'bg-muted/30')}>
                    <TableCell className="font-medium">{r.month}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtUsd(r.balance - r.interest)}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400 font-medium">
                      +{fmtUsd(r.interest)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {fmtUsd(r.balance)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmtUsd(r.cumulative)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground flex gap-2">
          <Info className="size-3.5 shrink-0 mt-0.5 text-primary" />
          <p>
            Esta calculadora es solo una simulación. El rendimiento real se aplica cada 30 días,
            solo si la cooperativa publicó resultado del periodo, y solo si tienes red (eres N1 o N2).
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- AdminPanel ----------
function AdminPanel({
  data, loading, onRefresh,
}: {
  data: any
  loading: boolean
  onRefresh: () => void
}) {
  if (loading) return <Skeleton className="h-96 w-full" />
  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No se pudo cargar el panel de administración.
        </CardContent>
      </Card>
    )
  }

  const s = data.stats as {
    totalInvested: number
    totalBalance: number
    totalInterestPaid: number
    activeInvestorCount: number
    totalInvestors: number
    activeCount: number
    withdrawnCount: number
    totalCount: number
    withdrawnAmount: number
  }
  const investments: any[] = data.investments || []

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Trophy}
          label="Total invertido"
          value={fmtUsd(s.totalInvested)}
          sub={`${s.totalInvestors} inversionistas`}
          tone="emerald"
        />
        <StatCard
          icon={Wallet}
          label="Balance activo"
          value={fmtUsd(s.totalBalance)}
          sub={`${s.activeCount} inversiones activas`}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Interés pagado"
          value={fmtUsd(s.totalInterestPaid)}
          sub={`Retirado: ${fmtUsd(s.withdrawnAmount)}`}
          tone="amber"
        />
        <StatCard
          icon={Network}
          label="Inversionistas activos"
          value={String(s.activeInvestorCount)}
          sub={`${s.totalInvestors} total`}
          tone="emerald"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          Todas las inversiones ({investments.length})
        </h2>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className="size-4 mr-1" /> Refrescar
        </Button>
      </div>

      {/* Tabla global */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto scroll-thin max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Inversionista</TableHead>
                  <TableHead className="text-center">Combos</TableHead>
                  <TableHead className="text-right">Invertido</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Interés ganado</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead>Último compound</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No hay inversiones registradas en la plataforma.
                    </TableCell>
                  </TableRow>
                ) : (
                  investments.map((inv: any, i: number) => (
                    <TableRow key={inv.id} className={cn(i % 2 === 1 && 'bg-muted/30')}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{inv.user?.name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{inv.user?.email}</p>
                          <Badge variant="outline" className="mt-0.5 text-[10px]">
                            {inv.user?.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{inv.comboQuantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmtUsd(inv.amount)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {fmtUsd(inv.currentBalance)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {fmtUsd(inv.totalEarned)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn('border text-[10px]', STATUS_BADGES[inv.status] || STATUS_BADGES.ACTIVE)}>
                          {STATUS_LABELS[inv.status] || inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(inv.lastCompoundAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
