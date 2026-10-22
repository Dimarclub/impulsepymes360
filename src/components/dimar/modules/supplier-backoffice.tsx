'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Store, Users, Share2, Camera, Gift, QrCode, TrendingUp, Wallet,
  CheckCircle2, Loader2, Plus, Link2, Copy, Store as StoreIcon,
  Package, MessageSquare, Megaphone, Star, ArrowRight, Zap,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

export function SupplierBackofficeModule() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Backoffice del Proveedor</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu tienda, afiliados, marketing y tareas</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 max-w-3xl">
          <TabsTrigger value="overview"><Store className="size-4 md:mr-1.5" /><span className="hidden md:inline">Resumen</span></TabsTrigger>
          <TabsTrigger value="affiliates"><Users className="size-4 md:mr-1.5" /><span className="hidden md:inline">Afiliados</span></TabsTrigger>
          <TabsTrigger value="marketing"><Megaphone className="size-4 md:mr-1.5" /><span className="hidden md:inline">Marketing</span></TabsTrigger>
          <TabsTrigger value="tasks"><CheckCircle2 className="size-4 md:mr-1.5" /><span className="hidden md:inline">Tareas</span></TabsTrigger>
          <TabsTrigger value="tools"><Zap className="size-4 md:mr-1.5" /><span className="hidden md:inline">Herramientas</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="affiliates" className="mt-4"><AffiliatesTab /></TabsContent>
        <TabsContent value="marketing" className="mt-4"><MarketingTab /></TabsContent>
        <TabsContent value="tasks" className="mt-4"><TasksTab /></TabsContent>
        <TabsContent value="tools" className="mt-4"><ToolsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ============ OVERVIEW ============
function OverviewTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/impulse/me').then((r) => r.ok ? r.json() : null).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Package className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data?.subscription?.plan?.maxProducts || '—'}</p><p className="text-xs text-muted-foreground">Productos permitidos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data?.subscription?.plan?.displayName || '—'}</p><p className="text-xs text-muted-foreground">Plan actual</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Wallet className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{fmtUsd(data?.subscription?.amount || 0)}</p><p className="text-xs text-muted-foreground">Suscripción mensual</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><QrCode className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{data?.qrCodes?.length || 0}</p><p className="text-xs text-muted-foreground">Códigos QR</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Accesos rápidos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('suppliers')}><Store className="size-4 mr-2" /> Gestionar productos</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('web-express')}><Package className="size-4 mr-2" /> Editar mi sitio web</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('logistics')}><TrendingUp className="size-4 mr-2" /> Ver pedidos y envíos</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('grid')}><QrCode className="size-4 mr-2" /> Grid publicitario</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('social-studio')}><Megaphone className="size-4 mr-2" /> Content Studio IA</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Mi código de afiliado</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/5 border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Comparte este código para registrar afiliados</p>
              <p className="text-2xl font-bold text-primary font-mono">{currentUser?.affiliateCode || '—'}</p>
              <Button className="mt-3" size="sm" onClick={() => { navigator.clipboard.writeText(currentUser?.affiliateCode || ''); useAppStore.getState().toast('Código copiado', 'success') }}>
                <Copy className="size-4 mr-1" /> Copiar código
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============ AFILIADOS ============
function AffiliatesTab() {
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
      setRegisterOpen(false)
      setRegForm({ name: '', email: '', phone: '', city: '', password: '' })
      fetchTree()
    } catch { toast('Error', 'error') }
  }

  if (loading) return <Skeleton className="h-64" />
  if (!tree) return <Card><CardContent className="py-8 text-center text-muted-foreground">No se pudo cargar la red.</CardContent></Card>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Mi red de afiliados</h2>
          <p className="text-sm text-muted-foreground">Registra nuevos afiliados y gestiona tu red de 3 niveles</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}><Plus className="size-4 mr-1" /> Nuevo afiliado</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{tree.stats?.referrals || 0}</p><p className="text-xs text-muted-foreground">Referidos directos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{fmtUsd(tree.stats?.commissions || 0)}</p><p className="text-xs text-muted-foreground">Comisiones totales</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{tree.stats?.sales || 0}</p><p className="text-xs text-muted-foreground">Ventas</p></CardContent></Card>
      </div>

      {/* Árbol simplificado */}
      <Card>
        <CardHeader><CardTitle className="text-base">Mi red (N1 → N2 → N3)</CardTitle></CardHeader>
        <CardContent>
          {tree.children?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No tienes afiliados registrados todavía. ¡Registra tu primer afiliado!</p>
          ) : (
            <div className="space-y-3">
              {/* N1 */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">NIVEL 1 (Directos) — {tree.children?.length} afiliados</p>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog registrar afiliado */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar nuevo afiliado</DialogTitle>
          <DialogDescription>Este afiliado se registrará bajo tu código: {currentUser?.affiliateCode}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre completo *</Label><Input value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Teléfono</Label><Input value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} /></div>
              <div><Label>Ciudad</Label><Input value={regForm.city} onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} /></div>
            </div>
            <div><Label>Contraseña *</Label><Input type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
            <Button onClick={registerAffiliate}><Plus className="size-4 mr-1" /> Registrar afiliado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============ MARKETING ============
function MarketingTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)
  const [products, setProducts] = useState<any[]>([])
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    fetch('/api/products?limit=10').then((r) => r.json()).then(setProducts).catch(() => setProducts([]))
  }, [])

  const shareProduct = (product: any) => {
    const url = `${window.location.origin}/?module=marketplace&product=${product.id}&ref=${currentUser?.affiliateCode}`
    setShareUrl(url)
    navigator.clipboard.writeText(url)
    toast('¡Enlace copiado! Compártelo en WhatsApp o redes', 'success')
  }

  const shareWhatsApp = (product: any) => {
    const url = `${window.location.origin}/?module=marketplace&product=${product.id}&ref=${currentUser?.affiliateCode}`
    const text = `¡Mira este producto en Dimarclub! ${product.name} - ${fmtUsd(product.price)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="size-5 text-primary" /> Herramientas de marketing</CardTitle>
          <CardDescription>Comparte tus productos y registra afiliados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enlace de referido */}
          <div className="rounded-lg bg-primary/5 border p-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Link2 className="size-4 text-primary" /> Mi enlace de referido</p>
            <div className="flex gap-2">
              <Input readOnly value={`${window.location.origin}/?ref=${currentUser?.affiliateCode}`} className="text-xs" />
              <Button size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser?.affiliateCode}`); toast('Enlace copiado', 'success') }}><Copy className="size-4" /></Button>
            </div>
          </div>

          {/* Compartir productos */}
          <div>
            <p className="text-sm font-medium mb-3">Compartir productos</p>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes productos. Agrega productos desde "Mi Tienda".</p>
            ) : (
              <div className="space-y-2">
                {products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <img src={p.imageUrl || 'https://picsum.photos/seed/p/80/80'} alt={p.name} className="size-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtUsd(p.price)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => shareProduct(p)}><Copy className="size-3.5 mr-1" /> Copiar link</Button>
                    <Button size="sm" variant="outline" onClick={() => shareWhatsApp(p)}><Share2 className="size-3.5 mr-1" /> WhatsApp</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Otras herramientas */}
          <div className="grid md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start" onClick={() => setModule('social-studio')}><Megaphone className="size-4 mr-2" /> Content Studio IA (generar posts)</Button>
            <Button variant="outline" className="justify-start" onClick={() => setModule('social')}><TrendingUp className="size-4 mr-2" /> Social Dashboard</Button>
            <Button variant="outline" className="justify-start" onClick={() => setModule('email')}><MessageSquare className="size-4 mr-2" /> Email Marketing</Button>
            <Button variant="outline" className="justify-start" onClick={() => setModule('grid')}><QrCode className="size-4 mr-2" /> Grid publicitario</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ TAREAS ============
function TasksTab() {
  const toast = useAppStore((s) => s.toast)
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks/progress')
      if (!res.ok) { setProgress(null); return }
      setProgress(await res.json())
    } catch { setProgress(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProgress() }, [fetchProgress])

  const toggleTask = async (task: string) => {
    const res = await fetch('/api/tasks/progress', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [task]: !progress[task] }),
    })
    if (res.ok) setProgress(await res.json())
  }

  const claimReward = async () => {
    const res = await fetch('/api/tasks/complete', { method: 'POST' })
    const d = await res.json()
    if (!res.ok) { toast(d.error || 'Error', 'error'); return }
    toast('¡Recompensa reclamada!', 'success')
    fetchProgress()
  }

  if (loading || !progress) return <Skeleton className="h-64" />

  const tasks = [
    { key: 'scanDone', label: 'Escanear código QR', icon: QrCode, desc: 'Escanea el QR del bolso o grid' },
    { key: 'identifyDone', label: 'Identificar empresa', icon: Store, desc: 'Identifica qué empresa es el QR' },
    { key: 'visitWebDone', label: 'Visitar sitio web', icon: ArrowRight, desc: 'Navega el sitio autogenerado' },
    { key: 'shareDone', label: 'Compartir oferta', icon: Share2, desc: 'Comparte en WhatsApp/redes' },
    { key: 'commentDone', label: 'Dejar comentario', icon: MessageSquare, desc: 'Comenta en el sitio' },
    { key: 'photoDone', label: 'Foto en tienda', icon: Camera, desc: 'Visita la tienda y toma foto' },
  ]
  const completedCount = tasks.filter((t) => progress[t.key]).length
  const progressPercent = (completedCount / tasks.length) * 100

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" /> Tareas del bolso</CardTitle>
          <CardDescription>Completa las 6 tareas para recibir bolso + álbum + sticker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progreso: {completedCount}/{tasks.length}</span>
              <span className="font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          {tasks.map((t) => {
            const done = progress[t.key]; const Icon = t.icon
            return (
              <button key={t.key} onClick={() => toggleTask(t.key)}
                className={cn('w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  done ? 'bg-emerald-50 border-emerald-300' : 'bg-card border-border hover:bg-muted/50')}>
                <div className={cn('size-9 rounded-full flex items-center justify-center shrink-0', done ? 'bg-emerald-500' : 'bg-muted')}>
                  {done ? <CheckCircle2 className="size-5 text-white" /> : <Icon className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </button>
            )
          })}
          {progress.completed && !progress.rewardClaimed && (
            <Button className="w-full" size="lg" onClick={claimReward}><Gift className="size-5 mr-2" />Reclamar recompensa</Button>
          )}
          {progress.rewardClaimed && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <CheckCircle2 className="size-8 mx-auto text-emerald-600 mb-2" />
              <p className="font-medium text-emerald-800">¡Recompensa reclamada!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ HERRAMIENTAS ============
function ToolsTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="size-5 text-primary" /> Enlaces y códigos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Código de afiliado</Label>
              <div className="flex gap-2">
                <Input readOnly value={currentUser?.affiliateCode || ''} className="font-mono" />
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(currentUser?.affiliateCode || ''); toast('Copiado', 'success') }}><Copy className="size-4" /></Button>
              </div>
            </div>
            <div>
              <Label>Enlace de referido</Label>
              <div className="flex gap-2">
                <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${currentUser?.affiliateCode || ''}`} className="text-xs" />
                <Button size="sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser?.affiliateCode}`); toast('Copiado', 'success') }}><Copy className="size-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="size-5 text-primary" /> Herramientas rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('suppliers')}><Store className="size-4 mr-2" /> Agregar productos</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('web-express')}><Package className="size-4 mr-2" /> Editar sitio web</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('social-studio')}><Megaphone className="size-4 mr-2" /> Crear post con IA</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('grid')}><QrCode className="size-4 mr-2" /> Comprar espacio grid</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setModule('cooperativa')}><Wallet className="size-4 mr-2" /> Mi cuenta cooperativa</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
