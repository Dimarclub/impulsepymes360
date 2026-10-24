'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  ShoppingBag,
  Sparkles,
  Leaf,
  TrendingUp,
  Palette,
  Link2,
  Recycle,
  Eye,
  Users,
  Phone,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  BAG_PANELS,
  BAG_TOTAL_SPACES,
  sponsorColor,
  type BagPanel,
} from '@/lib/bag-plan'

// ---------- Tipos (espejo del API bag-plan) ----------
interface BagSpace {
  id: string
  position: number
  type: string
  status: string
  price: number
  buyerId?: string | null
  buyerName?: string | null
  imageUrl?: string | null
}
interface BagEdition {
  id: string
  name: string
  slug: string
  city: string
  totalSpaces: number
  bagSize: string
  printQuantity: number
  startDate: string
  endDate: string
  status: string
  monthLabel: string
}
interface BagStats {
  total: number
  available: number
  reserved: number
  sold: number
  revenue: number
  potential: number
}
interface BagPlanData {
  currentEdition: BagEdition
  nextEdition: BagEdition
  currentSpaces: BagSpace[]
  nextSpaces: BagSpace[]
  panels: BagPanel[]
  currentStats: BagStats
  nextStats: BagStats
}

// ---------- Paleta oscura ----------
const C = {
  bg: '#0B1120',
  card: '#15203A',
  card2: '#1A2647',
  border: '#243352',
  borderLight: '#2F3F66',
  emerald: '#00D4AA',
  emeraldDark: '#00A886',
  gold: '#F5A623',
  purple: '#A855F7',
  text: '#E8EDF5',
  textDim: '#A0AEC8',
  muted: '#6B7FA0',
  success: '#22C55E',
  rose: '#F43F5E',
  amber: '#F59E0B',
}

const WHATSAPP_URL = 'https://wa.me/593992689844?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Publibags'
const WHATSAPP_DISPLAY = '+593 99 268 9844'

// ---------- Componente principal ----------
export function PubliBagsModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [data, setData] = useState<BagPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)

  // Inyectar Google Fonts (Outfit + DM Sans)
  useEffect(() => {
    const id = 'publibags-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/impulse/bag-plan')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no-ok'))))
      .then((d: BagPlanData) => { if (!cancelled) setData(d) })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div
      className="publibags-satellite"
      style={{
        background: C.bg,
        color: C.text,
        minHeight: '100vh',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ===== Navbar ===== */}
      <Navbar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        onCta={() => setModule('bag-plan')}
      />

      {/* ===== Hero ===== */}
      <Hero onSeePlan={() => scrollTo('plano')} onWhats={() => window.open(WHATSAPP_URL, '_blank')} />

      {/* ===== Anatomía ===== */}
      <Anatomia />

      {/* ===== Cómo funciona ===== */}
      <ComoFunciona />

      {/* ===== Plano LIVE ===== */}
      <PlanoLive data={data} loading={loading} onBuy={() => setModule('bag-plan')} />

      {/* ===== Ventajas ===== */}
      <Ventajas />

      {/* ===== Impacto ===== */}
      <Impacto />

      {/* ===== Propuesta DimarClub ===== */}
      <Propuesta onCta={() => toast('Próximamente: DimarClub marketplace', 'info')} />

      {/* ===== Red Universal ===== */}
      <RedUniversal onCta={() => setModule('affiliates')} />

      {/* ===== CTA Planes ===== */}
      <CtaPlanes onCta={() => setModule('bag-plan')} />

      {/* ===== Contacto ===== */}
      <Contacto onSeePlans={() => setModule('marketplace')} />

      {/* ===== Footer ===== */}
      <Footer onBackToPortal={() => setModule('marketplace')} />
    </div>
  )
}

