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
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Users, Recycle, PiggyBank,
  Loader2, Calculator, Edit, Plus, ArrowUpCircle, ArrowDownCircle,
  ShoppingCart, QrCode, Percent,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const MATERIAL_LABELS: Record<string, string> = {
  ALUMINUM: 'Aluminio', COPPER: 'Cobre', BOTTLE_SMALL: 'Botella pequeña', BOTTLE_LARGE: 'Botella 1L',
}

export function FinanzasModule() {
  const [tab, setTab] = useState('dashboard')
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground text-sm mt-1">Control financiero completo de ImpulsePymes360</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button variant={tab === 'dashboard' ? 'default' : 'outline'} size="sm" onClick={() => setTab('dashboard')}><TrendingUp className="size-4 mr-1" /> Dashboard</Button>
        <Button variant={tab === 'income' ? 'default' : 'outline'} size="sm" onClick={() => setTab('income')}><ArrowUpCircle className="size-4 mr-1" /> Ingresos</Button>
        <Button variant={tab === 'expenses' ? 'default' : 'outline'} size="sm" onClick={() => setTab('expenses')}><ArrowDownCircle className="size-4 mr-1" /> Egresos</Button>
        <Button variant={tab === 'socios' ? 'default' : 'outline'} size="sm" onClick={() => setTab('socios')}><Users className="size-4 mr-1" /> Socios</Button>
        <Button variant={tab === 'materials' ? 'default' : 'outline'} size="sm" onClick={() => setTab('materials')}><Recycle className="size-4 mr-1" /> Materiales</Button>
        <Button variant={tab === 'interest' ? 'default' : 'outline'} size="sm" onClick={() => setTab('interest')}><Percent className="size-4 mr-1" /> Interés</Button>
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'income' && <IncomeTab />}
      {tab === 'expenses' && <ExpensesTab />}
      {tab === 'socios' && <SociosTab />}
      {tab === 'materials' && <MaterialsTab />}
      {tab === 'interest' && <InterestTab />}
    </div>
  )
}

function DashboardTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cooperative/admin/report').then((r) => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Skeleton className="h-96" />
  const s = data.stats

  const totalIncome = s.marketplaceRevenue + s.marketplaceCommission + s.gridCommissionTotal + s.deposits + s.materials
  const totalExpenses = s.withdrawals + s.interest + s.gridCommissionTotal
  const netProfit = totalIncome - totalExpenses

  return (
    <div className="space-y-4">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-emerald-200"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1"><ArrowUpCircle className="size-4" /> Ingresos totales</div>
          <p className="text-2xl font-bold text-emerald-600">{fmtUsd(totalIncome)}</p>
        </CardContent></Card>
        <Card className="border-red-200"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600 text-xs mb-1"><ArrowDownCircle className="size-4" /> Egresos totales</div>
          <p className="text-2xl font-bold text-red-600">{fmtUsd(totalExpenses)}</p>
        </CardContent></Card>
        <Card className="border-primary"><CardContent className="p-4">
          <div className="flex items-center gap-2 text-primary text-xs mb-1"><Wallet className="size-4" /> Utilidad neta</div>
          <p className={cn('text-2xl font-bold', netProfit >= 0 ? 'text-emerald-600' : 'text-red-600')}>{fmtUsd(netProfit)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="size-4" /> Socios activos</div>
          <p className="text-2xl font-bold">{s.totalSocios}</p>
        </CardContent></Card>
      </div>

      {/* Desglose ingresos vs egresos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base text-emerald-600">Ingresos por fuente</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Ventas marketplace" value={fmtUsd(s.marketplaceRevenue)} icon={ShoppingCart} />
            <Row label="Comisión marketplace (8%)" value={fmtUsd(s.marketplaceCommission)} icon={Percent} />
            <Row label="Comisión grid (15%)" value={fmtUsd(s.gridCommissionTotal)} icon={QrCode} />
            <Row label="Aportes efectivo socios" value={fmtUsd(s.deposits)} icon={DollarSign} />
            <Row label="Aportes materiales" value={fmtUsd(s.materials)} icon={Recycle} />
            <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span className="text-emerald-600">{fmtUsd(totalIncome)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base text-red-600">Egresos por concepto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Retiros de socios" value={fmtUsd(s.withdrawals)} icon={ArrowDownCircle} />
            <Row label="Interés compuesto pagado" value={fmtUsd(s.interest)} icon={Percent} />
            <Row label="Comisiones grid pagadas" value={fmtUsd(s.gridCommissionTotal)} icon={QrCode} />
            <Row label="Arriendo bodega" value="$120.00" icon={Wallet} />
            <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span className="text-red-600">{fmtUsd(totalExpenses + 120)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Capital cooperativa + inventario */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PiggyBank className="size-5 text-primary" /> Capital cooperativa</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Capital total gestionado" value={fmtUsd(s.totalCapital)} icon={Wallet} />
            <Row label="Total aportado" value={fmtUsd(s.totalContributed)} icon={ArrowUpCircle} />
            <Row label="Total retirado" value={fmtUsd(s.totalWithdrawn)} icon={ArrowDownCircle} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Recycle className="size-5 text-primary" /> Inventario bodega</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.inventory.map((inv: any) => {
                  const price = data.materialPrices.find((p: any) => p.materialType === inv.materialType)
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{MATERIAL_LABELS[inv.materialType] || inv.materialType}</TableCell>
                      <TableCell className="text-right">{inv.quantity} {inv.unit}</TableCell>
                      <TableCell className="text-right font-bold">{price ? fmtUsd(price.unitPrice * inv.quantity) : '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex justify-between items-center">
      <span className="flex items-center gap-1.5 text-muted-foreground"><Icon className="size-3.5" /> {label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function IncomeTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/cooperative/admin/report').then((r) => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false)) }, [])
  if (loading || !data) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Detalle de ingresos</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.recentTransactions.filter((t: any) => t.amount > 0).slice(0, 30).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{fmtDate(t.createdAt)}</TableCell>
                <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.description || '—'}</TableCell>
                <TableCell className="text-right font-bold text-emerald-600">+{fmtUsd(t.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ExpensesTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/cooperative/admin/report').then((r) => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false)) }, [])
  if (loading || !data) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Detalle de egresos</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.recentTransactions.filter((t: any) => t.amount < 0 || t.type === 'WITHDRAWAL').slice(0, 30).map((t: any) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{fmtDate(t.createdAt)}</TableCell>
                <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.description || '—'}</TableCell>
                <TableCell className="text-right font-bold text-red-600">{fmtUsd(Math.abs(t.amount))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function SociosTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/cooperative/admin/report').then((r) => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false)) }, [])
  if (loading || !data) return <Skeleton className="h-64" />
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Socios de la cooperativa</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Socio</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Aportado</TableHead><TableHead className="text-right">Ganado</TableHead><TableHead className="text-right">Retirado</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.accounts.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.user?.name || '—'}</TableCell>
                <TableCell className="text-right font-bold text-primary">{fmtUsd(a.balance)}</TableCell>
                <TableCell className="text-right text-emerald-600">{fmtUsd(a.totalContributed)}</TableCell>
                <TableCell className="text-right text-amber-600">{fmtUsd(a.totalEarned)}</TableCell>
                <TableCell className="text-right text-red-600">{fmtUsd(a.totalWithdrawn)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function MaterialsTab() {
  const toast = useAppStore((s) => s.toast)
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: '', unitPrice: 0, unit: 'libra' })

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/cooperative/admin/material-prices'); setPrices(await res.json()) }
    catch { setPrices([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchPrices() }, [fetchPrices])

  const savePrice = async () => {
    try {
      const res = await fetch(`/api/cooperative/admin/material-prices/${editTarget.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) { toast('Error', 'error'); return }
      toast('Precio actualizado', 'success'); setEditTarget(null); fetchPrices()
    } catch { toast('Error', 'error') }
  }

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Precios de materiales (editables)</CardTitle>
        <CardDescription>Edita los precios de mercado de los materiales reciclados</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Precio</TableHead><TableHead>Unidad</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
            <TableBody>
              {prices.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right font-bold">{fmtUsd(p.unitPrice)}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { setEditTarget(p); setEditForm({ name: p.name, unitPrice: p.unitPrice, unit: p.unit }) }}><Edit className="size-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Editar precio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>Precio por unidad</Label><Input type="number" step="0.01" value={editForm.unitPrice} onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Unidad</Label><Input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button><Button onClick={savePrice}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InterestTab() {
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/cooperative/admin/report'); setData(await res.json()) }
    catch { setData(null) } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const calculateInterest = async () => {
    if (!confirm('¿Calcular interés compuesto 5% para todos los socios? Esto se hace una vez al mes.')) return
    setCalculating(true)
    try {
      const res = await fetch('/api/cooperative/admin/calculate-interest', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(d.message, 'success'); fetchData()
    } catch { toast('Error', 'error') }
    finally { setCalculating(false) }
  }

  if (loading || !data) return <Skeleton className="h-64" />
  const s = data.stats

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Interés compuesto mensual</p>
              <p className="text-4xl font-bold mt-1">5%</p>
              <p className="text-xs opacity-75 mt-2">Calculado sobre el balance de cada socio</p>
            </div>
            <Percent className="size-16 opacity-30" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="text-xs text-muted-foreground">Capital total</p><p className="font-bold">{fmtUsd(s.totalCapital)}</p></div>
            <div><p className="text-xs text-muted-foreground">Interés a pagar</p><p className="font-bold text-amber-600">{fmtUsd(s.totalCapital * 0.05)}</p></div>
            <div><p className="text-xs text-muted-foreground">Interés pagado histórico</p><p className="font-bold">{fmtUsd(s.interest)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={calculateInterest} disabled={calculating}>
        {calculating ? <Loader2 className="size-5 mr-2 animate-spin" /> : <Calculator className="size-5 mr-2" />}
        Calcular interés mensual (5%)
      </Button>

      <Card>
        <CardHeader><CardTitle className="text-base">Proyección anual de un aporte de $20</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Mes</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Ganancia del mes</TableHead></TableRow></TableHeader>
            <TableBody>
              {Array.from({ length: 12 }, (_, i) => {
                const balance = 20 * Math.pow(1.05, i + 1)
                const gain = balance - 20 * Math.pow(1.05, i)
                return (
                  <TableRow key={i}>
                    <TableCell>Mes {i + 1}</TableCell>
                    <TableCell className="text-right font-bold">{fmtUsd(balance)}</TableCell>
                    <TableCell className="text-right text-emerald-600">+{fmtUsd(gain)}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total año</TableCell>
                <TableCell className="text-right text-primary">{fmtUsd(20 * Math.pow(1.05, 12))}</TableCell>
                <TableCell className="text-right text-emerald-600">+{fmtUsd(20 * Math.pow(1.05, 12) - 20)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
