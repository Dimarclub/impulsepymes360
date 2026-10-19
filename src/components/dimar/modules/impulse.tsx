'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Store,
  Users,
  Truck,
  Globe,
  ShoppingBag,
  LayoutTemplate,
  Sparkles,
  BadgeCheck,
  ExternalLink,
  QrCode,
  TrendingUp,
  Eye,
  MousePointerClick,
  MapPin,
  Phone,
  Wallet,
  CreditCard,
  Calendar,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Settings2,
  Image as ImageIcon,
  Loader2,
  LogIn,
  Package,
} from 'lucide-react'
import type { Provider, AdEdition, Plan } from '@/lib/types'
import { useAppStore } from '@/lib/store'

// ---------- Helpers ----------

const usd = (n: number) => `$${(n || 0).toFixed(2)}`

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return 'Sin escaneos aún'
  try {
    return new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

const QR_TYPE_LABELS: Record<string, string> = {
  WEBSITE: 'Sitio Web',
  PRODUCT: 'Producto',
  PROMO: 'Promoción',
  WHATSAPP: 'WhatsApp',
  EDITION: 'Edición',
}

const QR_TYPE_COLORS: Record<string, string> = {
  WEBSITE: 'bg-emerald-100 text-emerald-700',
  PRODUCT: 'bg-amber-100 text-amber-700',
  PROMO: 'bg-orange-100 text-orange-700',
  WHATSAPP: 'bg-green-100 text-green-700',
  EDITION: 'bg-rose-100 text-rose-700',
}

const SUB_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  PAST_DUE: 'Pago pendiente',
  CANCELLED: 'Cancelada',
  TRIALING: 'Prueba',
}

const SUB_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAST_DUE: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  TRIALING: 'bg-sky-100 text-sky-700',
}

// ---------- Elementos ImpulsePymes360 ----------

interface ElementoImpulse {
  key: string
  name: string
  desc: string
  icon: typeof Store
  // plan flags
  flag?: 'hasWebExpress' | 'hasDirectorio' | 'hasLogistica' | 'hasSocial'
  alwaysActive?: boolean
}

const ELEMENTOS: ElementoImpulse[] = [
  {
    key: 'impulso360',
    name: 'Impulso360',
    desc: 'Marketplace B2C con red de afiliados de 3 niveles. Tus productos llegan a miles de compradores.',
    icon: Store,
    alwaysActive: true,
  },
  {
    key: 'dimarclub',
    name: 'Dimarclub',
    desc: 'Comunidad de afiliados que promocionan tus productos a cambio de comisión por venta.',
    icon: Users,
    alwaysActive: true,
  },
  {
    key: 'fuerza-delta',
    name: 'Fuerza Delta',
    desc: 'Logística última milla con mensajeros verificados. Entregas same-day en tu ciudad.',
    icon: Truck,
    flag: 'hasLogistica',
  },
  {
    key: 'directorio360',
    name: 'Directorio360',
    desc: 'Directorio de proveedores verificados con filtros por categoría y ciudad.',
    icon: Globe,
    flag: 'hasDirectorio',
  },
  {
    key: 'publibags',
    name: 'PubliBags',
    desc: 'Publicidad impresa en bolsas ecológicas distribuidas en supermercados y farmacias.',
    icon: ShoppingBag,
    alwaysActive: true,
  },
  {
    key: 'web-express',
    name: 'Web Express',
    desc: 'Sitio web profesional listo en minutos con tu propio dominio /w/tu-negocio.',
    icon: LayoutTemplate,
    flag: 'hasWebExpress',
  },
]

