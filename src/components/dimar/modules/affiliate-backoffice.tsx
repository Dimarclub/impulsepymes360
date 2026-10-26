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
  Users, Share2, Copy, Link2, Wallet, TrendingUp, QrCode, Gift,
  CheckCircle2, Plus, Network, DollarSign, Megaphone, ArrowRight,
  ShoppingBag, Award, Zap, Store, PiggyBank,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

export function AffiliateBackofficeModule() {
  const [tab, setTab] = useState('overview')
  const currentUser = useAppStore((s) => s.currentUser)
  const [isSocio, setIsSocio] = useState(false)

  useEffect(() => {
    // Verificar si el usuario es socio (compró 1+ espacio PubliBags)
    fetch('/api/impulse/bag-plan')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d || !currentUser?.id) return
        const mine = [...(d.currentSpaces || []), ...(d.nextSpaces || [])].filter((s: any) => s.buyerId === currentUser.id)
        setIsSocio(mine.length > 0)
      })
      .catch(() => {})
  }, [currentUser?.id])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {isSocio ? 'Backoffice de Socio' : 'Backoffice de Cliente'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isSocio
            ? 'Tu red, comisiones, cooperativa, marketing y tareas'
            : 'Tu red, comisiones, marketing y tareas — compra un espacio PubliBags para volverte socio'}
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={`grid w-full grid-cols-2 md:max-w-3xl ${isSocio ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
          <TabsTrigger value="overview"><TrendingUp className="size-4 md:mr-1.5" /><span className="hidden md:inline">Resumen</span></TabsTrigger>
          <TabsTrigger value="network"><Network className="size-4 md:mr-1.5" /><span className="hidden md:inline">Mi Red</span></TabsTrigger>
          <TabsTrigger value="commissions"><DollarSign className="size-4 md:mr-1.5" /><span className="hidden md:inline">Comisiones</span></TabsTrigger>
          {isSocio && <TabsTrigger value="cooperative"><PiggyBank className="size-4 md:mr-1.5" /><span className="hidden md:inline">Cooperativa</span></TabsTrigger>}
          <TabsTrigger value="marketing"><Megaphone className="size-4 md:mr-1.5" /><span className="hidden md:inline">Marketing</span></TabsTrigger>
          <TabsTrigger value="tasks"><Award className="size-4 md:mr-1.5" /><span className="hidden md:inline">Tareas</span></TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="network" className="mt-4"><NetworkTab /></TabsContent>
        <TabsContent value="commissions" className="mt-4"><CommissionsTab /></TabsContent>
        {isSocio && <TabsContent value="cooperative" className="mt-4"><CooperativeTab /></TabsContent>}
        <TabsContent value="marketing" className="mt-4"><MarketingTab /></TabsContent>
        <TabsContent value="tasks" className="mt-4"><TasksTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)
  const [tree, setTree] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/affiliates/tree?userId=${currentUser?.id}`).then((r) => r.ok ? r.json() : null).then(setTree).catch(() => setTree(null)).finally(() => setLoading(false))
  }, [currentUser?.id])

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Users className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{tree?.stats?.referrals || 0}</p><p className="text-xs text-muted-foreground">Referidos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-emerald-600">{fmtUsd(tree?.stats?.commissions || 0)}</p><p className="text-xs text-muted-foreground">Comisiones</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><ShoppingBag className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{tree?.stats?.sales || 0}</p><p className="text-xs text-muted-foreground">Ventas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Network className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{tree?.children?.length || 0}</p><p className="text-xs text-muted-foreground">Nivel 1</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Mi código de afiliado</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary/5 border p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Comparte este código para registrar afiliados</p>
            <p className="text-2xl font-bold text-primary font-mono">{currentUser?.affiliateCode || '—'}</p>
            <Button className="mt-3" size="sm" onClick={() => { navigator.clipboard.writeText(currentUser?.affiliateCode || ''); useAppStore.getState().toast('Código copiado', 'success') }}>
              <Copy className="size-4 mr-1" /> Copiar
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start" onClick={() => setModule('marketplace')}><ShoppingBag className="size-4 mr-2" /> Ir a la tienda</Button>
        <Button variant="outline" className="justify-start" onClick={() => setModule('publibags')}><QrCode className="size-4 mr-2" /> Comprar espacio PubliBags — $67</Button>
        <Button variant="outline" className="justify-start" onClick={() => setModule('benefits')}><Gift className="size-4 mr-2" /> Ver beneficios</Button>
        <Button variant="outline" className="justify-start" onClick={() => setModule('dimarclub')}><Users className="size-4 mr-2" /> Conocer DimarClub</Button>
      </div>
    </div>
  )
}

function NetworkTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [tree, setTree] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', city: '', password: '' })

  const fetchTree = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/affiliates/tree?userId=${currentUser?.id}`)
      if (!res.ok) { setTree(null); return }
      setTree(await res.json())
    } catch { setTree(null) }
    finally { setLoading(false) }
  }, [currentUser?.id])

  useEffect(() => { fetchTree() }, [fetchTree])

  const registerAffiliate = async () => {
    if (!regForm.name || !regForm.email || !regForm.password) { toast('Completa los campos', 'error'); return }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, role: 'AFFILIATE', sponsorCode: currentUser?.affiliateCode }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`¡Afiliado registrado: ${d.name}!`, 'success')
      setRegisterOpen(false); setRegForm({ name: '', email: '', phone: '', city: '', password: '' }); fetchTree()
    } catch { toast('Error', 'error') }
  }

  if (loading || !tree) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-bold">Mi red de afiliados</h2><p className="text-sm text-muted-foreground">3 niveles · N0 3% + N1/N2/N3 2%</p></div>
        <Button onClick={() => setRegisterOpen(true)}><Plus className="size-4 mr-1" /> Nuevo afiliado</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Nivel 1 — {tree.children?.length || 0} afiliados directos</CardTitle></CardHeader>
        <CardContent>
          {tree.children?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No tienes afiliados. ¡Registra tu primer afiliado!</p>
          ) : (
            <div className="space-y-2">
              {tree.children?.map((child: any) => (
                <div key={child.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{child.name?.slice(0, 2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{child.name}</p>
                    <p className="text-xs text-muted-foreground">{child.email} · {child.city || '—'}</p>
                  </div>
                  <Badge variant="outline">{child.stats?.referrals || 0} referidos</Badge>
                  <Badge variant="outline" className="text-emerald-600">{fmtUsd(child.stats?.commissions || 0)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar nuevo afiliado</DialogTitle>
          <DialogDescription>Se registrará bajo tu código: {currentUser?.affiliateCode}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>Teléfono</Label><Input value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} /></div><div><Label>Ciudad</Label><Input value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} /></div></div>
            <div><Label>Contraseña *</Label><Input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button><Button onClick={registerAffiliate}><Plus className="size-4 mr-1" /> Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CommissionsTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/affiliates/commissions?userId=${currentUser?.id}`).then((r) => r.ok ? r.json() : []).then(setCommissions).catch(() => setCommissions([])).finally(() => setLoading(false))
  }, [currentUser?.id])
  if (loading) return <Skeleton className="h-64" />
  const total = commissions.reduce((s, c) => s + c.amount, 0)
  const pending = commissions.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{fmtUsd(total)}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{fmtUsd(pending)}</p><p className="text-xs text-muted-foreground">Pendiente</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{commissions.length}</p><p className="text-xs text-muted-foreground">Transacciones</p></CardContent></Card>
      </div>
      {commissions.length === 0 ? (
        <Card><CardContent className="py-8 text-center"><DollarSign className="size-10 mx-auto text-muted-foreground mb-3" /><p className="font-medium">No tienes comisiones aún</p><p className="text-sm text-muted-foreground mt-1">Cuando tu red compre o venda, aquí aparecerán</p></CardContent></Card>
      ) : (
        <Card><CardHeader><CardTitle className="text-base">Historial de comisiones</CardTitle></CardHeader>
        <CardContent><div className="space-y-2 max-h-[400px] overflow-y-auto scroll-thin">
          {commissions.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0', c.amount >= 0 ? 'bg-emerald-100' : 'bg-red-100')}>
                <DollarSign className={cn('size-4', c.amount >= 0 ? 'text-emerald-600' : 'text-red-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">N{c.level} · {c.sourceUser?.name || 'Venta directa'}</p>
                <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('es-EC')}</p>
              </div>
              <span className="font-bold text-sm text-emerald-600">+{fmtUsd(c.amount)}</span>
              <Badge className={c.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{c.status === 'PAID' ? 'Pagada' : 'Pendiente'}</Badge>
            </div>
          ))}
        </div></CardContent></Card>
      )}
    </div>
  )
}

function MarketingTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)
  const [products, setProducts] = useState<any[]>([])
  useEffect(() => { fetch('/api/products?limit=10').then((r) => r.json()).then(setProducts).catch(() => setProducts([])) }, [])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Megaphone className="size-5 text-primary" /> Herramientas de marketing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/5 border p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Link2 className="size-4 text-primary" /> Mi enlace de referido</p>
            <div className="flex gap-2">
              <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${currentUser?.affiliateCode || ''}`} className="text-xs" />
              <Button size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser?.affiliateCode}`); toast('Enlace copiado', 'success') }}><Copy className="size-4" /></Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-3">Compartir productos</p>
            <div className="space-y-2">
              {products.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <img src={p.imageUrl || 'https://picsum.photos/seed/p/80/80'} alt={p.name} className="size-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-xs text-muted-foreground">{fmtUsd(p.price)}</p></div>
                  <Button size="sm" variant="outline" onClick={() => { const url = `${window.location.origin}/?module=marketplace&product=${p.id}&ref=${currentUser?.affiliateCode}`; navigator.clipboard.writeText(url); toast('Link copiado', 'success') }}><Copy className="size-3.5 mr-1" /> Copiar</Button>
                  <Button size="sm" variant="outline" onClick={() => { const url = `${window.location.origin}/?module=marketplace&product=${p.id}&ref=${currentUser?.affiliateCode}`; window.open(`https://wa.me/?text=${encodeURIComponent('¡Mira este producto! ' + p.name + ' ' + fmtUsd(p.price) + ' ' + url)}`, '_blank') }}><Share2 className="size-3.5 mr-1" /> WhatsApp</Button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start" onClick={() => setModule('grid')}><QrCode className="size-4 mr-2" /> Comprar espacio grid</Button>
            <Button variant="outline" className="justify-start" onClick={() => setModule('cooperativa')}><Wallet className="size-4 mr-2" /> Mi cooperativa</Button>
          </div>
        </CardContent>
      </Card>
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
  const toggleTask = async (task: string) => { const res = await fetch('/api/tasks/progress', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [task]: !progress[task] }) }); if (res.ok) setProgress(await res.json()) }
  const claimReward = async () => { const res = await fetch('/api/tasks/complete', { method: 'POST' }); const d = await res.json(); if (!res.ok) { toast(d.error || 'Error', 'error'); return }; toast('¡Recompensa reclamada!', 'success'); fetchProgress() }
  if (loading || !progress) return <Skeleton className="h-64" />
  const tasks = [
    { key: 'scanDone', label: 'Escanear QR', icon: QrCode }, { key: 'identifyDone', label: 'Identificar empresa', icon: Store },
    { key: 'visitWebDone', label: 'Visitar sitio', icon: ArrowRight }, { key: 'shareDone', label: 'Compartir', icon: Share2 },
    { key: 'commentDone', label: 'Comentar', icon: Megaphone }, { key: 'photoDone', label: 'Foto en tienda', icon: CheckCircle2 },
  ]
  const completedCount = tasks.filter((t) => progress[t.key]).length
  const progressPercent = (completedCount / tasks.length) * 100
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="size-5 text-primary" /> Tareas del bolso</CardTitle><CardDescription>Completa 6 tareas → bolso + álbum + sticker</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <div><div className="flex justify-between text-sm mb-1"><span>Progreso: {completedCount}/{tasks.length}</span><span className="font-bold text-primary">{progressPercent}%</span></div><Progress value={progressPercent} className="h-2" /></div>
        {tasks.map((t) => { const done = progress[t.key]; const Icon = t.icon; return (
          <button key={t.key} onClick={() => toggleTask(t.key)} className={cn('w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left', done ? 'bg-emerald-50 border-emerald-300' : 'bg-card border-border hover:bg-muted/50')}>
            <div className={cn('size-9 rounded-full flex items-center justify-center shrink-0', done ? 'bg-emerald-500' : 'bg-muted')}>{done ? <CheckCircle2 className="size-5 text-white" /> : <Icon className="size-5 text-muted-foreground" />}</div>
            <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{t.label}</p>
          </button>
        )})}
        {progress.completed && !progress.rewardClaimed && <Button className="w-full" size="lg" onClick={claimReward}><Gift className="size-5 mr-2" />Reclamar recompensa</Button>}
        {progress.rewardClaimed && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center"><CheckCircle2 className="size-8 mx-auto text-emerald-600 mb-2" /><p className="font-medium text-emerald-800">¡Recompensa reclamada!</p></div>}
      </CardContent>
    </Card>
  )
}

