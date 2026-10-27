'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  ShoppingBag, Users, Truck, MapPin, QrCode, Globe, Share2, Zap,
  TrendingUp, DollarSign, Package, Eye, CheckCircle2, AlertCircle,
  Activity, ArrowRight, Bot, Rocket,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtNum = (n: number) => (n || 0).toLocaleString('es-EC')
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return iso }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  PRODUCT_PUBLISHED: 'Producto publicado',
  PRODUCT_FEATURED: 'Producto destacado',
  PRODUCT_UPDATED: 'Producto actualizado',
  ORDER_CREATED: 'Pedido creado',
  COMMISSION_EARNED: 'Comisión generada',
  SHIPMENT_REQUESTED: 'Envío solicitado',
  PROVIDER_REGISTERED: 'Proveedor registrado',
}
const SOURCE_LABELS: Record<string, string> = {
  MARKETPLACE: 'Marketplace',
  SOCIAL: 'Social Media',
  FUERZA_DELTA: 'Fuerza Delta',
  DIRECTORIO: 'Directorio360',
  PUBLIBAGS: 'PubliBags',
  WEB_EXPRESS: 'Web Express',
  MANUAL: 'Manual',
}
const SOURCE_COLORS: Record<string, string> = {
  MARKETPLACE: 'bg-emerald-100 text-emerald-700',
  SOCIAL: 'bg-purple-100 text-purple-700',
  FUERZA_DELTA: 'bg-sky-100 text-sky-700',
  DIRECTORIO: 'bg-amber-100 text-amber-700',
  PUBLIBAGS: 'bg-rose-100 text-rose-700',
  WEB_EXPRESS: 'bg-indigo-100 text-indigo-700',
  MANUAL: 'bg-muted text-muted-foreground',
}

const PIE_COLORS = ['oklch(0.6 0.13 162)', 'oklch(0.75 0.15 75)', 'oklch(0.62 0.19 30)', 'oklch(0.6 0.1 200)', 'oklch(0.55 0.13 300)']

interface Metrics {
  marketplace: { totalProducts: number; activeProducts: number; totalOrders: number; revenue: number }
  affiliates: { totalCommissions: number; pendingCommissions: number; totalAffiliates: number }
  fuerzaDelta: { totalShipments: number; pendingShipments: number; deliveredShipments: number }
  directorio: { entries: number; views: number; visits: number }
  publibags: { adSpacesSold: number; qrScans: number; activeEditions: number }
  webExpress: { websites: number; views: number }
  social: { posts: number; reach: number }
  automation: { totalEvents: number; completedEvents: number }
  salesByDay: { date: string; total: number }[]
  channelROI: { channel: string; revenue: number; icon: string; views?: number; scans?: number; reach?: number }[]
}

interface EventItem {
  id: string
  type: string
  source: string
  title: string
  description?: string | null
  status: string
  propagated?: string | null
  createdAt: string
  provider?: { companyName: string; logoUrl?: string | null } | null
  product?: { name: string; imageUrl?: string | null; price: number } | null
}

