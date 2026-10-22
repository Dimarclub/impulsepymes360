'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Grid3x3, ShoppingCart, DollarSign, CheckCircle2, QrCode, Award, Gift, Camera, Share2, MessageSquare, Store, ExternalLink, Zap } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtDate = (iso?: string | null) => { if (!iso) return '—'; try { return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) } catch { return iso } }
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function GridModule() {
  const [tab, setTab] = useState('grid')
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Grid PubliBags 360</h1>
      <p className="text-muted-foreground text-sm mt-1">Compra espacios QR · Vende a clientes · Gana comisiones 5% × 3 niveles</p></div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="grid"><Grid3x3 className="size-4 md:mr-1.5" /><span className="hidden md:inline">Grid</span></TabsTrigger>
          <TabsTrigger value="mine"><ShoppingCart className="size-4 md:mr-1.5" /><span className="hidden md:inline">Mis espacios</span></TabsTrigger>
          <TabsTrigger value="commissions"><DollarSign className="size-4 md:mr-1.5" /><span className="hidden md:inline">Comisiones</span></TabsTrigger>
          <TabsTrigger value="tasks"><Award className="size-4 md:mr-1.5" /><span className="hidden md:inline">Tareas</span></TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-4"><GridTab /></TabsContent>
        <TabsContent value="mine" className="mt-4"><MySpacesTab /></TabsContent>
        <TabsContent value="commissions" className="mt-4"><CommissionsTab /></TabsContent>
        <TabsContent value="tasks" className="mt-4"><TasksTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function GridTab() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [spaces, setSpaces] = useState<any[]>([])
  const [purchaseTarget, setPurchaseTarget] = useState<any>(null)

  const fetchGrid = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/grid'); if (!res.ok) { setData(null); return }; setData(await res.json()) }
    catch { setData(null) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchGrid() }, [fetchGrid])

  const fetchSpaces = useCallback(async (pageId: string) => {
    try { const res = await fetch(`/api/grid?pageId=${pageId}`); const d = await res.json(); setSpaces(d.spaces || []) }
    catch { setSpaces([]) }
  }, [])

  const buySpace = async (id: string) => {
    try { const res = await fetch(`/api/grid/spaces/${id}/purchase`, { method: 'POST' }); const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`¡Espacio comprado! QR: ${d.qrCode}`, 'success'); setPurchaseTarget(null); fetchGrid()
    } catch { toast('Error', 'error') }
  }

  if (loading || !data) return <Skeleton className="h-96" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{data.stats.totalSpaces}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{data.stats.available}</p><p className="text-xs text-muted-foreground">Disponibles</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{data.stats.owned}</p><p className="text-xs text-muted-foreground">En propiedad</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{data.stats.sold}</p><p className="text-xs text-muted-foreground">Vendidos</p></CardContent></Card>
      </div>
      <div className="flex gap-2 overflow-x-auto scroll-thin pb-2">
        {data.pages.map((p: any) => (
          <Button key={p.id} variant={selectedMonth === p.month ? 'default' : 'outline'} size="sm" onClick={() => { setSelectedMonth(p.month); fetchSpaces(p.id) }}>{p.monthName}</Button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Grid — {MONTHS[selectedMonth - 1]} {data.campaign.year}</CardTitle>
        <CardDescription>Cada celda = un espacio QR ($20). Click para comprar.</CardDescription></CardHeader>
        <CardContent>
          {spaces.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Selecciona un mes para ver los espacios
              <div className="mt-3"><Button onClick={() => { const p = data.pages.find((x: any) => x.month === selectedMonth); if (p) fetchSpaces(p.id) }}>Cargar {MONTHS[selectedMonth - 1]}</Button></div>
            </div>
          ) : (
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
              {spaces.map((s: any) => {
                const isAvailable = s.status === 'AVAILABLE'; const isOwned = s.status === 'OWNED'; const isSold = s.status === 'SOLD'
                return (
                  <button key={s.id} onClick={() => isAvailable && setPurchaseTarget(s)} disabled={!isAvailable}
                    className={cn('aspect-square rounded border text-[8px] font-bold flex items-center justify-center transition-all relative',
                      isAvailable && 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:scale-110 cursor-pointer',
                      isOwned && 'border-amber-400 bg-amber-50', isSold && 'border-primary bg-primary/20')}
                    title={`#${s.position} · ${isAvailable ? 'Disponible $20' : isOwned ? 'En propiedad' : 'Vendido'}`}>
                    {s.position}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!purchaseTarget} onOpenChange={(o) => !o && setPurchaseTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Comprar espacio #{purchaseTarget?.position}</DialogTitle><DialogDescription>Adquiere este espacio por $20</DialogDescription></DialogHeader>
          <div className="rounded-lg bg-primary/5 p-3 text-sm">
            <p className="font-medium text-primary">¿Qué incluye?</p>
            <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
              <li>✅ Tu QR en el grid digital + bolso físico</li><li>✅ Puedes revenderlo al precio que quieras</li>
              <li>✅ Genera comisiones 5% × 3 niveles</li>
            </ul>
          </div>
          <p className="text-2xl font-bold text-center">$20.00</p>
          <DialogFooter><Button variant="outline" onClick={() => setPurchaseTarget(null)}>Cancelar</Button>
          <Button onClick={() => purchaseTarget && buySpace(purchaseTarget.id)}><Zap className="size-4 mr-1" />Comprar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MySpacesTab() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sellTarget, setSellTarget] = useState<any>(null)
  const [sellForm, setSellForm] = useState({ buyerName: '', salePrice: '20', imageUrl: '', websiteSlug: '' })

  const fetchMine = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/grid/my-spaces'); if (!res.ok) { setData(null); return }; setData(await res.json()) }
    catch { setData(null) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchMine() }, [fetchMine])

  const sellSpace = async () => {
    if (!sellTarget) return
    try {
      const res = await fetch(`/api/grid/spaces/${sellTarget.id}/sell`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sellForm, salePrice: parseFloat(sellForm.salePrice), soldBy: 'OWNER' }) })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast('¡Espacio vendido!', 'success'); setSellTarget(null); setSellForm({ buyerName: '', salePrice: '20', imageUrl: '', websiteSlug: '' }); fetchMine()
    } catch { toast('Error', 'error') }
  }

  if (loading || !data) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{data.stats.totalSpaces}</p><p className="text-xs text-muted-foreground">Mis espacios</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{data.stats.ownedSpaces}</p><p className="text-xs text-muted-foreground">En propiedad</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{data.stats.soldSpaces}</p><p className="text-xs text-muted-foreground">Vendidos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{fmtUsd(data.stats.totalCommissions)}</p><p className="text-xs text-muted-foreground">Comisiones</p></CardContent></Card>
      </div>
      {data.spaces.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><ShoppingCart className="size-10 mx-auto text-muted-foreground mb-3" /><p className="font-medium">No tienes espacios</p><p className="text-sm text-muted-foreground mt-1">Ve a "Grid" para comprar</p></CardContent></Card>
      ) : (
        <Card><CardHeader><CardTitle className="text-base">Mis espacios</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>QR</TableHead><TableHead>Mes</TableHead><TableHead>Estado</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
        <TableBody>{data.spaces.map((s: any) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono text-xs">{s.qrCode || '—'}</TableCell>
            <TableCell>{s.page?.monthName || '—'}</TableCell>
            <TableCell><Badge className={s.status === 'SOLD' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{s.status === 'SOLD' ? 'Vendido' : 'En propiedad'}</Badge></TableCell>
            <TableCell>{s.buyerName || '—'}</TableCell>
            <TableCell className="text-right">{s.salePrice ? fmtUsd(s.salePrice) : fmtUsd(s.purchasePrice)}</TableCell>
            <TableCell className="text-right">{s.status === 'OWNED' && <Button size="sm" variant="outline" onClick={() => { setSellTarget(s); setSellForm({ buyerName: '', salePrice: '20', imageUrl: '', websiteSlug: '' }) }}>Vender</Button>}</TableCell>
          </TableRow>
        ))}</TableBody></Table></CardContent></Card>
      )}
      <Dialog open={!!sellTarget} onOpenChange={(o) => !o && setSellTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Vender espacio #{sellTarget?.position}</DialogTitle><DialogDescription>Registra la venta al cliente</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cliente/empresa *</Label><Input value={sellForm.buyerName} onChange={(e) => setSellForm({ ...sellForm, buyerName: e.target.value })} placeholder="Ej: TecnoExpress" /></div>
            <div><Label>Precio de venta *</Label><Input type="number" value={sellForm.salePrice} onChange={(e) => setSellForm({ ...sellForm, salePrice: e.target.value })} /><p className="text-xs text-muted-foreground mt-0.5">Compraste por $20. Tu ganancia = precio - $20</p></div>
            <div><Label>URL imagen del cliente</Label><Input value={sellForm.imageUrl} onChange={(e) => setSellForm({ ...sellForm, imageUrl: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Enlace a tienda (Web Express)</Label><Input value={sellForm.websiteSlug} onChange={(e) => setSellForm({ ...sellForm, websiteSlug: e.target.value })} placeholder="/w/tecnoexpress" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSellTarget(null)}>Cancelar</Button><Button onClick={sellSpace} disabled={!sellForm.buyerName}><CheckCircle2 className="size-4 mr-1" />Confirmar venta</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CommissionsTab() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/grid/commissions').then((r) => r.ok ? r.json() : []).then(setCommissions).catch(() => setCommissions([])).finally(() => setLoading(false)) }, [])
  if (loading) return <Skeleton className="h-64" />
  const total = commissions.reduce((s, c) => s + c.amount, 0)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{fmtUsd(total)}</p><p className="text-xs text-muted-foreground">Total comisiones</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{commissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0)}</p><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
      </div>
      {commissions.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><DollarSign className="size-10 mx-auto text-muted-foreground mb-3" /><p className="font-medium">No tienes comisiones aún</p><p className="text-sm text-muted-foreground mt-1">Cuando tu red venda espacios, aquí aparecerán</p></CardContent></Card>
      ) : (
        <Card><CardHeader><CardTitle className="text-base">Comisiones del Grid (5% × 3 niveles)</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Nivel</TableHead><TableHead>Comprador</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
        <TableBody>{commissions.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="text-xs">{fmtDate(c.createdAt)}</TableCell>
            <TableCell><Badge variant="outline">N{c.level}</Badge></TableCell>
            <TableCell className="text-xs">{c.space?.buyerName || '—'}</TableCell>
            <TableCell className="text-right font-bold">{fmtUsd(c.amount)}</TableCell>
            <TableCell><Badge className={c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{c.status === 'PAID' ? 'Pagada' : 'Pendiente'}</Badge></TableCell>
          </TableRow>
        ))}</TableBody></Table></CardContent></Card>
      )}
    </div>
  )
}

