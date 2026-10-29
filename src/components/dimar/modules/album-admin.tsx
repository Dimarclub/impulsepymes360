'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Book, Plus, Printer, RefreshCw, Loader2, Trash2, Store,
  AlertCircle, CheckCircle2, X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  PLAN_STICKER_CONFIG,
  STICKER_DIMENSIONS,
  getPlanConfig,
  type PlanStickerConfig,
} from '@/lib/album-config'

interface AdminSticker {
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
  createdAt: string
  directoryEntry: {
    id: string
    category: string
    provider: {
      id: string
      companyName: string
      category?: string | null
      logoUrl?: string | null
      websiteSlug: string
      city?: string | null
      phone?: string | null
      address?: string | null
    }
  } | null
  _count?: { albumProgress: number }
}

interface DirEntryOption {
  id: string
  category: string
  shortDesc?: string | null
  provider: {
    id: string
    companyName: string
    logoUrl?: string | null
    websiteSlug: string
    city?: string | null
    category?: string | null
  }
  _count: { stickers: number }
}

const PLAN_COLORS: Record<number, string> = {
  1: 'bg-muted text-muted-foreground',
  2: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  3: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
  4: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  5: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  6: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
}

function qrImageUrl(targetUrl?: string | null, size = 150): string | null {
  if (!targetUrl) return null
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://impulsepymes360.com'
  const full = targetUrl.startsWith('http') ? targetUrl : `${origin}${targetUrl}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(full)}`
}