export function AutomatizacionModule() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, eRes] = await Promise.all([
        fetch('/api/impulse/metrics').then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/impulse/events').then((r) => r.ok ? r.json() : { events: [] }).catch(() => ({ events: [] })),
      ])
      setMetrics(mRes)
      setEvents(eRes.events || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Zap className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Inicia sesión para ver el dashboard unificado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Badge className="bg-primary/15 text-primary border-primary/20 w-fit">
          <Zap className="size-3 mr-1" /> ImpulsePymes360
        </Badge>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Automatización360</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Dashboard unificado del ecosistema. Métricas de todos los elementos en un solo lugar +
          automatización cruzada que propaga acciones entre sistemas.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="dashboard"><TrendingUp className="size-4 md:mr-1.5" /><span className="hidden md:inline">Dashboard</span></TabsTrigger>
            <TabsTrigger value="events"><Activity className="size-4 md:mr-1.5" /><span className="hidden md:inline">Eventos</span></TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            {metrics && <DashboardTab metrics={metrics} />}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            <EventsTab events={events} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// ============ TAB: DASHBOARD ============
function DashboardTab({ metrics: m }: { metrics: Metrics }) {
  return (
    <div className="space-y-4">
      {/* KPIs principales del ecosistema */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} label="Ingresos marketplace" value={fmtUsd(m.marketplace.revenue)} color="text-emerald-600" />
        <KpiCard icon={Users} label="Afiliados" value={fmtNum(m.affiliates.totalAffiliates)} sub={`${fmtUsd(m.affiliates.totalCommissions)} en comisiones`} color="text-amber-600" />
        <KpiCard icon={Truck} label="Envíos" value={fmtNum(m.fuerzaDelta.totalShipments)} sub={`${m.fuerzaDelta.deliveredShipments} entregados`} color="text-sky-600" />
        <KpiCard icon={QrCode} label="Escaneos QR" value={fmtNum(m.publibags.qrScans)} color="text-rose-600" />
      </div>

      {/* Grid de 7 elementos */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <ElementCard icon={ShoppingBag} label="Marketplace" value={m.marketplace.activeProducts} sub="productos" color="bg-emerald-500" />
        <ElementCard icon={Users} label="Afiliados" value={m.affiliates.totalAffiliates} sub="miembros" color="bg-amber-500" />
        <ElementCard icon={Truck} label="Fuerza Delta" value={m.fuerzaDelta.totalShipments} sub="envíos" color="bg-sky-500" />
        <ElementCard icon={MapPin} label="Directorio" value={m.directorio.entries} sub={`${m.directorio.views} vistas`} color="bg-purple-500" />
        <ElementCard icon={QrCode} label="PubliBags" value={m.publibags.adSpacesSold} sub={`${m.publibags.activeEditions} ediciones`} color="bg-rose-500" />
        <ElementCard icon={Globe} label="Web Express" value={m.webExpress.websites} sub={`${fmtNum(m.webExpress.views)} vistas`} color="bg-indigo-500" />
        <ElementCard icon={Share2} label="Social" value={m.social.posts} sub={`${fmtNum(m.social.reach)} alcance`} color="bg-pink-500" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Ventas 14 días */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingresos últimos 14 días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={m.salesByDay}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.6 0.13 162)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.6 0.13 162)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 130)" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(d) => d} formatter={(v: number) => fmtUsd(v)} />
                <Area type="monotone" dataKey="total" stroke="oklch(0.6 0.13 162)" strokeWidth={2} fill="url(#revGrad)" name="Ingresos" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ROI por canal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance por canal</CardTitle>
            <CardDescription>Alcance y engagement de cada elemento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={m.channelROI} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 130)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: number, _n, p) => {
                  const item = p?.payload
                  if (item?.scans) return [`${fmtNum(v)} escaneos`, item.channel]
                  if (item?.views) return [`${fmtNum(v)} vistas`, item.channel]
                  if (item?.reach) return [`${fmtNum(v)} alcance`, item.channel]
                  return [fmtUsd(v), item?.channel || '']
                }} />
                <Bar dataKey={(d) => d.scans || d.views || d.reach || d.revenue} fill="oklch(0.75 0.15 75)" radius={[0, 4, 4, 0]} name="Métrica" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Automatización status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            Automatización cruzada
          </CardTitle>
          <CardDescription>
            Cuando publicas un producto, se propaga automáticamente a los sistemas activados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <AutomationToggle icon={MapPin} label="Directorio" desc="Actualiza productos destacados" defaultOn />
            <AutomationToggle icon={Share2} label="Social Media" desc="Genera post con IA" defaultOn />
            <AutomationToggle icon={Globe} label="Web Express" desc="Actualiza featured products" defaultOn />
            <AutomationToggle icon={Users} label="Afiliados" desc="Notifica a la red" defaultOn />
          </div>
          <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Rocket className="size-5 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-primary">Sistema activo</p>
              <p className="text-xs text-muted-foreground">
                {m.automation.completedEvents} de {m.automation.totalEvents} eventos procesados correctamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn('flex items-center gap-2 text-xs', color)}>
          <Icon className="size-4" /> {label}
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function ElementCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number; sub: string; color: string
}) {
  return (
    <Card className="text-center hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className={cn('size-9 rounded-lg mx-auto flex items-center justify-center mb-2', color)}>
          <Icon className="size-5 text-white" />
        </div>
        <p className="text-xl font-bold">{fmtNum(value)}</p>
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function AutomationToggle({ icon: Icon, label, desc, defaultOn }: {
  icon: React.ElementType; label: string; desc: string; defaultOn?: boolean
}) {
  const [on, setOn] = useState(defaultOn ?? true)
  return (
    <div className={cn('rounded-lg border p-3 transition-colors', on ? 'bg-emerald-50/50 border-emerald-200' : 'bg-muted/30')}>
      <div className="flex items-center justify-between mb-1">
        <Icon className={cn('size-4', on ? 'text-emerald-600' : 'text-muted-foreground')} />
        <Switch checked={on} onCheckedChange={setOn} />
      </div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}

// ============ TAB: EVENTOS ============
function EventsTab({ events }: { events: EventItem[] }) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="size-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No hay eventos registrados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Los eventos aparecen automáticamente cuando se publican productos, se crean pedidos, etc.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          Log de automatización ({events.length})
        </CardTitle>
        <CardDescription>
          Eventos del ecosistema y su propagación a los sistemas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto scroll-thin">
          {events.map((e) => {
            const propagated = e.propagated ? JSON.parse(e.propagated) : []
            return (
              <div key={e.id} className="rounded-lg border p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                {/* Status icon */}
                <div className={cn(
                  'size-8 rounded-full flex items-center justify-center shrink-0',
                  e.status === 'COMPLETED' ? 'bg-emerald-100' : e.status === 'FAILED' ? 'bg-red-100' : 'bg-amber-100'
                )}>
                  {e.status === 'COMPLETED' ? <CheckCircle2 className="size-4 text-emerald-600" /> :
                   e.status === 'FAILED' ? <AlertCircle className="size-4 text-red-600" /> :
                   <Activity className="size-4 text-amber-600" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{e.title}</p>
                    <Badge className={SOURCE_COLORS[e.source] || 'bg-muted'}>{SOURCE_LABELS[e.source] || e.source}</Badge>
                    <Badge variant="outline">{EVENT_TYPE_LABELS[e.type] || e.type}</Badge>
                  </div>
                  {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                  {/* Propagación */}
                  {propagated.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">Propagado a:</span>
                      {propagated.map((p: string) => (
                        <Badge key={p} variant="outline" className="text-[10px] py-0">
                          {SOURCE_LABELS[p] || p}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(e.createdAt)}</p>
                </div>

                {/* Product image */}
                {e.product?.imageUrl && (
                  <img src={e.product.imageUrl} alt="" className="size-10 rounded object-cover shrink-0" />
                )}
                {e.provider?.logoUrl && !e.product?.imageUrl && (
                  <img src={e.provider.logoUrl} alt="" className="size-10 rounded-full object-cover shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
