'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Check,
  Phone,
  Mail,
  Globe,
  Sparkles,
  ArrowRight,
  Star,
  Package,
  Truck,
  ShoppingBag,
  MapPin,
  Users,
  Palette,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ---------- Datos ----------
interface Plan {
  id: string
  name: string
  price: number
  pages: number
  emails: number
  products: number
  sobres: number
  qr: number
  qrProd: number
  popular: boolean
}

interface Addon {
  id: string
  name: string
  price: number
  unit: string
  icon: 'package' | 'truck' | 'mapPin'
}

const PLANS: Plan[] = [
  { id: 'basico', name: 'Básico', price: 122, pages: 3, emails: 1, products: 5, sobres: 11, qr: 2, qrProd: 1, popular: false },
  { id: 'emprendedor', name: 'Emprendedor', price: 253, pages: 5, emails: 3, products: 15, sobres: 25, qr: 3, qrProd: 2, popular: false },
  { id: 'comercial', name: 'Comercial', price: 363, pages: 7, emails: 5, products: 25, sobres: 35, qr: 4, qrProd: 3, popular: true },
  { id: 'premium', name: 'Premium', price: 478, pages: 10, emails: 7, products: 35, sobres: 45, qr: 5, qrProd: 4, popular: false },
  { id: 'elite', name: 'Élite', price: 592, pages: 12, emails: 10, products: 45, sobres: 56, qr: 5, qrProd: 4, popular: false },
  { id: 'corporativo', name: 'Corporativo', price: 736, pages: 15, emails: 15, products: 60, sobres: 66, qr: 6, qrProd: 5, popular: false },
]

const ADDONS: Addon[] = [
  { id: 'sobre-individual', name: 'Sobre individual (retiro horario fijo)', price: 2.25, unit: '/ unidad', icon: 'package' },
  { id: 'entrega-express', name: 'Entrega Express (retiro y entrega inmediata)', price: 4.0, unit: '/ unidad', icon: 'truck' },
  { id: 'solo-publibags-qr', name: 'Solo espacio PubliBags con QR (sin plan integral)', price: 67.0, unit: '/ mes', icon: 'mapPin' },
]

const INCLUDED_ALL = [
  { icon: 'globe', label: 'Dominio propio (.com / .ec)' },
  { icon: 'mapPin', label: 'Espacio en directorio + álbum coleccionable' },
] as const

// ---------- Paleta oscura (mismo sistema que PubliBags) ----------
const C = {
  bg: '#0B1120',
  card: '#15203A',
  card2: '#1A2647',
  border: '#243352',
  borderLight: '#2F3F66',
  emerald: '#00D4AA',
  emeraldDark: '#00A886',
  gold: '#F5A623',
  goldDim: '#B47C18',
  purple: '#A855F7',
  text: '#F5F7FB',
  textDim: '#A9B6CB',
  muted: '#6B7FA0',
  success: '#22C55E',
  rose: '#F43F5E',
  amber: '#F59E0B',
}

const WHATSAPP_URL =
  'https://wa.me/593992689844?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20planes%20de%20ImpulsePymes360'
const WHATSAPP_DISPLAY = '+593 99 268 9844'
const EMAIL_DISPLAY = 'info@impulsepymes360.com'
const WEB_DISPLAY = 'impulsepymes360.com'

// ---------- Helpers ----------
function scrollTo(id: string) {
  if (typeof document === 'undefined') return
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function fmt(n: number) {
  return n.toLocaleString('es-EC', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })
}

