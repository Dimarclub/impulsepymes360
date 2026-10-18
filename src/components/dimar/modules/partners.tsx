'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import type { Partner, PartnerContribution } from '@/lib/types'
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  DollarSign,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  Percent,
  Phone,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react'

const fmtUSD = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)

const fmtDate = (s?: string) => {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

// El API incluye city en user; extendemos el tipo localmente.
interface PartnerWithCity extends Partner {
  user: { name: string; email: string; phone?: string | null; city?: string | null }
}

const STARTUP_PITCHES = [
  {
    name: 'EcoPack EC',
    sector: 'Eco-packaging',
    monto: 15000,
    descripcion:
      'Empaques biodegradables a base de cáscara de banano para reemplazar el plástico en retail y comida rápida.',
  },
  {
    name: 'AgroTrack',
    sector: 'AgroTech',
    monto: 28000,
    descripcion:
      'Plataforma IoT para monitoreo de cultivos en tiempo real con sensores de humedad, pH y nutrientes.',
  },
  {
    name: 'MandaYa',
    sector: 'Logística',
    monto: 12000,
    descripcion:
      'App de envíos de última milla que conecta comerciantes informales con mensajeros locales disponibles.',
  },
]

const JOB_OPENINGS = [
  { cargo: 'Coordinador de Logística', area: 'Operaciones', ubicacion: 'Guayaquil', tipo: 'Tiempo completo' },
  { cargo: 'Desarrollador Full Stack', area: 'Tecnología', ubicacion: 'Remoto', tipo: 'Tiempo completo' },
  { cargo: 'Ejecutivo de Ventas B2B', area: 'Comercial', ubicacion: 'Quito', tipo: 'Híbrido' },
]

function SummaryCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'amber'
}) {
  const ring =
    accent === 'emerald'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-xl md:text-2xl font-bold mt-1 truncate">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${ring}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function NewPartnerDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', amount: '300' })
  const toast = useAppStore((s) => s.toast)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email) {
      toast('Nombre y email son obligatorios', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          city: form.city || undefined,
          amount: Number(form.amount) || 300,
        }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Socio registrado con éxito')
      setForm({ name: '', email: '', phone: '', city: '', amount: '300' })
      setOpen(false)
      onCreated()
    } catch {
      toast('No se pudo registrar el socio', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Plus className="size-4" />
        Nuevo socio
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar nuevo socio capitalista</DialogTitle>
          <DialogDescription>El socio recibirá un retorno mensual del 3% sobre su aporte.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="np-name">Nombre completo</Label>
            <Input id="np-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Roberto Aguilar" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-email">Email</Label>
            <Input id="np-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="socio@dimarclub.com" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="np-phone">Teléfono</Label>
              <Input id="np-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="099111222" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-city">Ciudad</Label>
              <Input id="np-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Guayaquil" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-amount">Aporte inicial (USD)</Label>
            <Input id="np-amount" type="number" min={300} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <p className="text-xs text-muted-foreground">Mínimo $300 · Retorno mensual: {fmtUSD((Number(form.amount) || 0) * 0.03)}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Registrar socio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PartnerDetailDialog({
  partner,
  onClose,
  onUpdated,
}: {
  partner: PartnerWithCity | null
  onClose: () => void
  onUpdated: () => void
}) {
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useAppStore((s) => s.toast)

  useEffect(() => {
    if (partner) setAmount('')
  }, [partner])

  if (!partner) return null
  const monthly = (partner.totalContribution || 0) * 0.03
  const contributions: PartnerContribution[] = partner.contributions || []

  const addContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      toast('Ingresa un monto válido', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/partners/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: partner.id, amount: value }),
      })
      if (!r.ok) throw new Error('request failed')
      toast('Aporte registrado con éxito')
      setAmount('')
      onUpdated()
      onClose()
    } catch {
      toast('No se pudo registrar el aporte', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!partner} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{partner.user.name}</span>
            <Badge
              className={
                partner.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : ''
              }
            >
              {partner.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
            </Badge>
          </DialogTitle>
          <DialogDescription>Detalle del socio capitalista y su historial de aportes.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Capital aportado</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmtUSD(partner.totalContribution)}</p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Retorno total pagado</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-500">{fmtUSD(partner.totalReturns)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 shrink-0" /> <span className="truncate">{partner.user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 shrink-0" /> <span>{partner.user.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 shrink-0" /> <span>{partner.user.city || '—'}</span>
          </div>
        </div>

        {/* Tabla de aportes */}
        <div className="rounded-lg border">
          <div className="px-3 py-2 border-b bg-muted/30">
            <p className="text-sm font-semibold">Historial de aportes</p>
          </div>
          <div className="max-h-56 overflow-y-auto scroll-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead className="text-right">Retorno mensual</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">Sin aportes registrados</TableCell>
                  </TableRow>
                ) : (
                  contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-muted-foreground">{fmtDate(c.date)}</TableCell>
                      <TableCell className="text-right font-medium">{fmtUSD(c.amount)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{c.returnRate}%</TableCell>
                      <TableCell className="text-right text-emerald-700 dark:text-emerald-400">{fmtUSD(c.monthlyReturn)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.status === 'ACTIVE'
                              ? 'border-emerald-300 text-emerald-700'
                              : 'border-muted-foreground/30 text-muted-foreground'
                          }
                        >
                          {c.status === 'ACTIVE' ? 'Activo' : 'Retirado'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Form nuevo aporte */}
        <form onSubmit={addContribution} className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Agregar nuevo aporte</p>
            <p className="text-xs text-muted-foreground">Retorno mensual estimado: <span className="font-medium text-emerald-700 dark:text-emerald-400">{fmtUSD((Number(amount) || 0) * 0.03)}</span></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Monto en USD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white sm:w-auto">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Registrar aporte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PartnersModule() {
  const [partners, setPartners] = useState<PartnerWithCity[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PartnerWithCity | null>(null)
  const toast = useAppStore((s) => s.toast)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/partners')
      if (!r.ok) throw new Error('request failed')
      const data = await r.json()
      setPartners(data)
    } catch {
      toast('Error al cargar socios', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const totalCapital = partners.reduce((s, p) => s + (p.totalContribution || 0), 0)
  const totalReturns = partners.reduce((s, p) => s + (p.totalReturns || 0), 0)
  const activeCount = partners.filter((p) => p.status === 'ACTIVE').length
  const avgReturn = partners.length ? totalReturns / partners.length : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Socios Capitalistas</h1>
          <p className="text-muted-foreground text-sm mt-1">Capital desde $300 con retorno mensual del 3%</p>
        </div>
        <NewPartnerDialog onCreated={load} />
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Capital total aportado" value={fmtUSD(totalCapital)} icon={DollarSign} accent="emerald" />
        <SummaryCard title="Retornos totales pagados" value={fmtUSD(totalReturns)} icon={TrendingUp} accent="amber" />
        <SummaryCard title="Socios activos" value={activeCount.toString()} icon={Users} accent="emerald" />
        <SummaryCard title="Retorno promedio mensual" value={fmtUSD(avgReturn)} icon={Percent} accent="amber" />
      </div>

      {/* Tabla de socios */}
      <Card>
        <CardHeader>
          <CardTitle>Socios registrados</CardTitle>
          <CardDescription>Click en una fila para ver el detalle y agregar aportes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No hay socios registrados aún. Crea el primero con el botón <strong>Nuevo socio</strong>.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px] scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Socio</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead className="text-right">Capital aportado</TableHead>
                    <TableHead className="text-right">Retorno mensual</TableHead>
                    <TableHead className="text-right">Retorno total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10"
                      onClick={() => setSelected(p)}
                    >
                      <TableCell className="font-medium">{p.user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{p.user.phone || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{p.user.city || '—'}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-700 dark:text-emerald-400">
                        {fmtUSD(p.totalContribution)}
                      </TableCell>
                      <TableCell className="text-right text-amber-700 dark:text-amber-500">
                        {fmtUSD((p.totalContribution || 0) * 0.03)}
                      </TableCell>
                      <TableCell className="text-right">{fmtUSD(p.totalReturns)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capital semilla + Oportunidades laborales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capital semilla */}
        <Card className="border-amber-300/60 bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-900/10 dark:to-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Handshake className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Capital semilla para emprendimientos</CardTitle>
                <CardDescription>Acceso a capital para socios con ideas de negocio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {STARTUP_PITCHES.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-amber-200/60 bg-white/80 dark:bg-card/60 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{s.name}</div>
                    <Badge variant="outline" className="mt-1 text-amber-700 border-amber-300">
                      {s.sector}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Monto solicitado</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">{fmtUSD(s.monto)}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{s.descripcion}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Oportunidades laborales */}
        <Card className="border-emerald-300/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Briefcase className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle>Oportunidades laborales</CardTitle>
                <CardDescription>Posiciones abiertas en la red Dimarclub</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {JOB_OPENINGS.map((j) => (
              <div
                key={j.cargo}
                className="rounded-lg border p-4 hover:border-emerald-300 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      {j.cargo}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                        {j.area}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        <MapPin className="size-3 mr-1" />
                        {j.ubicacion}
                      </Badge>
                      <Badge variant="secondary">{j.tipo}</Badge>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalle */}
      <PartnerDetailDialog partner={selected} onClose={() => setSelected(null)} onUpdated={load} />
    </div>
  )
}
