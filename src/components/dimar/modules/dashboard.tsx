'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DollarSign, ShoppingBag, Users, Coins, Landmark, Package,
  Bike, Clock, TrendingUp, TrendingDown,
} from 'lucide-react'
import { ORDER_STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

// ---------- tipos locales ----------
interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalSuppliers: number
  totalCouriers: number
  totalPartners: number
  totalAffiliates: number
  pendingApps: number
  revenue: number
  totalCommissions: number
  totalCapital: number
  adClicks: number
  adImpressions: number
}
interface SalesByDay { date: string; total: number }
interface SalesByCategory { name: string; value: number }
interface CommissionsByLevel { name: string; value: number }
interface RecentOrder {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  user?: { name: string } | null
}
interface DashboardData {
  stats: DashboardStats
  salesByDay: SalesByDay[]
  salesByCategory: SalesByCategory[]
  commissionsByLevel: CommissionsByLevel[]
  recentOrders: RecentOrder[]
  topProducts: { name: string; sales: number; revenue: number }[]
}

// ---------- helpers ----------
const fmtUSD = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtNum = (n: number) => (n || 0).toLocaleString('es-EC')
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-EC', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return iso
  }
}
const fmtShortDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('es-EC', {
      day: '2-digit', month: '2-digit',
    })
  } catch {
    return iso
  }
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SHIPPED: 'bg-teal-100 text-teal-800 border-teal-200',
  DELIVERED: 'bg-primary/15 text-primary border-primary/20',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const PRIMARY = 'oklch(0.6 0.13 162)'
const SECONDARY = 'oklch(0.75 0.15 75)'

// ---------- StatCard ----------
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  trend?: { value: number; positive: boolean }
  accent?: 'primary' | 'accent' | 'muted'
  hint?: string
}

function StatCard({ icon, label, value, trend, accent = 'primary', hint }: StatCardProps) {
  const accentBg =
    accent === 'primary'
      ? 'bg-primary/10 text-primary'
      : accent === 'accent'
        ? 'bg-accent/20 text-accent-foreground'
        : 'bg-muted text-muted-foreground'

  return (
    <Card className="p-5 gap-0 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-bold text-foreground truncate">
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                trend.positive ? 'text-primary' : 'text-destructive',
              )}
            >
              {trend.positive ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              <span>
                {trend.positive ? '+' : ''}
                {trend.value}%
              </span>
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
          {!trend && hint && (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            'shrink-0 grid place-items-center size-11 rounded-xl',
            accentBg,
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ---------- skeleton ----------
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
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
      <Card className="p-0">
        <CardHeader>
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- tooltips personalizados ----------
function SalesTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs">
      <p className="font-medium text-foreground">{fmtShortDate(label)}</p>
      <p className="mt-1 text-primary font-semibold">
        {fmtUSD(payload[0].value)}
      </p>
    </div>
  )
}

function CategoryTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs">
      <p className="font-medium text-foreground">{payload[0].payload.name}</p>
      <p className="mt-1 text-primary font-semibold">
        {fmtUSD(payload[0].value)}
      </p>
    </div>
  )
}

function LevelTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0]
  const total = p.payload.__total || 0
  const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0'
  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md text-xs">
      <p className="font-medium text-foreground">{p.name}</p>
      <p className="mt-1 text-primary font-semibold">{fmtUSD(p.value)}</p>
      <p className="text-muted-foreground">{pct}% del total</p>
    </div>
  )
}

