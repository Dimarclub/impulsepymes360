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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Wallet, TrendingUp, ArrowDownCircle, ArrowUpCircle, Recycle, DollarSign,
  Loader2, PiggyBank, Plus, Minus,
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

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'Aporte efectivo', INTEREST: 'Interés compuesto', COMMISSION_MARKETPLACE: 'Comisión marketplace',
  COMMISSION_GRID: 'Comisión grid', WITHDRAWAL: 'Retiro', MATERIAL: 'Material reciclado',
}
const TX_COLORS: Record<string, string> = {
  DEPOSIT: 'text-emerald-600', INTEREST: 'text-amber-600', COMMISSION_MARKETPLACE: 'text-sky-600',
  COMMISSION_GRID: 'text-purple-600', WITHDRAWAL: 'text-red-600', MATERIAL: 'text-emerald-600',
}

export function CooperativaModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const isAdmin = currentUser?.role === 'ADMIN'
  const [tab, setTab] = useState('account')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cooperativa de Ahorro</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Capital + interés compuesto 5% mensual + aportes con materiales reciclados
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === 'account' ? 'default' : 'outline'} size="sm" onClick={() => setTab('account')}>
          <Wallet className="size-4 mr-1" /> Mi Cuenta
        </Button>
        <Button variant={tab === 'materials' ? 'default' : 'outline'} size="sm" onClick={() => setTab('materials')}>
          <Recycle className="size-4 mr-1" /> Materiales
        </Button>
        {isAdmin && (
          <Button variant={tab === 'admin' ? 'default' : 'outline'} size="sm" onClick={() => setTab('admin')}>
            <PiggyBank className="size-4 mr-1" /> Admin
          </Button>
        )}
      </div>

      {tab === 'account' && <AccountTab toast={toast} />}
      {tab === 'materials' && <MaterialsTab toast={toast} />}
      {tab === 'admin' && isAdmin && <AdminTab />}
    </div>
  )
}

