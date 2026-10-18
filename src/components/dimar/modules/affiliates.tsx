'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Network, Users, Coins, GitBranch, ShoppingBag, Filter,
  Wallet, TrendingUp, MapPin, Mail, Award, UserCircle2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { AffiliateNode, Commission, Order } from '@/lib/types'
import { ORDER_STATUS_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

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

// Colores por nivel (avatar + acentos)
const LEVEL_STYLES: Record<
  number, { ring: string; bg: string; text: string; label: string; chip: string }
> = {
  0: {
    ring: 'ring-primary/30',
    bg: 'bg-primary text-primary-foreground',
    text: 'text-primary',
    label: 'N0 · Tú',
    chip: 'bg-primary/15 text-primary border-primary/20',
  },
  1: {
    ring: 'ring-amber-400/40',
    bg: 'bg-accent text-accent-foreground',
    text: 'text-amber-700',
    label: 'N1',
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  2: {
    ring: 'ring-teal-400/40',
    bg: 'bg-teal-600 text-white',
    text: 'text-teal-700',
    label: 'N2',
    chip: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  3: {
    ring: 'ring-muted-foreground/30',
    bg: 'bg-muted text-muted-foreground',
    text: 'text-muted-foreground',
    label: 'N3',
    chip: 'bg-muted text-muted-foreground border-border',
  },
}
const getLevelStyle = (level: number) =>
  LEVEL_STYLES[Math.min(level, 3)] || LEVEL_STYLES[3]

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  AFFILIATE: 'Afiliado',
  CLIENT: 'Cliente',
  SUPPLIER: 'Proveedor',
  COURIER: 'Mensajero',
  PARTNER: 'Socio',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-primary/10 text-primary border-primary/20',
  AFFILIATE: 'bg-accent/20 text-accent-foreground border-accent/30',
  CLIENT: 'bg-muted text-muted-foreground border-border',
  SUPPLIER: 'bg-teal-100 text-teal-800 border-teal-200',
  COURIER: 'bg-amber-100 text-amber-800 border-amber-200',
  PARTNER: 'bg-primary/10 text-primary border-primary/20',
}

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  CANCELLED: 'Cancelada',
}
const COMMISSION_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PAID: 'bg-primary/15 text-primary border-primary/20',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SHIPPED: 'bg-teal-100 text-teal-800 border-teal-200',
  DELIVERED: 'bg-primary/15 text-primary border-primary/20',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
}

const N0_RATE = 0.03 // 3% comisión propia

// ---------- helpers de red ----------
function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

function countNetwork(node: AffiliateNode): number {
  let n = 0
  for (const c of node.children) {
    n += 1 + countNetwork(c)
  }
  return n
}

function sumCommissions(node: AffiliateNode): number {
  let s = node.stats?.commissions || 0
  for (const c of node.children) s += sumCommissions(c)
  return s
}

