'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Megaphone, Plus, Pencil, Trash2, MousePointerClick, Eye, Loader2,
  Sparkles, Crown, Gem, LayoutDashboard, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '@/components/dimar/image-upload'
import type { Advertisement, Supplier } from '@/lib/types'
import { PLACEMENT_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0)

const PLACEMENTS = ['HEADER', 'SIDEBAR_LEFT', 'SIDEBAR_RIGHT', 'IN_GRID', 'FOOTER', 'HERO'] as const
type Placement = typeof PLACEMENTS[number]

const PLACEMENT_ICONS: Record<Placement, React.ReactNode> = {
  HEADER: <div className="h-2 w-10 rounded bg-current/70" />,
  SIDEBAR_LEFT: <div className="h-10 w-2 rounded bg-current/70" />,
  SIDEBAR_RIGHT: <div className="h-10 w-2 rounded bg-current/70" />,
  IN_GRID: <div className="grid grid-cols-2 gap-0.5"><div className="h-2 w-2 rounded-sm bg-current/70" /><div className="h-2 w-2 rounded-sm bg-current/70" /><div className="h-2 w-2 rounded-sm bg-current/70" /><div className="h-2 w-2 rounded-sm bg-current/70" /></div>,
  FOOTER: <div className="h-2 w-10 rounded bg-current/70" />,
  HERO: <div className="h-6 w-12 rounded bg-current/70" />,
}

const PRICING_TIERS = [
  {
    name: 'Básico',
    price: 90,
    icon: <Sparkles className="size-5" />,
    accent: 'border-emerald-200 bg-emerald-50/50',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    features: [
      'Ubicación IN_GRID o FOOTER',
      '30 días de duración',
      'Métricas básicas (clicks, impresiones)',
      '1 banner rotativo',
      'Soporte por email',
    ],
  },
  {
    name: 'Destacado',
    price: 150,
    icon: <Crown className="size-5" />,
    accent: 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-300/50',
    badgeClass: 'bg-amber-200 text-amber-800',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    popular: true,
    features: [
      'Ubicación HEADER o SIDEBAR',
      '45 días de duración',
      'Métricas detalladas + CTR',
      'Banner estático + link',
      'Posicionamiento prioritario',
      'Soporte por chat',
    ],
  },
  {
    name: 'Premium',
    price: 250,
    icon: <Gem className="size-5" />,
    accent: 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-amber-50',
    badgeClass: 'bg-emerald-700 text-white',
    btnClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    features: [
      'Ubicación HERO (portada)',
      '60 días de duración',
      'Métricas avanzadas + heatmap',
      'Banner animado + video',
      'Segmentación por ciudad',
      'Gestor de cuenta dedicado',
    ],
  },
]

