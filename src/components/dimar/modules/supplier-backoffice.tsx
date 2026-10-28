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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Store, Users, Share2, Camera, Gift, QrCode, TrendingUp, Wallet,
  CheckCircle2, Loader2, Plus, Link2, Copy, Store as StoreIcon,
  Package, MessageSquare, Megaphone, Star, ArrowRight, Zap,
  Truck, MapPin, User, Phone, ClipboardList, Send, Tag, Trash2, Image as ImageIcon, Calendar,
  Award, DollarSign, Eye, Pause, Play, Video,
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
        <p className="text-muted-foreground text-sm mt-1">Gestiona tu tienda, marketing, logística y tareas</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 max-w-3xl">
          <TabsTrigger value="overview"><Store className="size-4 md:mr-1.5" /><span className="hidden md:inline">Resumen</span></TabsTrigger>
          <TabsTrigger value="marketing"><Megaphone className="size-4 md:mr-1.5" /><span className="hidden md:inline">Marketing</span></TabsTrigger>
          <TabsTrigger value="logistics"><Truck className="size-4 md:mr-1.5" /><span className="hidden md:inline">Logística</span></TabsTrigger>
          <TabsTrigger value="tasks"><CheckCircle2 className="size-4 md:mr-1.5" /><span className="hidden md:inline">Tareas</span></TabsTrigger>
          <TabsTrigger value="tools"><Zap className="size-4 md:mr-1.5" /><span className="hidden md:inline">Herramientas</span></TabsTrigger>
          <TabsTrigger value="ofertas"><Tag className="size-4 md:mr-1.5" /><span className="hidden md:inline">Ofertas</span></TabsTrigger>
          <TabsTrigger value="cpa"><Award className="size-4 md:mr-1.5" /><span className="hidden md:inline">Tareas CPA</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="marketing" className="mt-4"><MarketingTab /></TabsContent>
        <TabsContent value="logistics" className="mt-4"><LogisticsTab /></TabsContent>
        <TabsContent value="tasks" className="mt-4"><TasksTab /></TabsContent>
        <TabsContent value="tools" className="mt-4"><ToolsTab /></TabsContent>
        <TabsContent value="ofertas" className="mt-4"><OfertasTab /></TabsContent>
        <TabsContent value="cpa" className="mt-4"><CpaTab /></TabsContent>
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

// ============ LOGÍSTICA (solicitar servicio de envío) ============
const LOGISTICS_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Por asignar',
  ASSIGNED: 'Asignado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
}

const LOGISTICS_STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  ASSIGNED: 'bg-sky-100 text-sky-700 border-sky-300',
  PICKED_UP: 'bg-violet-100 text-violet-700 border-violet-300',
  IN_TRANSIT: 'bg-orange-100 text-orange-700 border-orange-300',
  DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  FAILED: 'bg-red-100 text-red-700 border-red-300',
}

const TASK_TYPE_LABEL: Record<string, string> = {
  SOBRE: 'Sobre',
  CARGA: 'Carga',
  EXPRESS: 'Express',
  MICRODISTRIBUCION: 'Microdist.',
}

