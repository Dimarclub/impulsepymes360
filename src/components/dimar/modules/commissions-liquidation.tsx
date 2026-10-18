'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Wallet, Users, Coins, Loader2, BanknoteIcon, CheckCircle2, AlertCircle,
  Award, Mail, UserCircle2, Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// ---------- tipos locales ----------
interface CommissionLiquidation {
  id: string
  userId: string
  orderId?: string | null
  amount: number
  level: number
  rate: number
  status: string
  createdAt: string
  user: { name: string; email: string; affiliateCode: string }
  sourceUser?: { name: string } | null
}

interface ByUserRow {
  userId: string
  name: string
  email: string
  affiliateCode: string
  total: number
  count: number
}

interface LiquidateResponse {
  commissions: CommissionLiquidation[]
  byUser: ByUserRow[]
}

// ---------- helpers ----------
const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0)

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

const fmtDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-EC', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const fmtRate = (r: number) => `${(r * 100).toFixed(1)}%`

const LEVEL_BADGE: Record<number, string> = {
  0: 'bg-primary/15 text-primary border-primary/20',
  1: 'bg-amber-100 text-amber-800 border-amber-200',
  2: 'bg-teal-100 text-teal-800 border-teal-200',
  3: 'bg-muted text-muted-foreground border-border',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-primary/15 text-primary border-primary/20',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

// ---------- skeleton ----------
function LiquidationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

// ---------- empty state ----------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="grid place-items-center size-16 rounded-2xl bg-emerald-50 text-emerald-700 mb-4">
        <CheckCircle2 className="size-8" />
      </div>
      <h2 className="text-xl font-bold text-foreground">No hay comisiones pendientes</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Todas las comisiones han sido liquidadas. Vuelve más tarde para revisar
        nuevas comisiones generadas por pedidos de la red de afiliados.
      </p>
    </div>
  )
}