// ---------- Stats card ----------

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'emerald',
}: {
  icon: typeof Store
  label: string
  value: string | number
  accent?: 'emerald' | 'amber' | 'rose' | 'muted'
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`grid place-items-center size-10 rounded-lg shrink-0 ${colors[accent]}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold text-foreground leading-none truncate">{value}</div>
          <div className="text-xs text-muted-foreground mt-1 truncate">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Mini-card del hero (5 elementos) ----------

function MiniElementCard({
  icon: Icon,
  name,
  status,
  index,
}: {
  icon: typeof Store
  name: string
  status: 'active' | 'inactive'
  index: number
}) {
  return (
    <Card
      className="relative overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-sm transition-all"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center gap-2">
        <div className={`grid place-items-center size-9 rounded-lg ${
          status === 'active'
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
            : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="size-4.5" />
        </div>
        <div className="text-xs font-semibold text-foreground leading-tight">{name}</div>
        <Badge
          variant="secondary"
          className={`text-[10px] px-1.5 py-0 ${
            status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {status === 'active' ? '● Activo' : '○ Inactivo'}
        </Badge>
      </CardContent>
    </Card>
  )
}

// ---------- Card de elemento del grid de 6 ----------

function ElementCard({
  elemento,
  active,
}: {
  elemento: ElementoImpulse
  active: boolean
}) {
  const Icon = elemento.icon
  return (
    <Card className={`overflow-hidden transition-all ${active ? 'border-primary/40 bg-primary/[0.03]' : 'opacity-70'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`grid place-items-center size-10 rounded-lg ${
            active
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
              : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className="size-5" />
          </div>
          <Badge
            variant="secondary"
            className={
              active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            }
          >
            {active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{elemento.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{elemento.desc}</CardDescription>
      </CardHeader>
    </Card>
  )
}

// ---------- Skeletons ----------

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

// ---------- Empty state: sin proveedor ----------

function NoProviderState() {
  const setModule = useAppStore((s) => s.setModule)
  return (
    <Card className="overflow-hidden border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/[0.04] to-accent/[0.04]">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg mb-4">
          <Sparkles className="size-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">Aún no tienes un negocio activo</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          Completa el onboarding de ImpulsePymes360 y en menos de 5 minutos tendrás tu
          proveedor, sitio Web Express, código QR y espacios PubliBags listos.
        </p>
        <Button
          size="lg"
          className="mt-6 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white"
          onClick={() => setModule('impulse-wizard')}
        >
          <PlusCircle className="size-4.5 mr-2" />
          Comenzar onboarding
        </Button>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-background">6 pasos guiados</Badge>
          <Badge variant="outline" className="bg-background">5 elementos omnicanal</Badge>
          <Badge variant="outline" className="bg-background">Pago mensual</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- No autenticado ----------

function UnauthenticatedState() {
  return (
    <Card className="overflow-hidden border-amber-200 bg-amber-50">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="mx-auto grid place-items-center size-14 rounded-full bg-amber-100 text-amber-600 mb-4">
          <LogIn className="size-6" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Inicia sesión para ver tu panel</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          El panel ImpulsePymes360 requiere que inicias sesión con tu cuenta de proveedor.
          Si aún no tienes cuenta, comienza el onboarding y la crearemos por ti.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------- Card de QR ----------

function QRCard({ qr, websiteUrl }: { qr: NonNullable<Provider['qrCodes']>[number]; websiteUrl: string }) {
  const targetUrl = qr.targetUrl?.startsWith('http')
    ? qr.targetUrl
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${qr.targetUrl || websiteUrl}`
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(targetUrl)}&size=160x160`
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex gap-4">
        <div className="shrink-0">
          <div className="size-24 rounded-lg bg-white border p-1.5">
            { }
            <img src={qrImg} alt={`QR ${qr.code}`} className="size-full object-contain" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-mono font-semibold text-foreground">{qr.code}</code>
            <Badge className={QR_TYPE_COLORS[qr.type] || 'bg-muted text-muted-foreground'}>
              {QR_TYPE_LABELS[qr.type] || qr.type}
            </Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Escaneos</div>
              <div className="font-semibold text-foreground flex items-center gap-1">
                <MousePointerClick className="size-3 text-emerald-600" />
                {qr.scans}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Únicos</div>
              <div className="font-semibold text-foreground">{qr.uniqueScans}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Último: {fmtDateTime(qr.lastScanAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Componente principal ----------

export function ImpulseModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [provider, setProvider] = useState<Provider | null | undefined>(undefined) // undefined=loading, null=no hay
  const [editions, setEditions] = useState<AdEdition[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [meRes, edRes] = await Promise.all([
        fetch('/api/impulse/me', { cache: 'no-store' }),
        fetch('/api/impulse/editions', { cache: 'no-store' }),
      ])
      if (meRes.status === 401) {
        setAuthChecked(true)
        setProvider(null)
        return
      }
      if (meRes.ok) {
        const me = await meRes.json()
        setProvider(me || null)
        setAuthChecked(true)
      } else {
        setProvider(null)
        setAuthChecked(true)
      }
      if (edRes.ok) {
        const eds = await edRes.json()
        setEditions(Array.isArray(eds) ? eds : [])
      }
    } catch {
      if (!silent) toast('No se pudo cargar el panel', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Loading inicial
  if (provider === undefined && !authChecked) {
    return (
      <div className="space-y-4">
        <HeroHeader loading />
        <LoadingSkeleton />
      </div>
    )
  }

  // No autenticado
  if (authChecked && provider === null && editions.length === 0) {
    return (
      <div className="space-y-4">
        <HeroHeader loading={false} />
        <UnauthenticatedState />
      </div>
    )
  }

  // Sin provider pero autenticado (puede ser CLIENT, AFFILIATE, etc.)
  if (provider === null) {
    return (
      <div className="space-y-4">
        <HeroHeader loading={false} />
        <NoProviderState />
      </div>
    )
  }

  // Provider activo
  const plan = provider.subscription?.plan
  const isActive = (e: ElementoImpulse) =>
    e.alwaysActive || (e.flag ? Boolean((plan as any)?.[e.flag]) : true)

  const totalQrScans = (provider.qrCodes || []).reduce((sum, q) => sum + (q.scans || 0), 0)
  const webViews = provider.website?.views || 0
  const adSpacesCount = (provider.adSpaces || []).length

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <HeroHeader
        loading={false}
        onRefresh={() => fetchData(true)}
        refreshing={refreshing}
      />

      {/* 5 mini-cards de elementos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ELEMENTOS.map((el, i) => (
          <MiniElementCard
            key={el.key}
            icon={el.icon}
            name={el.name}
            status={isActive(el) ? 'active' : 'inactive'}
            index={i}
          />
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Productos publicados" value="—" accent="emerald" />
        <StatCard icon={Eye} label="Vistas Web Express" value={webViews} accent="amber" />
        <StatCard icon={QrCode} label="Escaneos QR totales" value={totalQrScans} accent="rose" />
        <StatCard icon={ShoppingBag} label="Espacios PubliBags" value={adSpacesCount} accent="muted" />
      </div>

      {/* Grid principal: provider + subscription */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Provider info card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 pb-4">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="size-4 text-emerald-600" />
                Información del negocio
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setModule('impulse-wizard')}>
                <Settings2 className="size-3.5 mr-1" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-muted overflow-hidden shrink-0 border">
                {provider.logoUrl ? (
                   
                  <img src={provider.logoUrl} alt={provider.companyName} className="size-full object-cover" />
                ) : (
                  <div className="size-full grid place-items-center text-muted-foreground">
                    <Store className="size-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground truncate">{provider.companyName}</h3>
                  {provider.verified && (
                    <BadgeCheck className="size-4.5 text-emerald-600 shrink-0" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {provider.category || 'Sin categoría'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="size-3 mr-1" />
                    {provider.city || '—'}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={
                      provider.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {provider.status === 'ACTIVE' ? 'Activo' : provider.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              {provider.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs">Tel:</span>
                  <span className="font-medium text-foreground truncate">{provider.phone}</span>
                </div>
              )}
              {provider.taxId && (
                <div className="flex items-center gap-2">
                  <CreditCard className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-xs">RUC:</span>
                  <span className="font-medium text-foreground truncate">{provider.taxId}</span>
                </div>
              )}
            </div>
            {provider.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{provider.description}</p>
            )}
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
              <Globe className="size-4 text-emerald-600 shrink-0" />
              <code className="text-xs text-foreground truncate flex-1">
                /w/{provider.websiteSlug}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => window.open(`/w/${provider.websiteSlug}`, '_blank')}
              >
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4 text-amber-600" />
              Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {plan ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{plan.displayName}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={SUB_COLORS[provider.subscription?.status || 'ACTIVE'] || 'bg-muted'}
                  >
                    {SUB_LABELS[provider.subscription?.status || 'ACTIVE'] || provider.subscription?.status}
                  </Badge>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-foreground">{usd(plan.price)}</span>
                  <span className="text-sm text-muted-foreground mb-1">/mes</span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" /> Próximo cobro
                    </div>
                    <div className="font-medium text-foreground mt-0.5">
                      {fmtDate(provider.subscription?.nextBillingDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Wallet className="size-3" /> Comisión afiliados
                    </div>
                    <div className="font-medium text-foreground mt-0.5">
                      {provider.affiliateRate}%
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="font-semibold text-foreground">{plan.maxProducts}</div>
                    <div className="text-muted-foreground">Productos</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="font-semibold text-foreground">{plan.maxAdSpaces}</div>
                    <div className="text-muted-foreground">PubliBags</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="font-semibold text-foreground">{plan.maxShipments}</div>
                    <div className="text-muted-foreground">Envíos/mes</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No hay suscripción activa
              </div>
            )}
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-0">
            <Button variant="outline" className="w-full" onClick={() => setModule('impulse-wizard')}>
              <TrendingUp className="size-4 mr-2" />
              Cambiar plan
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Web Express + QR codes */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Web Express card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <LayoutTemplate className="size-4 text-emerald-600" />
                  Sitio Web Express
                </CardTitle>
                <CardDescription className="text-xs">
                  Tu tienda online lista en minutos
                </CardDescription>
              </div>
              {provider.website && (
                <Badge className={provider.website.published ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                  {provider.website.published ? 'Publicado' : 'Borrador'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {provider.website ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-lg shrink-0 border"
                    style={{
                      background: `linear-gradient(135deg, ${provider.website.primaryColor} 0%, ${provider.website.accentColor} 100%)`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground capitalize truncate">
                      Plantilla {provider.website.template}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      /w/{provider.website.slug}
                    </div>
                  </div>
                </div>
                {provider.website.heroTitle && (
                  <div className="text-sm font-medium text-foreground line-clamp-2">
                    {provider.website.heroTitle}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Eye className="size-3" /> Vistas
                    </div>
                    <div className="font-semibold text-foreground mt-0.5">{provider.website.views}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Globe className="size-3" /> URL
                    </div>
                    <div className="font-semibold text-foreground mt-0.5 truncate">/w/{provider.website.slug}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Tu plan no incluye Web Express.
              </div>
            )}
          </CardContent>
          {provider.website && (
            <CardFooter className="px-4 pb-4 pt-0 gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`/w/${provider.websiteSlug}`, '_blank')}
              >
                <ExternalLink className="size-4 mr-1.5" />
                Ver sitio
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setModule('web-express')}
              >
                <Settings2 className="size-4 mr-1.5" />
                Editar
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* QR Codes card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="size-4 text-amber-600" />
              Códigos QR
            </CardTitle>
            <CardDescription className="text-xs">
              {(provider.qrCodes || []).length} código(s) activo(s) · {totalQrScans} escaneos totales
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {(provider.qrCodes || []).length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                <QrCode className="size-8 mx-auto opacity-40 mb-2" />
                No tienes códigos QR todavía.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto scroll-thin pr-1">
                {(provider.qrCodes || []).map((qr) => (
                  <QRCard key={qr.id} qr={qr} websiteUrl={`/w/${provider.websiteSlug}`} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PubliBags spaces card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="size-4 text-rose-600" />
                Espacios PubliBags
              </CardTitle>
              <CardDescription className="text-xs">
                {adSpacesCount} espacio(s) comprado(s) en ediciones activas
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
              {editions.filter((e) => e.status === 'OPEN').length} edición(es) abierta(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {adSpacesCount === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              <ShoppingBag className="size-8 mx-auto opacity-40 mb-2" />
              No tienes espacios PubliBags comprados.
              <Button
                size="sm"
                variant="outline"
                className="ml-2"
                onClick={() => setModule('impulse-wizard')}
              >
                Reservar ahora
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {(provider.adSpaces || []).map((space) => {
                const editionName = (space as any).edition?.name || 'Edición'
                const editionCity = (space as any).edition?.city || ''
                return (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="grid place-items-center size-10 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 text-white shrink-0">
                      <span className="text-xs font-bold">#{space.position}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm truncate">
                        {editionName} {editionCity && <span className="text-muted-foreground">· {editionCity}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {space.type === 'QR' ? 'QR' : space.type === 'IMAGE' ? 'Imagen' : space.type}
                        </Badge>
                        <span>{usd(space.price)}</span>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        space.status === 'SOLD'
                          ? 'bg-emerald-100 text-emerald-700'
                          : space.status === 'RESERVED'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-muted text-muted-foreground'
                      }
                    >
                      {space.status === 'SOLD' ? 'Comprado' : space.status === 'RESERVED' ? 'Reservado' : 'Disponible'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid de 6 elementos con descripción */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ecosistema ImpulsePymes360</h2>
            <p className="text-xs text-muted-foreground">
              6 elementos omnicanal trabajando juntos para tu negocio
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ELEMENTOS.map((el) => (
            <ElementCard key={el.key} elemento={el} active={isActive(el)} />
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <Card className="overflow-hidden border-dashed bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/20 dark:to-amber-950/20">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h3 className="font-semibold text-foreground">¿Quieres ampliar tu presencia?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cambia de plan o reserva más espacios PubliBags desde el wizard de configuración.
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 border-primary/40 text-primary hover:bg-primary/10"
            onClick={() => setModule('impulse-wizard')}
          >
            Configurar de nuevo
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Hero header ----------

function HeroHeader({
  loading,
  onRefresh,
  refreshing,
}: {
  loading: boolean
  onRefresh?: () => void
  refreshing?: boolean
}) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-amber-600 text-white">
      <CardContent className="p-6 sm:p-8 relative">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-10" aria-hidden>
          <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white" />
          <div className="absolute -bottom-12 -left-8 size-32 rounded-full bg-white" />
        </div>
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Badge className="bg-white/20 text-white border-0 backdrop-blur mb-2">
              <Sparkles className="size-3 mr-1" />
              Sistema omnicanal
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              ImpulsePymes360
            </h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base max-w-xl">
              El sistema omnicanal que impulsa tu negocio: marketplace, comunidad, logística,
              directorio, publicidad impresa y sitio web — todo en uno.
            </p>
          </div>
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRefresh}
                    disabled={refreshing || loading}
                    className="bg-white/15 text-white border-white/20 hover:bg-white/25 backdrop-blur"
                  >
                    {refreshing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Actualizar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ImpulseModule