// ============ COOPERATIVA ============
function CooperativeTab() {
  const toast = useAppStore((s) => s.toast)
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [depositOpen, setDepositOpen] = useState(false)
  const [amount, setAmount] = useState('')

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch('/api/cooperative')
      if (res.ok) setAccount(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAccount() }, [fetchAccount])

  const deposit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast('Monto inválido', 'error'); return }
    try {
      const res = await fetch('/api/cooperative/deposit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, description: 'Aporte desde backoffice' }),
      })
      if (!res.ok) throw new Error()
      toast(`Aporte de ${fmtUsd(amt)} registrado`, 'success')
      setAmount(''); setDepositOpen(false); fetchAccount()
    } catch { toast('Error al depositar', 'error') }
  }

  if (loading) return <Card><CardContent className="p-8 text-center text-muted-foreground">Cargando cooperativa…</CardContent></Card>

  if (!account) {
    return <Card><CardContent className="p-8 text-center"><PiggyBank className="size-12 mx-auto text-muted-foreground mb-3" /><p className="font-medium">Aún no tienes cuenta cooperativa</p><p className="text-sm text-muted-foreground mt-1">Haz tu primer aporte para activar tu cuenta y empezar a generar 5% interés mensual.</p><Button className="mt-4" onClick={() => setDepositOpen(true)}><Plus className="size-4 mr-1.5" /> Hacer aporte</Button></CardContent></Card>
  }

  const projectedYear = account.balance * Math.pow(1.05, 12)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="size-5 text-emerald-600" /> Mi Cooperativa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <p className="text-xs text-muted-foreground">Saldo disponible</p>
            <p className="text-4xl font-bold mt-1 text-emerald-700">{fmtUsd(account.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Genera <strong>5% interés mensual compuesto</strong></p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center"><p className="text-xs text-muted-foreground">Total aportado</p><p className="font-bold text-emerald-600">{fmtUsd(account.totalContributed)}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Total ganado</p><p className="font-bold text-amber-600">{fmtUsd(account.totalEarned)}</p></div>
            <div className="text-center"><p className="text-xs text-muted-foreground">Proyección anual</p><p className="font-bold text-purple-600">{fmtUsd(projectedYear)}</p></div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setDepositOpen(true)}><Plus className="size-4 mr-1.5" /> Hacer aporte</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Hacer aporte de capital</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Tu aporte genera 5% interés mensual compuesto. Retiro disponible después de 5 años.</p>
            <Input type="number" placeholder="Monto en USD" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancelar</Button>
            <Button onClick={deposit}>Confirmar aporte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
