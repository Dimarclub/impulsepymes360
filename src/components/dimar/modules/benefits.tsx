'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Truck,
  Car,
  Stethoscope,
  Wrench,
  Ambulance,
  TrendingUp,
  Rocket,
  Briefcase,
  PiggyBank,
  ArrowRight,
  ArrowDown,
  Users,
  UserCheck,
  Handshake,
  Sparkles,
  Network,
  Check,
  ShieldCheck,
  Gift,
} from 'lucide-react'

interface BenefitItem {
  icon: string
  title: string
  desc: string
}
interface AffiliateLevel {
  level: string
  rate: string
  desc: string
}
interface BenefitsData {
  client: BenefitItem[]
  partner: BenefitItem[]
  affiliate: AffiliateLevel[]
}

const ICONS: Record<string, typeof Truck> = {
  Truck,
  CarFront: Car,
  Car,
  Stethoscope,
  Wrench,
  Ambulance,
  TrendingUp,
  Rocket,
  Briefcase,
  PiggyBank,
  Sparkles,
  ShieldCheck,
  Gift,
  Network,
  Users,
}

const iconFor = (name: string): typeof Truck =>
  ICONS[name] || Sparkles

export function BenefitsModule() {
  const [data, setData] = useState<BenefitsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/benefits', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: BenefitsData) => {
        if (mounted) setData(d)
      })
      .catch(() => {
        if (mounted) {
          setData({
            client: [],
            partner: [],
            affiliate: [],
          })
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative p-6 md:p-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium ring-1 ring-white/25 mb-3">
            <Sparkles className="size-3.5" />
            Comunidad Dimarclub
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl leading-tight">
            Beneficios Dimarclub
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/90 max-w-2xl">
            Una membresía que sí rinde. Como cliente disfrutas servicios gratuitos,
            como socio ganas rendimientos, y como afiliado construyes una red de
            ingresos de 3 niveles.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-lg bg-white/10 backdrop-blur px-4 py-2 ring-1 ring-white/20">
              <p className="text-xs text-white/80">Clientes</p>
              <p className="text-lg font-semibold">5 beneficios</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur px-4 py-2 ring-1 ring-white/20">
              <p className="text-xs text-white/80">Socios</p>
              <p className="text-lg font-semibold">4 ventajas</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur px-4 py-2 ring-1 ring-white/20">
              <p className="text-xs text-white/80">Afiliados</p>
              <p className="text-lg font-semibold">4 niveles · 9% total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cliente benefits */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Para clientes"
          title="Beneficios como cliente"
          description="Servicios incluidos en tu membresía, sin costo adicional."
          icon={Gift}
          accent="emerald"
        />
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.client || []).map((b, i) => (
              <ClientBenefitCard
                key={b.title}
                icon={iconFor(b.icon)}
                title={b.title}
                desc={b.desc}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* Socio benefits */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Para socios"
          title="Ventajas como socio capitalista"
          description="Aporta capital y recibe rendimientos mensuales más oportunidades."
          icon={PiggyBank}
          accent="amber"
        />
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data?.partner || []).map((b) => (
              <PartnerBenefitCard
                key={b.title}
                icon={iconFor(b.icon)}
                title={b.title}
                desc={b.desc}
              />
            ))}
          </div>
        )}
      </section>

      {/* Affiliate commission system */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Red de afiliados"
          title="Sistema de comisiones de 3 niveles"
          description="Gana por tus ventas y por las ventas de tu red. Hasta 4 niveles de comisión."
          icon={Network}
          accent="emerald"
        />
        <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-50/50 to-amber-50/40 border-emerald-200/50">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-2 justify-center">
              {(data?.affiliate || []).map((lvl, i) => (
                <div key={lvl.level} className="flex flex-col lg:flex-row items-center gap-3 lg:gap-2">
                  <LevelCard
                    level={lvl}
                    isRoot={i === 0}
                    isLast={i === (data?.affiliate.length || 0) - 1}
                  />
                  {i < (data?.affiliate.length || 0) - 1 && (
                    <div className="flex items-center justify-center">
                      <div className="hidden lg:flex size-9 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center ring-1 ring-emerald-200">
                        <ArrowRight className="size-5" />
                      </div>
                      <div className="lg:hidden size-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
                        <ArrowDown className="size-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 grid sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border bg-white p-3">
                <p className="font-medium text-emerald-700 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" /> 9% total
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Combinando N0 (3%) + N1+N2+N3 (6%) sobre cada venta de tu red.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="font-medium text-emerald-700 flex items-center gap-1.5">
                  <Users className="size-3.5" /> Sin límites
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Construye tu red con todos los referidos que quieras en cada nivel.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-3">
                <p className="font-medium text-emerald-700 flex items-center gap-1.5">
                  <Check className="size-3.5" /> Pago automático
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Las comisiones se calculan y acreditan por cada pedido confirmado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 md:p-10 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium ring-1 ring-amber-200 mb-3">
          <Sparkles className="size-3.5" />
          Únete hoy
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">
          Únete a la comunidad Dimarclub
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          Elige cómo quieres participar. Todos los caminos empiezan con una sola cuenta.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <CTAButton icon={Gift} label="Registrarme como cliente" tone="emerald" />
          <CTAButton icon={UserCheck} label="Quiero ser afiliado" tone="emerald" outline />
          <CTAButton icon={Handshake} label="Ser socio capitalista" tone="amber" />
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Membresía con vigencia anual · Beneficios sujetos a disponibilidad por ciudad
        </p>
      </section>
    </div>
  )
}

/* ---------------- Section header ---------------- */

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  accent,
}: {
  eyebrow: string
  title: string
  description: string
  icon: typeof Gift
  accent: 'emerald' | 'amber'
}) {
  const toneCls =
    accent === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
      : 'bg-amber-50 text-amber-700 ring-amber-200/60'
  return (
    <div className="flex items-start gap-3">
      <div className={`size-10 rounded-lg flex items-center justify-center ring-1 shrink-0 ${toneCls}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/* ---------------- Client benefit card ---------------- */

function ClientBenefitCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: typeof Truck
  title: string
  desc: string
  index: number
}) {
  return (
    <Card className="p-5 gap-3 hover:border-emerald-300 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-600/70">
              0{index + 1}
            </span>
            <CardTitle className="text-base leading-tight">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1 leading-relaxed">
            {desc}
          </CardDescription>
        </div>
      </div>
      <div className="pt-2 border-t flex items-center gap-1 text-[11px] text-emerald-700">
        <Check className="size-3" /> Incluido en tu membresía
      </div>
    </Card>
  )
}

/* ---------------- Partner benefit card ---------------- */

function PartnerBenefitCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Truck
  title: string
  desc: string
}) {
  return (
    <Card className="p-5 gap-3 hover:border-amber-300 hover:shadow-md transition-all group bg-gradient-to-br from-white to-amber-50/30">
      <div className="size-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
        <Icon className="size-6" />
      </div>
      <div>
        <Badge variant="outline" className="mb-1.5 text-[10px] border-amber-300 text-amber-700 bg-amber-50">
          Socio premium
        </Badge>
        <CardTitle className="text-base leading-tight">{title}</CardTitle>
        <CardDescription className="text-xs mt-1 leading-relaxed">
          {desc}
        </CardDescription>
      </div>
    </Card>
  )
}

/* ---------------- Affiliate level card ---------------- */

function LevelCard({
  level,
  isRoot,
  isLast,
}: {
  level: AffiliateLevel
  isRoot: boolean
  isLast: boolean
}) {
  const rootCls = 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-emerald-700 shadow-lg shadow-emerald-200/50'
  const childCls = 'bg-white border-emerald-200 text-emerald-700'
  return (
    <div
      className={`relative w-full lg:w-56 rounded-xl border-2 p-4 text-center transition-all ${
        isRoot ? rootCls : childCls
      }`}
    >
      {isRoot && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 shadow ring-2 ring-white">
          TÚ
        </span>
      )}
      <div className="flex flex-col items-center gap-1">
        <span
          className={`text-[10px] uppercase tracking-wider font-medium ${
            isRoot ? 'text-white/80' : 'text-muted-foreground'
          }`}
        >
          {level.level}
        </span>
        <span className={`text-3xl font-bold ${isRoot ? 'text-white' : 'text-emerald-700'}`}>
          {level.rate}
        </span>
        <span
          className={`text-[11px] leading-snug max-w-[12rem] ${
            isRoot ? 'text-white/90' : 'text-muted-foreground'
          }`}
        >
          {level.desc}
        </span>
      </div>
      {isLast && (
        <span
          className={`mt-2 inline-flex items-center gap-1 text-[10px] ${
            isRoot ? 'text-white/80' : 'text-muted-foreground'
          }`}
        >
          <Network className="size-3" /> fin de la cadena
        </span>
      )}
    </div>
  )
}

/* ---------------- CTA Button ---------------- */

function CTAButton({
  icon: Icon,
  label,
  tone,
  outline,
}: {
  icon: typeof Gift
  label: string
  tone: 'emerald' | 'amber'
  outline?: boolean
}) {
  const base = 'h-10 px-4'
  if (outline) {
    return (
      <Button variant="outline" size="sm" className={`${base} border-emerald-300 text-emerald-700 hover:bg-emerald-50`}>
        <Icon className="size-4" />
        {label}
      </Button>
    )
  }
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white'
  return (
    <Button size="sm" className={`${base} ${cls}`}>
      <Icon className="size-4" />
      {label}
    </Button>
  )
}