const fmtDate = (iso: string) => {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const plusDaysStr = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

interface AdWithSupplier extends Advertisement {
  supplier?: { id: string; companyName: string } | null
}

interface SupplierLite extends Supplier {
  user?: { name: string }
}

export function AdsModule() {
  const toast = useAppStore((s) => s.toast)
  const [ads, setAds] = useState<AdWithSupplier[]>([])
  const [suppliers, setSuppliers] = useState<SupplierLite[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [editAd, setEditAd] = useState<AdWithSupplier | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const emptyForm = {
    title: '', imageUrl: '', targetUrl: '', placement: 'IN_GRID' as Placement,
    supplierId: '', price: '', startDate: todayStr(), endDate: plusDaysStr(30),
  }
  const [form, setForm] = useState(emptyForm)

  const fetchAds = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ads?all=true')
      const data = await res.json()
      setAds(data)
    } catch {
      toast('Error al cargar anuncios', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      setSuppliers(data)
    } catch {
      /* noop */
    }
  }

  useEffect(() => { fetchAds(); fetchSuppliers() }, [])

  const placementCounts = useMemo(() => {
    const counts: Record<Placement, number> = {
      HEADER: 0, SIDEBAR_LEFT: 0, SIDEBAR_RIGHT: 0, IN_GRID: 0, FOOTER: 0, HERO: 0,
    }
    ads.forEach((a) => {
      if (a.placement in counts) counts[a.placement as Placement]++
    })
    return counts
  }, [ads])

  const totals = useMemo(() => {
    const clicks = ads.reduce((a, x) => a + (x.clicks || 0), 0)
    const impressions = ads.reduce((a, x) => a + (x.impressions || 0), 0)
    const revenue = ads.reduce((a, x) => a + (x.price || 0), 0)
    return { clicks, impressions, revenue, count: ads.length }
  }, [ads])

  const openCreate = () => {
    setForm(emptyForm)
    setCreateOpen(true)
  }

  const openEdit = (ad: AdWithSupplier) => {
    setForm({
      title: ad.title,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl || '',
      placement: (ad.placement as Placement) || 'IN_GRID',
      supplierId: ad.supplierId || '',
      price: String(ad.price || 0),
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 10) : todayStr(),
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 10) : plusDaysStr(30),
    })
    setEditAd(ad)
  }

  const submit = async (isEdit: boolean) => {
    if (!form.title || !form.imageUrl || !form.placement) {
      toast('Título, imagen y ubicación son obligatorios', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl,
        targetUrl: form.targetUrl || null,
        placement: form.placement,
        supplierId: form.supplierId || null,
        price: parseFloat(form.price || '0'),
        startDate: form.startDate,
        endDate: form.endDate,
        status: 'ACTIVE',
      }
      const url = isEdit && editAd ? `/api/ads/${editAd.id}` : '/api/ads'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      await fetchAds()
      if (isEdit) { setEditAd(null) } else { setCreateOpen(false) }
      setForm(emptyForm)
      toast(isEdit ? 'Anuncio actualizado' : 'Espacio vendido correctamente')
    } catch {
      toast('Error al guardar anuncio', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/ads/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchAds()
      toast('Anuncio eliminado')
    } catch {
      toast('Error al eliminar', 'error')
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Espacios Publicitarios</h1>
          <p className="text-sm text-muted-foreground">Vende y gestiona espacios publicitarios a tus proveedores.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" /> Vender espacio
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={<Megaphone className="size-4" />} label="Anuncios activos" value={totals.count} accent="emerald" />
        <MiniStat icon={<Eye className="size-4" />} label="Impresiones" value={totals.impressions.toLocaleString('es-EC')} accent="emerald" />
        <MiniStat icon={<MousePointerClick className="size-4" />} label="Clicks" value={totals.clicks.toLocaleString('es-EC')} accent="amber" />
        <MiniStat icon={<Crown className="size-4" />} label="Ingresos" value={usd(totals.revenue)} accent="amber" />
      </div>

      {/* Placement map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutDashboard className="size-4 text-emerald-600" /> Mapa de ubicaciones
          </CardTitle>
          <CardDescription className="text-xs">
            Maqueta visual del marketplace con las zonas publicitarias y la cantidad de anuncios activos en cada una.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-2 w-full max-w-3xl mx-auto"
            style={{
              gridTemplateColumns: '1fr 2fr 1fr',
              gridTemplateRows: 'auto auto auto auto',
              gridTemplateAreas: `"header header header" "left hero right" "left grid right" "footer footer footer"`,
            }}
          >
            <ZoneCard area="header" placement="HEADER" count={placementCounts.HEADER} accent="emerald" />
            <ZoneCard area="left" placement="SIDEBAR_LEFT" count={placementCounts.SIDEBAR_LEFT} accent="amber" />
            <ZoneCard area="hero" placement="HERO" count={placementCounts.HERO} accent="emerald" tall />
            <ZoneCard area="grid" placement="IN_GRID" count={placementCounts.IN_GRID} accent="amber" />
            <ZoneCard area="right" placement="SIDEBAR_RIGHT" count={placementCounts.SIDEBAR_RIGHT} accent="amber" />
            <ZoneCard area="footer" placement="FOOTER" count={placementCounts.FOOTER} accent="emerald" />
          </div>
        </CardContent>
      </Card>

      {/* Ads table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Anuncios gestionados</CardTitle>
          <CardDescription className="text-xs">Edita o elimina los espacios contratados.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Megaphone className="size-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No hay anuncios. Vende tu primer espacio.</p>
              <Button onClick={openCreate} size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="size-4" /> Vender espacio
              </Button>
            </div>
          ) : (
            <div className="rounded-md border max-h-[60vh] overflow-y-auto scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Impresiones</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => {
                    const now = new Date()
                    const start = new Date(ad.startDate)
                    const end = new Date(ad.endDate)
                    const isActive = ad.status === 'ACTIVE' && now >= start && now <= end
                    return (
                      <TableRow key={ad.id}>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[220px]">
                            <img
                              src={ad.imageUrl}
                              alt=""
                              className="size-8 rounded object-cover border bg-muted shrink-0"
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2' }}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{ad.title}</div>
                              {ad.targetUrl ? (
                                <a
                                  href={ad.targetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-muted-foreground hover:text-emerald-700 inline-flex items-center gap-0.5 truncate"
                                >
                                  <ExternalLink className="size-3" /> link
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ad.supplier?.companyName || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                            {PLACEMENT_LABELS[ad.placement] || ad.placement}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(ad.startDate)} → {fmtDate(ad.endDate)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{ad.clicks}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{ad.impressions.toLocaleString('es-EC')}</TableCell>
                        <TableCell className="text-right font-semibold">{usd(ad.price)}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              isActive
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : ad.status === 'ACTIVE'
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                : 'bg-muted text-muted-foreground hover:bg-muted'
                            }
                          >
                            {isActive ? 'Activo' : ad.status === 'ACTIVE' ? 'Programado' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(ad)} title="Editar">
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(ad.id)} title="Eliminar">
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing tiers */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gradient">Planes de publicidad</h2>
          <p className="text-sm text-muted-foreground">Ofrece a tus proveedores opciones flexibles según su presupuesto.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PRICING_TIERS.map((tier) => (
            <Card key={tier.name} className={cn('relative flex flex-col', tier.accent)}>
              {tier.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white hover:bg-amber-500 shadow">
                  Más popular
                </Badge>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={cn('size-10 rounded-lg flex items-center justify-center', tier.badgeClass)}>
                    {tier.icon}
                  </div>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{usd(tier.price)}</span>
                  <span className="text-xs text-muted-foreground">/ periodo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2 text-sm flex-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="size-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">✓</span>
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={cn('mt-4 w-full', tier.btnClass)} onClick={openCreate}>
                  Contratar {tier.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create/Edit dialog (shared) */}
      <Dialog
        open={createOpen || !!editAd}
        onOpenChange={(o) => {
          if (!o) { setCreateOpen(false); setEditAd(null); setForm(emptyForm) }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogHeader>
            <DialogTitle>{editAd ? 'Editar anuncio' : 'Vender espacio publicitario'}</DialogTitle>
            <DialogDescription>
              {editAd ? 'Actualiza los datos del anuncio.' : 'Configura el nuevo anuncio para el proveedor.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Black Friday en electrónicos" />
            </div>
            <div className="grid gap-1.5">
              <Label>Imagen del anuncio *</Label>
              <ImageUpload
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>URL destino</Label>
              <Input value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Ubicación *</Label>
                <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v as Placement })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p} value={p}>{PLACEMENT_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Proveedor</Label>
                <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Precio USD</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="150" />
              </div>
              <div className="grid gap-1.5">
                <Label>Inicio</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditAd(null); setForm(emptyForm) }}>Cancelar</Button>
            <Button
              onClick={() => submit(!!editAd)}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : editAd ? <Pencil className="size-4" /> : <Plus className="size-4" />}
              {editAd ? 'Guardar cambios' : 'Vender espacio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El anuncio será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MiniStat({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: 'emerald' | 'amber' }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 flex items-center gap-2.5">
        <div className={cn(
          'size-9 rounded-lg flex items-center justify-center shrink-0',
          accent === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground truncate">{label}</div>
          <div className="text-base font-bold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ZoneCard({
  area, placement, count, accent, tall,
}: { area: string; placement: Placement; count: number; accent: 'emerald' | 'amber'; tall?: boolean }) {
  return (
    <div
      style={{ gridArea: area }}
      className={cn(
        'rounded-lg border-2 border-dashed p-2 flex flex-col items-center justify-center text-center gap-1 transition-colors',
        tall ? 'min-h-[120px]' : 'min-h-[64px]',
        accent === 'emerald'
          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-50'
          : 'border-amber-300 bg-amber-50/60 text-amber-700 hover:bg-amber-50'
      )}
    >
      <div className="opacity-70">{PLACEMENT_ICONS[placement]}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide leading-tight">{PLACEMENT_LABELS[placement]}</div>
      <Badge
        className={cn(
          'text-[10px] px-1.5 py-0',
          count > 0
            ? (accent === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-amber-500 text-white hover:bg-amber-500')
            : 'bg-background text-muted-foreground border'
        )}
      >
        {count} {count === 1 ? 'anuncio' : 'anuncios'}
      </Badge>
    </div>
  )
}