function AccountTab({ toast }: { toast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchAccount = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cooperative')
      if (!res.ok) { setAccount(null); return }
      setAccount(await res.json())
    } catch { setAccount(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAccount() }, [fetchAccount])

  const deposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) { toast('Monto inválido', 'error'); return }
    setProcessing(true)
    try {
      const res = await fetch('/api/cooperative/deposit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`Aporte de ${fmtUsd(amount)} registrado`, 'success')
      setDepositOpen(false); setDepositAmount(''); fetchAccount()
    } catch { toast('Error', 'error') }
    finally { setProcessing(false) }
  }

  const withdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) { toast('Monto inválido', 'error'); return }
    setProcessing(true)
    try {
      const res = await fetch('/api/cooperative/withdraw', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`Retiro de ${fmtUsd(amount)} procesado`, 'success')
      setWithdrawOpen(false); setWithdrawAmount(''); fetchAccount()
    } catch { toast('Error', 'error') }
    finally { setProcessing(false) }
  }

  if (loading || !account) return <Skeleton className="h-64" />

  const projectedYear = account.balance * Math.pow(1.05, 12)

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Balance actual (capital + interés)</p>
              <p className="text-4xl font-bold mt-1">{fmtUsd(account.balance)}</p>
              <p className="text-xs opacity-75 mt-2">Proyección en 12 meses: {fmtUsd(projectedYear)}</p>
            </div>
            <PiggyBank className="size-16 opacity-30" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="text-xs text-muted-foreground">Total aportado</p><p className="font-bold text-emerald-600">{fmtUsd(account.totalContributed)}</p></div>
            <div><p className="text-xs text-muted-foreground">Total ganado</p><p className="font-bold text-amber-600">{fmtUsd(account.totalEarned)}</p></div>
            <div><p className="text-xs text-muted-foreground">Total retirado</p><p className="font-bold text-red-600">{fmtUsd(account.totalWithdrawn)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => setDepositOpen(true)}>
          <Plus className="size-4 mr-1" /> Aportar capital
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setWithdrawOpen(true)}>
          <Minus className="size-4 mr-1" /> Retirar
        </Button>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Historial de transacciones</CardTitle></CardHeader>
        <CardContent>
          {account.transactions?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No hay transacciones aún.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto scroll-thin">
              {account.transactions?.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0',
                    t.amount >= 0 ? 'bg-emerald-100' : 'bg-red-100')}>
                    {t.amount >= 0 ? <ArrowDownCircle className="size-4 text-emerald-600" /> : <ArrowUpCircle className="size-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{TX_LABELS[t.type] || t.type}</p>
                    <p className="text-xs text-muted-foreground">{t.description || '—'} · {fmtDate(t.createdAt)}</p>
                  </div>
                  <span className={cn('font-bold text-sm', TX_COLORS[t.type] || 'text-foreground')}>
                    {t.amount >= 0 ? '+' : ''}{fmtUsd(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Aportar capital</DialogTitle><DialogDescription>Ingresa el monto a aportar</DialogDescription></DialogHeader>
          <div><Label>Monto (USD)</Label><Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="20.00" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setDepositOpen(false)}>Cancelar</Button><Button onClick={deposit} disabled={processing}>{processing ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}Aportar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Retirar capital</DialogTitle><DialogDescription>Saldo disponible: {fmtUsd(account.balance)}</DialogDescription></DialogHeader>
          <div><Label>Monto a retirar (USD)</Label><Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="10.00" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancelar</Button><Button onClick={withdraw} disabled={processing}>{processing ? <Loader2 className="size-4 mr-1 animate-spin" /> : null}Retirar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MaterialsTab({ toast }: { toast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [materialType, setMaterialType] = useState('BOTTLE_LARGE')
  const [quantity, setQuantity] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetch('/api/cooperative/material').then((r) => r.json()).then(setPrices).catch(() => setPrices([])).finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { toast('Cantidad inválida', 'error'); return }
    setProcessing(true)
    try {
      const res = await fetch('/api/cooperative/material', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialType, quantity: qty }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error', 'error'); return }
      toast(`Aporte registrado: ${fmtUsd(d.materialValue)}`, 'success')
      setQuantity('')
    } catch { toast('Error', 'error') }
    finally { setProcessing(false) }
  }

  if (loading) return <Skeleton className="h-64" />

  const selected = prices.find((p) => p.materialType === materialType)
  const total = selected ? selected.unitPrice * (parseFloat(quantity) || 0) : 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Recycle className="size-5 text-primary" /> Aportar materiales reciclados</CardTitle>
          <CardDescription>Los materiales se convierten en capital al precio de mercado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Precios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {prices.map((p) => (
              <div key={p.id} className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">{p.name}</p>
                <p className="text-lg font-bold text-primary">{fmtUsd(p.unitPrice)}</p>
                <p className="text-[10px] text-muted-foreground">por {p.unit}</p>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Material</Label>
              <select value={materialType} onChange={(e) => setMaterialType(e.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                {prices.map((p) => <option key={p.id} value={p.materialType}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Cantidad ({selected?.unit || 'unidad'})</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="10" />
            </div>
            <div>
              <Label>Valor total</Label>
              <p className="text-2xl font-bold text-primary">{fmtUsd(total)}</p>
            </div>
          </div>
          <Button className="w-full" onClick={submit} disabled={processing}>
            {processing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Recycle className="size-4 mr-1" />}
            Aportar material
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><TrendingUp className="size-5 text-primary" /></div>
            <div className="text-sm">
              <p className="font-medium">¿Cómo funciona?</p>
              <p className="text-muted-foreground text-xs mt-1">
                Los materiales reciclados se convierten en capital al precio de mercado. El aluminio y cobre se venden, el vidrio se guarda para Reciclarte (artesanías). Tu capital genera 5% de interés compuesto mensual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cooperative/admin/report').then((r) => r.json()).then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Skeleton className="h-96" />
  const s = data.stats

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{fmtUsd(s.totalCapital)}</p><p className="text-xs text-muted-foreground">Capital total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{fmtUsd(s.totalContributed)}</p><p className="text-xs text-muted-foreground">Aportado total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{fmtUsd(s.interest)}</p><p className="text-xs text-muted-foreground">Intereses pagados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{s.totalSocios}</p><p className="text-xs text-muted-foreground">Socios</p></CardContent></Card>
      </div>

      {/* Ingresos vs egresos */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base text-emerald-600">Ingresos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Marketplace</span><span className="font-bold">{fmtUsd(s.marketplaceRevenue)}</span></div>
            <div className="flex justify-between"><span>Comisión marketplace</span><span className="font-bold">{fmtUsd(s.marketplaceCommission)}</span></div>
            <div className="flex justify-between"><span>Comisión grid</span><span className="font-bold">{fmtUsd(s.gridCommissionTotal)}</span></div>
            <div className="flex justify-between"><span>Aportes efectivo</span><span className="font-bold">{fmtUsd(s.deposits)}</span></div>
            <div className="flex justify-between"><span>Aportes materiales</span><span className="font-bold">{fmtUsd(s.materials)}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base text-red-600">Egresos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Retiros socios</span><span className="font-bold">{fmtUsd(s.withdrawals)}</span></div>
            <div className="flex justify-between"><span>Intereses pagados</span><span className="font-bold">{fmtUsd(s.interest)}</span></div>
            <div className="flex justify-between"><span>Comisiones grid pagadas</span><span className="font-bold">{fmtUsd(s.gridCommissionTotal)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-bold">Utilidad</span><span className="font-bold text-emerald-600">{fmtUsd(s.marketplaceCommission + s.gridCommissionTotal - s.interest - s.withdrawals)}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Inventario */}
      <Card>
        <CardHeader><CardTitle className="text-base">Inventario de bodega</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Precio unit.</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.inventory.map((inv: any) => {
                const price = data.materialPrices.find((p: any) => p.materialType === inv.materialType)
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{MATERIAL_LABELS[inv.materialType] || inv.materialType}</TableCell>
                    <TableCell className="text-right">{inv.quantity} {inv.unit}</TableCell>
                    <TableCell className="text-right">{price ? fmtUsd(price.unitPrice) : '—'}</TableCell>
                    <TableCell className="text-right font-bold">{price ? fmtUsd(price.unitPrice * inv.quantity) : '—'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