// ===================== NAVBAR =====================
function Navbar({
  mobileNav,
  setMobileNav,
  onCta,
}: {
  mobileNav: boolean
  setMobileNav: (v: boolean) => void
  onCta: () => void
}) {
  const links = [
    { href: '#anatomia', label: 'Anatomía' },
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#ventajas', label: 'Ventajas' },
    { href: '#impacto', label: 'Impacto' },
    { href: '#propuesta', label: 'Propuesta' },
    { href: '#contacto', label: 'Contacto' },
  ]
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(11, 17, 32, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <a href="#top" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, color: C.text, textDecoration: 'none' }}>
          Publi<span style={{ color: C.emerald }}>bags</span>
        </a>
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: C.textDim,
                fontSize: 14,
                padding: '8px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                transition: 'color .15s, background .15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.card }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'transparent' }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: C.emerald, color: '#062019' }}
          >
            <Phone className="size-3.5" />
            {WHATSAPP_DISPLAY}
          </a>
          <button
            onClick={onCta}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: 'transparent', color: C.emerald, border: `1px solid ${C.emerald}` }}
          >
            Comprar espacio
          </button>
          <button
            className="lg:hidden p-2 rounded-md"
            style={{ color: C.text, background: C.card }}
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Menú"
          >
            {mobileNav ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileNav && (
        <div className="lg:hidden border-t" style={{ borderColor: C.border, background: C.card }}>
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileNav(false)}
                className="block px-3 py-2 rounded-md text-sm"
                style={{ color: C.textDim }}
              >
                {l.label}
              </a>
            ))}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.emerald }}
            >
              WhatsApp: {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

// ===================== HERO =====================
function Hero({ onSeePlan, onWhats }: { onSeePlan: () => void; onWhats: () => void }) {
  return (
    <section id="top" style={{ position: 'relative', overflow: 'hidden', padding: '60px 0 80px' }}>
      {/* glow */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.emerald}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[1280px] mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{ background: `${C.emerald}1A`, color: C.emerald, border: `1px solid ${C.emerald}55` }}
            >
              <Sparkles className="size-3.5" />
              Bolso ecológico publicitario · Guayaquil
            </div>
            <h1
              style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: -1, color: C.text }}
            >
              Convertimos cada <span style={{ color: C.emerald }}>bolso</span> en publicidad que viaja por tu ciudad
            </h1>
            <p style={{ color: C.textDim, fontSize: 17, marginTop: 18, lineHeight: 1.55, maxWidth: 540 }}>
              {BAG_TOTAL_SPACES} espacios publicitarios de 5×5 cm en bolsos elegantes, ecológicas y reutilizables que circulan por toda la ciudad.
              Tu marca impresa + QR, vista por miles de personas todos los días.
            </p>

            {/* Price badge */}
            <div
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl mt-6"
              style={{ background: C.card, border: `1px solid ${C.borderLight}` }}
            >
              <div
                className="size-11 rounded-lg flex items-center justify-center font-bold"
                style={{ background: `${C.gold}22`, color: C.gold, fontSize: 18 }}
              >
                $20
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>por espacio · pago único</p>
                <p style={{ fontSize: 12, color: C.muted }}>Se convierte en aporte de capital de socio + 5% interés mensual</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={onSeePlan}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: C.emerald, color: '#062019' }}
              >
                Ver plano del bolso <ArrowRight className="size-4" />
              </button>
              <button
                onClick={onWhats}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: 'transparent', color: C.text, border: `1px solid ${C.borderLight}` }}
              >
                <Phone className="size-4" /> Hablar por WhatsApp
              </button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div
              className="rounded-2xl p-8 flex flex-col items-center justify-center text-center"
              style={{
                background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
                border: `1px solid ${C.borderLight}`,
                minHeight: 320,
              }}
            >
              <p style={{ color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>Espacios totales</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(80px, 14vw, 140px)', lineHeight: 1, color: C.emerald, marginTop: 8 }}>
                141
              </p>
              <p style={{ color: C.textDim, fontSize: 15, marginTop: 8, maxWidth: 320 }}>
                Cada uno de 5×5 cm, distribuidos en 3 paneles del bolso de 45×35 cm
              </p>
              <div className="grid grid-cols-3 gap-2 w-full mt-6">
                {[
                  { label: 'Paneles', value: '3' },
                  { label: 'Tamaño bolso', value: '45×35cm' },
                  { label: 'Reutilizable', value: '∞' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-2.5" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===================== ANATOMÍA =====================
function Anatomia() {
  const panelInfo = [
    { label: 'Frontal', dims: '45×35 cm', count: 63, color: C.emerald },
    { label: 'Posterior', dims: '45×35 cm', count: 63, color: C.purple },
    { label: 'Correa / Asa', dims: '75×5 cm', count: 15, color: C.gold, big: true },
  ]

  const stats = [
    { label: 'Espacios totales', value: '141', color: C.emerald },
    { label: 'Vendibles', value: '141', color: C.emerald },
    { label: 'Por espacio', value: '$20', color: C.gold },
    { label: 'Interés mensual', value: '5%', color: C.purple },
  ]

  return (
    <Section id="anatomia" eyebrow="Anatomía del bolso" title="141 espacios publicitarios por bolso" subtitle="Cada bolso de 45×35 cm tiene espacios de 5×5 cm distribuidos en 3 paneles (Frontal, Posterior y Correa). Los 141 espacios son vendibles.">
      {/* Visual panels */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {panelInfo.map((p) => (
          <div
            key={p.label}
            className="rounded-xl p-4"
            style={{
              background: C.card,
              border: `1px solid ${C.borderLight}`,
              gridColumn: p.big ? 'span 2' : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.label}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{p.dims}</span>
            </div>
            <div
              className="rounded-md flex items-center justify-center font-bold"
              style={{
                background: `${p.color}22`,
                border: `1px solid ${p.color}55`,
                color: p.color,
                minHeight: p.big ? 80 : 56,
                fontSize: p.big ? 28 : 20,
              }}
            >
              {p.count} espacios
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 36, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== CÓMO FUNCIONA =====================
function ComoFunciona() {
  const steps = [
    { n: 1, icon: <ShoppingBag className="size-5" />, title: 'Compras tu espacio', desc: 'Eliges un espacio de 5×5 cm en el plano del bolso. Pagas $20 (pago único) y automáticamente te haces SOCIO de la cooperativa.' },
    { n: 2, icon: <TrendingUp className="size-5" />, title: 'Tu $20 = aporte de capital', desc: 'El $20 se registra como aporte de capital en tu cuenta cooperativa. Genera 5% interés mensual compuesto.' },
    { n: 3, icon: <Palette className="size-5" />, title: 'Tu marca se imprime + QR', desc: 'Subes tu logo o generas un QR. Se imprime en el bolso junto con 296 marcas más, en 500 bolsas que circulan por toda la ciudad.' },
    { n: 4, icon: <Users className="size-5" />, title: 'Miles ven tu marca', desc: 'Cada bolso es visto por miles de personas. Tu red de afiliados gana 2% en 3 niveles + 3% cashback en cada compra.' },
  ]
  return (
    <Section id="como-funciona" eyebrow="Cómo funciona" title="De $20 a marca impresa en 4 pasos" subtitle="Un flujo simple que te convierte en socio, genera interés compuesto y pone tu marca en circulación.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl p-5 relative" style={{ background: C.card, border: `1px solid ${C.borderLight}` }}>
            <div
              className="absolute -top-3 -left-3 size-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: C.emerald, color: '#062019' }}
            >
              {s.n}
            </div>
            <div
              className="size-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${C.emerald}22`, color: C.emerald }}
            >
              {s.icon}
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>
              {s.title}
            </h3>
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== PLANO LIVE =====================
function PlanoLive({ data, loading, onBuy }: { data: BagPlanData | null; loading: boolean; onBuy: () => void }) {
  const [view, setView] = useState<'current' | 'next'>('current')

  const edition = view === 'current' ? data?.currentEdition : data?.nextEdition
  const spaces = view === 'current' ? data?.currentSpaces : data?.nextSpaces
  const stats = view === 'current' ? data?.currentStats : data?.nextStats

  // Para la campaña actual (todos vendidos), agrupamos sponsors para la leyenda
  const sponsors = useMemo(() => {
    if (!spaces) return []
    const map = new Map<string, number>()
    for (const s of spaces) {
      if (s.status !== 'SOLD') continue
      const n = s.buyerName || ''
      if (!n) continue
      map.set(n, (map.get(n) || 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12)
  }, [spaces])

  return (
    <Section
      id="plano"
      eyebrow="Plano de corte en vivo"
      title="Mira los 141 espacios del bolso en tiempo real"
      subtitle="Esta es la campaña actual (impresa, llena de patrocinadores) y la próxima campaña (compra abierta)."
    >
      {/* Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex rounded-lg p-1" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <button
            onClick={() => setView('current')}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{
              background: view === 'current' ? C.emerald : 'transparent',
              color: view === 'current' ? '#062019' : C.textDim,
            }}
          >
            Campaña actual (impresa)
          </button>
          <button
            onClick={() => setView('next')}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{
              background: view === 'next' ? C.gold : 'transparent',
              color: view === 'next' ? '#1a1206' : C.textDim,
            }}
          >
            Próxima campaña (compra abierta)
          </button>
        </div>
        {edition && (
          <p style={{ fontSize: 13, color: C.muted }}>
            {edition.monthLabel} · {edition.city} · {edition.printQuantity} bolsas
          </p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <LiveStat label="Total" value={stats.total} color={C.text} />
          <LiveStat label="Vendidos" value={stats.sold} color={C.rose} />
          <LiveStat label="Disponibles" value={stats.available} color={C.emerald} />
          <LiveStat label="Recaudado" value={`$${stats.revenue.toLocaleString()}`} color={C.gold} />
        </div>
      )}

      {loading ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="inline-block size-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.emerald} transparent transparent transparent` }} />
          <p style={{ color: C.muted, fontSize: 14, marginTop: 12 }}>Cargando los 141 espacios…</p>
        </div>
      ) : !spaces ? (
        <div className="rounded-xl p-12 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p style={{ color: C.muted }}>No se pudo cargar el plano.</p>
        </div>
      ) : (
        <>
          {/* Panels */}
          <div className="grid md:grid-cols-2 gap-4">
            {BAG_PANELS.map((panel) => (
              <LivePanel key={panel.key} panel={panel} spaces={spaces} view={view} />
            ))}
          </div>

          {/* Legend for current (sponsors) */}
          {view === 'current' && sponsors.length > 0 && (
            <div className="rounded-xl p-4 mt-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Top patrocinadores (campaña actual)
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {sponsors.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-1.5">
                    <div className="size-3 rounded-sm" style={{ background: sponsorColor(name) }} />
                    <span style={{ fontSize: 12, color: C.textDim }}>{name} ({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend for next (statuses) */}
          {view === 'next' && (
            <div className="rounded-xl p-4 mt-5 flex flex-wrap items-center gap-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Leyenda:</span>
              <LegendDot color={C.emerald} label="Disponible" />
              <LegendDot color={C.amber} label="Reservado" />
              <LegendDot color={C.rose} label="Vendido" />
            </div>
          )}

          {/* Big CTA */}
          <div
            className="mt-6 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: `linear-gradient(135deg, ${C.emerald}22 0%, ${C.gold}11 100%)`, border: `1px solid ${C.emerald}55` }}
          >
            <div>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 22, color: C.text }}>
                ¿Listo para imprimir tu marca?
              </h3>
              <p style={{ color: C.textDim, fontSize: 14, marginTop: 4 }}>
                Abre el visualizador completo, elige tu espacio y hazte socio PubliBags por $20.
              </p>
            </div>
            <button
              onClick={onBuy}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap"
              style={{ background: C.emerald, color: '#062019' }}
            >
              Comprar mi espacio <ArrowRight className="size-4" />
            </button>
          </div>
        </>
      )}
    </Section>
  )
}

function LiveStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl p-3.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 26, color }}>{value}</p>
      <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</p>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="size-3 rounded-sm" style={{ background: color }} />
      <span style={{ fontSize: 12, color: C.textDim }}>{label}</span>
    </div>
  )
}

function LivePanel({ panel, spaces, view }: { panel: BagPanel; spaces: BagSpace[]; view: 'current' | 'next' }) {
  const byPos = useMemo(() => {
    const m = new Map<number, BagSpace>()
    for (const s of spaces) m.set(s.position, s)
    return m
  }, [spaces])

  const positions: number[] = []
  for (let i = panel.start; i <= panel.end; i++) positions.push(i)

  return (
    <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{panel.label}</p>
          <p style={{ fontSize: 11, color: C.muted }}>{panel.widthCm}×{panel.heightCm} cm · {panel.cols}×{panel.rows}</p>
        </div>
        <span style={{ fontSize: 11, color: C.muted }}>#{panel.start}–{panel.end}</span>
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${panel.cols}, minmax(0, 1fr))`, gap: 2 }}
      >
        {positions.map((pos) => {
          const s = byPos.get(pos)
          let bg = C.bg
          let title = `#${pos} · Disponible`
          if (view === 'current') {
            // Todos vendidos → color por sponsor
            const name = s?.buyerName
            if (name) {
              bg = sponsorColor(name)
              title = `#${pos} · ${name}`
            }
          } else {
            // next → color por status
            if (s?.status === 'SOLD') {
              const name = s.buyerName
              bg = name ? sponsorColor(name) : C.rose
              title = `#${pos} · Vendido${name ? ` · ${name}` : ''}`
            } else if (s?.status === 'RESERVED') {
              bg = C.amber
              title = `#${pos} · Reservado`
            } else {
              bg = `${C.emerald}33`
              title = `#${pos} · Disponible`
            }
          }
          return (
            <div
              key={pos}
              title={title}
              style={{
                aspectRatio: '1 / 1',
                background: bg,
                borderRadius: 2,
                minWidth: 6,
                cursor: 'default',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ===================== VENTAJAS =====================
function Ventajas() {
  const items = [
    { icon: <Leaf className="size-5" />, title: '100% Ecológico', desc: 'Bolso reutilizable de tela resistente. Cero plástico de un solo uso.' },
    { icon: <Eye className="size-5" />, title: 'Medición Real', desc: 'Cada QR se escanea y mide en tiempo real. Sabes cuántas personas vieron tu marca.' },
    { icon: <Palette className="size-5" />, title: 'Diseño Incluido', desc: 'Te ayudamos a diseñar tu espacio de 5×5 cm. No necesitas diseñador.' },
    { icon: <Link2 className="size-5" />, title: 'Enlace a tu Web', desc: 'El QR lleva directo a tu sitio web, tienda o perfil de afiliado.' },
    { icon: <Recycle className="size-5" />, title: 'Reutilización', desc: 'Un bolso se usa cientos de veces. Tu marca se ve una y otra vez.' },
    { icon: <TrendingUp className="size-5" />, title: 'Alcance Masivo', desc: '500 bolsas circulando × cientos de vistas = miles de impresiones/mes.' },
  ]
  return (
    <Section id="ventajas" eyebrow="Ventajas" title="Por qué PubliBags funciona" subtitle="No es solo publicidad. Es un activo que genera retorno ambiental, social y financiero.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.title} className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.borderLight}` }}>
            <div
              className="size-10 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${C.emerald}22`, color: C.emerald }}
            >
              {it.icon}
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>
              {it.title}
            </h3>
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{it.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== IMPACTO =====================
function Impacto() {
  const items = [
    { value: '100%', label: 'Papel reciclado', color: C.emerald },
    { value: '3R', label: 'Reducir, Reutilizar, Reciclar', color: C.gold },
    { value: '0%', label: 'Plástico de un solo uso', color: C.rose },
    { value: '∞', label: 'Reutilizaciones por bolso', color: C.purple },
  ]
  return (
    <Section id="impacto" eyebrow="Impacto ecológico" title="Publicidad que cuida el planeta" subtitle="Cada bolso PubliBags evita cientos de fundas plásticas. Tu marca promueve un consumo consciente.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-xl p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`, border: `1px solid ${C.borderLight}` }}
          >
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 44, color: it.color, lineHeight: 1 }}>
              {it.value}
            </p>
            <p style={{ fontSize: 12, color: C.textDim, marginTop: 10, lineHeight: 1.4 }}>{it.label}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== PROPUESTA DIMARCLUB =====================
function Propuesta({ onCta }: { onCta: () => void }) {
  const benefits = [
    { icon: '🚑', title: 'Ambulancia Gratis', desc: 'Servicio de ambulancia sin costo para socios.' },
    { icon: '🔧', title: 'Servicios Técnicos', desc: 'Red de técnicos en electricidad, plomería y más.' },
    { icon: '🌿', title: 'Medicina Ancestral', desc: 'Acceso a terapias alternativas y naturales.' },
    { icon: '🚚', title: 'Entrega Gratis', desc: 'Logística de productos sin costo adicional.' },
    { icon: '💰', title: 'Préstamos con Garantía', desc: 'Crédito respaldado por tu aporte de capital.' },
    { icon: '📈', title: 'Línea de Crédito 75%', desc: 'Financia hasta el 75% de tu aporte acumulado.' },
    { icon: '💹', title: 'Inversión 5% Mensual', desc: 'Tu aporte genera 5% interés mensual compuesto.' },
    { icon: '🎯', title: 'Hub de Tareas CPA', desc: 'Centro de tareas de costo por acción para afiliados.' },
    { icon: '🛍️', title: 'Fundas con Descuentos', desc: 'Descuentos exclusivos en fundas y productos.' },
    { icon: '🏢', title: 'Coworking $150/mes', desc: 'Espacio de trabajo compartido a precio de socio.' },
    { icon: '🎓', title: 'Capacitación', desc: 'Cursos y formación empresarial continua.' },
    { icon: '📅', title: 'Reuniones Semanales', desc: 'Encuentros de networking y negocios.' },
  ]
  return (
    <Section
      id="propuesta"
      eyebrow="Propuesta DimarClub"
      title="Ser socio PubliBags te abre las puertas de DimarClub"
      subtitle="No solo publicitarias tu marca. Al comprar un espacio te conviertes en socio de la cooperativa DimarClub con 12 beneficios exclusivos."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {benefits.map((b) => (
          <div
            key={b.title}
            className="rounded-xl p-4 transition-transform hover:scale-[1.02]"
            style={{ background: C.card, border: `1px solid ${C.borderLight}` }}
          >
            <div className="size-9 rounded-lg flex items-center justify-center text-lg mb-2" style={{ background: C.bg }}>
              {b.icon}
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{b.title}</h4>
            <p style={{ fontSize: 12, color: C.textDim, lineHeight: 1.4 }}>{b.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={onCta}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
          style={{ background: C.emerald, color: '#062019' }}
        >
          Conocer DimarClub <ChevronRight className="size-4" />
        </button>
        <button
          onClick={onCta}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
          style={{ background: 'transparent', color: C.text, border: `1px solid ${C.borderLight}` }}
        >
          Ser Proveedor
        </button>
      </div>
    </Section>
  )
}

// ===================== RED UNIVERSAL =====================
function RedUniversal({ onCta }: { onCta: () => void }) {
  return (
    <section style={{ padding: '40px 0' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div
          className="rounded-2xl p-6 sm:p-10 grid lg:grid-cols-[1fr_auto] gap-6 items-center"
          style={{
            background: `linear-gradient(135deg, ${C.purple}22 0%, ${C.emerald}11 100%)`,
            border: `1px solid ${C.purple}55`,
          }}
        >
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ background: `${C.purple}22`, color: C.purple, border: `1px solid ${C.purple}55` }}
            >
              <Users className="size-3.5" /> Red Universal de Afiliados
            </div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 32px)', color: C.text, lineHeight: 1.15 }}>
              Construye tu red de 3 niveles y gana comisiones en cada compra
            </h2>
            <p style={{ color: C.textDim, fontSize: 15, marginTop: 12, lineHeight: 1.55, maxWidth: 620 }}>
              Cada socio puede construir su <strong style={{ color: C.text }}>Red Universal de 3 Niveles</strong> y ganar{' '}
              <strong style={{ color: C.emerald }}>2% de cada nivel</strong> (N1, N2, N3) +{' '}
              <strong style={{ color: C.gold }}>3% cashback N0</strong> en cada compra de espacio PubliBags.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="rounded-lg px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, color: C.muted }}>Tú compras</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>3% cashback N0</p>
              </div>
              <div className="rounded-lg px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, color: C.muted }}>Tu padrino (N1)</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: C.emerald }}>2% comisión</p>
              </div>
              <div className="rounded-lg px-3 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, color: C.muted }}>N2 y N3</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: C.purple }}>+2% cada nivel</p>
              </div>
            </div>
          </div>
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm whitespace-nowrap justify-self-start lg:justify-self-end"
            style={{ background: C.purple, color: '#fff' }}
          >
            Ver mi red <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ===================== CTA PLANES =====================
function CtaPlanes({ onCta }: { onCta: () => void }) {
  return (
    <section style={{ padding: '60px 0', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 400,
          background: `radial-gradient(ellipse, ${C.emerald}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[1280px] mx-auto px-4 relative text-center">
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)', color: C.text, lineHeight: 1.1 }}>
          ¿Listo para ver tu marca <span style={{ color: C.emerald }}>en todas partes</span>?
        </h2>
        <p style={{ color: C.textDim, fontSize: 16, marginTop: 14, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
          Únete a los 141 espacios del bolso PubliBags. Inversión $20, retorno ambiental + financiero + publicitario.
        </p>
        <button
          onClick={onCta}
          className="mt-7 inline-flex items-center gap-2 px-7 py-4 rounded-lg font-bold text-base"
          style={{ background: C.emerald, color: '#062019' }}
        >
          <ShoppingBag className="size-5" /> Comprar mi espacio — $20
        </button>
      </div>
    </section>
  )
}

// ===================== CONTACTO =====================
function Contacto({ onSeePlans }: { onSeePlans: () => void }) {
  return (
    <Section id="contacto" eyebrow="Contacto" title="Hablemos de tu marca" subtitle="Escríbenos por WhatsApp y te ayudamos a elegir el mejor espacio para tu negocio.">
      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${C.emerald}22 0%, ${C.card} 100%)`, border: `1px solid ${C.emerald}55` }}
        >
          <div className="size-12 rounded-full flex items-center justify-center" style={{ background: C.emerald, color: '#062019' }}>
            <Phone className="size-6" />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>WhatsApp</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: C.text }}>{WHATSAPP_DISPLAY}</p>
          </div>
        </a>
        <button
          onClick={onSeePlans}
          className="rounded-xl p-6 flex items-center gap-4 text-left transition-transform hover:scale-[1.02]"
          style={{ background: C.card, border: `1px solid ${C.borderLight}` }}
        >
          <div className="size-12 rounded-full flex items-center justify-center" style={{ background: C.gold, color: '#1a1206' }}>
            <Sparkles className="size-6" />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Marketplace</p>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: C.text }}>Ver planes y productos</p>
          </div>
        </button>
      </div>
    </Section>
  )
}

// ===================== FOOTER =====================
function Footer({ onBackToPortal }: { onBackToPortal: () => void }) {
  const cols = [
    {
      title: 'ImpulsePymes360',
      links: ['Marketplace', 'DimarClub', 'PubliBags', 'Cooperativa', 'Afiliados'],
    },
    {
      title: 'Ecosistema',
      links: ['Socios', 'Proveedores', 'Mensajería', 'CRM', 'Email Marketing'],
    },
    {
      title: 'Más servicios',
      links: ['Grid 360', 'Web Express', 'Social Studio', 'Directorio', 'Alertas'],
    },
    {
      title: 'Contacto',
      links: [WHATSAPP_DISPLAY, 'Guayaquil, Ecuador', 'Lun–Sáb 8am–8pm'],
    },
    {
      title: 'Legal',
      links: ['Términos', 'Privacidad', 'Política de devoluciones', 'PQRS'],
    },
  ]
  return (
    <footer style={{ background: '#070C18', borderTop: `1px solid ${C.border}`, padding: '48px 0 24px' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {cols.map((col) => (
            <div key={col.title}>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                {col.title}
              </h4>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <span style={{ fontSize: 13, color: C.muted, cursor: 'default' }}>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 18, color: C.text }}>
              Publi<span style={{ color: C.emerald }}>bags</span>
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>· por ImpulsePymes360</span>
          </div>
          <div className="flex items-center gap-3">
            {['FB', 'IG', 'WA', 'YT'].map((s) => (
              <div
                key={s}
                className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: C.card, color: C.textDim, border: `1px solid ${C.border}` }}
              >
                {s}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.muted }}>© 2026 ImpulsePymes360 · Todos los derechos reservados</p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToPortal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: C.card, color: C.textDim, border: `1px solid ${C.border}` }}
          >
            <ArrowRight className="size-4 rotate-180" /> Volver al portal
          </button>
        </div>
      </div>
    </footer>
  )
}

// ===================== SECTION WRAPPER =====================
function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} style={{ padding: '56px 0' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div style={{ maxWidth: 720, marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: C.emerald,
              textTransform: 'uppercase',
              letterSpacing: 2,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </p>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(24px, 3.4vw, 36px)',
              color: C.text,
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: C.textDim, fontSize: 15, marginTop: 12, lineHeight: 1.55 }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

// ===================== UTIL =====================
function scrollTo(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