function TasksTab() {
  const toast = useAppStore((s) => s.toast)
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/tasks/progress'); if (!res.ok) { setProgress(null); return }; setProgress(await res.json()) }
    catch { setProgress(null) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchProgress() }, [fetchProgress])

  const toggleTask = async (task: string) => {
    const res = await fetch('/api/tasks/progress', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [task]: !progress[task] }) })
    if (res.ok) setProgress(await res.json())
  }
  const claimReward = async () => {
    const res = await fetch('/api/tasks/complete', { method: 'POST' }); const d = await res.json()
    if (!res.ok) { toast(d.error || 'Error', 'error'); return }
    toast('¡Recompensa reclamada! Bolso + Álbum + Sticker', 'success'); fetchProgress()
  }

  if (loading || !progress) return <Skeleton className="h-64" />

  const tasks = [
    { key: 'scanDone', label: 'Escanear código QR', icon: QrCode }, { key: 'identifyDone', label: 'Identificar empresa', icon: Store },
    { key: 'visitWebDone', label: 'Visitar sitio web', icon: ExternalLink }, { key: 'shareDone', label: 'Compartir oferta', icon: Share2 },
    { key: 'commentDone', label: 'Dejar comentario', icon: MessageSquare }, { key: 'photoDone', label: 'Foto en tienda', icon: Camera },
  ]
  const completedCount = tasks.filter((t) => progress[t.key]).length
  const progressPercent = (completedCount / tasks.length) * 100

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="size-5 text-primary" /> Checklist de tareas</CardTitle>
        <CardDescription>Completa las 6 tareas para recibir bolso + álbum + sticker</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div><div className="flex justify-between text-sm mb-1"><span>Progreso: {completedCount}/{tasks.length}</span><span className="font-bold text-primary">{progressPercent}%</span></div><Progress value={progressPercent} className="h-2" /></div>
          {tasks.map((t) => {
            const done = progress[t.key]; const Icon = t.icon
            return (
              <button key={t.key} onClick={() => toggleTask(t.key)} className={cn('w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left', done ? 'bg-emerald-50 border-emerald-300' : 'bg-card border-border hover:bg-muted/50')}>
                <div className={cn('size-9 rounded-full flex items-center justify-center shrink-0', done ? 'bg-emerald-500' : 'bg-muted')}>
                  {done ? <CheckCircle2 className="size-5 text-white" /> : <Icon className="size-5 text-muted-foreground" />}
                </div>
                <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{t.label}</p>
              </button>
            )
          })}
          {progress.completed && !progress.rewardClaimed && <Button className="w-full" size="lg" onClick={claimReward}><Gift className="size-5 mr-2" />Reclamar recompensa</Button>}
          {progress.rewardClaimed && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center"><CheckCircle2 className="size-8 mx-auto text-emerald-600 mb-2" /><p className="font-medium text-emerald-800">¡Recompensa reclamada!</p></div>}
        </CardContent>
      </Card>
    </div>
  )
}