// ---------- módulo principal ----------
export function DashboardModule() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData) => {
        if (mounted) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel administrativo</h1>
          <p className="text-muted-foreground text-sm">Cargando métricas…</p>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  const { stats, salesByDay, salesByCategory, commissionsByLevel, recentOrders } = data
  const commissionsTotal = commissionsByLevel.reduce((s, c) => s + c.value, 0)
  const pieData = commissionsByLevel.map((c) => ({
    ...c,
    __total: commissionsTotal,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Panel administrativo
        </h1>
        <p className="text-muted-foreground text-sm">
          Visión global del marketplace Dimarclub en tiempo real.
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="size-5" />}
          label="Ingresos totales"
          value={fmtUSD(stats.revenue)}
          accent="primary"
          trend={{ value: 12.4, positive: true }}
          hint="vs. mes anterior"
        />
        <StatCard
          icon={<ShoppingBag className="size-5" />}
          label="Pedidos"
          value={fmtNum(stats.totalOrders)}
          accent="primary"
          trend={{ value: 8.1, positive: true }}
          hint="vs. mes anterior"
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Usuarios"
          value={fmtNum(stats.totalUsers)}
          accent="accent"
          trend={{ value: 5.2, positive: true }}
          hint="vs. mes anterior"
        />
        <StatCard
          icon={<Coins className="size-5" />}
          label="Comisiones pagadas"
          value={fmtUSD(stats.totalCommissions)}
          accent="accent"
          trend={{ value: 3.7, positive: false }}
          hint="vs. mes anterior"
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Landmark className="size-5" />}
          label="Capital socios"
          value={fmtUSD(stats.totalCapital)}
          accent="accent"
          hint={`${fmtNum(stats.totalPartners)} socios activos`}
        />
        <StatCard
          icon={<Package className="size-5" />}
          label="Proveedores"
          value={fmtNum(stats.totalSuppliers)}
          accent="primary"
          hint={`${fmtNum(stats.totalProducts)} productos`}
        />
        <StatCard
          icon={<Bike className="size-5" />}
          label="Mensajeros"
          value={fmtNum(stats.totalCouriers)}
          accent="primary"
          hint="Flota de entrega"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Solicitudes pendientes"
          value={fmtNum(stats.pendingApps)}
          accent="muted"
          hint="Requieren revisión"
        />
      </div>

      {/* Gráfico de ventas 14 días */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Ventas últimos 14 días</CardTitle>
          <CardDescription>
            Tendencia de ingresos por día · Total {fmtUSD(salesByDay.reduce((s, d) => s + d.total, 0))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesByDay}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.05} />
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
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 160)' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip content={<SalesTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#salesGradient)"
                  activeDot={{ r: 5, fill: PRIMARY, stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por categoría */}
        <Card className="p-0">
          <CardHeader>
            <CardTitle>Ventas por categoría</CardTitle>
            <CardDescription>Distribución de ingresos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesByCategory}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 130)" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 11, fill: 'oklch(0.5 0.02 160)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: 'oklch(0.3 0.02 160)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'oklch(0.52 0.13 162 / 0.05)' }} />
                  <Bar
                    dataKey="value"
                    fill={PRIMARY}
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comisiones por nivel */}
        <Card className="p-0">
          <CardHeader>
            <CardTitle>Comisiones por nivel</CardTitle>
            <CardDescription>
              Distribución · Total {fmtUSD(commissionsTotal)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                      ))}
                    </Pie>
                    <Tooltip content={<LevelTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2.5">
                {pieData.map((c, i) => {
                  const pct = commissionsTotal > 0 ? (c.value / commissionsTotal) * 100 : 0
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-3 rounded-sm shrink-0"
                          style={{ background: `var(--chart-${(i % 5) + 1})` }}
                        />
                        <span className="font-medium text-foreground">{c.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-foreground">{fmtUSD(c.value)}</p>
                        <p className="text-xs text-muted-foreground">{pct.toFixed(1)}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos recientes */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Pedidos recientes</CardTitle>
          <CardDescription>Últimas {recentOrders.length} transacciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto scroll-thin rounded-md border border-border/60">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="px-4">Pedido</TableHead>
                  <TableHead className="px-4">Cliente</TableHead>
                  <TableHead className="px-4 text-right">Total</TableHead>
                  <TableHead className="px-4">Estado</TableHead>
                  <TableHead className="px-4 text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="px-4 font-mono text-xs text-foreground">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell className="px-4 font-medium">
                      {o.user?.name || '—'}
                    </TableCell>
                    <TableCell className="px-4 text-right font-semibold">
                      {fmtUSD(o.total)}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          'border',
                          ORDER_STATUS_COLORS[o.status] ||
                            'bg-muted text-muted-foreground border-border',
                        )}
                      >
                        {ORDER_STATUS_LABELS[o.status] || o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-right text-muted-foreground text-xs">
                      {fmtDate(o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Sin pedidos recientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
