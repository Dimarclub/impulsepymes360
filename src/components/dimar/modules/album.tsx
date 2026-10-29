'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Book, QrCode, Trophy, Gift, Sparkles, CheckCircle2, Loader2, RefreshCw,
  Store, MapPin, Info, Lock, Wallet,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { PLAN_STICKER_CONFIG } from '@/lib/album-config'

interface AlbumSticker {
  id: string
  name: string
  imageUrl: string
  code: string
  rarity: string
  planLevel: number
  stickerSize: string
  hasQR: boolean
  hasLogo: boolean
  hasBanner: boolean
  bannerType?: string | null
  hasMarketplaceAd: boolean
  qrCode?: string | null
  qrTargetUrl?: string | null
  provider: {
    id: string
    companyName: string
    category?: string | null
    logoUrl?: string | null
    websiteSlug: string
    city?: string | null
    phone?: string | null
    address?: string | null
  } | null
  collected: boolean
}

interface AlbumData {
  ok: boolean
  prize: {
    id: string
    totalStickers: number
    collectedStickers: number
    completed: boolean
    completedAt?: string | null
    prizeAmount: number
    prizeClaimed: boolean
    prizeClaimedAt?: string | null
    canClaim: boolean
  }
  stats: {
    total: number
    collected: number
    missing: number
    progress: number
    completed: boolean
    prizeAmount: number
    prizeClaimed: boolean
  }
  stickers: AlbumSticker[]
}

const RARITY_LABELS: Record<string, string> = {
  COMMON: 'Común',
  RARE: 'Raro',
  GOLDEN: 'Dorado',
}
const RARITY_BADGE: Record<string, string> = {
  COMMON: 'bg-muted text-muted-foreground',
  RARE: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  GOLDEN: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
}