// ---------- Componente principal ----------
export function PlanesModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [mobileNav, setMobileNav] = useState(false)

  // Inyectar Google Fonts (Outfit + DM Sans)
  useEffect(() => {
    const id = 'planes-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const choosePlan = (plan: Plan) => {
    toast(`Plan ${plan.name} agregado al carrito — $${fmt(plan.price)}/mes`, 'success')
    setTimeout(() => setModule('marketplace'), 400)
  }
  const chooseAddon = (a: Addon) => {
    toast(`${a.name} — $${fmt(a.price)}${a.unit}`, 'success')
    setTimeout(() => setModule('marketplace'), 400)
  }

  return (
    <div
      className="planes-satellite"
      style={{
        background: C.bg,
        color: C.text,
        minHeight: '100vh',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <Navbar
        mobileNav={mobileNav}
        setMobileNav={setMobileNav}
        onBack={() => setModule('marketplace')}
      />

      <Hero onSeePlans={() => scrollTo('planes')} onWhats={() => window.open(WHATSAPP_URL, '_blank')} />

      {/* Tabla de comparación (desktop) */}
      <ComparisonTable onChoose={choosePlan} onAddon={chooseAddon} />

      {/* Tarjetas de plan (mobile) */}
      <PlanCards onChoose={choosePlan} />

      {/* Todos los planes incluyen */}
      <IncludedAll />

      {/* Add-ons */}
      <AddonsSection onChoose={chooseAddon} />

      {/* CTA */}
      <CtaSection onWhats={() => window.open(WHATSAPP_URL, '_blank')} onSeePlans={() => setModule('marketplace')} />

      {/* Footer */}
      <Footer onBack={() => setModule('marketplace')} />
    </div>
  )
}

// ===================== NAVBAR =====================
function Navbar({
  mobileNav,
  setMobileNav,
  onBack,
}: {
  mobileNav: boolean
  setMobileNav: (v: boolean) => void
  onBack: () => void
}) {
  const links = [
    { href: 'planes', label: 'Planes' },
    { href: 'incluido', label: 'Incluido' },
    { href: 'addons', label: 'Add-ons' },
    { href: 'contacto', label: 'Contacto' },
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
        <a
          href="#top"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: C.text,
            textDecoration: 'none',
            letterSpacing: -0.5,
          }}
        >
          IMPULSE<span style={{ color: C.gold }}>PYMES</span>360
        </a>

        <span
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: `${C.emerald}1A`, color: C.emerald, border: `1px solid ${C.emerald}44` }}
        >
          <Sparkles className="size-3" /> Soluciones para crecer
        </span>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => scrollTo(l.href)}
              style={{
                color: C.textDim,
                fontSize: 14,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color .15s, background .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.text
                e.currentTarget.style.background = C.card
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.textDim
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {l.label}
            </button>
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
            onClick={onBack}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: 'transparent', color: C.gold, border: `1px solid ${C.gold}` }}
          >
            Volver al portal
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
              <button
                key={l.href}
                onClick={() => {
                  setMobileNav(false)
                  scrollTo(l.href)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm"
                style={{ color: C.textDim, background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {l.label}
              </button>
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
            <button
              onClick={() => {
                setMobileNav(false)
                onBack()
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.gold, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Volver al portal
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

// ===================== HERO =====================
function Hero({ onSeePlans, onWhats }: { onSeePlans: () => void; onWhats: () => void }) {
  return (
    <section id="top" style={{ position: 'relative', overflow: 'hidden', padding: '64px 0 80px' }}>
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.gold}1A 0%, ${C.emerald}11 35%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[1100px] mx-auto px-4 relative text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: `${C.gold}1A`, color: C.gold, border: `1px solid ${C.gold}55` }}
        >
          <CreditCard className="size-3.5" /> Planes integrales · Ecuador
        </div>
        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(34px, 5.5vw, 60px)',
            lineHeight: 1.05,
            letterSpacing: -1,
            color: C.text,
            margin: 0,
          }}
        >
          Planes para <span style={{ color: C.gold }}>impulsar</span> tu negocio
        </h1>
        <p
          style={{
            color: C.textDim,
            fontSize: 17,
            marginTop: 22,
            lineHeight: 1.55,
            maxWidth: 720,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Un ecosistema omnicanal para multiplicar tu presencia y tus ventas.
          Sitio web, marketplace, emails, sobres Fuerza Delta y espacios PubliBags con QR en un solo plan.
        </p>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-9 max-w-[760px] mx-auto">
          {[
            { k: '6', v: 'planes integrales', color: C.gold },
            { k: '3', v: 'add-ons premium', color: C.emerald },
            { k: '$122', v: 'plan desde /mes', color: C.text },
            { k: '10×5cm', v: 'QR en bolso PubliBags', color: C.purple },
          ].map((m) => (
            <div
              key={m.v}
              className="px-3 py-4 rounded-xl"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: m.color,
                  lineHeight: 1,
                }}
              >
                {m.k}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-9 justify-center">
          <button
            onClick={onSeePlans}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
            style={{ background: C.gold, color: '#241600' }}
          >
            Ver planes <ArrowRight className="size-4" />
          </button>
          <button
            onClick={onWhats}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
            style={{ background: 'transparent', color: C.emerald, border: `1px solid ${C.emerald}` }}
          >
            <Phone className="size-4" /> WhatsApp
          </button>
        </div>
      </div>
    </section>
  )
}

// ===================== TABLA DE COMPARACIÓN (desktop) =====================
function ComparisonTable({ onChoose, onAddon }: { onChoose: (p: Plan) => void; onAddon: (a: Addon) => void }) {
  const rows: { label: string; icon: 'globe' | 'mail' | 'package' | 'shoppingBag' | 'truck' | 'mapPin'; get: (p: Plan) => string }[] = [
    { label: 'Sitio web (páginas)', icon: 'globe', get: (p) => `${p.pages}` },
    { label: 'Emails corporativos', icon: 'mail', get: (p) => `${p.emails}` },
    { label: 'Productos marketplace', icon: 'shoppingBag', get: (p) => `${p.products}` },
    { label: 'Sobres Fuerza Delta', icon: 'truck', get: (p) => `${p.sobres}` },
    { label: 'PubliBags — QR', icon: 'mapPin', get: (p) => `${p.qr} QR` },
    { label: 'PubliBags — Productos', icon: 'package', get: (p) => `${p.qrProd} prod` },
  ]
  const iconFor = (k: string, size = 14) => {
    switch (k) {
      case 'globe':
        return <Globe className={`size-${size === 14 ? 3.5 : 4}`} />
      case 'mail':
        return <Mail className="size-3.5" />
      case 'package':
        return <Package className="size-3.5" />
      case 'shoppingBag':
        return <ShoppingBag className="size-3.5" />
      case 'truck':
        return <Truck className="size-3.5" />
      case 'mapPin':
        return <MapPin className="size-3.5" />
      default:
        return null
    }
  }
  return (
    <section id="planes" style={{ padding: '48px 0 64px' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <SectionHeading
          eyebrow="Comparativa"
          title={
            <>
              6 planes <span style={{ color: C.gold }}>integrales</span>
            </>
          }
          subtitle="Todos incluyen dominio propio y espacio en directorio + álbum coleccionable."
        />

        {/* Add-ons destacados arriba */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ background: C.card2, border: `1px solid ${C.gold}55` }}
        >
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${C.gold}33`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: `${C.gold}14`,
            }}
          >
            <Sparkles className="size-4" style={{ color: C.gold }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: C.gold }}>
              Servicios adicionales (add-ons)
            </span>
          </div>
          {ADDONS.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-12 gap-3 items-center px-4 py-3"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <div className="col-span-12 sm:col-span-7 flex items-center gap-3">
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${C.gold}1F`, color: C.gold }}
                >
                  {a.icon === 'package' && <Package className="size-4" />}
                  {a.icon === 'truck' && <Truck className="size-4" />}
                  {a.icon === 'mapPin' && <MapPin className="size-4" />}
                </div>
                <span style={{ fontSize: 14, color: C.text }}>{a.name}</span>
              </div>
              <div className="col-span-7 sm:col-span-3">
                <span
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 22,
                    color: C.gold,
                  }}
                >
                  ${fmt(a.price)}
                </span>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>{a.unit}</span>
              </div>
              <div className="col-span-5 sm:col-span-2 flex justify-end">
                <button
                  onClick={() => onAddon(a)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-semibold"
                  style={{ background: C.gold, color: '#241600' }}
                >
                  Agregar <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla principal — solo desktop */}
        <div
          className="hidden lg:block rounded-xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {/* Header */}
          <div className="grid" style={{ gridTemplateColumns: '220px repeat(6, 1fr)' }}>
            <div
              style={{
                padding: '18px 16px',
                borderBottom: `1px solid ${C.border}`,
                background: C.card2,
              }}
            >
              <div
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: C.textDim,
                }}
              >
                Característica
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Comparativa de planes</div>
            </div>
            {PLANS.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '18px 14px',
                  borderBottom: `1px solid ${C.border}`,
                  borderLeft: `1px solid ${C.border}`,
                  background: p.popular ? `${C.gold}10` : 'transparent',
                  position: 'relative',
                }}
              >
                {p.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      padding: '3px 0',
                      textAlign: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      background: C.gold,
                      color: '#241600',
                      textTransform: 'uppercase',
                    }}
                  >
                    ★ Popular
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 800,
                    fontSize: 18,
                    color: p.popular ? C.gold : C.text,
                    marginTop: p.popular ? 18 : 0,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: 26,
                      color: C.text,
                    }}
                  >
                    ${p.price}
                  </span>
                  <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>/mes</span>
                </div>
              </div>
            ))}
          </div>

          {/* Filas de características */}
          {rows.map((row, idx) => (
            <div className="grid" style={{ gridTemplateColumns: '220px repeat(6, 1fr)' }} key={row.label}>
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${C.border}`,
                  background: C.card2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: C.textDim,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span style={{ color: C.emerald }}>{iconFor(row.icon)}</span>
                {row.label}
              </div>
              {PLANS.map((p, pi) => (
                <div
                  key={p.id}
                  style={{
                    padding: '14px 12px',
                    borderBottom: idx === rows.length - 1 ? 'none' : `1px solid ${C.border}`,
                    borderLeft: `1px solid ${C.border}`,
                    background: p.popular ? `${C.gold}08` : 'transparent',
                    textAlign: 'center',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: p.popular ? C.gold : C.text,
                  }}
                >
                  {row.get(p)}
                </div>
              ))}
            </div>
          ))}

          {/* Fila CTA */}
          <div className="grid" style={{ gridTemplateColumns: '220px repeat(6, 1fr)' }}>
            <div
              style={{
                padding: '16px',
                background: C.card2,
                color: C.muted,
                fontSize: 12,
              }}
            >
              Elegir plan
            </div>
            {PLANS.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: '14px 12px',
                  borderLeft: `1px solid ${C.border}`,
                  background: p.popular ? `${C.gold}10` : 'transparent',
                  textAlign: 'center',
                }}
              >
                <button
                  onClick={() => onChoose(p)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-bold w-full justify-center"
                  style={{
                    background: p.popular ? C.gold : C.emerald,
                    color: p.popular ? '#241600' : '#062019',
                  }}
                >
                  Elegir <ArrowRight className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ===================== TARJETAS DE PLAN (mobile) =====================
function PlanCards({ onChoose }: { onChoose: (p: Plan) => void }) {
  return (
    <section className="lg:hidden" style={{ padding: '8px 0 48px' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl overflow-hidden"
              style={{
                background: C.card,
                border: `1px solid ${p.popular ? C.gold : C.border}`,
                position: 'relative',
              }}
            >
              {p.popular && (
                <div
                  style={{
                    padding: '5px 0',
                    textAlign: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    background: C.gold,
                    color: '#241600',
                    textTransform: 'uppercase',
                  }}
                >
                  ★ Popular
                </div>
              )}
              <div className="p-5">
                <div className="flex items-baseline justify-between mb-1">
                  <h3
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                      color: p.popular ? C.gold : C.text,
                      margin: 0,
                    }}
                  >
                    {p.name}
                  </h3>
                  {p.popular && <Star className="size-4" style={{ color: C.gold, fill: C.gold }} />}
                </div>
                <div className="mb-4">
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 30, color: C.text }}>
                    ${p.price}
                  </span>
                  <span style={{ fontSize: 13, color: C.muted, marginLeft: 4 }}>/mes</span>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  <FeatureRow icon="globe" label="Sitio web" value={`${p.pages} páginas`} />
                  <FeatureRow icon="mail" label="Emails" value={`${p.emails}`} />
                  <FeatureRow icon="shoppingBag" label="Marketplace" value={`${p.products} productos`} />
                  <FeatureRow icon="truck" label="Sobres Fuerza Delta" value={`${p.sobres}`} />
                  <FeatureRow icon="mapPin" label="PubliBags" value={`${p.qr} QR + ${p.qrProd} prod`} />
                  <FeatureRow icon="check" label="Dominio propio" value="Incluido" />
                </ul>

                <button
                  onClick={() => onChoose(p)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-bold w-full"
                  style={{
                    background: p.popular ? C.gold : C.emerald,
                    color: p.popular ? '#241600' : '#062019',
                  }}
                >
                  Elegir plan <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  const iconEl =
    icon === 'globe' ? (
      <Globe className="size-3.5" />
    ) : icon === 'mail' ? (
      <Mail className="size-3.5" />
    ) : icon === 'shoppingBag' ? (
      <ShoppingBag className="size-3.5" />
    ) : icon === 'truck' ? (
      <Truck className="size-3.5" />
    ) : icon === 'mapPin' ? (
      <MapPin className="size-3.5" />
    ) : (
      <Check className="size-3.5" />
    )
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 0',
        borderBottom: `1px solid ${C.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textDim }}>
        <span style={{ color: C.emerald }}>{iconEl}</span>
        {label}
      </span>
      <span style={{ color: C.text, fontWeight: 600 }}>{value}</span>
    </li>
  )
}