// ---------- Nodo de árbol ----------
function NodeCard({ node, level }: { node: AffiliateNode; level: number }) {
  const style = getLevelStyle(level)
  return (
    <div className="w-[200px] max-w-full">
      <div
        className={cn(
          'relative rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5',
          level === 0 ? 'border-primary/40' : 'border-border',
        )}
      >
        {/* encabezado: avatar + código */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'grid place-items-center size-10 rounded-full text-sm font-bold ring-2 shrink-0',
              style.bg,
              style.ring,
            )}
          >
            {getInitials(node.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{node.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{node.email}</p>
          </div>
        </div>

        {/* badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <Badge variant="outline" className={cn('border', style.chip)}>
            {style.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn('border', ROLE_COLORS[node.role] || ROLE_COLORS.CLIENT)}
          >
            {ROLE_LABELS[node.role] || node.role}
          </Badge>
        </div>

        {/* info */}
        <div className="mt-2.5 space-y-1 text-[11px] text-muted-foreground">
          {node.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{node.city}</span>
            </div>
          )}
          {node.affiliateCode && (
            <div className="flex items-center gap-1.5">
              <Award className="size-3 shrink-0" />
              <span className="font-mono truncate">{node.affiliateCode}</span>
            </div>
          )}
        </div>

        {/* stats */}
        <div className="mt-2.5 grid grid-cols-3 gap-1 border-t border-border/60 pt-2">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Referidos
            </p>
            <p className="text-sm font-bold text-foreground">
              {node.stats?.referrals ?? 0}
            </p>
          </div>
          <div className="text-center border-x border-border/60">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Ventas
            </p>
            <p className="text-sm font-bold text-foreground">
              {node.stats?.sales ?? 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Comisión
            </p>
            <p className={cn('text-sm font-bold', style.text)}>
              {fmtUSD(node.stats?.commissions || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- TreeNode recursivo ----------
function TreeNode({ node, level }: { node: AffiliateNode; level: number }) {
  const hasChildren = node.children.length > 0
  const childCount = node.children.length

  return (
    <div className="relative flex flex-col items-center">
      <NodeCard node={node} level={level} />

      {hasChildren && (
        <>
          {/* línea vertical hacia abajo */}
          <div className="w-px h-5 bg-border" aria-hidden />

          {/* contenedor de hijos */}
          <div
            className="relative flex justify-center"
            style={{ gap: 0 }}
          >
            {/* línea horizontal conectora (solo si hay 2+ hijos) */}
            {childCount > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(50% / ${childCount})`,
                  right: `calc(50% / ${childCount})`,
                }}
                aria-hidden
              />
            )}

            {node.children.map((child) => (
              <div
                key={child.id}
                className="relative flex flex-col items-center px-2"
              >
                {/* línea vertical hacia arriba (hijo) */}
                <div className="w-px h-5 bg-border" aria-hidden />
                <TreeNode node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Skeletons ----------
function TreeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24 mt-2" />
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-32 w-64 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-32 w-48 rounded-xl" />
            <Skeleton className="h-32 w-48 rounded-xl" />
          </div>
        </div>
      </Card>
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="p-0">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full mb-2" />
        ))}
      </CardContent>
    </Card>
  )
}

// ---------- Mini stat card ----------
function MiniStat({
  icon, label, value, accent = 'primary',
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: 'primary' | 'accent' | 'muted' | 'teal'
}) {
  const accentClass =
    accent === 'primary'
      ? 'bg-primary/10 text-primary'
      : accent === 'accent'
        ? 'bg-accent/20 text-accent-foreground'
        : accent === 'teal'
          ? 'bg-teal-100 text-teal-700'
          : 'bg-muted text-muted-foreground'
  return (
    <Card className="p-4 gap-0">
      <div className="flex items-center gap-3">
        <div className={cn('grid place-items-center size-9 rounded-lg shrink-0', accentClass)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-lg font-bold text-foreground truncate">{value}</p>
        </div>
      </div>
    </Card>
  )
}

// ===================== TAB: MI RED =====================
function MiRedTab({ userId }: { userId?: string }) {
  const [tree, setTree] = useState<AffiliateNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const url = userId
      ? `/api/affiliates/tree?userId=${encodeURIComponent(userId)}`
      : '/api/affiliates/tree'
    fetch(url)
      .then((r) => r.json())
      .then((d: AffiliateNode) => {
        if (mounted) {
          setTree(d)
          setLoading(false)
        }
      })
      .catch(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [userId])

  if (loading || !tree) return <TreeSkeleton />

  const networkSize = countNetwork(tree)
  const totalCommissions = sumCommissions(tree)
  const directReferrals = tree.stats?.referrals ?? 0

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 md:col-span-2 gap-0">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center size-12 rounded-xl bg-primary text-primary-foreground shrink-0">
              <Award className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                Tu código de afiliado
              </p>
              <p className="text-2xl font-bold text-foreground font-mono truncate">
                {tree.affiliateCode || '—'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {tree.name} · {ROLE_LABELS[tree.role] || tree.role}
              </p>
            </div>
          </div>
        </Card>
        <MiniStat
          icon={<Users className="size-4" />}
          label="Referidos directos"
          value={fmtNum(directReferrals)}
          accent="primary"
        />
        <MiniStat
          icon={<Coins className="size-4" />}
          label="Comisiones totales"
          value={fmtUSD(totalCommissions)}
          accent="accent"
        />
      </div>

      <Card className="p-4">
        <MiniStat
          icon={<GitBranch className="size-4" />}
          label="Tamaño total de la red"
          value={`${fmtNum(networkSize)} afiliados`}
          accent="teal"
        />
      </Card>

      {/* Árbol visual */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-5 text-primary" />
            Árbol de afiliados
          </CardTitle>
          <CardDescription>
            Estructura jerárquica de tu red · 3 niveles de profundidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto scroll-thin pb-4">
            <div className="min-w-max mx-auto py-2">
              <TreeNode node={tree} level={0} />
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
            <span className="text-xs font-medium text-muted-foreground">Niveles:</span>
            {Object.entries(LEVEL_STYLES).map(([lvl, s]) => (
              <div key={lvl} className="flex items-center gap-1.5">
                <span className={cn('size-3 rounded-sm', s.bg)} />
                <Badge variant="outline" className={cn('border', s.chip)}>
                  {s.label}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===================== TAB: COMISIONES =====================
function ComisionesTab({ userId }: { userId?: string }) {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    let mounted = true
    const url = userId
      ? `/api/affiliates/commissions?userId=${encodeURIComponent(userId)}`
      : '/api/affiliates/commissions'
    fetch(url)
      .then((r) => r.json())
      .then((d: Commission[]) => {
        if (mounted) {
          setCommissions(d)
          setLoading(false)
        }
      })
      .catch(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [userId])

  const totalsByLevel = useMemo(() => {
    const map: Record<string, number> = { N0: 0, N1: 0, N2: 0, N3: 0 }
    for (const c of commissions) {
      const key = `N${c.level}`
      map[key] = (map[key] || 0) + c.amount
    }
    return map
  }, [commissions])

  const total = useMemo(
    () => commissions.reduce((s, c) => s + c.amount, 0),
    [commissions],
  )

  const filtered = useMemo(() => {
    if (filter === 'ALL') return commissions
    return commissions.filter((c) => `N${c.level}` === filter)
  }, [commissions, filter])

  if (loading) return <TableSkeleton rows={6} />

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat
          icon={<Wallet className="size-4" />}
          label="Total comisiones"
          value={fmtUSD(total)}
          accent="primary"
        />
        <MiniStat
          icon={<Coins className="size-4" />}
          label="Nivel 0 (3%)"
          value={fmtUSD(totalsByLevel.N0 || 0)}
          accent="primary"
        />
        <MiniStat
          icon={<Coins className="size-4" />}
          label="Nivel 1 (2%)"
          value={fmtUSD(totalsByLevel.N1 || 0)}
          accent="accent"
        />
        <MiniStat
          icon={<Coins className="size-4" />}
          label="Niveles 2+3"
          value={fmtUSD((totalsByLevel.N2 || 0) + (totalsByLevel.N3 || 0))}
          accent="teal"
        />
      </div>

      {/* Filtro + tabla */}
      <Card className="p-0">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Historial de comisiones</CardTitle>
              <CardDescription>
                {filtered.length} registros · Total {fmtUSD(filtered.reduce((s, c) => s + c.amount, 0))}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[160px]" size="sm">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los niveles</SelectItem>
                  <SelectItem value="N0">Nivel 0 (3%)</SelectItem>
                  <SelectItem value="N1">Nivel 1 (2%)</SelectItem>
                  <SelectItem value="N2">Nivel 2 (1%)</SelectItem>
                  <SelectItem value="N3">Nivel 3 (0.5%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] overflow-y-auto scroll-thin rounded-md border border-border/60">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="px-4">Fecha</TableHead>
                  <TableHead className="px-4">Origen</TableHead>
                  <TableHead className="px-4">Nivel</TableHead>
                  <TableHead className="px-4 text-right">Tasa</TableHead>
                  <TableHead className="px-4 text-right">Monto</TableHead>
                  <TableHead className="px-4">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const style = getLevelStyle(c.level)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="px-4 text-xs text-muted-foreground">
                        {fmtDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 font-medium">
                        {c.sourceUser?.name || 'Venta directa'}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className={cn('border', style.chip)}>
                          N{c.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 text-right text-muted-foreground">
                        {(c.rate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="px-4 text-right font-semibold text-primary">
                        {fmtUSD(c.amount)}
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border',
                            COMMISSION_STATUS_COLORS[c.status] ||
                              'bg-muted text-muted-foreground border-border',
                          )}
                        >
                          {COMMISSION_STATUS_LABELS[c.status] || c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay comisiones para este filtro
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

// ===================== TAB: MIS VENTAS =====================
function MisVentasTab({ userId }: { userId?: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const url = userId
      ? `/api/affiliates/sales?userId=${encodeURIComponent(userId)}`
      : '/api/affiliates/sales'
    fetch(url)
      .then((r) => r.json())
      .then((d: Order[]) => {
        if (mounted) {
          setOrders(d)
          setLoading(false)
        }
      })
      .catch(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [userId])

  if (loading) return <TableSkeleton rows={6} />

  const totalVentas = orders.reduce((s, o) => s + o.total, 0)
  const totalComisionN0 = orders.reduce((s, o) => s + o.total * N0_RATE, 0)

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat
          icon={<ShoppingBag className="size-4" />}
          label="Total ventas"
          value={fmtNum(orders.length)}
          accent="primary"
        />
        <MiniStat
          icon={<TrendingUp className="size-4" />}
          label="Monto vendido"
          value={fmtUSD(totalVentas)}
          accent="primary"
        />
        <MiniStat
          icon={<Coins className="size-4" />}
          label="Comisión N0 (3%)"
          value={fmtUSD(totalComisionN0)}
          accent="accent"
        />
        <MiniStat
          icon={<UserCircle2 className="size-4" />}
          label="Ticket promedio"
          value={orders.length > 0 ? fmtUSD(totalVentas / orders.length) : '$0.00'}
          accent="teal"
        />
      </div>

      {/* Tabla */}
      <Card className="p-0">
        <CardHeader>
          <CardTitle>Tus ventas directas</CardTitle>
          <CardDescription>
            Generas {N0_RATE * 100}% de comisión por cada venta propia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] overflow-y-auto scroll-thin rounded-md border border-border/60">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="px-4">Pedido</TableHead>
                  <TableHead className="px-4">Fecha</TableHead>
                  <TableHead className="px-4 text-center">Items</TableHead>
                  <TableHead className="px-4 text-right">Total</TableHead>
                  <TableHead className="px-4">Estado</TableHead>
                  <TableHead className="px-4 text-right">Comisión N0</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="px-4 font-mono text-xs text-foreground">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell className="px-4 text-xs text-muted-foreground">
                      {fmtDate(o.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 text-center text-muted-foreground">
                      {o.items?.length || 0}
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
                    <TableCell className="px-4 text-right font-semibold text-primary">
                      {fmtUSD(o.total * N0_RATE)}
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aún no tienes ventas registradas
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

// ===================== Módulo principal =====================
export function AffiliatesModule() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [tab, setTab] = useState('red')

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="grid place-items-center size-16 rounded-2xl bg-muted text-muted-foreground mb-4">
          <UserCircle2 className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Inicia sesión para ver tu red</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Necesitas una cuenta activa para acceder al back-office de afiliados,
          visualizar tu árbol de referidos y consultar tus comisiones.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="size-7 text-primary" />
          Back-office de afiliados
        </h1>
        <p className="text-muted-foreground text-sm">
          {currentUser.name} · Código{' '}
          <span className="font-mono font-semibold text-foreground">
            {currentUser.affiliateCode || '—'}
          </span>
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-grid">
          <TabsTrigger value="red">
            <Network className="size-4 mr-1.5" />
            <span className="hidden sm:inline">Mi Red</span>
            <span className="sm:hidden">Red</span>
          </TabsTrigger>
          <TabsTrigger value="comisiones">
            <Coins className="size-4 mr-1.5" />
            <span className="hidden sm:inline">Comisiones</span>
            <span className="sm:hidden">Comis.</span>
          </TabsTrigger>
          <TabsTrigger value="ventas">
            <ShoppingBag className="size-4 mr-1.5" />
            <span className="hidden sm:inline">Mis Ventas</span>
            <span className="sm:hidden">Ventas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="red" className="mt-6">
          <MiRedTab userId={currentUser.id} />
        </TabsContent>
        <TabsContent value="comisiones" className="mt-6">
          <ComisionesTab userId={currentUser.id} />
        </TabsContent>
        <TabsContent value="ventas" className="mt-6">
          <MisVentasTab userId={currentUser.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