const PLAN_BADGE: Record<number, string> = {
  1: 'bg-muted text-muted-foreground',
  2: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  3: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  4: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  5: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  6: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

function planLabel(level: number): string {
  return PLAN_STICKER_CONFIG.find((c) => c.level === level)?.plan || `$${level}`
}

function qrImageUrl(targetUrl?: string | null, size = 150): string | null {
  if (!targetUrl) return null
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://impulsepymes360.com'
  const full = targetUrl.startsWith('http') ? targetUrl : `${origin}${targetUrl}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(full)}`
}

export function AlbumModule() {
  const toast = useAppStore((s) => s.toast)
  const setModule = useAppStore((s) => s.setModule)
  const [data, setData] = useState<AlbumData | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsAuth, setNeedsAuth] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanCode, setScanCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const fetchAlbum = useCallback(async () => {
    setLoading(true)
    setNeedsAuth(false)
    try {
      const res = await fetch('/api/album')
      if (res.status === 401) {
        setData(null)
        setNeedsAuth(true)
        return
      }
      if (!res.ok) { setData(null); return }
      const d = await res.json()
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlbum() }, [fetchAlbum])

  const handleScan = async () => {
    if (!scanCode.trim()) return
    setScanning(true)
    try {
      const res = await fetch('/api/album/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scanCode.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error al escanear el cromo', 'error')
        return
      }
      toast(d.message, 'success')
      setScanOpen(false)
      setScanCode('')
      fetchAlbum()
    } catch {
      toast('Error de red al escanear', 'error')
    } finally {
      setScanning(false)
    }
  }

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/album/claim-prize', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error al reclamar el premio', 'error')
        return
      }
      toast(d.message || `¡Premio de $${d.amount} acreditado!`, 'success')
      fetchAlbum()
      // Llevamos al usuario a su billetera para ver el saldo
      setTimeout(() => setModule('cooperativa'), 1500)
    } catch {
      toast('Error de red al reclamar', 'error')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    )
  }

  if (needsAuth) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
        <div>
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 w-fit">
            <Book className="size-3 mr-1" /> Álbum de Cromos
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 flex items-center gap-2">
            📗 Mi Álbum de Cromos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Colecciona todos los cromos y gana <strong className="text-emerald-700 dark:text-emerald-400">$200</strong>
          </p>
        </div>
        <Card className="mt-6 border-emerald-200 dark:border-emerald-900">
          <CardContent className="py-12 text-center">
            <Book className="size-12 mx-auto text-emerald-600 mb-3" />
            <p className="font-medium text-lg">Inicia sesión para ver tu álbum</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Necesitas una cuenta para recolectar cromos, escanear códigos QR y participar por el premio de $200 al completar el álbum.
            </p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setModule('marketplace')}
            >
              Ir al inicio
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Usa el botón <strong>Ingresar</strong> en la barra superior para iniciar sesión o registrarte.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 max-w-[1320px] mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Book className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium">No se pudo cargar tu álbum.</p>
            <Button variant="outline" className="mt-4" onClick={fetchAlbum}>
              <RefreshCw className="size-4 mr-2" /> Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { stats, prize, stickers } = data

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 w-fit">
            <Book className="size-3 mr-1" /> Álbum de Cromos
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 flex items-center gap-2">
            📗 Mi Álbum de Cromos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Colecciona todos los cromos y gana <strong className="text-emerald-700 dark:text-emerald-400">$200</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAlbum} disabled={loading}>
            <RefreshCw className="size-4 mr-1.5" /> Actualizar
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setScanOpen(true)}
          >
            <QrCode className="size-4 mr-1.5" /> Escanear cromo
          </Button>
        </div>
      </div>

      {/* Stats + progress */}
      <Card className="overflow-hidden border-2 border-emerald-200 dark:border-emerald-900">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <Sparkles className="size-3.5" /> Progreso del álbum
              </p>
              <p className="text-4xl font-bold mt-0.5">
                {stats.collected}
                <span className="text-xl opacity-75">/{stats.total || 0}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Premio al completar</p>
              <p className="text-3xl font-bold flex items-center gap-1 justify-end">
                <Trophy className="size-6" /> ${stats.prizeAmount.toFixed(0)}
              </p>
            </div>
          </div>
          <div className="bg-white/25 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <p className="text-xs mt-2 opacity-90">{stats.progress}% completado</p>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="rounded-lg bg-muted/40 p-3">
              <Book className="size-5 mx-auto text-emerald-600" />
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total cromos</p>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <CheckCircle2 className="size-5 mx-auto text-emerald-600" />
              <p className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{stats.collected}</p>
              <p className="text-xs text-muted-foreground">Recolectados</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
              <Lock className="size-5 mx-auto text-amber-600" />
              <p className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{stats.missing}</p>
              <p className="text-xs text-muted-foreground">Faltan</p>
            </div>
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-3">
              <Gift className="size-5 mx-auto text-rose-600" />
              <p className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-400">${stats.prizeAmount.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Premio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner: álbum completo o premio reclamado */}
      {prize.completed && !prize.prizeClaimed && (
        <Card className="border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700">
          <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3 text-center md:text-left">
              <div className="size-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl shrink-0">
                🎉
              </div>
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">
                  ¡ÁLBUM COMPLETO!
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Has recolectado todos los cromos. Reclama tus ${prize.prizeAmount.toFixed(0)} ahora.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              onClick={handleClaim}
              disabled={claiming}
            >
              {claiming ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="size-4 mr-2" />
              )}
              Reclamar ${prize.prizeAmount.toFixed(0)}
            </Button>
          </CardContent>
        </Card>
      )}

      {prize.completed && prize.prizeClaimed && (
        <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="size-8 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">
                ¡Felicidades! Ya reclamaste tus ${prize.prizeAmount.toFixed(0)}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {prize.prizeClaimedAt && `Reclamado el ${new Date(prize.prizeClaimedAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}. El premio fue acreditado a tu billetera cooperativa.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de cromos */}
      {stickers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Book className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium">Todavía no hay cromos disponibles.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vuelve pronto — los proveedores están preparando sus cromos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          {stickers.map((s) => (
            <StickerCard key={s.id} sticker={s} />
          ))}
        </div>
      )}

      {/* Info: cómo conseguir cromos */}
      <Card className="border-emerald-200 dark:border-emerald-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-5 text-emerald-600" /> ¿Cómo conseguir cromos?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span>Visita las tiendas físicas de los <strong>proveedores</strong> del directorio.</span>
            </li>
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span>Pide tu <strong>cromo físico</strong> y escanea su código QR con tu celular (o pide que te lo dicten).</span>
            </li>
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <span>Ingresa el código en el botón <strong className="text-emerald-700 dark:text-emerald-400">"Escanear cromo"</strong> y se agregará a tu álbum.</span>
            </li>
            <li className="flex gap-3">
              <span className="size-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
              <span>Llena tu álbum con <strong>todos</strong> los cromos y ¡cobra <strong className="text-emerald-700 dark:text-emerald-400">$200</strong>!</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Dialog: escanear cromo */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-emerald-600" /> Escanear cromo
            </DialogTitle>
            <DialogDescription>
              Escribe o pega el código que aparece en el cromo físico del proveedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="scan-code">Código del cromo</Label>
              <Input
                id="scan-code"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value.toUpperCase())}
                placeholder="Ej: TECN-1234"
                className="text-center text-lg font-mono uppercase tracking-wider mt-1"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                El código se encuentra en el cromo físico del proveedor.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleScan}
              disabled={scanning || !scanCode.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {scanning ? (
                <Loader2 className="size-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4 mr-1" />
              )}
              Agregar al álbum
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StickerCard({ sticker }: { sticker: AlbumSticker }) {
  const [imgError, setImgError] = useState(false)
  const collected = sticker.collected

  if (!collected) {
    // Cromo sin recolectar: placeholder gris
    return (
      <Card className="overflow-hidden border-dashed border-2 border-muted-foreground/20 bg-muted/30">
        <div className="aspect-square flex flex-col items-center justify-center text-muted-foreground/50 p-3">
          <div className="size-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-2">
            <span className="text-3xl font-bold">?</span>
          </div>
          <p className="text-xs font-medium text-center">No recolectado</p>
        </div>
        <CardContent className="p-2 text-center">
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            {sticker.stickerSize}
          </p>
        </CardContent>
      </Card>
    )
  }

  const qrUrl = sticker.hasQR ? qrImageUrl(sticker.qrTargetUrl, 120) : null
  const imageUrl = sticker.imageUrl && !imgError
    ? sticker.imageUrl
    : `https://picsum.photos/seed/${sticker.code}/200/200`

  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-md transition-all flex flex-col',
      sticker.rarity === 'GOLDEN' && 'ring-2 ring-amber-400/60 shadow-amber-200/50 shadow-lg',
      sticker.rarity === 'RARE' && 'ring-1 ring-sky-300/60',
    )}>
      <div className={cn(
        'aspect-square relative flex flex-col items-center justify-center p-2 gap-1',
        sticker.rarity === 'GOLDEN'
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20'
          : sticker.rarity === 'RARE'
            ? 'bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/20'
            : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10',
      )}>
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className={cn(
            'text-[9px] font-bold px-1.5 py-0.5 rounded',
            PLAN_BADGE[sticker.planLevel] || PLAN_BADGE[1],
          )}>
            {planLabel(sticker.planLevel)}
          </span>
        </div>
        <div className="absolute top-1.5 right-1.5 z-10">
          <span className={cn(
            'text-[9px] font-bold px-1.5 py-0.5 rounded',
            RARITY_BADGE[sticker.rarity],
          )}>
            {RARITY_LABELS[sticker.rarity]}
          </span>
        </div>

        {/* Logo o imagen del cromo */}
        {sticker.hasLogo && sticker.provider?.logoUrl ? (
          <img
            src={sticker.provider.logoUrl}
            alt={sticker.name}
            className="size-12 rounded-lg object-cover border bg-white"
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src={imageUrl}
            alt={sticker.name}
            className="size-12 rounded-lg object-cover"
            onError={() => setImgError(true)}
          />
        )}

        {/* QR si aplica */}
        {qrUrl && (
          <img
            src={qrUrl}
            alt={`QR de ${sticker.name}`}
            className="size-10 rounded bg-white p-0.5 border"
          />
        )}

        <p className="text-[10px] font-bold text-center line-clamp-2 mt-0.5">
          {sticker.name}
        </p>
        {sticker.provider?.companyName && (
          <p className="text-[9px] text-muted-foreground line-clamp-1 flex items-center gap-0.5">
            <Store className="size-2.5" /> {sticker.provider.companyName}
          </p>
        )}
      </div>
      <CardContent className="p-2 text-center">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <span className="text-[9px] text-muted-foreground font-mono">
            {sticker.stickerSize}cm
          </span>
          {sticker.provider?.city && (
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="size-2.5" />{sticker.provider.city}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <CheckCircle2 className="size-3 text-emerald-600" />
          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
            Recolectado
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
