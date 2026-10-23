'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Package,
  RefreshCw,
  MapPin,
  Calendar,
  Printer,
  Search,
  Store,
  CircleDollarSign,
  Layers,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  QrCode,
  Lock,
  LogIn,
  AlertTriangle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  BAG_PANELS,
  BAG_TOTAL_SPACES,
  panelForPosition,
  rowColForPosition,
  sponsorColor,
  sponsorColorLight,
  type BagPanel,
} from '@/lib/bag-plan'

// ---------- Tipos locales ----------

interface BagSpace {
  id: string
  position: number
  type: string
  status: string
  price: number
  providerId?: string | null
  provider?: { companyName: string; logoUrl?: string | null; websiteSlug?: string } | null
  imageUrl?: string | null
  reservedAt?: string | null
  soldAt?: string | null
}

interface BagEdition {
  id: string
  name: string
  slug: string
  city: string
  totalSpaces: number
  bagSize: string
  printQuantity: number
  startDate: string
  endDate: string
  status: string
}

interface BagStats {
  total: number
  available: number
  reserved: number
  sold: number
  revenue: number
  potential: number
}

interface BagPlanData {
  edition: BagEdition
  spaces: BagSpace[]
  panels: BagPanel[]
  stats: BagStats
}

interface SupplierOption {
  id: string
  companyName: string
  logoUrl?: string | null
}

// ---------- Helpers ----------

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}
const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Reservado',
  SOLD: 'Vendido',
}

const TYPE_LABELS: Record<string, string> = {
  QR: 'QR',
  IMAGE: 'Imagen',
  LOGO: 'Logo',
}

// ---------- Componente principal ----------

