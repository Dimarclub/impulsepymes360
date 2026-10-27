'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Tag, QrCode, Calendar, Store, Loader2, RefreshCw, ImageIcon,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface PublicOffer {
  id: string
  title: string
  description?: string | null
  originalPrice?: number | null
  offerPrice?: number | null
  discountPct?: number | null
  imageUrl?: string | null
  startDate: string
  endDate: string
  status: string
  qrCode?: string | null
  qrTargetUrl?: string | null
  createdAt: string
  supplier: {
    id: string
    companyName: string
    websiteSlug: string
    logoUrl?: string | null
  }
}

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / 86400000)
}

function qrCodeUrl(targetPath: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://impulsepymes360.com'
  const fullUrl = `${origin}${targetPath}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fullUrl)}`
}

const PLACEHOLDER_IMAGE = 'https://picsum.photos/seed/oferta-placeholder/400/300'

export function OfertasModule() {
  const toast = useAppStore((s) => s.toast)
  const [offers, setOffers] = useState<PublicOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/offers')
      const d = await res.json()
      if (res.ok) setOffers(d.offers || [])
      else setOffers([])
    } catch {
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  const handleImgError = (id: string) => {
    setImgErrors((p) => ({ ...p, [id]: true }))
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="size-7 text-primary" /> Ofertas Activas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Escanea el QR para ver la oferta completa en el sitio del proveedor
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOffers} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {/* Banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
        <QrCode className="size-6 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-emerald-900 dark:text-emerald-200">
            ¿Cómo aprovechar estas ofertas?
          </p>
          <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
            Escanea el <strong>código QR</strong> debajo de cada imagen con la cámara de tu celular.
            Se abrirá el sitio Web Express del proveedor con todos los detalles de la oferta.
            El mismo diseño (imagen + QR) va impreso en los <strong>bolsos PubliBags</strong> que
            circulan por toda la ciudad.
          </p>
        </div>
      </div>

      {/* Grid de ofertas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-20 mx-auto" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="size-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No hay ofertas activas en este momento</p>
            <p className="text-sm text-muted-foreground mt-1">
              Vuelve pronto — los proveedores envían nuevas ofertas todos los días.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {offers.map((o) => {
            const days = daysUntil(o.endDate)
            const endingSoon = days <= 3 && days >= 0
            const expired = days < 0
            const imageUrl = o.imageUrl && !imgErrors[o.id] ? o.imageUrl : PLACEHOLDER_IMAGE
            const qrUrl = o.qrTargetUrl ? qrCodeUrl(o.qrTargetUrl) : null
            return (
              <Card
                key={o.id}
                className="overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Imagen promocional */}
                <div className="relative aspect-[4/3] bg-muted/30 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Oferta: ${o.title}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => handleImgError(o.id)}
                  />
                  {o.discountPct != null && o.discountPct > 0 && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow">
                      -{o.discountPct}%
                    </div>
                  )}
                  {endingSoon && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">
                      Últimos días
                    </div>
                  )}
                </div>

                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                  {/* Título */}
                  <div>
                    <h3 className="font-bold text-base leading-tight line-clamp-2">{o.title}</h3>
                    {o.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{o.description}</p>
                    )}
                  </div>

                  {/* Precios */}
                  {(o.originalPrice != null || o.offerPrice != null) && (
                    <div className="flex items-baseline gap-2">
                      {o.originalPrice != null && (
                        <span className="text-sm text-muted-foreground line-through">
                          {fmtUsd(o.originalPrice)}
                        </span>
                      )}
                      {o.offerPrice != null && (
                        <span className="text-xl font-bold text-emerald-600">
                          {fmtUsd(o.offerPrice)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* QR + ESCANEA */}
                  {qrUrl && (
                    <div className="flex flex-col items-center gap-1 py-2 border-y border-dashed border-primary/20">
                      <img
                        src={qrUrl}
                        alt={`QR de la oferta ${o.title}`}
                        className="size-28 rounded bg-white p-1 border"
                        loading="lazy"
                      />
                      <p className="text-emerald-700 font-bold text-sm tracking-wide">
                        ESCANEA <span className="text-primary">→</span>
                      </p>
                    </div>
                  )}

                  {/* Footer: supplier + fecha */}
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2">
                      {o.supplier.logoUrl ? (
                        <img
                          src={o.supplier.logoUrl}
                          alt={o.supplier.companyName}
                          className="size-6 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="size-3.5 text-primary" />
                        </div>
                      )}
                      <span className="text-xs font-medium truncate">{o.supplier.companyName}</span>
                    </div>

                    <div className={cn(
                      'flex items-center gap-1.5 text-xs',
                      expired ? 'text-red-600' : endingSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground',
                    )}>
                      <Calendar className="size-3.5" />
                      {expired ? (
                        <span>Venció</span>
                      ) : endingSoon ? (
                        <span>Vence en {days}d — {new Date(o.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}</span>
                      ) : (
                        <span>Vence: {new Date(o.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pie informativo */}
      {!loading && offers.length > 0 && (
        <div className="text-center text-xs text-muted-foreground pt-2">
          <p className="flex items-center justify-center gap-1.5">
            <ImageIcon className="size-3.5" />
            {offers.length} oferta{offers.length !== 1 ? 's' : ''} activa{offers.length !== 1 ? 's' : ''} ·
            Diseño impreso en bolsos PubliBags · ImpulsePymes360
          </p>
        </div>
      )}
    </div>
  )
}