// ===================== TODOS LOS PLANES INCLUYEN =====================
function IncludedAll() {
  const items = [
    { icon: 'globe', title: 'Dominio propio', desc: 'Tu marca online con .com o .ec incluido en cada plan.' },
    { icon: 'palette', title: 'Directorio + álbum', desc: 'Espacio en directorio público y álbum coleccionable digital.' },
  ]
  const iconFor = (k: string) => {
    if (k === 'globe') return <Globe className="size-5" />
    if (k === 'users') return <Users className="size-5" />
    return <Palette className="size-5" />
  }
  return (
    <section id="incluido" style={{ padding: '48px 0', background: `${C.card2}55` }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <SectionHeading
          eyebrow="Incluido en todos"
          title={
            <>
              Todo plan trae <span style={{ color: C.emerald }}>esto</span>
            </>
          }
          subtitle="Tres pilares del ecosistema ImpulsePymes360 disponibles desde el plan Básico."
        />
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-xl p-5"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div
                className="size-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${C.emerald}1F`, color: C.emerald }}
              >
                {iconFor(it.icon)}
              </div>
              <h4
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 16,
                  color: C.text,
                  margin: '0 0 6px',
                }}
              >
                {it.title}
              </h4>
              <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5, margin: 0 }}>{it.desc}</p>
            </div>
          ))}
        </div>
        <ul
          className="mt-6 grid sm:grid-cols-2 gap-2 max-w-[820px] mx-auto"
          style={{ listStyle: 'none', padding: 0 }}
        >
          {INCLUDED_ALL.map((it) => (
            <li
              key={it.label}
              className="flex items-center gap-2 px-3 py-2 rounded-md"
              style={{ background: C.card, border: `1px solid ${C.border}`, fontSize: 13, color: C.textDim }}
            >
              <Check className="size-4" style={{ color: C.emerald }} />
              {it.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ===================== ADD-ONS (mobile-friendly) =====================
function AddonsSection({ onChoose }: { onChoose: (a: Addon) => void }) {
  return (
    <section id="addons" style={{ padding: '48px 0' }}>
      <div className="max-w-[1100px] mx-auto px-4">
        <SectionHeading
          eyebrow="Add-ons"
          title={
            <>
              Servicios <span style={{ color: C.gold }}>adicionales</span>
            </>
          }
          subtitle="Complementos unitarios para potenciar tu operación logística y publicitaria."
        />
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {ADDONS.map((a) => (
            <div
              key={a.id}
              className="rounded-xl p-5"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="size-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${C.gold}1F`, color: C.gold }}
                >
                  {a.icon === 'package' && <Package className="size-5" />}
                  {a.icon === 'truck' && <Truck className="size-5" />}
                  {a.icon === 'mapPin' && <MapPin className="size-5" />}
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded"
                  style={{ background: `${C.gold}1A`, color: C.gold }}
                >
                  Add-on
                </span>
              </div>
              <h4
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.text,
                  margin: '0 0 8px',
                  minHeight: 40,
                }}
              >
                {a.name}
              </h4>
              <div className="mb-4">
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 24, color: C.gold }}>
                  ${fmt(a.price)}
                </span>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 4 }}>{a.unit}</span>
              </div>
              <button
                onClick={() => onChoose(a)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold w-full"
                style={{ background: C.gold, color: '#241600' }}
              >
                Agregar <ChevronRight className="size-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ===================== CTA =====================
function CtaSection({ onWhats, onSeePlans }: { onWhats: () => void; onSeePlans: () => void }) {
  return (
    <section id="contacto" style={{ padding: '64px 0' }}>
      <div className="max-w-[920px] mx-auto px-4">
        <div
          className="rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.borderLight}` }}
        >
          <div
            style={{
              position: 'absolute',
              top: -120,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${C.gold}22 0%, transparent 65%)`,
              pointerEvents: 'none',
            }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{ background: `${C.emerald}1A`, color: C.emerald, border: `1px solid ${C.emerald}55` }}
            >
              <Sparkles className="size-3.5" /> Hablemos
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(28px, 4vw, 40px)',
                color: C.text,
                margin: '0 0 12px',
                letterSpacing: -0.5,
              }}
            >
              ¿Listo para <span style={{ color: C.gold }}>crecer</span>?
            </h2>
            <p style={{ color: C.textDim, fontSize: 16, maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.55 }}>
              Te asesoramos por WhatsApp para elegir el plan ideal según tu rubro y ciudad.
              Activación en menos de 24h.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={onWhats}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: C.emerald, color: '#062019' }}
              >
                <Phone className="size-4" /> WhatsApp {WHATSAPP_DISPLAY}
              </button>
              <a
                href={`mailto:${EMAIL_DISPLAY}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: 'transparent', color: C.gold, border: `1px solid ${C.gold}` }}
              >
                <Mail className="size-4" /> {EMAIL_DISPLAY}
              </a>
              <button
                onClick={onSeePlans}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: 'transparent', color: C.textDim, border: `1px solid ${C.borderLight}` }}
              >
                Ir al marketplace <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===================== FOOTER =====================
function Footer({ onBack }: { onBack: () => void }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.border}`,
        background: C.card2,
        padding: '36px 0 28px',
        marginTop: 'auto',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 20,
                color: C.text,
                marginBottom: 8,
              }}
            >
              IMPULSE<span style={{ color: C.gold }}>PYMES</span>360
            </div>
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55, margin: 0, maxWidth: 320 }}>
              Ecosistema omnicanal para Pymes en Ecuador: marketplace, sitio web, emails, logística y
              publicidad en fundas ecológicas.
            </p>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: C.text,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Contacto
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: C.textDim, lineHeight: 1.8 }}>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5" style={{ color: C.emerald }} /> {EMAIL_DISPLAY}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-3.5" style={{ color: C.emerald }} /> {WHATSAPP_DISPLAY}
              </li>
              <li className="flex items-center gap-2">
                <Globe className="size-3.5" style={{ color: C.emerald }} /> {WEB_DISPLAY}
              </li>
            </ul>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: C.text,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Explora
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm font-semibold w-fit"
                style={{ background: 'transparent', color: C.gold, border: `1px solid ${C.gold}`, padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <ArrowRight className="size-4" /> Volver al portal
              </button>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold w-fit"
                style={{ background: C.emerald, color: '#062019', padding: '8px 14px', borderRadius: 6 }}
              >
                <Phone className="size-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            fontSize: 12,
            color: C.muted,
          }}
        >
          <span>© {new Date().getFullYear()} ImpulsePymes360 · Ecuador</span>
          <span>Planes integrales + add-ons · Hecho con 💛 en Guayaquil</span>
        </div>
      </div>
    </footer>
  )
}

// ===================== SECTION HEADING =====================
function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: React.ReactNode
  subtitle?: string
}) {
  return (
    <div className="text-center mb-2">
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold mb-3"
        style={{ background: `${C.gold}1A`, color: C.gold, border: `1px solid ${C.gold}33` }}
      >
        <Sparkles className="size-3" /> {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          fontSize: 'clamp(26px, 4vw, 38px)',
          color: C.text,
          margin: '0 0 10px',
          letterSpacing: -0.5,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: C.textDim, fontSize: 15, maxWidth: 620, margin: '0 auto', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
