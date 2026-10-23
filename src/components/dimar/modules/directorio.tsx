'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  MapPin, Star, Eye, Gift, Trophy, Plus, QrCode, Sparkles, Award,
  CheckCircle2, Loader2, Calendar, Users, Crown, Ticket, Store, ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const RARITY_LABELS: Record<string, string> = { COMMON: 'Común', RARE: 'Raro', GOLDEN: 'Dorado' }
const RARITY_COLORS: Record<string, string> = { COMMON: 'bg-muted text-muted-foreground border-muted', RARE: 'bg-sky-100 text-sky-700 border-sky-300', GOLDEN: 'bg-amber-100 text-amber-700 border-amber-400' }
const RARITY_GLOW: Record<string, string> = { COMMON: '', RARE: 'shadow-sky-200 shadow-lg', GOLDEN: 'shadow-amber-300 shadow-xl ring-2 ring-amber-400/50' }

export function DirectorioModule() {
  const [tab, setTab] = useState('directory')
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <Badge className="bg-primary/15 text-primary border-primary/20 w-fit"><MapPin className="size-3 mr-1" /> Directorio360</Badge>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-2">Directorio de Empresas</h1>
        <p className="text-muted-foreground text-sm mt-1">Directorio digital + álbum de stickers + sorteos</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="directory"><Store className="size-4 md:mr-1.5" /><span className="hidden md:inline">Directorio</span></TabsTrigger>
          <TabsTrigger value="album"><Sparkles className="size-4 md:mr-1.5" /><span className="hidden md:inline">Mi Álbum</span></TabsTrigger>
          <TabsTrigger value="raffles"><Trophy className="size-4 md:mr-1.5" /><span className="hidden md:inline">Sorteos</span></TabsTrigger>
        </TabsList>
        <TabsContent value="directory" className="mt-4"><DirectoryTab /></TabsContent>
        <TabsContent value="album" className="mt-4"><AlbumTab /></TabsContent>
        <TabsContent value="raffles" className="mt-4"><RafflesTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function DirectoryTab() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/impulse/directory?${params}`)
      if (!res.ok) { setEntries([]); return }
      setEntries(await res.json())
    } catch { setEntries([]) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  if (loading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <Skeleton key={i} className="h-56" />)}</div>

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input placeholder="Buscar empresas..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md" />
      </div>
      {entries.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron empresas.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((e: any) => {
            const p = e.provider
            const featured = e.featured
            return (
              <Card key={e.id} className={cn('overflow-hidden hover:shadow-md transition-shadow cursor-pointer', featured && 'ring-2 ring-primary/30')} onClick={() => setSelected(e)}>
                <div className="relative h-24 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
                  {featured && <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">★ Destacado</Badge>}
                  <div className="size-14 rounded-full bg-background border-2 border-background shadow-md flex items-center justify-center font-bold text-primary text-lg">{p?.companyName?.slice(0, 2).toUpperCase() || '??'}</div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div><h3 className="font-semibold leading-tight line-clamp-1">{p?.companyName}</h3><p className="text-xs text-muted-foreground">{e.category}</p></div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{e.shortDesc}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="size-3 fill-amber-400 text-amber-400" />{(e.rating || 0).toFixed(1)}</span>
                    <span className="flex items-center gap-0.5"><Eye className="size-3" />{e.viewCount}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="size-3" />{p?.city}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">{selected.provider?.companyName?.slice(0, 2).toUpperCase()}</div>
                  <div><DialogTitle>{selected.provider?.companyName}</DialogTitle><DialogDescription>{selected.category} · {selected.provider?.city}</DialogDescription></div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" />{(selected.rating || 0).toFixed(1)} ({selected.reviewCount})</span>
                  <span className="flex items-center gap-1"><Eye className="size-4" />{selected.viewCount} vistas</span>
                  <span className="flex items-center gap-1"><MapPin className="size-4" />{selected.visitCount} visitas</span>
                </div>
                <p className="text-sm text-muted-foreground">{selected.provider?.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Teléfono:</span> {selected.provider?.phone || '—'}</div>
                  <div><span className="text-muted-foreground">Celular:</span> {selected.provider?.mobile || '—'}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Dirección:</span> {selected.provider?.address || '—'}</div>
                </div>
                {selected.stickers?.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5"><Sparkles className="size-4" /> Sticker disponible</p>
                    <p className="text-xs text-amber-700 mt-0.5">Código: <span className="font-mono font-bold">{selected.stickers[0].code}</span></p>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={() => window.open(`/w/${selected.provider?.websiteSlug}`, '_blank')}><ArrowRight className="size-4 mr-1" /> Ver sitio web</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AlbumTab() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimCode, setClaimCode] = useState('')
  const [claiming, setClaiming] = useState(false)

  const fetchAlbum = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/impulse/album'); if (!res.ok) { setData(null); return }; setData(await res.json()) }
    catch { setData(null) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchAlbum() }, [fetchAlbum])

  const handleClaim = async () => {
    if (!claimCode.trim()) return
    setClaiming(true)
    try {
      const res = await fetch('/api/impulse/album/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: claimCode.trim().toUpperCase() }) })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      if (d.already) { toast('Ya tienes este sticker', 'info'); setClaimOpen(false); return }
      const rarity = d.sticker?.rarity === 'GOLDEN' ? '¡Sticker DORADO!' : d.sticker?.rarity === 'RARE' ? '¡Sticker raro!' : '¡Sticker reclamado!'
      toast(`${rarity} ${d.sticker?.name}`, 'success')
      setClaimOpen(false); setClaimCode(''); fetchAlbum()
    } catch { toast('Error', 'error') } finally { setClaiming(false) }
  }

  if (loading || !data) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-5 text-primary-foreground">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-sm opacity-90">Mi Álbum de Stickers</p><p className="text-3xl font-bold">{data.collected}<span className="text-lg opacity-75">/{data.total}</span></p></div>
            <div className="text-right"><p className="text-sm opacity-90">Progreso</p><p className="text-3xl font-bold">{data.progress}%</p></div>
          </div>
          <div className="bg-primary-foreground/20 rounded-full h-3 overflow-hidden"><div className="bg-primary-foreground h-full transition-all duration-500" style={{ width: `${data.progress}%` }} /></div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="flex items-center justify-center gap-1 text-amber-600"><Crown className="size-4" /></div><p className="text-2xl font-bold text-amber-600">{data.rarity.golden}</p><p className="text-xs text-muted-foreground">Dorados</p></div>
            <div><div className="flex items-center justify-center gap-1 text-sky-600"><Award className="size-4" /></div><p className="text-2xl font-bold text-sky-600">{data.rarity.rare}</p><p className="text-xs text-muted-foreground">Raros</p></div>
            <div><div className="flex items-center justify-center gap-1 text-muted-foreground"><Sparkles className="size-4" /></div><p className="text-2xl font-bold">{data.rarity.common}</p><p className="text-xs text-muted-foreground">Comunes</p></div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => setClaimOpen(true)} className="w-full" size="lg"><QrCode className="size-5 mr-2" /> Reclamar sticker</Button>
      {data.byCategory?.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Sparkles className="size-10 mx-auto text-muted-foreground mb-3" /><p className="font-medium">Tu álbum está vacío</p><p className="text-sm text-muted-foreground mt-1">Visita empresas del directorio y escanea sus códigos QR</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {data.byCategory?.map((cat: any) => (
            <Card key={cat.category}>
              <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base">{cat.category}</CardTitle><Badge variant="outline">{cat.count} stickers</Badge></div></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {cat.stickers.map((sp: any) => {
                    const sticker = sp.sticker
                    return (
                      <div key={sp.id} className={cn('aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center text-center transition-all', RARITY_COLORS[sticker.rarity], RARITY_GLOW[sticker.rarity])}>
                        <img src={sticker.imageUrl} alt={sticker.name} className="size-10 rounded-lg object-cover" />
                        <p className="text-[9px] font-medium mt-1 line-clamp-1">{sticker.name}</p>
                        <p className="text-[8px] text-muted-foreground">{RARITY_LABELS[sticker.rarity]}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={claimOpen} onOpenChange={setClaimOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reclamar sticker</DialogTitle><DialogDescription>Ingresa el código que recibiste al visitar la empresa</DialogDescription></DialogHeader>
          <div><Label>Código del sticker</Label><Input value={claimCode} onChange={(e) => setClaimCode(e.target.value)} placeholder="Ej: TECN-STK" className="text-center text-lg font-mono uppercase" onKeyDown={(e) => e.key === 'Enter' && handleClaim()} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setClaimOpen(false)}>Cancelar</Button><Button onClick={handleClaim} disabled={claiming || !claimCode.trim()}>{claiming ? <Loader2 className="size-4 mr-1 animate-spin" /> : <CheckCircle2 className="size-4 mr-1" />}Reclamar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RafflesTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [raffles, setRaffles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entering, setEntering] = useState<string | null>(null)

  const fetchRaffles = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/impulse/raffles'); if (!res.ok) { setRaffles([]); return }; setRaffles(await res.json()) }
    catch { setRaffles([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchRaffles() }, [fetchRaffles])

  const handleEnter = async (id: string) => {
    setEntering(id)
    try { const res = await fetch(`/api/impulse/raffles/${id}/enter`, { method: 'POST' }); const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      if (d.already) { toast('Ya estás participando', 'info'); return }
      toast(d.message, 'success'); fetchRaffles()
    } catch { toast('Error', 'error') } finally { setEntering(null) }
  }

  if (loading) return <Skeleton className="h-64" />
  const isAdmin = currentUser?.role === 'ADMIN'

  return (
    <div className="space-y-4">
      {raffles.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Trophy className="size-10 mx-auto text-muted-foreground mb-3" /><p className="font-medium">No hay sorteos activos</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {raffles.map((r) => {
            const isDrawn = r.status === 'DRAWN'
            const isPast = new Date(r.drawDate) < new Date()
            return (
              <Card key={r.id} className={cn('overflow-hidden', isDrawn && 'opacity-75')}>
                {r.prizeImageUrl && <div className="relative h-40 bg-muted"><img src={r.prizeImageUrl} alt={r.prize} className="w-full h-full object-cover" /><Badge className={cn('absolute top-3 right-3', isDrawn ? 'bg-muted text-muted-foreground' : 'bg-emerald-500 text-white')}>{isDrawn ? 'Sorteado' : 'Activo'}</Badge></div>}
                <CardContent className="p-4 space-y-3">
                  <div><h3 className="font-bold text-lg leading-tight">{r.name}</h3><p className="text-sm text-muted-foreground mt-1">{r.description}</p></div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-primary"><Gift className="size-4" /> {r.prize}</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-muted p-2"><Calendar className="size-4 mx-auto text-muted-foreground" /><p className="font-bold mt-0.5">{fmtDate(r.drawDate)}</p><p className="text-[10px] text-muted-foreground">Sorteo</p></div>
                    <div className="rounded-lg bg-muted p-2"><Sparkles className="size-4 mx-auto text-muted-foreground" /><p className="font-bold mt-0.5">{r.minStickers}</p><p className="text-[10px] text-muted-foreground">Mín. stickers</p></div>
                    <div className="rounded-lg bg-muted p-2"><Users className="size-4 mx-auto text-muted-foreground" /><p className="font-bold mt-0.5">{r.entriesCount}</p><p className="text-[10px] text-muted-foreground">Participantes</p></div>
                  </div>
                  {!isDrawn && !isPast && <Button className="w-full" onClick={() => handleEnter(r.id)} disabled={entering === r.id}>{entering === r.id ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Ticket className="size-4 mr-1" />}Participar</Button>}
                  {isDrawn && <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center"><Crown className="size-5 mx-auto text-amber-600 mb-1" /><p className="text-sm font-medium text-amber-800">Sorteo realizado</p></div>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