export function AlbumAdminModule() {
  const toast = useAppStore((s) => s.toast)
  const [stickers, setStickers] = useState<AdminSticker[]>([])
  const [groups, setGroups] = useState<{
    level: number
    plan: string
    size: string
    config: PlanStickerConfig
    stickers: AdminSticker[]
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [dirEntries, setDirEntries] = useState<DirEntryOption[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<AdminSticker | null>(null)

  const fetchStickers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/album/stickers')
      const d = await res.json()
      if (res.ok) {
        setStickers(d.stickers || [])
        setGroups(d.groups || [])
      } else {
        toast(d.error || 'Error al cargar cromos', 'error')
      }
    } catch {
      toast('Error de red al cargar cromos', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchDirEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/impulse/directory')
      if (res.ok) {
        const data = await res.json()
        setDirEntries(data)
      }
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    fetchStickers()
    fetchDirEntries()
  }, [fetchStickers, fetchDirEntries])

  const handleDelete = async (s: AdminSticker) => {
    try {
      const res = await fetch(`/api/album/stickers/${s.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error al eliminar', 'error')
        return
      }
      toast('Cromo eliminado', 'success')
      setConfirmDelete(null)
      fetchStickers()
    } catch {
      toast('Error de red', 'error')
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Badge className="bg-primary/15 text-primary border-primary/20 w-fit">
            <Book className="size-3 mr-1" /> Administración
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2 flex items-center gap-2">
            📒 Cromos del Álbum
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona los cromos de cada proveedor e imprime la hoja de stickers.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchStickers} disabled={loading}>
            {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrintOpen(true)}
            disabled={stickers.length === 0}
          >
            <Printer className="size-4 mr-1.5" /> Imprimir cromos
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4 mr-1.5" /> Nuevo cromo
          </Button>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Book className="size-5 mx-auto text-emerald-600" />
            <p className="text-2xl font-bold mt-1">{stickers.length}</p>
            <p className="text-xs text-muted-foreground">Cromos totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="size-5 mx-auto text-primary" />
            <p className="text-2xl font-bold mt-1">{dirEntries.length}</p>
            <p className="text-xs text-muted-foreground">Proveedores en directorio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="size-5 mx-auto text-amber-600" />
            <p className="text-2xl font-bold mt-1">{dirEntries.filter((e) => e._count?.stickers === 0).length}</p>
            <p className="text-xs text-muted-foreground">Proveedores sin cromo</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de cromos agrupados por plan */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : groups.length === 0 || stickers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Book className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium">Aún no hay cromos creados.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea el primer cromo para un proveedor usando el botón <strong>"Nuevo cromo"</strong>.
            </p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4 mr-1.5" /> Crear primer cromo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => g.stickers.length > 0 && (
            <Card key={g.level}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className={cn('text-xs font-bold px-2 py-1 rounded', PLAN_COLORS[g.level])}>
                        Plan {g.plan}
                      </span>
                      Nivel {g.level} · {g.size}cm
                    </CardTitle>
                    <CardDescription className="mt-1">{g.config.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{g.stickers.length} cromos</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {g.stickers.map((s) => (
                    <AdminStickerCard
                      key={s.id}
                      sticker={s}
                      onDelete={() => setConfirmDelete(s)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: crear cromo */}
      <CreateStickerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        dirEntries={dirEntries}
        onCreated={() => {
          setCreateOpen(false)
          fetchStickers()
          fetchDirEntries()
        }}
      />

      {/* Dialog: imprimir */}
      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        groups={groups}
      />

      {/* Confirmar eliminación */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="size-5" /> Eliminar cromo
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar el cromo <strong>{confirmDelete?.name}</strong>
              {' '}({confirmDelete?.code})? Esta acción no se puede deshacer. Los usuarios que ya
              lo recolectaron conservarán el progreso en su álbum.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              <Trash2 className="size-4 mr-1.5" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminStickerCard({
  sticker,
  onDelete,
}: {
  sticker: AdminSticker
  onDelete: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const provider = sticker.directoryEntry?.provider
  const qrUrl = sticker.hasQR ? qrImageUrl(sticker.qrTargetUrl, 100) : null
  const imageUrl = sticker.imageUrl && !imgError
    ? sticker.imageUrl
    : `https://picsum.photos/seed/${sticker.code}/120/120`

  return (
    <div className="rounded-lg border bg-card p-3 flex gap-3">
      <div className="shrink-0">
        {sticker.hasLogo && provider?.logoUrl ? (
          <img
            src={provider.logoUrl}
            alt={sticker.name}
            className="size-14 rounded-lg object-cover border bg-white"
            onError={() => setImgError(true)}
          />
        ) : (
          <img
            src={imageUrl}
            alt={sticker.name}
            className="size-14 rounded-lg object-cover"
            onError={() => setImgError(true)}
          />
        )}
        {qrUrl && (
          <img
            src={qrUrl}
            alt={`QR ${sticker.name}`}
            className="size-14 rounded bg-white p-0.5 border mt-1"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{sticker.name}</p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Store className="size-3" /> {provider?.companyName || '—'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            onClick={onDelete}
            aria-label="Eliminar cromo"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1 mt-2">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted">
            {sticker.code}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {sticker.stickerSize}cm
          </span>
          {sticker.hasQR && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              QR
            </span>
          )}
          {sticker.hasLogo && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              Logo
            </span>
          )}
          {sticker.hasBanner && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              Banner {sticker.bannerType || ''}
            </span>
          )}
          {sticker.hasMarketplaceAd && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              Ad marketplace
            </span>
          )}
        </div>
        {sticker._count?.albumProgress != null && (
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Recolectado por <strong>{sticker._count.albumProgress}</strong> usuario(s)
          </p>
        )}
      </div>
    </div>
  )
}

function CreateStickerDialog({
  open,
  onOpenChange,
  dirEntries,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  dirEntries: DirEntryOption[]
  onCreated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [entryId, setEntryId] = useState('')
  const [planLevel, setPlanLevel] = useState('1')
  const [creating, setCreating] = useState(false)

  const available = dirEntries.filter((e) => (e._count?.stickers ?? 0) === 0)
  const selectedEntry = dirEntries.find((e) => e.id === entryId) || null
  const level = Number(planLevel)
  const cfg = getPlanConfig(level)

  useEffect(() => {
    if (open) {
      setEntryId('')
      setPlanLevel('1')
    }
  }, [open])

  const handleCreate = async () => {
    if (!entryId) {
      toast('Selecciona un proveedor', 'error')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`/api/album/stickers/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directoryEntryId: entryId,
          planLevel: level,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error al crear cromo', 'error')
        return
      }
      toast(`Cromo creado: ${d.sticker?.code}`, 'success')
      onCreated()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5 text-emerald-600" /> Crear cromo para un proveedor
          </DialogTitle>
          <DialogDescription>
            El cromo se genera automáticamente con el tamaño y características del plan seleccionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Proveedor (entrada del directorio)</Label>
            <Select value={entryId} onValueChange={setEntryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={
                  available.length === 0
                    ? 'No hay proveedores disponibles (todos tienen cromo)'
                    : 'Selecciona un proveedor'
                } />
              </SelectTrigger>
              <SelectContent>
                {available.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <Store className="size-3" />
                      {e.provider.companyName}
                      <span className="text-xs text-muted-foreground">· {e.category}</span>
                      {e.provider.city && (
                        <span className="text-xs text-muted-foreground">· {e.provider.city}</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {available.length === 0 && dirEntries.length > 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" /> Todos los proveedores ya tienen un cromo asignado.
              </p>
            )}
            {dirEntries.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" /> No hay proveedores en el directorio todavía.
              </p>
            )}
          </div>

          <div>
            <Label>Nivel del plan del proveedor</Label>
            <Select value={planLevel} onValueChange={setPlanLevel}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_STICKER_CONFIG.map((c) => (
                  <SelectItem key={c.level} value={String(c.level)}>
                    Nivel {c.level} — Plan {c.plan} ({c.size}cm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vista previa del cromo según el plan */}
          {cfg && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Configuración automática del cromo:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <PreviewRow label="Tamaño" value={`${cfg.size}cm`} />
                <PreviewRow label="QR" value={cfg.hasQR ? 'Sí' : 'No'} />
                <PreviewRow label="Logo" value={cfg.hasLogo ? 'Sí' : 'No'} />
                <PreviewRow label="Banner" value={cfg.hasBanner ? `Sí (${cfg.bannerType})` : 'No'} />
                <PreviewRow label="Anuncio marketplace" value={cfg.hasMarketplaceAd ? 'Sí' : 'No'} />
                <PreviewRow label="Rareza" value={
                  level >= 5 ? 'Dorado' : level >= 3 ? 'Raro' : 'Común'
                } />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{cfg.description}</p>
            </div>
          )}

          {selectedEntry && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Vista previa del cromo</p>
              <PrintableSticker
                name={selectedEntry.provider.companyName}
                provider={selectedEntry.provider.companyName}
                logoUrl={selectedEntry.provider.logoUrl}
                websiteSlug={selectedEntry.provider.websiteSlug}
                phone={selectedEntry.provider.phone || null}
                address={selectedEntry.provider.address || null}
                city={selectedEntry.provider.city || null}
                config={cfg}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCreate}
            disabled={creating || !entryId}
          >
            {creating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <CheckCircle2 className="size-4 mr-1" />}
            Crear cromo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function PrintDialog({
  open,
  onOpenChange,
  groups,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  groups: { level: number; plan: string; size: string; config: PlanStickerConfig; stickers: AdminSticker[] }[]
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5 text-primary" /> Hoja de impresión de cromos
          </DialogTitle>
          <DialogDescription>
            Vista previa para imprimir los cromos físicos. Cada cromo se muestra a tamaño real según su plan.
            Usa <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Ctrl + P</kbd> o el botón imprimir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 print-area">
          {groups.map((g) => g.stickers.length > 0 && (
            <div key={g.level} className="break-inside-avoid">
              <div className="flex items-center justify-between border-b-2 border-primary/30 pb-1 mb-2">
                <h3 className="font-bold text-sm">
                  Plan {g.plan} · {g.size}cm · Nivel {g.level}
                </h3>
                <span className="text-xs text-muted-foreground">{g.stickers.length} cromos</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {g.stickers.map((s) => (
                  <PrintableSticker
                    key={s.id}
                    name={s.name}
                    provider={s.directoryEntry?.provider?.companyName || ''}
                    logoUrl={s.hasLogo ? (s.directoryEntry?.provider?.logoUrl || null) : null}
                    websiteSlug={s.directoryEntry?.provider?.websiteSlug || ''}
                    phone={s.directoryEntry?.provider?.phone || null}
                    address={s.directoryEntry?.provider?.address || null}
                    city={s.directoryEntry?.provider?.city || null}
                    config={g.config}
                    code={s.code}
                    qrTargetUrl={s.hasQR ? s.qrTargetUrl : null}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="size-4 mr-1" /> Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4 mr-1" /> Imprimir
          </Button>
        </DialogFooter>
        <style jsx global>{`
          @media print {
            body * { visibility: hidden !important; }
            .print-area, .print-area * { visibility: visible !important; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
            @page { margin: 1cm; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

function PrintableSticker({
  name,
  provider,
  logoUrl,
  websiteSlug,
  phone,
  address,
  city,
  config,
  code,
  qrTargetUrl,
}: {
  name: string
  provider: string
  logoUrl?: string | null
  websiteSlug: string
  phone?: string | null
  address?: string | null
  city?: string | null
  config: PlanStickerConfig
  code?: string
  qrTargetUrl?: string | null
}) {
  const dims = STICKER_DIMENSIONS[config.size] || { w: 8, h: 2 }
  // Escala para mostrar en pantalla (cm → px aprox, 1cm ≈ 14px)
  const scale = 14
  const w = dims.w * scale
  const h = dims.h * scale
  const qrUrl = config.hasQR && qrTargetUrl
    ? qrImageUrl(qrTargetUrl, 80)
    : null

  return (
    <div
      className="border-2 border-dashed border-foreground/40 bg-white text-black flex p-1 gap-1 overflow-hidden mx-auto"
      style={{ width: `${w}px`, height: `${h}px`, maxWidth: '100%' }}
    >
      {config.hasLogo && logoUrl && (
        <img
          src={logoUrl}
          alt={provider}
          className="h-full w-auto object-contain shrink-0"
          style={{ maxHeight: `${h - 8}px` }}
        />
      )}
      {qrUrl && (
        <img
          src={qrUrl}
          alt={`QR ${name}`}
          className="h-full w-auto object-contain shrink-0"
          style={{ maxHeight: `${h - 8}px` }}
        />
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="font-bold text-[10px] leading-tight truncate">{name}</p>
        {phone && <p className="text-[8px] leading-tight truncate">Tel: {phone}</p>}
        {address && <p className="text-[8px] leading-tight truncate">{address}</p>}
        {city && <p className="text-[8px] leading-tight truncate">{city}</p>}
        {config.hasBanner && (
          <p className="text-[7px] italic text-foreground/70 leading-tight mt-0.5">
            Banner {config.bannerType}
          </p>
        )}
        {config.hasMarketplaceAd && (
          <p className="text-[7px] font-bold text-rose-700 leading-tight">+ Ad Marketplace</p>
        )}
        {code && (
          <p className="text-[7px] font-mono mt-0.5">Código: {code}</p>
        )}
        {websiteSlug && (
          <p className="text-[7px] leading-tight truncate text-emerald-700">
            /w/{websiteSlug}
          </p>
        )}
      </div>
    </div>
  )
}