function LogisticsTab() {
  const toast = useAppStore((s) => s.toast)
  const setModule = useAppStore((s) => s.setModule)
  const [form, setForm] = useState({
    taskType: 'SOBRE' as 'SOBRE' | 'CARGA',
    pickupAddress: '',
    deliveryAddress: '',
    recipientName: '',
    recipientPhone: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const fetchDeliveries = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/deliveries/request')
      const d = await res.json()
      if (res.ok && d?.deliveries) setDeliveries(d.deliveries)
      else setDeliveries([])
    } catch {
      setDeliveries([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { fetchDeliveries() }, [fetchDeliveries])

  const submit = async () => {
    if (!form.pickupAddress.trim() || !form.deliveryAddress.trim()) {
      toast('Completa las direcciones de recogida y entrega', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/deliveries/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: form.taskType,
          pickupAddress: form.pickupAddress.trim(),
          deliveryAddress: form.deliveryAddress.trim(),
          recipientName: form.recipientName.trim() || undefined,
          recipientPhone: form.recipientPhone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al enviar la solicitud', 'error')
        return
      }
      toast('Solicitud enviada. El Delta Master asignará un mensajero pronto.', 'success')
      setForm({
        taskType: 'SOBRE',
        pickupAddress: '',
        deliveryAddress: '',
        recipientName: '',
        recipientPhone: '',
        notes: '',
      })
      fetchDeliveries()
    } catch {
      toast('Error de red al enviar la solicitud', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner informativo: solo el Delta Master asigna mensajeros */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 flex items-start gap-3">
        <ClipboardList className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">¿Cómo funciona el servicio de logística?</p>
          <p className="text-amber-700 dark:text-amber-300 mt-0.5">
            Tú solicitas el envío y el <strong>Delta Master</strong> (administrador) asigna un mensajero.
            Recibirás el nombre del mensajero en cuanto sea asignado.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="size-5 text-primary" /> Solicitar servicio de logística
            </CardTitle>
            <CardDescription>
              ¿Necesitas enviar un sobre o carga? Solicita el servicio y nuestro Delta Master asignará un mensajero.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de envío */}
            <div className="space-y-1.5">
              <Label>Tipo de envío <span className="text-destructive">*</span></Label>
              <Select value={form.taskType} onValueChange={(v) => setForm({ ...form, taskType: v as 'SOBRE' | 'CARGA' })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOBRE">Sobre (documentos, sobres pequeños)</SelectItem>
                  <SelectItem value="CARGA">Carga (paquetes, bultos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dirección de recogida */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" /> Dirección de recogida <span className="text-destructive">*</span></Label>
              <Input
                value={form.pickupAddress}
                onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
                placeholder="Ej. Av. Amazonas N34-451, Quito"
              />
            </div>

            {/* Dirección de entrega */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><MapPin className="size-3.5 text-muted-foreground" /> Dirección de entrega <span className="text-destructive">*</span></Label>
              <Input
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                placeholder="Ej. Calle Bolívar 12-34, Guayaquil"
              />
            </div>

            {/* Destinatario */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><User className="size-3.5 text-muted-foreground" /> Nombre del destinatario</Label>
                <Input
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="size-3.5 text-muted-foreground" /> Teléfono del destinatario</Label>
                <Input
                  value={form.recipientPhone}
                  onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Descripción del contenido, instrucciones especiales..."
                rows={3}
              />
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="size-4 mr-1.5 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="size-4 mr-1.5" /> Enviar solicitud</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tus solicitudes recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" /> Tus solicitudes recientes
            </CardTitle>
            <CardDescription>Solicitudes de logística que has creado</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : deliveries.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Truck className="size-10 mx-auto mb-2 opacity-30" />
                No tienes solicitudes de logística todavía.
                <br />Crea la primera con el formulario de la izquierda.
              </div>
            ) : (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                {deliveries.map((d) => {
                  const st = d.status || 'PENDING'
                  const stLabel = LOGISTICS_STATUS_LABELS[st] || st
                  const stBadge = LOGISTICS_STATUS_BADGES[st] || 'bg-muted text-muted-foreground border-border'
                  const courierName = d.courier?.user?.name
                  return (
                    <div key={d.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="shrink-0">
                            {TASK_TYPE_LABEL[d.taskType] || d.taskType}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono truncate">
                            {d.order?.orderNumber || '—'}
                          </span>
                        </div>
                        <Badge variant="outline" className={cn('shrink-0', stBadge)}>{stLabel}</Badge>
                      </div>
                      <div className="text-sm">
                        <p className="flex items-start gap-1.5">
                          <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="truncate">{d.deliveryAddress || '—'}</span>
                        </p>
                        {courierName && (
                          <p className="flex items-center gap-1.5 mt-1 text-emerald-700 dark:text-emerald-300">
                            <User className="size-3.5 shrink-0" /> Mensajero: <strong>{courierName}</strong>
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {d.createdAt ? new Date(d.createdAt).toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
            <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => setModule('logistics')}>
              <Truck className="size-4 mr-1.5" /> Ver tablero de logística
            </Button>
          </CardContent>
        </Card>
      </div>
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

// ============ OFERTAS (enviar + mis ofertas) ============
const OFFER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
}

const OFFER_STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
}

function toDateInputValue(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  // Ajustar a zona horaria local para inputs type=date
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

function OfertasTab() {
  const toast = useAppStore((s) => s.toast)
  const [form, setForm] = useState({
    title: '',
    description: '',
    originalPrice: '',
    offerPrice: '',
    discountPct: '',
    imageUrl: '',
    startDate: toDateInputValue(new Date()),
    endDate: toDateInputValue(new Date(Date.now() + 7 * 86400000)),
  })
  const [submitting, setSubmitting] = useState(false)
  const [offers, setOffers] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchMine = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/offers/mine')
      const d = await res.json()
      if (res.ok) setOffers(d.offers || [])
      else setOffers([])
    } catch {
      setOffers([])
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { fetchMine() }, [fetchMine])

  // Auto-calcular % descuento cuando cambian los precios
  useEffect(() => {
    const orig = parseFloat(form.originalPrice)
    const off = parseFloat(form.offerPrice)
    if (!isNaN(orig) && !isNaN(off) && orig > 0 && off <= orig) {
      const pct = Math.round(((orig - off) / orig) * 100)
      if (pct !== parseFloat(form.discountPct)) {
        setForm((p) => ({ ...p, discountPct: String(pct) }))
      }
    }
  }, [form.originalPrice, form.offerPrice])

  const submit = async () => {
    if (!form.title.trim()) {
      toast('El título de la oferta es obligatorio', 'error')
      return
    }
    if (!form.startDate || !form.endDate) {
      toast('Las fechas de inicio y fin son obligatorias', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }
      if (form.originalPrice) payload.originalPrice = Number(form.originalPrice)
      if (form.offerPrice) payload.offerPrice = Number(form.offerPrice)
      if (form.discountPct) payload.discountPct = Number(form.discountPct)

      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al enviar la oferta', 'error')
        return
      }
      toast('Oferta enviada. El admin la revisará pronto.', 'success')
      setForm({
        title: '',
        description: '',
        originalPrice: '',
        offerPrice: '',
        discountPct: '',
        imageUrl: '',
        startDate: toDateInputValue(new Date()),
        endDate: toDateInputValue(new Date(Date.now() + 7 * 86400000)),
      })
      fetchMine()
    } catch {
      toast('Error de red al enviar la oferta', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const removeOffer = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al eliminar', 'error')
        return
      }
      toast('Oferta eliminada', 'info')
      fetchMine()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
        <Tag className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">¿Cómo funcionan las ofertas?</p>
          <p className="text-muted-foreground mt-0.5">
            Envías una oferta con tu imagen promocional → el <strong>admin</strong> la revisa
            → al aprobarla, se genera un <strong>código QR</strong> que apunta a tu sitio Web Express
            → la oferta aparece pública en el módulo <strong>Ofertas</strong> con la imagen + QR + "ESCANEA".
            Ese mismo diseño va impreso en los <strong>bolsos PubliBags</strong>.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="size-5 text-primary" /> Enviar nueva oferta
            </CardTitle>
            <CardDescription>
              Completa los datos. El admin la aprobará y se generará el QR automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título de la oferta <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej: Zapatos 2x1 — Black Friday"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalles de la oferta, condiciones, productos incluidos..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Precio original</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio oferta</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.offerPrice}
                  onChange={(e) => setForm({ ...form, offerPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>% Descuento</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPct}
                  onChange={(e) => setForm({ ...form, discountPct: e.target.value })}
                  placeholder="auto"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Si ingresas ambos precios, el % se calcula automáticamente.
            </p>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-muted-foreground" /> URL de imagen promocional
              </Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://...  (URL directa a la imagen que irá en el bolso)"
              />
              {form.imageUrl && (
                <div className="mt-2 rounded-lg border overflow-hidden bg-muted/30">
                  <img
                    src={form.imageUrl}
                    alt="Vista previa"
                    className="w-full h-40 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" /> Fecha inicio
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" /> Fecha fin
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="size-4 mr-1.5 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="size-4 mr-1.5" /> Enviar oferta</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Mis ofertas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="size-5 text-primary" /> Mis ofertas
            </CardTitle>
            <CardDescription>
              Estado de las ofertas que has enviado ({offers.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Tag className="size-10 mx-auto mb-2 opacity-30" />
                No has enviado ofertas todavía.
                <br />Crea la primera con el formulario de la izquierda.
              </div>
            ) : (
              <div className="space-y-3 max-h-[36rem] overflow-y-auto pr-1 scroll-thin">
                {offers.map((o) => {
                  const st = o.status || 'PENDING'
                  const stLabel = OFFER_STATUS_LABELS[st] || st
                  const stBadge = OFFER_STATUS_BADGES[st] || 'bg-muted text-muted-foreground border-border'
                  const qrUrl = o.qrTargetUrl
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}${o.qrTargetUrl}`)}`
                    : null
                  const canDelete = st === 'PENDING' || st === 'REJECTED' || st === 'EXPIRED'
                  return (
                    <div key={o.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{o.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(o.startDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })} → {new Date(o.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn('shrink-0', stBadge)}>{stLabel}</Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {o.originalPrice != null && (
                          <span className="text-muted-foreground line-through">{fmtUsd(o.originalPrice)}</span>
                        )}
                        {o.offerPrice != null && (
                          <span className="font-bold text-emerald-700">{fmtUsd(o.offerPrice)}</span>
                        )}
                        {o.discountPct != null && o.discountPct > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">-{o.discountPct}%</Badge>
                        )}
                      </div>

                      {o.adminNotes && st === 'REJECTED' && (
                        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                          <strong>Nota del admin:</strong> {o.adminNotes}
                        </div>
                      )}

                      {st === 'APPROVED' && qrUrl && (
                        <div className="flex items-center gap-3 rounded-md bg-emerald-50 border border-emerald-200 p-3">
                          <img
                            src={qrUrl}
                            alt="QR de la oferta"
                            className="size-20 rounded bg-white p-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-emerald-700 font-semibold">¡Aprobada y pública!</p>
                            <p className="text-[11px] text-emerald-600 mt-0.5">
                              Código: <span className="font-mono">{o.qrCode}</span>
                            </p>
                            <p className="text-[11px] text-emerald-600 truncate">
                              Apunta a: {o.qrTargetUrl}
                            </p>
                            <p className="text-emerald-700 font-bold text-sm mt-1">ESCANEA →</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        {o.imageUrl ? (
                          <a
                            href={o.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate flex items-center gap-1"
                          >
                            <ImageIcon className="size-3" /> Ver imagen
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin imagen</span>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                            disabled={deletingId === o.id}
                            onClick={() => removeOffer(o.id)}
                          >
                            {deletingId === o.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <><Trash2 className="size-3.5 mr-1" /> Eliminar</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


// ============ TAREAS CPA ============
const CPA_TYPE_LABELS: Record<string, string> = {
  VIDEO: '🎬 Video',
  SHARE: '📤 Compartir',
  VISIT: '🔗 Visitar',
  SUBSCRIBE: '🔔 Suscribirse',
  PHOTO_BOLSO: '📸 Foto bolso',
  PHOTO_STORE: '📸 Foto tienda',
  PHOTO_STICKER: '📸 Foto sticker',
}

const CPA_STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  PAUSED: 'bg-amber-100 text-amber-700 border-amber-300',
  COMPLETED: 'bg-sky-100 text-sky-700 border-sky-300',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
}

function CpaTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'VIDEO',
    videoUrl: '',
    imageUrl: '',
    offerTitle: '',
    offerUrl: '',
    commission: '0.25',
    maxParticipants: '',
    endDate: toDateInputValue(new Date(Date.now() + 7 * 86400000)),
  })
  const [submitting, setSubmitting] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchMine = useCallback(async () => {
    setLoadingList(true)
    try {
      // Filter admin endpoint? We'll fetch all and filter by createdBy === currentUser.id
      const res = await fetch('/api/cpa-tasks')
      const d = await res.json()
      // Public list only returns ACTIVE+available — to show own tasks regardless of status we need
      // a different endpoint. Use admin endpoint as a fallback for SUPPLIER with no admin perms:
      // it returns 403, so we just use the public list filtered by createdBy.
      const all = (d.tasks || []).filter((t: any) => t.createdBy === currentUser?.id)
      setTasks(all)
    } catch {
      setTasks([])
    } finally {
      setLoadingList(false)
    }
  }, [currentUser?.id])

  useEffect(() => { fetchMine() }, [fetchMine])

  const isPhoto = form.type.startsWith('PHOTO_')

  const submit = async () => {
    if (!form.title.trim()) { toast('El título es obligatorio', 'error'); return }
    if (!form.endDate) { toast('La fecha de fin es obligatoria', 'error'); return }
    if (!isPhoto && !form.videoUrl.trim()) {
      toast('La URL del video es obligatoria para tareas de video', 'error'); return
    }
    const commission = Number(form.commission)
    if (isNaN(commission) || commission < 0) { toast('Comisión inválida', 'error'); return }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        videoUrl: form.videoUrl.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        offerTitle: form.offerTitle.trim() || undefined,
        offerUrl: form.offerUrl.trim() || undefined,
        commission,
        endDate: new Date(form.endDate).toISOString(),
      }
      if (form.maxParticipants) payload.maxParticipants = Number(form.maxParticipants)

      const res = await fetch('/api/cpa-tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error al crear', 'error'); return }
      toast(`Tarea CPA "${form.title}" creada y publicada a todos los usuarios`, 'success')
      setForm({
        title: '', description: '', type: 'VIDEO', videoUrl: '', imageUrl: '',
        offerTitle: '', offerUrl: '', commission: '0.25', maxParticipants: '',
        endDate: toDateInputValue(new Date(Date.now() + 7 * 86400000)),
      })
      fetchMine()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const removeTask = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/cpa-tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Error al eliminar', 'error'); return }
      toast('Tarea eliminada', 'success')
      fetchMine()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const togglePause = async (task: any) => {
    setTogglingId(task.id)
    const next = task.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED'
    try {
      const res = await fetch(`/api/cpa-tasks/${task.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast(d.error || 'No tienes permiso para editar (solo el admin)', 'error'); return
      }
      toast(next === 'PAUSED' ? 'Tarea pausada' : 'Tarea reactivada', 'success')
      fetchMine()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="size-5 text-primary" /> Publicar tarea CPA
          </CardTitle>
          <CardDescription>
            Crea una tarea con video o foto + oferta. Todos los usuarios la verán y ganarán la comisión al completarla.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Zapatos 2x1 - TecnoExpress" />
          </div>
          <div>
            <Label>Tipo de tarea *</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">🎬 Video (ver completo)</SelectItem>
                <SelectItem value="SHARE">📤 Compartir contenido</SelectItem>
                <SelectItem value="VISIT">🔗 Visitar enlace</SelectItem>
                <SelectItem value="SUBSCRIBE">🔔 Suscribirse</SelectItem>
                <SelectItem value="PHOTO_BOLSO">📸 Foto con bolso PubliBags</SelectItem>
                <SelectItem value="PHOTO_STORE">📸 Foto en la tienda</SelectItem>
                <SelectItem value="PHOTO_STICKER">📸 Foto con sticker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Instrucciones para el usuario…" rows={2} />
          </div>
          {!isPhoto && (
            <div>
              <Label className="flex items-center gap-1.5"><Video className="size-3.5" /> URL del video *</Label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://…mp4 (URL directa, no YouTube)" />
            </div>
          )}
          <div>
            <Label className="flex items-center gap-1.5"><ImageIcon className="size-3.5" /> URL de imagen</Label>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://… (opcional)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Título oferta</Label>
              <Input value={form.offerTitle} onChange={(e) => setForm({ ...form, offerTitle: e.target.value })} placeholder="2x1 en zapatos" /></div>
            <div><Label>URL oferta (comprar)</Label>
              <Input value={form.offerUrl} onChange={(e) => setForm({ ...form, offerUrl: e.target.value })} placeholder="/w/mi-sitio" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Comisión *</Label>
              <Input type="number" step="0.01" min="0" value={form.commission}
                onChange={(e) => setForm({ ...form, commission: e.target.value })} /></div>
            <div><Label>Máx. participantes</Label>
              <Input type="number" min="1" value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                placeholder="Vacío = ∞" /></div>
            <div><Label>Fecha fin *</Label>
              <Input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submit} disabled={submitting}>
            {submitting ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Publicando…</> : <><Send className="size-4 mr-1.5" /> Publicar tarea</>}
          </Button>
        </CardContent>
      </Card>

      {/* List of own tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="size-5 text-primary" /> Mis tareas CPA
          </CardTitle>
          <CardDescription>{tasks.length} tarea(s) publicada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Award className="size-10 mx-auto mb-2 opacity-30" />
              No has publicado tareas CPA todavía.
              <br />Crea la primera con el formulario de la izquierda.
            </div>
          ) : (
            <div className="space-y-2 max-h-[36rem] overflow-y-auto pr-1 scroll-thin">
              {tasks.map((t) => {
                const st = t.status || 'ACTIVE'
                return (
                  <div key={t.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {CPA_TYPE_LABELS[t.type] || t.type} · {fmtUsd(t.commission)} · {t.currentParticipants}/{t.maxParticipants || '∞'} cupos
                        </p>
                      </div>
                      <Badge variant="outline" className={cn('shrink-0', CPA_STATUS_BADGES[st] || '')}>{st}</Badge>
                    </div>
                    {t.offerTitle && <p className="text-xs text-muted-foreground">Oferta: {t.offerTitle}</p>}
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7"
                        onClick={() => togglePause(t)} disabled={togglingId === t.id}>
                        {togglingId === t.id ? <Loader2 className="size-3.5 animate-spin" /> :
                          st === 'PAUSED' ? <><Play className="size-3.5 mr-1" /> Activar</> : <><Pause className="size-3.5 mr-1" /> Pausar</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeTask(t.id)} disabled={deletingId === t.id}>
                        {deletingId === t.id ? <Loader2 className="size-3.5 animate-spin" /> : <><Trash2 className="size-3.5 mr-1" /> Eliminar</>}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