export function BagPlanModule() {
  const [tab, setTab] = useState('plano')
  const [data, setData] = useState<BagPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterPanel, setFilterPanel] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedSpace, setSelectedSpace] = useState<BagSpace | null>(null)
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/impulse/bag-plan')
      if (!res.ok) throw new Error('Error al cargar')
      const json = (await res.json()) as BagPlanData
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filtrado de espacios
  const filteredSpaces = useMemo(() => {
    if (!data) return []
    return data.spaces.filter((s) => {
      if (filterPanel !== 'all') {
        const p = panelForPosition(s.position)
        if (p.key !== filterPanel) return false
      }
      if (filterType !== 'all' && s.type !== filterType) return false
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const name = s.provider?.companyName?.toLowerCase() || ''
        if (!name.includes(q)) return false
      }
      return true
    })
  }, [data, filterPanel, filterType, search])

  // Sponsor lookup map
  const sponsors = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { id: string; name: string; logoUrl?: string | null; count: number; invested: number; status: string }>()
    for (const s of data.spaces) {
      if (s.status === 'SOLD' && s.provider) {
        const key = s.provider.companyName
        const existing = map.get(key) || { id: s.providerId || key, name: key, logoUrl: s.provider.logoUrl, count: 0, invested: 0, status: 'Activo' }
        existing.count++
        existing.invested += s.price || 0
        map.set(key, existing)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.invested - a.invested)
  }, [data])

  const handlePatched = (updated: BagSpace) => {
    if (!data) return
    // Reemplazar el espacio actualizado y recalcular stats
    const next = data.spaces.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    let available = 0, reserved = 0, sold = 0, revenue = 0
    for (const s of next) {
      if (s.status === 'AVAILABLE') available++
      else if (s.status === 'RESERVED') reserved++
      else if (s.status === 'SOLD') { sold++; revenue += s.price || 0 }
    }
    setData({
      ...data,
      spaces: next,
      stats: { total: data.stats.total, available, reserved, sold, revenue, potential: data.stats.potential },
    })
    setSelectedSpace(null)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="size-10 mx-auto text-amber-500 mb-3" />
            <p className="font-medium">No se pudo cargar el plano del bolso</p>
            <p className="text-sm text-muted-foreground mt-1">{error || 'Intenta nuevamente'}</p>
            <Button className="mt-4" onClick={fetchData}>
              <RefreshCw className="size-4 mr-2" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <Card className="overflow-hidden border-emerald-200">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Package className="size-5 text-emerald-600" />
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">{data.edition.name}</h1>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {data.edition.status === 'OPEN' ? 'Abierta' : data.edition.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {data.edition.city}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" /> {fmtDate(data.edition.startDate)} – {fmtDate(data.edition.endDate)}</span>
                <span className="inline-flex items-center gap-1"><Layers className="size-3.5" /> {data.edition.printQuantity} bolsas</span>
                <span className="inline-flex items-center gap-1"><Package className="size-3.5" /> Bolso {data.edition.bagSize} cm</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="size-4 mr-1.5" /> Actualizar
            </Button>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <StatPill label="Total espacios" value={data.stats.total} tone="muted" icon={<Package className="size-4" />} />
            <StatPill label="Disponibles" value={data.stats.available} tone="emerald" icon={<CheckCircle2 className="size-4" />} />
            <StatPill label="Reservados" value={data.stats.reserved} tone="amber" icon={<Clock className="size-4" />} />
            <StatPill label="Vendidos" value={data.stats.sold} tone="rose" icon={<ShoppingBag className="size-4" />} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="plano"><Package className="size-4 md:mr-1.5" /><span className="hidden sm:inline">Plano</span></TabsTrigger>
          <TabsTrigger value="mapa"><MapPin className="size-4 md:mr-1.5" /><span className="hidden sm:inline">Mapa</span></TabsTrigger>
          <TabsTrigger value="sponsors"><Store className="size-4 md:mr-1.5" /><span className="hidden sm:inline">Patrocinadores</span></TabsTrigger>
          <TabsTrigger value="dashboard"><TrendingUp className="size-4 md:mr-1.5" /><span className="hidden sm:inline">Dashboard</span></TabsTrigger>
        </TabsList>

        <TabsContent value="plano" className="mt-4 space-y-4">
          <Toolbar
            filterPanel={filterPanel}
            setFilterPanel={setFilterPanel}
            filterType={filterType}
            setFilterType={setFilterType}
            search={search}
            setSearch={setSearch}
          />
          <BagView
            spaces={filteredSpaces}
            onCellClick={setSelectedSpace}
            currentUserId={currentUser?.id}
            view="status"
          />
          <Legend />
        </TabsContent>

        <TabsContent value="mapa" className="mt-4 space-y-4">
          <Toolbar
            filterPanel={filterPanel}
            setFilterPanel={setFilterPanel}
            filterType={filterType}
            setFilterType={setFilterType}
            search={search}
            setSearch={setSearch}
          />
          <BagView
            spaces={filteredSpaces}
            onCellClick={setSelectedSpace}
            currentUserId={currentUser?.id}
            view="sponsor"
          />
          <SponsorLegend spaces={data.spaces} />
        </TabsContent>

        <TabsContent value="sponsors" className="mt-4">
          <SponsorsTab sponsors={sponsors} onPick={(name) => { setSearch(name); setTab('plano'); toast(`Mostrando espacios de ${name}`, 'info') }} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab data={data} />
        </TabsContent>
      </Tabs>

      {/* Space Editor */}
      <SpaceEditorDialog
        space={selectedSpace}
        onClose={() => setSelectedSpace(null)}
        onPatched={handlePatched}
        currentUser={currentUser}
        toast={toast}
      />
    </div>
  )
}

// ---------- Sub-componentes ----------

function StatPill({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: 'muted' | 'emerald' | 'amber' | 'rose'
  icon: React.ReactNode
}) {
  const toneClasses = {
    muted: 'bg-muted/50 text-muted-foreground',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  }[tone]
  return (
    <div className={cn('rounded-lg border p-3 flex items-center gap-3', toneClasses)}>
      <div className="size-8 rounded-md bg-white/60 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs opacity-80 truncate">{label}</p>
      </div>
    </div>
  )
}

