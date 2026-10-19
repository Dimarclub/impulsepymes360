'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Store,
  Users,
  Truck,
  Globe,
  ShoppingBag,
  LayoutTemplate,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  CreditCard,
  Wallet,
  Calculator,
  Info,
  QrCode,
  ExternalLink,
  PartyPopper,
  Eye,
  Palette,
  ChevronDown,
  Lock,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Tag,
  Star,
  Image as ImageIcon,
} from 'lucide-react'
import type { Plan, AdEdition, AdSpaceInfo, Provider } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '@/components/dimar/image-upload'

// ---------- Helpers ----------

const usd = (n: number) => `$${(n || 0).toFixed(2)}`

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

// ---------- Constantes UI ----------

const CATEGORIES = [
  { value: 'Electrónica', label: 'Electrónica' },
  { value: 'Hogar', label: 'Hogar' },
  { value: 'Moda', label: 'Moda' },
  { value: 'Alimentos', label: 'Alimentos' },
  { value: 'Salud', label: 'Salud' },
  { value: 'Automotriz', label: 'Automotriz' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Otros', label: 'Otros' },
]

const CITIES = [
  { value: 'Guayaquil', label: 'Guayaquil' },
  { value: 'Quito', label: 'Quito' },
  { value: 'Cuenca', label: 'Cuenca' },
  { value: 'Manta', label: 'Manta' },
  { value: 'Ambato', label: 'Ambato' },
  { value: 'Loja', label: 'Loja' },
  { value: 'Otros', label: 'Otros' },
]

const TEMPLATES = [
  {
    value: 'classic',
    label: 'Classic',
    desc: 'Layout tradicional con header y secciones',
    accent: 'bg-emerald-500',
  },
  {
    value: 'modern',
    label: 'Modern',
    desc: 'Hero grande, gradientes y cards',
    accent: 'bg-amber-500',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    desc: 'Espaciado amplio, tipografía limpia',
    accent: 'bg-stone-500',
  },
  {
    value: 'vibrant',
    label: 'Vibrant',
    desc: 'Colores saturados, animaciones',
    accent: 'bg-rose-500',
  },
] as const

const STEPS = [
  { id: 1, label: 'Negocio', icon: Building2 },
  { id: 2, label: 'Plan', icon: CreditCard },
  { id: 3, label: 'Afiliados', icon: Users },
  { id: 4, label: 'PubliBags', icon: ShoppingBag },
  { id: 5, label: 'Web Express', icon: LayoutTemplate },
  { id: 6, label: 'Confirmar', icon: CheckCircle2 },
] as const

// ---------- Estado del form ----------

interface FormState {
  // Step 1 — Usuario + Negocio
  name: string
  email: string
  password: string
  confirmPassword: string
  companyName: string
  taxId: string
  category: string
  description: string
  city: string
  address: string
  phone: string
  mobile: string
  logoUrl: string

  // Step 2 — Plan
  planId: string

  // Step 3 — Comisión
  affiliateRate: number

  // Step 4 — PubliBags
  editionId: string | null
  selectedSpaceIds: string[]

  // Step 5 — Web Express
  template: 'classic' | 'modern' | 'minimal' | 'vibrant'
  primaryColor: string
  accentColor: string
  heroTitle: string
  heroSubtitle: string
  aboutText: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  contactAddress: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  taxId: '',
  category: '',
  description: '',
  city: '',
  address: '',
  phone: '',
  mobile: '',
  logoUrl: '',
  planId: '',
  affiliateRate: 5,
  editionId: null,
  selectedSpaceIds: [],
  template: 'modern',
  primaryColor: '#0d9488',
  accentColor: '#d97706',
  heroTitle: '',
  heroSubtitle: '',
  aboutText: '',
  contactEmail: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactAddress: '',
}

interface SuccessResult {
  providerId: string
  websiteSlug: string
  qrCode: string
  websiteUrl: string
  message: string
}

// ---------- Stepper ----------

function Stepper({ current, onJump }: { current: number; onJump: (s: number) => void }) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const done = s.id < current
          const active = s.id === current
          const Icon = s.icon
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => s.id < current && onJump(s.id)}
                disabled={s.id >= current}
                className={`flex items-center gap-2 group ${s.id < current ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div
                  className={`grid place-items-center size-9 rounded-full shrink-0 transition-all ${
                    active
                      ? 'bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-md ring-2 ring-primary/20'
                      : done
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground border'
                  }`}
                >
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className="text-left">
                  <div className={`text-xs font-medium ${active ? 'text-foreground' : done ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                    {s.label}
                  </div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${s.id < current ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
      {/* Mobile */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            Paso {current} de {STEPS.length}
          </span>
          <span className="text-xs text-muted-foreground">{STEPS[current - 1]?.label}</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
            style={{ width: `${(current / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ---------- Step 1: Datos del negocio ----------

function Step1({
  form,
  setForm,
  isAuthed,
  errors,
}: {
  form: FormState
  setForm: (patch: Partial<FormState>) => void
  isAuthed: boolean
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-6">
      {isAuthed && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
          <Info className="size-4 shrink-0 mt-0.5" />
          <div>
            Estás autenticado como proveedor. Tu información de cuenta se conservará y no necesitas
            volver a ingresar la contraseña.
          </div>
        </div>
      )}

      {/* Datos del negocio */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="size-4 text-emerald-600" />
            Datos del negocio
          </CardTitle>
          <CardDescription className="text-xs">
            Información que aparecerá en tu perfil de proveedor y sitio web
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nombre del negocio" required error={errors.companyName}>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ companyName: e.target.value })}
                placeholder="TecnoExpress S.A."
              />
            </Field>
            <Field label="RUC / Tax ID">
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ taxId: e.target.value })}
                placeholder="0992345678001"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoría" required error={errors.category}>
              <Select value={form.category} onValueChange={(v) => setForm({ category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ciudad" required error={errors.city}>
              <Select value={form.city} onValueChange={(v) => setForm({ city: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una ciudad" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Descripción">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ description: e.target.value })}
              placeholder="Cuéntanos sobre tu negocio, qué vendes y qué te diferencia..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">{form.description.length}/500</div>
          </Field>

          <Field label="Logo del negocio">
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => setForm({ logoUrl: url })}
              label="Logo cuadrado (PNG, JPG)"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Dirección">
              <Input
                value={form.address}
                onChange={(e) => setForm({ address: e.target.value })}
                placeholder="Av. Principal 123"
              />
            </Field>
            <Field label="Teléfono fijo">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ phone: e.target.value })}
                placeholder="04 222-2333"
              />
            </Field>
          </div>
          <Field label="Móvil / WhatsApp">
            <Input
              value={form.mobile}
              onChange={(e) => setForm({ mobile: e.target.value })}
              placeholder="099 123 4567"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Datos del usuario admin */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-amber-600" />
            Cuenta de administrador
          </CardTitle>
          <CardDescription className="text-xs">
            Credenciales para acceder al panel de gestión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Nombre del responsable" required error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="Juan Pérez"
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ email: e.target.value })}
              placeholder="admin@minegocio.com"
              disabled={isAuthed}
            />
          </Field>
          {!isAuthed && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Contraseña" required error={errors.password}>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    className="pl-8"
                  />
                </div>
              </Field>
              <Field label="Confirmar contraseña" required error={errors.confirmPassword}>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ confirmPassword: e.target.value })}
                    placeholder="Repite la contraseña"
                    className="pl-8"
                  />
                </div>
              </Field>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- Field wrapper ----------

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// ---------- Step 2: Plan ----------

function Step2({
  plans,
  selectedId,
  onSelect,
  loading,
}: {
  plans: Plan[]
  selectedId: string
  onSelect: (id: string) => void
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Elige tu plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Todos los planes incluyen Impulso360, Dimarclub y PubliBags. Los superiores añaden más
          elementos y límites.
        </p>
      </div>
      <RadioGroup
        value={selectedId}
        onValueChange={onSelect}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start"
      >
        {plans.map((plan) => (
          <label
            key={plan.id}
            className={`relative cursor-pointer rounded-xl border-2 bg-card transition-all ${
              selectedId === plan.id
                ? 'border-primary shadow-md ring-2 ring-primary/20'
                : 'border-border hover:border-primary/40'
            } ${plan.featured ? 'lg:scale-105' : ''}`}
          >
            <RadioGroupItem value={plan.id} className="sr-only" />
            <div className="p-4 space-y-3">
              {plan.featured && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-amber-500 text-white border-0">
                  <Star className="size-3 mr-1" />
                  Más popular
                </Badge>
              )}
              <div className="text-center">
                <div className="font-bold text-foreground">{plan.displayName}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 min-h-[2.5rem]">
                  {plan.description}
                </div>
                <div className="mt-3 flex items-end justify-center gap-1">
                  <span className="text-3xl font-bold text-foreground">{usd(plan.price)}</span>
                  <span className="text-xs text-muted-foreground mb-1">/mes</span>
                </div>
              </div>
              <Separator />
              <ul className="space-y-1.5 text-xs">
                <PlanFeature icon={ShoppingBag}>Hasta {plan.maxProducts} productos</PlanFeature>
                <PlanFeature icon={ImageIcon}>{plan.maxAdSpaces} espacio(s) PubliBags</PlanFeature>
                <PlanFeature icon={Truck}>{plan.maxShipments} envíos/mes</PlanFeature>
                <PlanFeature icon={Users}>Comisión afiliados: hasta {plan.maxAffiliateRate}%</PlanFeature>
                <PlanFeature icon={LayoutTemplate} active={plan.hasWebExpress}>
                  Sitio Web Express
                </PlanFeature>
                <PlanFeature icon={Globe} active={plan.hasDirectorio}>
                  Directorio360
                </PlanFeature>
                <PlanFeature icon={Truck} active={plan.hasLogistica}>
                  Fuerza Delta (logística)
                </PlanFeature>
                <PlanFeature icon={Sparkles} active={plan.hasSocial}>
                  Dimarclub Social
                </PlanFeature>
              </ul>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  )
}

function PlanFeature({
  icon: Icon,
  children,
  active = true,
}: {
  icon: typeof Store
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <li className={`flex items-start gap-1.5 ${active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
      {active ? (
        <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <Icon className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </li>
  )
}

// ---------- Step 3: Comisión afiliados ----------

function Step3({
  rate,
  setRate,
  maxRate,
  planName,
}: {
  rate: number
  setRate: (n: number) => void
  maxRate: number
  planName: string
}) {
  const EXAMPLE_PRICE = 100
  // Sistema de comisiones de Dimarclub (base, independiente del proveedor):
  //   N0 = 3% (comprador) + N1/N2/N3 = 2% cada uno → 9% base por venta.
  // El porcentaje del proveedor aquí es una CONTRIBUCIÓN ADICIONAL que se suma
  // al reparto para incentivar a los afiliados (no reemplaza la base del sistema).
  const providerCut = (EXAMPLE_PRICE * rate) / 100
  const net = EXAMPLE_PRICE - providerCut

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Comisión a la red de afiliados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tu contribución adicional a la red Dimarclub (por encima de la comisión base del sistema)
        </p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.04] to-accent/[0.04]">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-emerald-600" />
            ¿Qué % ofreces a la red de afiliados Dimarclub?
          </CardTitle>
          <CardDescription className="text-xs">
            Plan seleccionado: <span className="font-medium text-foreground">{planName}</span> · máximo
            permitido <span className="font-medium text-foreground">{maxRate}%</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-center">
            <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              {rate}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">de cada venta</div>
          </div>
          <Slider
            value={[rate]}
            min={1}
            max={maxRate}
            step={1}
            onValueChange={(v) => setRate(v[0])}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1%</span>
            <span>{Math.round(maxRate / 2)}%</span>
            <span>{maxRate}% (máx)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-xs text-foreground leading-relaxed">
              Esta comisión <strong>se descuenta de cada venta y se reparte</strong> entre la red de
              afiliados Dimarclub. El presupuesto <strong>sale de las comisiones de ventas, no de tu
              bolsillo</strong>: solo pagas cuando alguien te trae un cliente.
            </p>
          </div>
          <Separator />
          <div className="flex items-start gap-2">
            <Info className="size-4 shrink-0 mt-0.5 text-emerald-600" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Aclaración importante:</strong> el sistema de afiliados Dimarclub reparte
              siempre <strong>N0=3% (comprador) + N1/N2/N3=2% cada uno</strong> = 9% base por venta.
              Tu porcentaje aquí es una <strong>contribución adicional</strong> que incrementa el atractivo
              de tu catálogo para los afiliados. A más %, más afiliados promocionan tus productos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calculadora en vivo */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="size-4 text-amber-600" />
            Calculadora en vivo
          </CardTitle>
          <CardDescription className="text-xs">
            Ejemplo para una venta de {usd(EXAMPLE_PRICE)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Precio del producto</div>
              <div className="text-lg font-bold text-foreground">{usd(EXAMPLE_PRICE)}</div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
              <div className="text-xs text-amber-700 dark:text-amber-300">Tu comisión adicional ({rate}%)</div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-300">−{usd(providerCut)}</div>
            </div>
          </div>
          <Separator />
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Reparto de tu {rate}% entre la red:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <CommissionBox level="N0" who="Comprador" rate={3} amount={(EXAMPLE_PRICE * 3) / 100} />
            <CommissionBox level="N1" who="Afiliado directo" rate={2} amount={(EXAMPLE_PRICE * 2) / 100} />
            <CommissionBox level="N2" who="Nivel 2" rate={2} amount={(EXAMPLE_PRICE * 2) / 100} />
            <CommissionBox level="N3" who="Nivel 3" rate={2} amount={(EXAMPLE_PRICE * 2) / 100} />
          </div>
          <Separator />
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <Wallet className="size-3" />
                Tu ganancia neta
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                (precio − tu comisión adicional)
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{usd(net)}</div>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-start gap-1">
            <Info className="size-3 shrink-0 mt-0.5" />
            <span>
              La comisión base del sistema (9% = N0 3% + N1-N3 2% c/u) se descuenta automáticamente
              del total de la venta y se distribuye a la red. Tu {rate}% adicional sale de tu margen y
              se suma al reparto para incentivar a los afiliados.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CommissionBox({
  level,
  who,
  rate,
  amount,
}: {
  level: string
  who: string
  rate: number
  amount: number
}) {
  return (
    <div className="rounded-lg border p-2 text-center bg-card">
      <div className="text-xs font-bold text-foreground">{level}</div>
      <div className="text-[10px] text-muted-foreground truncate">{who}</div>
      <div className="text-sm font-semibold text-emerald-700 mt-0.5">{rate}%</div>
      <div className="text-[10px] text-muted-foreground">{usd(amount)}</div>
    </div>
  )
}

// ---------- Step 4: PubliBags ----------

function Step4({
  editions,
  loadingEditions,
  selectedEdition,
  editionDetail,
  loadingDetail,
  selectedSpaceIds,
  toggleSpace,
  clearSpaces,
  maxSpaces,
  skip,
}: {
  editions: AdEdition[]
  loadingEditions: boolean
  selectedEdition: AdEdition | null
  editionDetail: AdEdition | null
  loadingDetail: boolean
  selectedSpaceIds: string[]
  toggleSpace: (id: string) => void
  clearSpaces: () => void
  maxSpaces: number
  skip: boolean
}) {
  const spaces = editionDetail?.adSpaces || []
  const totalPrice = useMemo(
    () =>
      spaces
        .filter((s) => selectedSpaceIds.includes(s.id))
        .reduce((sum, s) => sum + (s.price || 0), 0),
    [spaces, selectedSpaceIds],
  )
  const remaining = maxSpaces - selectedSpaceIds.length

  if (loadingEditions) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (editions.filter((e) => e.status === 'OPEN').length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ShoppingBag className="size-12 mx-auto text-muted-foreground opacity-40 mb-3" />
          <h3 className="font-semibold text-foreground">No hay ediciones abiertas</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            En este momento no hay ediciones PubliBags con espacios disponibles. Puedes saltarte
            este paso y reservar más tarde.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Espacios PubliBags</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Reserva espacios en la edición actual. El primer espacio será QR, los adicionales son imagen.
        </p>
      </div>

      {selectedEdition && (
        <Card className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border-rose-200 dark:border-rose-900">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-semibold text-foreground">{selectedEdition.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {selectedEdition.city} · {selectedEdition.bagSize} · {selectedEdition.printQuantity.toLocaleString('es-EC')} bolsas
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Vigencia: {fmtDate(selectedEdition.startDate)} → {fmtDate(selectedEdition.endDate)}
              </div>
            </div>
            <div className="flex items-center gap-3 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{selectedEdition.availableSpaces}</div>
                <div className="text-xs text-muted-foreground">disponibles</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <div className="text-2xl font-bold text-rose-600">{selectedEdition.totalSpaces - selectedEdition.availableSpaces}</div>
                <div className="text-xs text-muted-foreground">vendidos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="size-4 text-rose-600" />
              Selecciona tus espacios
            </CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Seleccionados: {selectedSpaceIds.length}/{maxSpaces}
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Restantes: {Math.max(0, remaining)}
              </Badge>
              {selectedSpaceIds.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSpaces}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingDetail ? (
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 80 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Esta edición no tiene espacios definidos todavía.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                {spaces.map((space) => {
                  const selected = selectedSpaceIds.includes(space.id)
                  const available = space.status === 'AVAILABLE'
                  const blocked = !available && !selected
                  const disabled = blocked || (!selected && remaining <= 0)
                  return (
                    <button
                      key={space.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => available && toggleSpace(space.id)}
                      title={`#${space.position} · ${space.type} · ${usd(space.price)}`}
                      className={`relative aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md ring-2 ring-emerald-300 scale-105 z-10'
                          : available
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 cursor-pointer'
                            : space.status === 'RESERVED'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 cursor-not-allowed'
                              : 'bg-rose-100 dark:bg-rose-950/40 text-rose-400 cursor-not-allowed'
                      }`}
                    >
                      {selected && <Check className="size-3 sm:size-3.5" />}
                      {!selected && <span>{space.position}</span>}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-emerald-50 border border-emerald-200" /> Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-emerald-500" /> Seleccionado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-amber-100" /> Reservado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded bg-rose-100" /> Vendido
                </span>
              </div>
            </>
          )}
        </CardContent>
        {selectedSpaceIds.length > 0 && (
          <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between gap-2 flex-wrap">
            <div className="text-sm">
              <span className="text-muted-foreground">Subtotal PubliBags: </span>
              <span className="font-bold text-foreground text-lg">{usd(totalPrice)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedSpaceIds.length === 1
                ? '1 espacio (QR por defecto)'
                : `1 QR + ${selectedSpaceIds.length - 1} imagen(es)`}
            </div>
          </CardFooter>
        )}
      </Card>

      {skip && (
        <div className="text-xs text-muted-foreground text-center">
          Has decidido saltar este paso. Puedes reservar espacios más tarde desde tu panel.
        </div>
      )}
    </div>
  )
}

// ---------- Step 5: Web Express ----------

function Step5({
  form,
  setForm,
}: {
  form: FormState
  setForm: (patch: Partial<FormState>) => void
}) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Configura tu sitio Web Express</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tu tienda online profesional lista en minutos con tu propio subdominio /w/tu-negocio
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="size-4 text-emerald-600" />
              Diseño y contenido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template */}
            <Field label="Plantilla">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ template: t.value as FormState['template'] })}
                    className={`rounded-lg border-2 p-2 text-center transition-all ${
                      form.template === t.value
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className={`size-8 mx-auto rounded ${t.accent} mb-1`} />
                    <div className="text-xs font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </Field>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color primario">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ primaryColor: e.target.value })}
                    className="size-9 rounded-md border cursor-pointer p-0.5 bg-transparent"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => setForm({ primaryColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </Field>
              <Field label="Color de acento">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor}
                    onChange={(e) => setForm({ accentColor: e.target.value })}
                    className="size-9 rounded-md border cursor-pointer p-0.5 bg-transparent"
                  />
                  <Input
                    value={form.accentColor}
                    onChange={(e) => setForm({ accentColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </Field>
            </div>

            <Separator />

            {/* Hero */}
            <Field label="Título principal (Hero)">
              <Input
                value={form.heroTitle}
                onChange={(e) => setForm({ heroTitle: e.target.value })}
                placeholder={`${form.companyName || 'Tu Negocio'} — ${form.category || 'Bienvenidos'}`}
              />
            </Field>
            <Field label="Subtítulo">
              <Input
                value={form.heroSubtitle}
                onChange={(e) => setForm({ heroSubtitle: e.target.value })}
                placeholder="Tu compromiso con la calidad"
              />
            </Field>
            <Field label="Texto «Sobre nosotros»">
              <Textarea
                value={form.aboutText}
                onChange={(e) => setForm({ aboutText: e.target.value })}
                rows={3}
                placeholder={form.description || 'Historia y misión de tu negocio...'}
              />
            </Field>

            <Separator />

            {/* Contacto */}
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Email de contacto">
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ contactEmail: e.target.value })}
                  placeholder={form.email || 'ventas@minegocio.com'}
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm({ contactPhone: e.target.value })}
                  placeholder={form.phone || '04 222-2333'}
                />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={form.contactWhatsapp}
                  onChange={(e) => setForm({ contactWhatsapp: e.target.value })}
                  placeholder={form.mobile || '099 123 4567'}
                />
              </Field>
              <Field label="Dirección">
                <Input
                  value={form.contactAddress}
                  onChange={(e) => setForm({ contactAddress: e.target.value })}
                  placeholder={form.address || 'Av. Principal 123'}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="size-4 text-amber-600" />
                  Vista previa
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Plantilla {form.template}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <WebsitePreview form={form} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function WebsitePreview({ form }: { form: FormState }) {
  const heroTitle = form.heroTitle || `${form.companyName || 'Tu Negocio'} — ${form.category || 'Bienvenidos'}`
  const heroSubtitle = form.heroSubtitle || form.description || 'Tu compromiso con la calidad'
  const isMinimal = form.template === 'minimal'
  const isVibrant = form.template === 'vibrant'
  const isClassic = form.template === 'classic'

  return (
    <div
      className="rounded-lg overflow-hidden border bg-white text-gray-900"
      style={{
        borderRadius: isMinimal ? '0' : '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header bar */}
      <div
        className="px-3 py-2.5 flex items-center justify-between"
        style={{
          background: isVibrant
            ? `linear-gradient(135deg, ${form.primaryColor}, ${form.accentColor})`
            : form.primaryColor,
          color: '#fff',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {form.logoUrl ? (
             
            <img src={form.logoUrl} alt="" className="size-5 rounded object-cover" />
          ) : (
            <Store className="size-4 shrink-0" />
          )}
          <span className="text-xs font-bold truncate">
            {form.companyName || 'Tu Negocio'}
          </span>
        </div>
        <div className="flex gap-2 text-[10px] opacity-90">
          <span>Inicio</span>
          <span>Productos</span>
          <span>Contacto</span>
        </div>
      </div>

      {/* Hero */}
      <div
        className="px-3 py-5 text-center"
        style={{
          background: isVibrant
            ? `linear-gradient(180deg, ${form.primaryColor}11, transparent)`
            : isMinimal
              ? 'transparent'
              : `${form.primaryColor}08`,
        }}
      >
        <h3
          className={`text-base font-bold ${isClassic ? '' : 'tracking-tight'}`}
          style={{ color: form.primaryColor }}
        >
          {heroTitle}
        </h3>
        <p className="text-[10px] text-gray-600 mt-1 line-clamp-2">{heroSubtitle}</p>
        <div className="mt-2.5 flex justify-center gap-1.5">
          <button
            className="text-[10px] font-medium px-2.5 py-1 rounded text-white"
            style={{ background: form.primaryColor }}
          >
            Ver productos
          </button>
          <button
            className="text-[10px] font-medium px-2.5 py-1 rounded border"
            style={{ borderColor: form.accentColor, color: form.accentColor }}
          >
            Contactar
          </button>
        </div>
      </div>

      {/* Products mock */}
      <div className="px-3 py-3">
        <div className="text-[10px] font-semibold text-gray-700 mb-1.5">Productos destacados</div>
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded border border-gray-200 p-1.5"
              style={{ background: i % 2 ? `${form.accentColor}10` : `${form.primaryColor}10` }}
            >
              <div
                className="aspect-square rounded mb-1"
                style={{
                  background: i % 2
                    ? `linear-gradient(135deg, ${form.accentColor}40, ${form.accentColor}20)`
                    : `linear-gradient(135deg, ${form.primaryColor}40, ${form.primaryColor}20)`,
                }}
              />
              <div className="h-1.5 bg-gray-300 rounded w-3/4 mb-0.5" />
              <div
                className="text-[9px] font-bold"
                style={{ color: form.primaryColor }}
              >
                $XX.XX
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      {form.aboutText && (
        <div className="px-3 py-2 border-t border-gray-100">
          <div className="text-[10px] font-semibold text-gray-700 mb-0.5">Sobre nosotros</div>
          <p className="text-[9px] text-gray-600 line-clamp-3">{form.aboutText}</p>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-3 py-2 flex items-center justify-between text-[9px]"
        style={{ background: `${form.primaryColor}08`, color: '#555' }}
      >
        <div className="flex items-center gap-1">
          <Phone className="size-2.5" />
          <span>{form.contactPhone || '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="size-2.5" />
          <span className="truncate max-w-[100px]">{form.contactAddress || '—'}</span>
        </div>
      </div>
    </div>
  )
}

// ---------- Step 6: Confirmación ----------

function Step6({
  form,
  plans,
  editionDetail,
  selectedSpaceIds,
  submitting,
  onSubmit,
}: {
  form: FormState
  plans: Plan[]
  editionDetail: AdEdition | null
  selectedSpaceIds: string[]
  submitting: boolean
  onSubmit: () => void
}) {
  const plan = plans.find((p) => p.id === form.planId)
  const spaces = (editionDetail?.adSpaces || []).filter((s) => selectedSpaceIds.includes(s.id))
  const spacesTotal = spaces.reduce((sum, s) => sum + (s.price || 0), 0)
  const total = (plan?.price || 0) + spacesTotal

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">Confirma y crea tus perfiles</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revisa todos los datos antes de proceder. Al confirmar se crearán tu proveedor, suscripción,
          Web Express, QR y espacios PubliBags en un solo paso.
        </p>
      </div>

      <SummaryCard title="Datos del negocio" icon={Building2}>
        <Row label="Negocio">{form.companyName}</Row>
        {form.taxId && <Row label="RUC">{form.taxId}</Row>}
        <Row label="Categoría">{form.category || '—'}</Row>
        <Row label="Ciudad">{form.city}</Row>
        {form.description && <Row label="Descripción">{form.description}</Row>}
        {form.phone && <Row label="Teléfono">{form.phone}</Row>}
        {form.mobile && <Row label="Móvil">{form.mobile}</Row>}
        {form.address && <Row label="Dirección">{form.address}</Row>}
      </SummaryCard>

      <SummaryCard title="Cuenta de administrador" icon={User}>
        <Row label="Responsable">{form.name}</Row>
        <Row label="Email">{form.email}</Row>
      </SummaryCard>

      <SummaryCard title="Plan y comisión" icon={CreditCard}>
        {plan ? (
          <>
            <Row label="Plan">
              {plan.displayName} · {usd(plan.price)}/mes
            </Row>
            <Row label="Comisión afiliados">{form.affiliateRate}%</Row>
          </>
        ) : (
          <Row label="Plan">—</Row>
        )}
      </SummaryCard>

      <SummaryCard title={`PubliBags (${spaces.length} espacios)`} icon={ShoppingBag}>
        {spaces.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin espacios reservados (paso saltado)</div>
        ) : (
          <>
            <Row label="Edición">{editionDetail?.name || '—'}</Row>
            <Row label="Espacios">
              {spaces.map((s) => `#${s.position}`).join(', ')}
            </Row>
            <Row label="Subtotal">{usd(spacesTotal)}</Row>
          </>
        )}
      </SummaryCard>

      <SummaryCard title="Web Express" icon={LayoutTemplate}>
        <Row label="Plantilla"><span className="capitalize">{form.template}</span></Row>
        <Row label="Título">{form.heroTitle || `${form.companyName} — ${form.category}`}</Row>
        <Row label="Colores">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full border" style={{ background: form.primaryColor }} />
            <span className="size-3 rounded-full border" style={{ background: form.accentColor }} />
            <span className="font-mono text-xs">{form.primaryColor} · {form.accentColor}</span>
          </span>
        </Row>
      </SummaryCard>

      {/* Total */}
      <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-5">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Resumen del primer mes</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan {plan?.displayName}</span>
              <span className="font-medium">{usd(plan?.price || 0)}</span>
            </div>
            {spaces.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">PubliBags ({spaces.length} espacios)</span>
                <span className="font-medium">{usd(spacesTotal)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between items-end">
              <span className="font-semibold text-foreground">Total a pagar hoy</span>
              <span className="text-2xl font-bold text-foreground">{usd(total)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Facturación mensual recurrente. El próximo cobro será en 30 días.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white"
        disabled={submitting}
        onClick={onSubmit}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Creando perfiles...
          </>
        ) : (
          <>
            <CreditCard className="size-4 mr-2" />
            Pagar {usd(total)} y crear perfiles
          </>
        )}
      </Button>
    </div>
  )
}

function SummaryCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Store
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className="size-4 text-emerald-600" />
                {title}
              </CardTitle>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-1.5">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium text-foreground text-right min-w-0 truncate">{children}</span>
    </div>
  )
}

// ---------- Success screen ----------

function SuccessScreen({
  result,
  onViewPanel,
  onViewWebsite,
}: {
  result: SuccessResult
  onViewPanel: () => void
  onViewWebsite: () => void
}) {
  const fullUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${result.websiteUrl}`
  const qrImg = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(fullUrl)}&size=200x200`
  return (
    <Card className="overflow-hidden border-2 border-emerald-300">
      <CardContent className="p-8 sm:p-12 text-center">
        <div className="mx-auto grid place-items-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg mb-4">
          <PartyPopper className="size-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">¡Onboarding completado!</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          {result.message}
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* QR */}
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-2">Tu código QR</div>
            <div className="size-32 mx-auto rounded-lg bg-white border p-2">
              { }
              <img src={qrImg} alt="QR code" className="size-full object-contain" />
            </div>
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Código: </span>
              <code className="font-mono font-semibold text-foreground">{result.qrCode}</code>
            </div>
          </div>
          {/* Website URL */}
          <div className="rounded-xl border bg-card p-4 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Globe className="size-3" />
              Tu sitio web
            </div>
            <a
              href={result.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-bold text-emerald-700 hover:underline break-all"
            >
              {result.websiteUrl}
            </a>
            <div className="text-xs text-muted-foreground mt-2">
              Slug: <code className="font-mono">{result.websiteSlug}</code>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onViewPanel}
          >
            <Store className="size-4 mr-2" />
            Ver mi panel
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onViewWebsite}
          >
            <LayoutTemplate className="size-4 mr-2" />
            Ver mi sitio web
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Componente principal ----------

export function ImpulseWizardModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [step, setStep] = useState(1)
  const [form, setFormState] = useState<FormState>(DEFAULT_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [editions, setEditions] = useState<AdEdition[]>([])
  const [loadingEditions, setLoadingEditions] = useState(true)
  const [editionDetail, setEditionDetail] = useState<AdEdition | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [existingProvider, setExistingProvider] = useState<Provider | null | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessResult | null>(null)
  const [skipPubliBags, setSkipPubliBags] = useState(false)

  const setForm = useCallback((patch: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...patch }))
  }, [])

  // Cargar planes siempre
  useEffect(() => {
    let mounted = true
    fetch('/api/impulse/plans', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setPlans(data)
          // Pre-seleccionar plan destacado (Crecimiento)
          const featured = data.find((p) => p.featured)
          if (featured) setFormState((prev) => ({ ...prev, planId: featured.id }))
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoadingPlans(false))
    return () => { mounted = false }
  }, [])

  // Cargar editions
  useEffect(() => {
    let mounted = true
    fetch('/api/impulse/editions', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setEditions(data)
          // Pre-seleccionar primera edición abierta
          const open = data.find((e: AdEdition) => e.status === 'OPEN')
          if (open) setFormState((prev) => ({ ...prev, editionId: open.id }))
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoadingEditions(false))
    return () => { mounted = false }
  }, [])

  // Cargar provider existente si hay sesión (para pre-llenar step 1)
  useEffect(() => {
    let mounted = true
    fetch('/api/impulse/me', { cache: 'no-store' })
      .then(async (r) => {
        if (r.status === 401) {
          if (mounted) setExistingProvider(null)
          return null
        }
        if (!r.ok) return null
        return r.json()
      })
      .then((data) => {
        if (!mounted) return
        setExistingProvider(data || null)
        if (data) {
          // Pre-llenar con datos del provider existente
          setFormState((prev) => ({
            ...prev,
            companyName: data.companyName || '',
            taxId: data.taxId || '',
            category: data.category || '',
            description: data.description || '',
            city: data.city || '',
            address: data.address || '',
            phone: data.phone || '',
            mobile: data.mobile || '',
            logoUrl: data.logoUrl || '',
            name: '', // no tenemos acceso al nombre del user en /me
            email: '', // no exponemos email en /me
            affiliateRate: data.affiliateRate || prev.affiliateRate,
            planId: data.subscription?.plan?.id || prev.planId,
          }))
        }
      })
      .catch(() => mounted && setExistingProvider(null))
    return () => { mounted = false }
  }, [])

  // Cargar detalle de edición cuando se entra al paso 4
  useEffect(() => {
    if (step !== 4 || !form.editionId || editionDetail?.id === form.editionId) return
    let mounted = true
    setLoadingDetail(true)
    fetch(`/api/impulse/editions/${form.editionId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data && !data.error) setEditionDetail(data)
      })
      .catch(() => {})
      .finally(() => mounted && setLoadingDetail(false))
    return () => { mounted = false }
  }, [step, form.editionId, editionDetail?.id])

  // Validación por paso
  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    const isAuthed = existingProvider !== null && existingProvider !== undefined
    if (s === 1) {
      if (!form.companyName.trim()) errs.companyName = 'Requerido'
      if (!form.category) errs.category = 'Requerido'
      if (!form.city) errs.city = 'Requerido'
      if (!form.name.trim()) errs.name = 'Requerido'
      if (!form.email.trim()) errs.email = 'Requerido'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email inválido'
      if (!isAuthed) {
        if (!form.password) errs.password = 'Requerido'
        else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
      }
    } else if (s === 2) {
      if (!form.planId) errs.planId = 'Selecciona un plan'
    } else if (s === 3) {
      const plan = plans.find((p) => p.id === form.planId)
      if (plan && form.affiliateRate > plan.maxAffiliateRate) {
        errs.affiliateRate = `Máximo ${plan.maxAffiliateRate}% para tu plan`
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) {
      toast('Revisa los campos marcados en rojo', 'error')
      return
    }
    if (step < 6) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleJump = (s: number) => {
    if (s < step) setStep(s)
  }

  const toggleSpace = (id: string) => {
    setFormState((prev) => {
      const exists = prev.selectedSpaceIds?.includes(id)
      const plan = plans.find((p) => p.id === prev.planId)
      const maxSpaces = plan?.maxAdSpaces || 0
      let next: string[]
      if (exists) {
        next = prev.selectedSpaceIds!.filter((s) => s !== id)
      } else {
        if ((prev.selectedSpaceIds?.length || 0) >= maxSpaces) {
          toast(`Tu plan permite máximo ${maxSpaces} espacios`, 'warning')
          return prev
        }
        next = [...(prev.selectedSpaceIds || []), id]
      }
      return { ...prev, selectedSpaceIds: next }
    })
  }

  const clearSpaces = () => setForm({ selectedSpaceIds: [] })

  const selectedEdition = useMemo(
    () => editions.find((e) => e.id === form.editionId) || null,
    [editions, form.editionId],
  )

  const selectedPlan = plans.find((p) => p.id === form.planId)

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const payload = {
        // user
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        phone: form.phone,
        mobile: form.mobile,
        city: form.city,
        // business
        companyName: form.companyName,
        taxId: form.taxId,
        address: form.address,
        category: form.category,
        description: form.description,
        logoUrl: form.logoUrl,
        // plan
        planId: form.planId,
        affiliateRate: form.affiliateRate,
        // web express
        heroTitle: form.heroTitle,
        heroSubtitle: form.heroSubtitle,
        aboutText: form.aboutText,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        contactWhatsapp: form.contactWhatsapp,
        contactAddress: form.contactAddress,
        template: form.template,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        // publibags
        selectedSpaceIds: form.selectedSpaceIds || [],
      }
      const res = await fetch('/api/impulse/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear perfiles')
      }
      setSuccess(data)
      toast('¡Onboarding completado!')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear perfiles'
      toast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="space-y-4">
        <SuccessScreen
          result={success}
          onViewPanel={() => setModule('impulse')}
          onViewWebsite={() => setModule('web-express')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-amber-600 text-white">
        <CardContent className="p-5 sm:p-6 relative">
          <div className="absolute inset-0 opacity-10" aria-hidden>
            <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white" />
          </div>
          <div className="relative">
            <Badge className="bg-white/20 text-white border-0 backdrop-blur mb-2">
              <Sparkles className="size-3 mr-1" />
              Onboarding · 5 elementos
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ImpulsePymes360</h1>
            <p className="text-white/80 mt-1 text-sm">
              Crea tu presencia omnicanal en 6 simples pasos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <Stepper current={step} onJump={handleJump} />
        </CardContent>
      </Card>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === 1 && (
          <Step1
            form={form}
            setForm={setForm}
            isAuthed={existingProvider !== null && existingProvider !== undefined}
            errors={errors}
          />
        )}
        {step === 2 && (
          <Step2
            plans={plans}
            selectedId={form.planId}
            onSelect={(id) => {
              setForm({ planId: id })
              const plan = plans.find((p) => p.id === id)
              if (plan && form.affiliateRate > plan.maxAffiliateRate) {
                setForm({ affiliateRate: plan.maxAffiliateRate })
              }
            }}
            loading={loadingPlans}
          />
        )}
        {step === 3 && (
          <Step3
            rate={form.affiliateRate}
            setRate={(n) => setForm({ affiliateRate: n })}
            maxRate={selectedPlan?.maxAffiliateRate || 10}
            planName={selectedPlan?.displayName || '—'}
          />
        )}
        {step === 4 && (
          <Step4
            editions={editions}
            loadingEditions={loadingEditions}
            selectedEdition={selectedEdition}
            editionDetail={editionDetail}
            loadingDetail={loadingDetail}
            selectedSpaceIds={form.selectedSpaceIds || []}
            toggleSpace={toggleSpace}
            clearSpaces={clearSpaces}
            maxSpaces={selectedPlan?.maxAdSpaces || 0}
            skip={skipPubliBags}
          />
        )}
        {step === 5 && <Step5 form={form} setForm={setForm} />}
        {step === 6 && (
          <Step6
            form={form}
            plans={plans}
            editionDetail={editionDetail}
            selectedSpaceIds={form.selectedSpaceIds || []}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft className="size-4 mr-2" />
          Atrás
        </Button>
        <div className="flex items-center gap-2">
          {step === 4 && !skipPubliBags && (form.selectedSpaceIds?.length || 0) === 0 && (
            <Button
              variant="ghost"
              onClick={() => setSkipPubliBags(true)}
              disabled={submitting}
            >
              Saltar este paso
            </Button>
          )}
          {step < 6 ? (
            <Button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={submitting}
            >
              Continuar
              <ArrowRight className="size-4 ml-2" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Paso final</span>
          )}
        </div>
      </div>

      {/* Salir del wizard */}
      <div className="text-center">
        <Button
          variant="link"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setModule('impulse')}
        >
          Volver al panel
        </Button>
      </div>
    </div>
  )
}

export default ImpulseWizardModule
