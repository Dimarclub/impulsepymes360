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
  Bot, Wallet, TrendingUp, Package, Users, Award, Star, Plus, Copy,
  QrCode, Loader2, Sparkles, ShoppingBag, Gift, Crown, ArrowUpRight,
  Trash2, Pause, Play, RefreshCw, ExternalLink, MessageCircle, CheckCircle,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return String(iso) }
}

// ---------- Componente principal ----------
export function DimaModule() {
  const [tab, setTab] = useState('overview')
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="size-7 text-primary" />
            Robot Dima
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tu buscador con IA · Inversión al 5% compuesto · Red de afiliados · Dima Stars
          </p>
        </div>
        <Button variant="outline" onClick={() => window.open('/dima', '_blank')}>
          <ExternalLink className="size-4 mr-1.5" /> Abrir Robot Dima
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview"><Bot className="size-4 md:mr-1.5" /><span className="hidden md:inline">Mi Dima</span></TabsTrigger>
          <TabsTrigger value="pop"><Package className="size-4 md:mr-1.5" /><span className="hidden md:inline">Inversión POP</span></TabsTrigger>
          <TabsTrigger value="network"><Users className="size-4 md:mr-1.5" /><span className="hidden md:inline">Mi Red</span></TabsTrigger>
          <TabsTrigger value="stars"><Award className="size-4 md:mr-1.5" /><span className="hidden md:inline">Dima Stars</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><OverviewTab onSwitch={setTab} /></TabsContent>
        <TabsContent value="pop" className="mt-4"><PopTab /></TabsContent>
        <TabsContent value="network" className="mt-4"><NetworkTab /></TabsContent>
        <TabsContent value="stars" className="mt-4"><StarsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ============ OVERVIEW (Mi Dima) ============
function OverviewTab({ onSwitch }: { onSwitch: (t: string) => void }) {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [paying, setPaying] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dima/my-subscription')
      if (!r.ok) { setData(null); return }
      const d = await r.json()
      setData(d)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const subscribe = async () => {
    setProcessing(true)
    try {
      const r = await fetch('/api/dima/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PLUS', billingCycle: annualBilling ? 'ANNUAL' : 'MONTHLY' }),
      })
      const d = await r.json()
      if (!r.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`¡Suscripción Dima Plus activa! Invertiste ${fmtUsd(annualBilling ? 200 : 20)}.`, 'success')
      setSubscribeOpen(false)
      fetchData()
    } catch { toast('Error', 'error') }
    finally { setProcessing(false) }
  }

  const payNow = async () => {
    setPaying(true)
    try {
      const r = await fetch('/api/dima/pay-monthly', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const d = await r.json()
      if (!r.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`Pago procesado. Nuevo balance: ${fmtUsd(d.newBalance)}`, 'success')
      fetchData()
    } catch { toast('Error', 'error') }
    finally { setPaying(false) }
  }

  const compound = async () => {
    try {
      const r = await fetch('/api/dima/compound', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { toast(d.error || 'Error', 'error'); return }
      if (d.updated) {
        toast(`Interés aplicado: +${fmtUsd(d.interestEarned)}`, 'success')
        fetchData()
      } else {
        toast('No hay intereses para aplicar todavía.', 'info')
      }
    } catch { toast('Error', 'error') }
  }

  if (loading) return <Skeleton className="h-64" />

  const sub = data?.subscription
  const stats = data?.stats || {}
  const isPlus = sub?.plan === 'PLUS' && sub?.status === 'ACTIVE'
  const projected12 = (sub?.currentBalance || 0) * Math.pow(1.05, 12)

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm opacity-90">Plan actual</p>
              <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                {isPlus ? <><Crown className="size-7" /> Dima Plus</> : 'Dima Free'}
              </p>
              <p className="text-xs opacity-75 mt-2">
                {isPlus
                  ? `Próximo cobro: ${fmtDate(sub.currentPeriodEnd)} · ${sub.billingCycle === 'ANNUAL' ? 'Anual' : 'Mensual'}`
                  : 'Búsquedas libres disponibles. No puedes armar red.'}
              </p>
            </div>
            <Bot className="size-16 opacity-30" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Balance invertido</p>
              <p className="text-lg font-bold text-primary">{fmtUsd(sub?.currentBalance || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Interés ganado</p>
              <p className="text-lg font-bold text-amber-600">{fmtUsd(stats.interesGanado || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Proyección 12 meses</p>
              <p className="text-lg font-bold text-emerald-600">{fmtUsd(projected12)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Capital total</p>
              <p className="text-lg font-bold">{fmtUsd(stats.capitalTotalInvertido || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Free vs Plus actions */}
      {!isPlus ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Suscríbete a Dima Plus</CardTitle>
            <CardDescription>$20/mes se invierten al 5% compuesto (no es gasto, es inversión).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><TrendingUp className="size-4 text-primary mt-0.5" /> Búsquedas ilimitadas + inversión 5% compuesto</li>
              <li className="flex items-start gap-2"><Users className="size-4 text-primary mt-0.5" /> Arma tu red de afiliados (gana $5 + $2/mes por referido)</li>
              <li className="flex items-start gap-2"><Award className="size-4 text-primary mt-0.5" /> Dima Stars: cashback por cada compra</li>
            </ul>
            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={() => setSubscribeOpen(true)} className="flex-1 min-w-48">
                <Crown className="size-4 mr-1.5" /> Suscribirme $20/mes
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={annualBilling} onChange={(e) => setAnnualBilling(e.target.checked)} />
                Pago anual $200 (ahorra $40)
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acciones de suscripción</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={payNow} disabled={paying}>
              {paying ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Wallet className="size-4 mr-1" />}
              Pagar ahora ({fmtUsd(sub?.billingCycle === 'ANNUAL' ? 200 : 20)})
            </Button>
            <Button variant="outline" onClick={compound}>
              <RefreshCw className="size-4 mr-1" /> Aplicar interés compuesto
            </Button>
            <Button variant="outline" onClick={() => onSwitch('pop')}>
              <Package className="size-4 mr-1" /> Inversión POP
            </Button>
            <Button variant="outline" onClick={() => onSwitch('network')}>
              <Users className="size-4 mr-1" /> Ver mi red
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Supplier-only: phrases section */}
      <SupplierPhrasesCard />
    </div>
  )
}

// ============ SUPPLIER PHRASES (en overview) ============
function SupplierPhrasesCard() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [phraseOpen, setPhraseOpen] = useState(false)
  const [phraseText, setPhraseText] = useState('')
  const [phraseCat, setPhraseCat] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchPhrases = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dima/phrases')
      if (!r.ok) { setData(null); return }
      const d = await r.json()
      setData(d)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPhrases() }, [fetchPhrases])

  if (currentUser?.role !== 'SUPPLIER' && currentUser?.role !== 'ADMIN') return null
  if (loading) return <Skeleton className="h-64" />

  const phrases = data?.phrases || []
  const planLimit = data?.planLimit || 5
  const includedCount = data?.includedCount || 0
  const extraCount = data?.extraCount || 0
  const extraCost = data?.extraCost || 0

  const createPhrase = async () => {
    if (!phraseText.trim()) { toast('Escribe una frase', 'error'); return }
    setCreating(true)
    try {
      const r = await fetch('/api/dima/phrases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: phraseText, category: phraseCat || undefined }),
      })
      const d = await r.json()
      if (!r.ok) { toast(d.error || 'Error', 'error'); return }
      toast(d.included ? 'Frase creada (incluida en el plan)' : `Frase creada. Costo extra: ${fmtUsd(d.monthlyCost)}/mes`, 'success')
      setPhraseOpen(false)
      setPhraseText('')
      setPhraseCat('')
      fetchPhrases()
    } catch { toast('Error', 'error') }
    finally { setCreating(false) }
  }

  const toggleStatus = async (p: any) => {
    const next = p.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    try {
      const r = await fetch(`/api/dima/phrases/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!r.ok) { toast('Error', 'error'); return }
      toast(`Frase ${next === 'ACTIVE' ? 'activada' : 'pausada'}`, 'success')
      fetchPhrases()
    } catch { toast('Error', 'error') }
  }

  const remove = async (p: any) => {
    if (!confirm('¿Eliminar esta frase?')) return
    try {
      const r = await fetch(`/api/dima/phrases/${p.id}`, { method: 'DELETE' })
      if (!r.ok) { toast('Error', 'error'); return }
      toast('Frase eliminada', 'success')
      fetchPhrases()
    } catch { toast('Error', 'error') }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="size-5 text-primary" /> Mis frases de posicionamiento</CardTitle>
            <CardDescription>{phrases.length} / {planLimit} frases · {extraCount} extra = {fmtUsd(extraCost)}/mes</CardDescription>
          </div>
          <Button size="sm" onClick={() => setPhraseOpen(true)}>
            <Plus className="size-4 mr-1" /> Comprar frase
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {phrases.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No tienes frases. Compra tu primera frase para aparecer en búsquedas de Dima.
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto scroll-thin">
            {phrases.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {p.isPremium ? <Crown className="size-4 text-amber-500" /> : <Sparkles className="size-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.phrase}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                    <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">{p.status === 'ACTIVE' ? 'Activa' : 'Pausada'}</Badge>
                    {p.monthlyPrice > 0 ? (
                      <span className="text-amber-600 font-medium">{fmtUsd(p.monthlyPrice)}/mes</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Incluida</span>
                    )}
                    <span>· {p.searchCount} búsquedas</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => toggleStatus(p)} title={p.status === 'ACTIVE' ? 'Pausar' : 'Activar'}>
                    {p.status === 'ACTIVE' ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)} title="Eliminar">
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={phraseOpen} onOpenChange={setPhraseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprar frase de posicionamiento</DialogTitle>
            <DialogDescription>
              Las frases incluidas en tu plan son gratis. Frases extra cuestan $1/mes c/u.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Frase</Label>
              <Input
                value={phraseText}
                onChange={(e) => setPhraseText(e.target.value)}
                placeholder="ej: distribuidores mayoristas de bazar y papelería"
              />
            </div>
            <div>
              <Label>Categoría (opcional)</Label>
              <Input value={phraseCat} onChange={(e) => setPhraseCat(e.target.value)} placeholder="BAZAR, PAPELERIA…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhraseOpen(false)}>Cancelar</Button>
            <Button onClick={createPhrase} disabled={creating}>
              {creating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Plus className="size-4 mr-1" />}
              Crear frase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ============ POP TAB ============
function PopTab() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchaseOpen, setPurchaseOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dima/pop-purchase')
      if (!r.ok) { setData(null); return }
      setData(await r.json())
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <Skeleton className="h-64" />
  const pops = data?.popPurchases || []
  const stats = data?.stats || {}

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Package className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{fmtUsd(stats.totalInvertido || 0)}</p><p className="text-xs text-muted-foreground">Total invertido</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="size-5 mx-auto text-emerald-600 mb-1" /><p className="text-xl font-bold text-emerald-600">{fmtUsd(stats.balanceTotal || 0)}</p><p className="text-xs text-muted-foreground">Balance actual</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Wallet className="size-5 mx-auto text-amber-600 mb-1" /><p className="text-xl font-bold text-amber-600">{fmtUsd(stats.interesGanado || 0)}</p><p className="text-xs text-muted-foreground">Interés ganado</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><QrCode className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{stats.totalScans || 0} / {stats.totalDownloads || 0}</p><p className="text-xs text-muted-foreground">Scans / Descargas</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Package className="size-5 text-primary" /> Mis compras POP</CardTitle>
              <CardDescription>Cada compra se invierte al 5% compuesto mensual</CardDescription>
            </div>
            <Button onClick={() => setPurchaseOpen(true)}>
              <Plus className="size-4 mr-1" /> Comprar material POP
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pops.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="size-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Aún no has comprado material POP.</p>
              <Button onClick={() => setPurchaseOpen(true)} size="sm">
                <Plus className="size-4 mr-1" /> Hacer primera compra
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pops.map((p: any) => (
                <PopPurchaseCard key={p.id} purchase={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="size-5 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium">¿Cómo funciona la inversión POP?</p>
              <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                Cada compra de material POP (bolsos, imanes, calendarios) se suma a tu capital invertido y gana <strong>5% mensual compuesto</strong>.
                Recibes los productos físicos. Los items llevan el QR unificado de Dima — si alguien escanea y descarga la app y se suscribe a Dima Plus,
                tú ganas <strong>$2/mes recurrente</strong> (más $5 de comisión signup).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {purchaseOpen && (
        <PurchaseDialog
          onClose={() => setPurchaseOpen(false)}
          onSuccess={() => {
            fetchData()
            setPurchaseOpen(false)
            toast('¡Compra POP registrada! Tu capital crece al 5% compuesto.', 'success')
          }}
        />
      )}
    </div>
  )
}

function PopPurchaseCard({ purchase }: { purchase: any }) {
  const [showQr, setShowQr] = useState(false)
  const items = (() => {
    try { return JSON.parse(purchase.items) } catch { return [] }
  })()
  const progress = purchase.currentBalance > 0 ? Math.min(100, (purchase.totalEarned / purchase.currentBalance) * 100) : 0

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{fmtUsd(purchase.amount)} · {items.length} items</p>
            <p className="text-xs text-muted-foreground">{fmtDate(purchase.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={purchase.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {purchase.status === 'ACTIVE' ? 'Activa' : 'Retirada'}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setShowQr(!showQr)}>
            <QrCode className="size-4 mr-1" /> {showQr ? 'Ocultar QR' : 'Ver QR'}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
        <div><p className="text-muted-foreground">Invertido</p><p className="font-bold">{fmtUsd(purchase.amount)}</p></div>
        <div><p className="text-muted-foreground">Balance</p><p className="font-bold text-emerald-600">{fmtUsd(purchase.currentBalance)}</p></div>
        <div><p className="text-muted-foreground">Ganado</p><p className="font-bold text-amber-600">{fmtUsd(purchase.totalEarned)}</p></div>
      </div>
      <Progress value={progress} className="h-1.5 mt-3" />
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span>{purchase.scanCount} scans</span>
        <span>·</span>
        <span>{purchase.downloadCount} descargas</span>
        <span>·</span>
        <span className="font-mono text-[10px]">{purchase.qrCode}</span>
      </div>
      {showQr && (
        <div className="mt-3 flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/40">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/dima?qr=${purchase.qrCode}`)}`}
            alt={`QR ${purchase.qrCode}`}
            width={160}
            height={160}
          />
          <p className="text-xs text-muted-foreground">Escanea este QR para descargar la app Dima</p>
          <p className="font-mono text-xs">{purchase.qrCode}</p>
        </div>
      )}
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {items.map((it: any, i: number) => (
            <Badge key={i} variant="outline" className="text-[10px]">
              {it.type} ×{it.quantity} · {fmtUsd(it.unitPrice)}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

const POP_ITEMS = [
  { type: 'BOLSO', label: 'Bolso POP', unitPrice: 2.5 },
  { type: 'IMAN', label: 'Imán', unitPrice: 1.0 },
  { type: 'CALENDARIO', label: 'Calendario', unitPrice: 1.5 },
  { type: 'EMPASTADO', label: 'Empastado', unitPrice: 3.0 },
]

function PurchaseDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const [items, setItems] = useState<Record<string, number>>({})
  const [processing, setProcessing] = useState(false)

  const total = POP_ITEMS.reduce((s, it) => s + (items[it.type] || 0) * it.unitPrice, 0)
  const totalItems = Object.values(items).reduce((s, n) => s + n, 0)

  const submit = async () => {
    if (total <= 0) { toast('Selecciona al menos 1 item', 'error'); return }
    setProcessing(true)
    try {
      const r = await fetch('/api/dima/pop-purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          items: POP_ITEMS.filter((it) => items[it.type] > 0).map((it) => ({
            type: it.type,
            quantity: items[it.type],
            unitPrice: it.unitPrice,
          })),
        }),
      })
      const d = await r.json()
      if (!r.ok) { toast(d.error || 'Error', 'error'); return }
      onSuccess()
    } catch { toast('Error', 'error') }
    finally { setProcessing(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comprar material POP</DialogTitle>
          <DialogDescription>El monto se invierte al 5% compuesto mensual. Recibes los productos físicos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {POP_ITEMS.map((it) => (
            <div key={it.type} className="flex items-center justify-between gap-2 rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{it.label}</p>
                <p className="text-xs text-muted-foreground">{fmtUsd(it.unitPrice)} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setItems({ ...items, [it.type]: Math.max(0, (items[it.type] || 0) - 1) })}>−</Button>
                <Input
                  type="number"
                  value={items[it.type] || 0}
                  onChange={(e) => setItems({ ...items, [it.type]: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 text-center"
                />
                <Button size="sm" variant="outline" onClick={() => setItems({ ...items, [it.type]: (items[it.type] || 0) + 1 })}>+</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-primary/5 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{totalItems} items · total</p>
            <p className="text-2xl font-bold text-primary">{fmtUsd(total)}</p>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            <p>Proyección 12 meses</p>
            <p className="text-sm font-bold text-emerald-600">{fmtUsd(total * Math.pow(1.05, 12))}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={processing || total <= 0}>
            {processing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <ShoppingBag className="size-4 mr-1" />}
            Comprar e invertir {fmtUsd(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ NETWORK TAB ============
function NetworkTab() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dima/referrals')
      if (!r.ok) { setData(null); return }
      setData(await r.json())
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <Skeleton className="h-64" />
  const referrals = data?.referrals || []
  const stats = data?.stats || {}
  const affiliateCode = currentUser?.affiliateCode || '—'
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const affiliateUrl = `${origin}/dima?ref=${affiliateCode}`

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(affiliateUrl).then(() => {
        setCopied(true)
        toast('Link copiado', 'success')
        setTimeout(() => setCopied(false), 1500)
      })
    }
  }

  const shareWhatsapp = () => {
    const text = encodeURIComponent(`¡Descarga la app de Dima y busca lo que necesites con voz! ${affiliateUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Affiliate link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="size-5 text-primary" /> Mi link de afiliado Dima</CardTitle>
          <CardDescription>Comparte este link. Por cada descarga + suscripción Plus ganas $5 + $2/mes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <Input readOnly value={affiliateUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copy}>
              {copied ? <CheckCircle className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={shareWhatsapp}>
              <MessageCircle className="size-4 mr-1" /> Compartir por WhatsApp
            </Button>
            <div className="rounded-lg bg-muted/40 p-2 inline-flex">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(affiliateUrl)}`}
                alt="QR Dima"
                width={120}
                height={120}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Users className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{stats.n1 || 0}</p><p className="text-xs text-muted-foreground">N1 (directos)</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="size-5 mx-auto text-amber-600 mb-1" /><p className="text-xl font-bold">{stats.n2 || 0}</p><p className="text-xs text-muted-foreground">N2 (sub)</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Users className="size-5 mx-auto text-muted-foreground mb-1" /><p className="text-xl font-bold">{stats.n3 || 0}</p><p className="text-xs text-muted-foreground">N3 (sub-sub)</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Wallet className="size-5 mx-auto text-emerald-600 mb-1" /><p className="text-xl font-bold text-emerald-600">{fmtUsd(stats.comisionesMensualesEsperadas || 0)}</p><p className="text-xs text-muted-foreground">Comisión mensual</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis referidos Dima</CardTitle>
          <CardDescription>
            Total ganado: {fmtUsd(stats.totalGanado || 0)} · Comisiones mensuales esperadas: {fmtUsd(stats.comisionesMensualesEsperadas || 0)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="size-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Aún no tienes referidos. Comparte tu link para empezar a ganar.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin">
              {referrals.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Badge variant={r.level === 1 ? 'default' : r.level === 2 ? 'secondary' : 'outline'}>N{r.level}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.referredName}</p>
                    <p className="text-xs text-muted-foreground">{r.referredEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{fmtUsd(r.totalEarned)}</p>
                    <p className="text-xs text-muted-foreground">{fmtUsd(r.monthlyCommission)}/mes</p>
                  </div>
                  <Badge variant={r.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                    {r.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============ STARS TAB ============
function StarsTab() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/dima/stars')
      if (!r.ok) { setData(null); return }
      setData(await r.json())
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const redeem = async () => {
    setRedeeming(true)
    try {
      const r = await fetch('/api/dima/stars', { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { toast(d.error || 'Error', 'error'); return }
      toast(d.message || `Canjeaste ${d.cashbackRedeemed} estrellas.`, 'success')
      fetchData()
    } catch { toast('Error', 'error') }
    finally { setRedeeming(false) }
  }

  if (loading) return <Skeleton className="h-64" />
  const stars = data?.stars || []
  const total = data?.total || 0
  const cashback = data?.cashbackDisponible || 0
  const topUsers = data?.topUsers || []

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Dima Stars acumuladas</p>
              <p className="text-4xl font-bold mt-1 flex items-center gap-2"><Star className="size-8" fill="currentColor" /> {total}</p>
              <p className="text-xs opacity-75 mt-2">Cashback disponible: {fmtUsd(cashback)} · Cada 10 stars = $1</p>
            </div>
            <Award className="size-16 opacity-30" />
          </div>
        </div>
        <CardContent className="p-4">
          <Button onClick={redeem} disabled={redeeming || cashback <= 0} className="w-full">
            {redeeming ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Gift className="size-4 mr-1" />}
            Canjear cashback {fmtUsd(cashback)}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Crown className="size-5 text-amber-500" /> Top 10 buscadores del mes</CardTitle>
          <CardDescription>El top 1 del mes recibe un bono de $20.</CardDescription>
        </CardHeader>
        <CardContent>
          {topUsers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Aún no hay buscadores destacados este mes.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto scroll-thin">
              {topUsers.map((u: any, i: number) => (
                <div key={u.userId} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={cn(
                    'size-8 rounded-full flex items-center justify-center font-bold text-sm',
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-muted text-foreground' : i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-muted/50 text-muted-foreground'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    {u.city && <p className="text-xs text-muted-foreground">{u.city}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold flex items-center gap-1"><Star className="size-3 fill-amber-500 text-amber-500" /> {u.stars}</p>
                  </div>
                  {i === 0 && (
                    <Badge className="bg-amber-500 text-white text-[10px]"><ArrowUpRight className="size-3 mr-0.5" /> Bono $20</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi historial de estrellas</CardTitle>
        </CardHeader>
        <CardContent>
          {stars.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Aún no has ganado estrellas. Compra vía Dima para acumular.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scroll-thin">
              {stars.slice(0, 20).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-2.5 text-sm">
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                  <span className="flex-1 text-xs">{s.reason === 'PURCHASE' ? 'Compra' : s.reason === 'SEARCH' ? 'Búsqueda' : s.reason === 'REFERRAL' ? 'Referido' : s.reason === 'TOP_MONTH' ? 'Top del mes' : s.reason}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(s.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
