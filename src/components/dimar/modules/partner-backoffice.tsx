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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  HandCoins, TrendingUp, Wallet, DollarSign, Plus, Loader2,
  PiggyBank, Gift, CheckCircle2, Share2, Copy, Link2, Award,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

export function PartnerBackofficeModule() {
  const [tab, setTab] = useState('overview')
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Backoffice de Socio</h1>
        <p className="text-muted-foreground text-sm mt-1">Capital, utilidades, cooperativa y beneficios</p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview"><TrendingUp className="size-4 md:mr-1.5" /><span className="hidden md:inline">Resumen</span></TabsTrigger>
          <TabsTrigger value="capital"><HandCoins className="size-4 md:mr-1.5" /><span className="hidden md:inline">Capital</span></TabsTrigger>
          <TabsTrigger value="cooperativa"><PiggyBank className="size-4 md:mr-1.5" /><span className="hidden md:inline">Cooperativa</span></TabsTrigger>
          <TabsTrigger value="benefits"><Gift className="size-4 md:mr-1.5" /><span className="hidden md:inline">Beneficios</span></TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="capital" className="mt-4"><CapitalTab /></TabsContent>
        <TabsContent value="cooperativa" className="mt-4"><CooperativaTab /></TabsContent>
        <TabsContent value="benefits" className="mt-4"><BenefitsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/impulse/me').then((r) => r.ok ? r.json() : null).then(setPartner).catch(() => setPartner(null)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><HandCoins className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{fmtUsd(partner?.totalContribution || 0)}</p><p className="text-xs text-muted-foreground">Capital aportado</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><TrendingUp className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-emerald-600">{fmtUsd(partner?.totalReturns || 0)}</p><p className="text-xs text-muted-foreground">Retornos totales</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-amber-600">{fmtUsd((partner?.totalContribution || 0) * 0.03)}</p><p className="text-xs text-muted-foreground">Retorno mensual (3%)</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Wallet className="size-5 mx-auto text-primary mb-1" /><p className="text-xl font-bold">{partner?.subscription?.plan?.displayName || 'Socio'}</p><p className="text-xs text-muted-foreground">Estado</p></CardContent></Card>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start" onClick={() => setModule('cooperativa')}><PiggyBank className="size-4 mr-2" /> Ver mi cooperativa</Button>
        <Button variant="outline" className="justify-start" onClick={() => setModule('benefits')}><Gift className="size-4 mr-2" /> Ver beneficios</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Mi código de referido</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary/5 border p-4 text-center">
            <p className="text-2xl font-bold text-primary font-mono">{currentUser?.affiliateCode || '—'}</p>
            <Button className="mt-3" size="sm" onClick={() => { navigator.clipboard.writeText(currentUser?.affiliateCode || ''); useAppStore.getState().toast('Copiado', 'success') }}><Copy className="size-4 mr-1" /> Copiar código</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CapitalTab() {
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/impulse/me').then((r) => r.ok ? r.json() : null).then(setPartner).catch(() => setPartner(null)).finally(() => setLoading(false))
  }, [])
  if (loading || !partner) return <Skeleton className="h-64" />
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Mis aportes de capital</CardTitle></CardHeader>
        <CardContent>
          {partner.contributions?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No tienes aportes registrados.</p>
          ) : (
            <div className="space-y-2">
              {partner.contributions?.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center"><HandCoins className="size-4 text-emerald-600" /></div>
                  <div className="flex-1"><p className="text-sm font-medium">{fmtUsd(c.amount)} · {c.returnRate}% mensual</p><p className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString('es-EC')} · Retorno: {fmtUsd(c.monthlyReturn)}/mes</p></div>
                  <Badge className={c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted'}>{c.status === 'ACTIVE' ? 'Activo' : 'Retirado'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CooperativaTab() {
  const toast = useAppStore((s) => s.toast)
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')

  const fetchAccount = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/cooperative'); if (!res.ok) { setAccount(null); return }; setAccount(await res.json()) }
    catch { setAccount(null) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchAccount() }, [fetchAccount])

  const deposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) { toast('Monto inválido', 'error'); return }
    try {
      const res = await fetch('/api/cooperative/deposit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) })
      const d = await res.json(); if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`Aporte de ${fmtUsd(amount)} registrado`, 'success'); setDepositOpen(false); setDepositAmount(''); fetchAccount()
    } catch { toast('Error', 'error') }
  }

  if (loading || !account) return <Skeleton className="h-64" />
  const projectedYear = account.balance * Math.pow(1.05, 12)

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
          <p className="text-sm opacity-90">Balance cooperativa</p>
          <p className="text-4xl font-bold mt-1">{fmtUsd(account.balance)}</p>
          <p className="text-xs opacity-75 mt-2">Proyección 12 meses: {fmtUsd(projectedYear)}</p>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="text-xs text-muted-foreground">Aportado</p><p className="font-bold text-emerald-600">{fmtUsd(account.totalContributed)}</p></div>
            <div><p className="text-xs text-muted-foreground">Ganado</p><p className="font-bold text-amber-600">{fmtUsd(account.totalEarned)}</p></div>
            <div><p className="text-xs text-muted-foreground">Retirado</p><p className="font-bold text-red-600">{fmtUsd(account.totalWithdrawn)}</p></div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full" onClick={() => setDepositOpen(true)}><Plus className="size-4 mr-1" /> Aportar capital</Button>
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Aportar capital</DialogTitle><DialogDescription>Ingresa el monto</DialogDescription></DialogHeader>
          <div><Label>Monto (USD)</Label><Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="100.00" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDepositOpen(false)}>Cancelar</Button><Button onClick={deposit}>Aportar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BenefitsTab() {
  const setModule = useAppStore((s) => s.setModule)
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Beneficios del Socio</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border"><TrendingUp className="size-5 text-emerald-600" /><div><p className="text-sm font-medium">3% de utilidad mensual</p><p className="text-xs text-muted-foreground">Sobre tu capital aportado</p></div></div>
          <div className="flex items-center gap-3 p-3 rounded-lg border"><HandCoins className="size-5 text-amber-600" /><div><p className="text-sm font-medium">Capital semilla</p><p className="text-xs text-muted-foreground">Acceso a capital para emprendimientos</p></div></div>
          <div className="flex items-center gap-3 p-3 rounded-lg border"><Gift className="size-5 text-primary" /><div><p className="text-sm font-medium">Oportunidades laborales</p><p className="text-xs text-muted-foreground">Cargos según experiencia</p></div></div>
          <div className="flex items-center gap-3 p-3 rounded-lg border"><PiggyBank className="size-5 text-purple-600" /><div><p className="text-sm font-medium">Cooperativa de ahorro</p><p className="text-xs text-muted-foreground">5% interés compuesto mensual</p></div></div>
        </CardContent>
      </Card>
      <Button className="w-full" onClick={() => setModule('benefits')}>Ver todos los beneficios</Button>
    </div>
  )
}