// ---------- módulo principal ----------
export function CommissionsLiquidation() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<LiquidateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [liquidating, setLiquidating] = useState<'all' | string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliates/commissions/liquidate?status=PENDING')
      if (!res.ok) throw new Error()
      const json = (await res.json()) as LiquidateResponse
      setData(json)
    } catch {
      toast('Error al cargar comisiones pendientes', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totals = useMemo(() => {
    const total = (data?.byUser || []).reduce((s, u) => s + (u.total || 0), 0)
    const affiliates = data?.byUser?.length || 0
    const count = (data?.byUser || []).reduce((s, u) => s + u.count, 0)
    return { total, affiliates, count }
  }, [data])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!data) return
    const all = data.commissions.length
    if (selected.size === all) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.commissions.map((c) => c.id)))
    }
  }

  const liquidateAll = async () => {
    setLiquidating('all')
    try {
      const res = await fetch('/api/affiliates/commissions/liquidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) throw new Error()
      const { liquidated } = (await res.json()) as { liquidated: number }
      toast(`Liquidadas ${liquidated} comisiones`)
      setSelected(new Set())
      await fetchData()
    } catch {
      toast('Error al liquidar comisiones', 'error')
    } finally {
      setLiquidating(null)
    }
  }

  const liquidateUser = async (userId: string) => {
    setLiquidating(userId)
    try {
      const res = await fetch('/api/affiliates/commissions/liquidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true, userId }),
      })
      if (!res.ok) throw new Error()
      const { liquidated } = (await res.json()) as { liquidated: number }
      toast(`Liquidadas ${liquidated} comisiones`)
      setSelected(new Set())
      await fetchData()
    } catch {
      toast('Error al liquidar comisiones del afiliado', 'error')
    } finally {
      setLiquidating(null)
    }
  }

  const liquidateSelected = async () => {
    if (selected.size === 0) {
      toast('Selecciona al menos una comisión', 'info')
      return
    }
    setLiquidating('selected')
    try {
      const res = await fetch('/api/affiliates/commissions/liquidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionIds: Array.from(selected) }),
      })
      if (!res.ok) throw new Error()
      const { liquidated } = (await res.json()) as { liquidated: number }
      toast(`Liquidadas ${liquidated} comisiones`)
      setSelected(new Set())
      await fetchData()
    } catch {
      toast('Error al liquidar comisiones seleccionadas', 'error')
    } finally {
      setLiquidating(null)
    }
  }

  if (loading) return <LiquidationSkeleton />
  if (!data || (data.commissions.length === 0 && data.byUser.length === 0)) {
    return <EmptyState />
  }

  const allSelected = data.commissions.length > 0 && selected.size === data.commissions.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <BanknoteIcon className="size-5 text-primary" />
            Liquidación de comisiones
          </h2>
          <p className="text-sm text-muted-foreground">
            Marca como <span className="font-medium text-foreground">pagadas</span> las
            comisiones acumuladas por la red de afiliados.
          </p>
        </div>
        <Button
          onClick={liquidateAll}
          disabled={liquidating === 'all' || data.commissions.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {liquidating === 'all' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BanknoteIcon className="size-4" />
          )}
          Liquidar todo
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SummaryCard
          icon={<Wallet className="size-5" />}
          label="Total pendiente"
          value={usd(totals.total)}
          accent="emerald"
        />
        <SummaryCard
          icon={<Users className="size-5" />}
          label="Afiliados con saldo"
          value={fmtNum(totals.affiliates)}
          accent="amber"
        />
        <SummaryCard
          icon={<Coins className="size-5" />}
          label="Comisiones pendientes"
          value={fmtNum(totals.count)}
          accent="emerald"
        />
      </div>

      {/* Tabla por usuario */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle2 className="size-4 text-primary" />
            Saldos por afiliado
          </CardTitle>
          <CardDescription className="text-xs">
            Liquida todas las comisiones pendientes de un afiliado en un solo clic.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="px-4">Afiliado</TableHead>
                  <TableHead className="px-4 hidden sm:table-cell">Email</TableHead>
                  <TableHead className="px-4 hidden md:table-cell">Código</TableHead>
                  <TableHead className="px-4 text-center">Comisiones</TableHead>
                  <TableHead className="px-4 text-right">Monto total</TableHead>
                  <TableHead className="px-4 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byUser.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="px-4">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <span className="grid place-items-center size-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Mail className="size-3" />
                        {u.email}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 hidden md:table-cell">
                      <span className="font-mono text-xs inline-flex items-center gap-1 text-amber-700">
                        <Award className="size-3" />
                        {u.affiliateCode || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        {u.count}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 text-right font-bold text-foreground">
                      {usd(u.total)}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => liquidateUser(u.userId)}
                        disabled={liquidating === u.userId || liquidating === 'all'}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        {liquidating === u.userId ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <BanknoteIcon className="size-3.5" />
                        )}
                        Liquidar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data.byUser.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Sin afiliados con saldo pendiente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalle de comisiones */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Detalle de comisiones pendientes
          </CardTitle>
          <CardDescription className="text-xs">
            {data.commissions.length} comisiones · selecciona individualmente para liquidar.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-md border max-h-96 overflow-y-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-10 px-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todas"
                    />
                  </TableHead>
                  <TableHead className="px-3">Fecha</TableHead>
                  <TableHead className="px-3">Afiliado</TableHead>
                  <TableHead className="px-3 hidden md:table-cell">Origen</TableHead>
                  <TableHead className="px-3 text-center">Nivel</TableHead>
                  <TableHead className="px-3 text-right hidden sm:table-cell">Tasa</TableHead>
                  <TableHead className="px-3 text-right">Monto</TableHead>
                  <TableHead className="px-3 text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.commissions.map((c) => (
                  <TableRow
                    key={c.id}
                    className={cn(
                      selected.has(c.id) && 'bg-primary/5',
                    )}
                  >
                    <TableCell className="px-3">
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={() => toggle(c.id)}
                        aria-label={`Seleccionar comisión ${c.id}`}
                      />
                    </TableCell>
                    <TableCell className="px-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmtDateTime(c.createdAt)}
                    </TableCell>
                    <TableCell className="px-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[160px]">
                          {c.user?.name || '—'}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {c.user?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 hidden md:table-cell text-sm text-muted-foreground">
                      {c.sourceUser?.name || 'Venta directa'}
                    </TableCell>
                    <TableCell className="px-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[11px] font-mono',
                          LEVEL_BADGE[Math.min(c.level, 3)] || LEVEL_BADGE[3],
                        )}
                      >
                        N{c.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 text-right hidden sm:table-cell text-xs text-muted-foreground">
                      {fmtRate(c.rate)}
                    </TableCell>
                    <TableCell className="px-3 text-right font-semibold text-foreground">
                      {usd(c.amount)}
                    </TableCell>
                    <TableCell className="px-3 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[11px]',
                          STATUS_COLORS[c.status] || 'bg-muted text-muted-foreground border-border',
                        )}
                      >
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {data.commissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      <AlertCircle className="size-5 mx-auto mb-1 opacity-60" />
                      No hay comisiones en este estado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer de selección */}
          {data.commissions.length > 0 && (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-xs text-muted-foreground">
                {selected.size === 0 ? (
                  'Selecciona comisiones para liquidar.'
                ) : (
                  <>
                    <span className="font-medium text-foreground">{selected.size}</span>{' '}
                    {selected.size === 1 ? 'comisión seleccionada' : 'comisiones seleccionadas'}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                  disabled={selected.size === 0 || liquidating === 'selected'}
                >
                  Limpiar
                </Button>
                <Button
                  size="sm"
                  onClick={liquidateSelected}
                  disabled={selected.size === 0 || liquidating === 'selected'}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {liquidating === 'selected' ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <BanknoteIcon className="size-3.5" />
                  )}
                  Liquidar seleccionadas
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- sub-componentes ----------
function SummaryCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: 'emerald' | 'amber' }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={cn(
            'size-10 rounded-lg flex items-center justify-center shrink-0',
            accent === 'emerald'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-bold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CommissionsLiquidation