function Toolbar({
  filterPanel,
  setFilterPanel,
  filterType,
  setFilterType,
  search,
  setSearch,
}: {
  filterPanel: string
  setFilterPanel: (v: string) => void
  filterType: string
  setFilterType: (v: string) => void
  search: string
  setSearch: (v: string) => void
}) {
  return (
    <Card>
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Panel</Label>
            <Select value={filterPanel} onValueChange={setFilterPanel}>
              <SelectTrigger size="sm" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los paneles</SelectItem>
                {BAG_PANELS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Tipo</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="QR">QR</SelectItem>
                <SelectItem value="IMAGE">Imagen</SelectItem>
                <SelectItem value="LOGO">Logo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 min-w-0">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar patrocinador..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BagView({
  spaces,
  onCellClick,
  currentUserId,
  view,
}: {
  spaces: BagSpace[]
  onCellClick: (s: BagSpace) => void
  currentUserId?: string
  view: 'status' | 'sponsor'
}) {
  // Indexar espacios por posición para acceso rápido
  const byPosition = useMemo(() => {
    const m = new Map<number, BagSpace>()
    for (const s of spaces) m.set(s.position, s)
    return m
  }, [spaces])

  return (
    <div className="space-y-4">
      {BAG_PANELS.map((panel) => {
        const positions: number[] = []
        for (let i = panel.start; i <= panel.end; i++) positions.push(i)
        const panelSpaces = positions.map((p) => byPosition.get(p)).filter(Boolean) as BagSpace[]
        const sold = panelSpaces.filter((s) => s.status === 'SOLD').length
        const available = panelSpaces.filter((s) => s.status === 'AVAILABLE').length
        const total = panel.end - panel.start + 1

        return (
          <Card key={panel.key}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {panel.label}
                    <span className="text-xs font-normal text-muted-foreground">
                      · {panel.widthCm}×{panel.heightCm} cm · {panel.cols}×{panel.rows}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Espacios {panel.start}–{panel.end} · {total} celdas de 5×5 cm
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{available} libres</Badge>
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">{sold} vendidas</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="grid gap-[2px] sm:gap-1"
                style={{ gridTemplateColumns: `repeat(${panel.cols}, minmax(0, 1fr))` }}
              >
                {positions.map((pos) => {
                  const s = byPosition.get(pos)
                  return (
                    <Cell
                      key={pos}
                      position={pos}
                      space={s}
                      onCellClick={onCellClick}
                      currentUserId={currentUserId}
                      view={view}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function Cell({
  position,
  space,
  onCellClick,
  currentUserId,
  view,
}: {
  position: number
  space?: BagSpace
  onCellClick: (s: BagSpace) => void
  currentUserId?: string
  view: 'status' | 'sponsor'
}) {
  const { row, col } = rowColForPosition(position)
  const status = space?.status || 'AVAILABLE'
  const isMine = !!space?.providerId && space.providerId === currentUserId

  // Estilos por vista
  let bg = 'bg-muted/40 border-border hover:bg-muted/70'
  let textColor = 'text-muted-foreground'

  if (view === 'sponsor') {
    if (status === 'SOLD' && space?.provider?.companyName) {
      const c = sponsorColor(space.provider.companyName)
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => space && onCellClick(space)}
              className="aspect-square rounded-sm border border-black/10 text-[8px] sm:text-[9px] font-medium flex items-center justify-center transition-all hover:scale-110 hover:z-10 hover:shadow-md"
              style={{ backgroundColor: c, color: '#fff' }}
            >
              {position}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="space-y-0.5">
              <p className="font-semibold">#{position} · {space?.provider?.companyName}</p>
              <p>Vendido · {fmtUsd(space?.price || 20)}</p>
              <p className="text-muted-foreground">Fila {row + 1}, Col {col + 1}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }
    if (status === 'RESERVED') {
      bg = 'bg-amber-100 border-amber-300 hover:bg-amber-200'
      textColor = 'text-amber-800'
    } else {
      bg = 'bg-muted/40 border-border hover:bg-muted/70'
    }
  } else {
    // view status
    if (status === 'AVAILABLE') {
      bg = 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
      textColor = 'text-emerald-700'
    } else if (status === 'RESERVED') {
      bg = 'bg-amber-100 border-amber-300 hover:bg-amber-200'
      textColor = 'text-amber-800'
    } else if (status === 'SOLD') {
      bg = 'bg-rose-100 border-rose-300 hover:bg-rose-200'
      textColor = 'text-rose-800'
    }
  }

  if (isMine) {
    bg += ' ring-2 ring-emerald-500 ring-offset-1'
  }

  const sponsorName = space?.provider?.companyName

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => space && onCellClick(space)}
          className={cn(
            'aspect-square rounded-sm border text-[8px] sm:text-[9px] font-medium flex items-center justify-center transition-all hover:scale-110 hover:z-10 hover:shadow-md',
            bg,
            textColor
          )}
        >
          {position}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="space-y-0.5">
          <p className="font-semibold">#{position} · {space ? STATUS_LABELS[status] : 'Disponible'}</p>
          {sponsorName && <p>{sponsorName}</p>}
          <p className="text-muted-foreground">{fmtUsd(space?.price || 20)} · Fila {row + 1}, Col {col + 1}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function Legend() {
  const items = [
    { label: 'Disponible', className: 'bg-emerald-50 border-emerald-300' },
    { label: 'Reservado', className: 'bg-amber-100 border-amber-300' },
    { label: 'Vendido', className: 'bg-rose-100 border-rose-300' },
    { label: 'Mío', className: 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500' },
  ]
  return (
    <Card>
      <CardContent className="p-3 flex flex-wrap items-center gap-4">
        <span className="text-xs text-muted-foreground font-medium">Leyenda:</span>
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-1.5">
            <div className={cn('size-4 rounded-sm border', it.className)} />
            <span className="text-xs">{it.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SponsorLegend({ spaces }: { spaces: BagSpace[] }) {
  const sponsors = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of spaces) {
      if (s.status === 'SOLD' && s.provider?.companyName) {
        map.set(s.provider.companyName, (map.get(s.provider.companyName) || 0) + 1)
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [spaces])

  if (sponsors.length === 0) {
    return (
      <Card>
        <CardContent className="p-3 text-sm text-muted-foreground">
          Aún no hay patrocinadores con espacios vendidos. Asigna espacios para verlos aquí.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">Patrocinadores:</span>
          {sponsors.map(([name, count]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div
                className="size-4 rounded-sm border border-black/10"
                style={{ backgroundColor: sponsorColor(name) }}
              />
              <span className="text-xs">{name} ({count})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SponsorsTab({
  sponsors,
  onPick,
}: {
  sponsors: Array<{ id: string; name: string; logoUrl?: string | null; count: number; invested: number; status: string }>
  onPick: (name: string) => void
}) {
  if (sponsors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Store className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Sin patrocinadores aún</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ve al Plano del Bolso y asigna espacios a proveedores para verlos aquí.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Patrocinadores del bolso</CardTitle>
        <CardDescription>{sponsors.length} empresa(s) compraron espacios</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-center">Espacios</TableHead>
              <TableHead className="text-right">Inversión</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sponsors.map((sp) => (
              <TableRow key={sp.id}>
                <TableCell>
                  {sp.logoUrl ? (
                    <img src={sp.logoUrl} alt={sp.name} className="size-8 rounded object-cover" />
                  ) : (
                    <div className="size-8 rounded bg-muted flex items-center justify-center">
                      <Store className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-sm border border-black/10" style={{ backgroundColor: sponsorColor(sp.name) }} />
                    {sp.name}
                  </div>
                </TableCell>
                <TableCell className="text-center">{sp.count}</TableCell>
                <TableCell className="text-right font-bold">{fmtUsd(sp.invested)}</TableCell>
                <TableCell className="text-center">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Activo</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onPick(sp.name)}>Ver</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function DashboardTab({ data }: { data: BagPlanData }) {
  const occupancy = data.stats.total > 0 ? (data.stats.sold / data.stats.total) * 100 : 0

  // Breakdown por panel
  const panelStats = useMemo(() => {
    return BAG_PANELS.map((p) => {
      let sold = 0, reserved = 0, available = 0, revenue = 0
      for (const s of data.spaces) {
        if (s.position < p.start || s.position > p.end) continue
        if (s.status === 'SOLD') { sold++; revenue += s.price || 0 }
        else if (s.status === 'RESERVED') reserved++
        else available++
      }
      const total = p.end - p.start + 1
      return { panel: p, sold, reserved, available, revenue, total, pct: (sold / total) * 100 }
    })
  }, [data])

  const exportCSV = () => {
    const rows = [['position', 'panel', 'row', 'col', 'status', 'type', 'price', 'sponsor']]
    for (const s of data.spaces) {
      const { panel, row, col } = rowColForPosition(s.position)
      rows.push([
        String(s.position),
        panel.label,
        String(row + 1),
        String(col + 1),
        s.status,
        s.type,
        String(s.price),
        s.provider?.companyName || '',
      ])
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadBlob(csv, `plano-bolso-${data.edition.slug}.csv`, 'text/csv;charset=utf-8')
  }

  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2)
    downloadBlob(json, `plano-bolso-${data.edition.slug}.json`, 'application/json')
  }

  const exportSVG = () => {
    const svg = buildSVG(data)
    downloadBlob(svg, `plano-bolso-${data.edition.slug}.svg`, 'image/svg+xml')
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <Wallet className="size-4" />
              <span className="text-xs font-medium">Ingresos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{fmtUsd(data.stats.revenue)}</p>
            <p className="text-xs text-muted-foreground">Espacios vendidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CircleDollarSign className="size-4" />
              <span className="text-xs font-medium">Potencial</span>
            </div>
            <p className="text-2xl font-bold mt-1">{fmtUsd(data.stats.potential)}</p>
            <p className="text-xs text-muted-foreground">270 × $20</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <TrendingUp className="size-4" />
              <span className="text-xs font-medium">Ocupación</span>
            </div>
            <p className="text-2xl font-bold mt-1">{occupancy.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{data.stats.sold} de {data.stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-medium">Disponibles</span>
            </div>
            <p className="text-2xl font-bold mt-1">{data.stats.available}</p>
            <p className="text-xs text-muted-foreground">{data.stats.reserved} reservados</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ocupación general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={occupancy} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.stats.sold} vendidos</span>
            <span>{data.stats.reserved} reservados</span>
            <span>{data.stats.available} disponibles</span>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown por panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ocupación por panel</CardTitle>
          <CardDescription>Vendidos vs. total por cada panel del bolso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {panelStats.map((ps) => (
            <div key={ps.panel.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{ps.panel.label}</span>
                <span className="text-muted-foreground">
                  {ps.sold}/{ps.total} · {fmtUsd(ps.revenue)}
                </span>
              </div>
              <Progress value={ps.pct} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Export buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Exportar e imprimir</CardTitle>
          <CardDescription>Descarga el plano en distintos formatos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="size-4 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <FileJson className="size-4 mr-1.5" /> JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportSVG}>
              <FileCode className="size-4 mr-1.5" /> SVG
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4 mr-1.5" /> Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Space Editor Dialog ----------

function SpaceEditorDialog({
  space,
  onClose,
  onPatched,
  currentUser,
  toast,
}: {
  space: BagSpace | null
  onClose: () => void
  onPatched: (s: BagSpace) => void
  currentUser: { id: string; role: string; name: string } | null
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [providers, setProviders] = useState<SupplierOption[]>([])
  const [providerId, setProviderId] = useState<string>('')
  const [type, setType] = useState<string>('QR')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [price, setPrice] = useState<string>('20')
  const [saving, setSaving] = useState(false)
  const [providersError, setProvidersError] = useState(false)

  // Cargar proveedores para el select
  useEffect(() => {
    if (!space) return
    let cancelled = false
    fetch('/api/suppliers')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no-ok'))))
      .then((rows: any[]) => {
        if (cancelled) return
        const opts = rows.map((r) => ({ id: r.id, companyName: r.companyName, logoUrl: r.logoUrl }))
        setProviders(opts)
        setProvidersError(false)
      })
      .catch(() => {
        setProviders([])
        setProvidersError(true)
      })
    return () => { cancelled = true }
  }, [space])

  // Reset form cuando cambia el space
  useEffect(() => {
    if (space) {
      setProviderId(space.providerId || '')
      setType(space.type || 'QR')
      setImageUrl(space.imageUrl || '')
      setPrice(String(space.price ?? 20))
    }
  }, [space])

  const { panel, row, col } = space ? rowColForPosition(space.position) : { panel: null, row: 0, col: 0 }
  const isAdmin = currentUser?.role === 'ADMIN'
  const isSupplier = currentUser?.role === 'SUPPLIER'
  const canAssign = isAdmin || isSupplier
  const isReserved = space?.status === 'RESERVED'
  const isSold = space?.status === 'SOLD'
  const isAvailable = space?.status === 'AVAILABLE'

  const patch = async (action: 'reserve' | 'release' | 'assign') => {
    if (!space) return
    if (!currentUser) {
      toast('Inicia sesión para gestionar espacios', 'warning')
      return
    }
    setSaving(true)
    try {
      const body: any = { spaceId: space.id, action }
      if (action === 'assign') {
        if (!providerId) {
          toast('Selecciona un proveedor', 'warning')
          setSaving(false)
          return
        }
        body.providerId = providerId
        body.type = type
        body.imageUrl = imageUrl || undefined
        const pNum = parseFloat(price)
        if (!isNaN(pNum) && pNum >= 0) body.price = pNum
      }
      const res = await fetch('/api/impulse/bag-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error al actualizar', 'error')
        return
      }
      toast(`Espacio #${space.position} ${action === 'reserve' ? 'reservado' : action === 'release' ? 'liberado' : 'vendido'}`, 'success')
      onPatched(d.space)
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSaving(false)
    }
  }

  const qrTarget = useMemo(() => {
    if (!space?.provider?.websiteSlug) return null
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/w/${space.provider.websiteSlug}`
    }
    return `/w/${space.provider.websiteSlug}`
  }, [space])

  if (!space) return null

  return (
    <Dialog open={!!space} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Espacio #{space.position}
            <Badge className={
              isAvailable ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
              : isReserved ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
              : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
            }>
              {STATUS_LABELS[space.status] || space.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {panel?.label} · Fila {row + 1}, Col {col + 1} · 5×5 cm · {fmtUsd(space.price || 20)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Provider info si ya tiene */}
          {(isSold || isReserved) && space.provider && (
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
              {space.provider.logoUrl ? (
                <img src={space.provider.logoUrl} alt="" className="size-10 rounded object-cover" />
              ) : (
                <div className="size-10 rounded bg-muted flex items-center justify-center">
                  <Store className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{space.provider.companyName}</p>
                <p className="text-xs text-muted-foreground">
                  {isSold && space.soldAt ? `Vendido el ${fmtDate(space.soldAt)}` : ''}
                  {isReserved && space.reservedAt ? `Reservado el ${fmtDateTime(space.reservedAt)}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* QR preview si está vendido y es QR */}
          {isSold && space.type === 'QR' && qrTarget && (
            <div className="rounded-lg border p-3 flex items-center gap-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrTarget)}`}
                alt="QR del espacio"
                className="size-20 rounded border"
              />
              <div className="min-w-0 text-xs">
                <p className="font-medium flex items-center gap-1"><QrCode className="size-3" /> Código QR</p>
                <p className="text-muted-foreground break-all">{qrTarget}</p>
              </div>
            </div>
          )}

          {/* Imagen si es IMAGE/LOGO */}
          {isSold && (space.type === 'IMAGE' || space.type === 'LOGO') && space.imageUrl && (
            <div className="rounded-lg border p-2 flex items-center justify-center">
              <img src={space.imageUrl} alt="Contenido del espacio" className="max-h-32 rounded" />
            </div>
          )}

          {/* Form de edición */}
          {canAssign && !isSold && (
            <>
              <div>
                <Label className="text-xs">Proveedor</Label>
                {providersError ? (
                  <Input
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    placeholder="ID del proveedor (no se pudo cargar lista)"
                    className="mt-1 text-sm"
                  />
                ) : providers.length === 0 ? (
                  <div className="text-xs text-muted-foreground mt-1">Cargando proveedores...</div>
                ) : (
                  <Select value={providerId} onValueChange={setProviderId}>
                    <SelectTrigger className="w-full mt-1 text-sm">
                      <SelectValue placeholder="Selecciona proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QR">QR</SelectItem>
                      <SelectItem value="IMAGE">Imagen</SelectItem>
                      <SelectItem value="LOGO">Logo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Precio $</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min={0}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
              {(type === 'IMAGE' || type === 'LOGO') && (
                <div>
                  <Label className="text-xs">URL de imagen</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 text-sm"
                  />
                </div>
              )}
            </>
          )}

          {/* Admin puede editar precio de vendidos */}
          {isSold && isAdmin && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={type} onValueChange={setType} disabled>
                  <SelectTrigger className="w-full mt-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QR">QR</SelectItem>
                    <SelectItem value="IMAGE">Imagen</SelectItem>
                    <SelectItem value="LOGO">Logo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Precio $</Label>
                <Input type="number" value={price} disabled className="mt-1 text-sm" />
              </div>
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex-wrap gap-2">
          {!currentUser && (
            <div className="w-full text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 flex items-center gap-2">
              <LogIn className="size-4" /> Inicia sesión para gestionar este espacio.
            </div>
          )}
          {currentUser && isAvailable && (
            <>
              <Button variant="outline" onClick={() => patch('reserve')} disabled={saving}>
                <Clock className="size-4 mr-1.5" /> Reservar
              </Button>
              {canAssign && (
                <Button onClick={() => patch('assign')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <RefreshCw className="size-4 mr-1.5 animate-spin" /> : <ShoppingBag className="size-4 mr-1.5" />}
                  Asignar y vender
                </Button>
              )}
            </>
          )}
          {currentUser && isReserved && (
            <>
              <Button variant="outline" onClick={() => patch('release')} disabled={saving}>
                <XCircle className="size-4 mr-1.5" /> Liberar
              </Button>
              {canAssign && (
                <Button onClick={() => patch('assign')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <RefreshCw className="size-4 mr-1.5 animate-spin" /> : <ShoppingBag className="size-4 mr-1.5" />}
                  Confirmar venta
                </Button>
              )}
            </>
          )}
          {currentUser && isSold && isAdmin && (
            <Button variant="outline" onClick={() => patch('release')} disabled={saving}>
              <Lock className="size-4 mr-1.5" /> Liberar (admin)
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- Utilidades de export ----------

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildSVG(data: BagPlanData): string {
  const cellSize = 20
  const panelGap = 30
  const labelHeight = 24
  let totalHeight = 0
  const maxWidth = Math.max(...BAG_PANELS.map((p) => p.cols)) * cellSize

  const panels = BAG_PANELS.map((p) => {
    const y = totalHeight + labelHeight
    const cells: string[] = []
    for (let pos = p.start; pos <= p.end; pos++) {
      const idx = pos - p.start
      const r = Math.floor(idx / p.cols)
      const c = idx % p.cols
      const x = c * cellSize
      const cy = y + r * cellSize
      const space = data.spaces.find((s) => s.position === pos)
      let fill = '#f5f5f5'
      let stroke = '#ddd'
      if (space?.status === 'AVAILABLE') { fill = '#ecfdf5'; stroke = '#a7f3d0' }
      else if (space?.status === 'RESERVED') { fill = '#fef3c7'; stroke = '#fcd34d' }
      else if (space?.status === 'SOLD') {
        const color = space.provider?.companyName ? sponsorColor(space.provider.companyName) : '#fecdd3'
        const { h, s, l } = parseHslLocal(color)
        fill = `hsl(${h}, ${s}%, ${Math.min(l + 25, 88)}%)`
        stroke = color
      }
      cells.push(`<rect x="${x}" y="${cy}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="${stroke}" />`)
      cells.push(`<text x="${x + cellSize / 2}" y="${cy + cellSize / 2 + 3}" font-size="7" text-anchor="middle" fill="#555">${pos}</text>`)
    }
    const panelSVG = `
      <text x="0" y="${totalHeight + 16}" font-size="13" font-weight="bold" fill="#064e3b">${p.label} · ${p.widthCm}×${p.heightCm} cm</text>
      ${cells.join('\n')}
    `
    totalHeight = y + p.rows * cellSize + panelGap
    return panelSVG
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${totalHeight}" viewBox="0 0 ${maxWidth} ${totalHeight}">
  <rect width="${maxWidth}" height="${totalHeight}" fill="white" />
  <text x="0" y="14" font-size="14" font-weight="bold" fill="#065f46">${data.edition.name}</text>
  ${panels.join('\n')}
</svg>`
}

function parseHslLocal(hsl: string): { h: number; s: number; l: number } {
  const m = hsl.match(/hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)/)
  if (!m) return { h: 150, s: 45, l: 55 }
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) }
}
