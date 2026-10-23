'use client'

import { useEffect, useState } from 'react'
import {
  Truck,
  Package,
  Building2,
  Smartphone,
  Store,
  Users,
  FileText,
  Newspaper,
  Headphones,
  BookOpen,
  ShoppingBag,
  Globe,
  Check,
  Phone,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Bike,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

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
  blue: '#3B82F6',
  text: '#E8EDF5',
  textDim: '#A0AEC8',
  muted: '#6B7FA0',
  success: '#22C55E',
  rose: '#F43F5E',
  amber: '#F59E0B',
}

const WHATSAPP_URL =
  'https://wa.me/593992689844?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20Fuerza%20Delta'
const WHATSAPP_DISPLAY = '+593 99 268 9844'
const EMAIL_DISPLAY = 'info@impulsepymes360.com'
const WEB_DISPLAY = 'impulsepymes360.com'

// ---------- Componente principal ----------
export function FuerzaDeltaModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [mobileNav, setMobileNav] = useState(false)

  // Inyectar Google Fonts (Outfit + DM Sans)
  useEffect(() => {
    const id = 'fuerza-delta-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const onSolicitar = (planName: string) => {
    toast(`${planName} solicitado — te contactaremos por WhatsApp`)
    window.open(WHATSAPP_URL, '_blank')
  }

  return (
    <div
      className="fuerza-delta-satellite"
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
        onSeePlanes={() => setModule('planes')}
      />

      {/* ===== Hero ===== */}
      <Hero
        onSeeTarifas={() => scrollTo('tarifas')}
        onWhats={() => window.open(WHATSAPP_URL, '_blank')}
      />

      {/* ===== Tarifas por unidad ===== */}
      <Tarifas onSolicitar={onSolicitar} />

      {/* ===== App Deltas + Micro-distribuidores ===== */}
      <Deltas />

      {/* ===== CTA 16+ entregas ===== */}
      <Cta16 onSeePlanes={() => setModule('planes')} />

      {/* ===== Beneficios del Plan Integral incluido ===== */}
      <Beneficios onSeePlanes={() => setModule('planes')} />

      {/* ===== Contacto ===== */}
      <Contacto onSeePlanes={() => setModule('planes')} />

      {/* ===== Footer ===== */}
      <Footer onBackToPortal={() => setModule('marketplace')} />
    </div>
  )
}

// ===================== NAVBAR =====================
function Navbar({
  mobileNav,
  setMobileNav,
  onSeePlanes,
}: {
  mobileNav: boolean
  setMobileNav: (v: boolean) => void
  onSeePlanes: () => void
}) {
  const links = [
    { href: '#tarifas', label: 'Tarifas' },
    { href: '#deltas', label: 'App Deltas' },
    { href: '#beneficios', label: 'Beneficios' },
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
        <a
          href="#top"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: C.text,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Truck className="size-5" style={{ color: C.emerald }} />
          Fuerza <span style={{ color: C.emerald }}>Delta</span>
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
            onClick={onSeePlanes}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: 'transparent', color: C.gold, border: `1px solid ${C.gold}` }}
          >
            Ver planes
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
            <button
              onClick={() => {
                setMobileNav(false)
                onSeePlanes()
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.gold }}
            >
              Ver planes
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

// ===================== HERO =====================
function Hero({ onSeeTarifas, onWhats }: { onSeeTarifas: () => void; onWhats: () => void }) {
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
              style={{
                background: `${C.emerald}1A`,
                color: C.emerald,
                border: `1px solid ${C.emerald}55`,
              }}
            >
              <Sparkles className="size-3.5" />
              Mensajería B2B · Tarifas planas · Ecuador
            </div>
            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(32px, 5vw, 52px)',
                lineHeight: 1.05,
                letterSpacing: -1,
                color: C.text,
              }}
            >
              Ahorra en tus envíos y obtén <span style={{ color: C.emerald }}>GRATIS</span> nuestro
              Plan Integral
            </h1>
            <p style={{ color: C.textDim, fontSize: 17, marginTop: 18, lineHeight: 1.55, maxWidth: 540 }}>
              Por la contratación de nuestras tarifas planas, tu negocio recibe presencia digital
              completa: página web, marketplace, publicidad en fundas ecológicas y más.
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
                $1.75
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                  por entrega · Plan 15 · pago diario
                </p>
                <p style={{ fontSize: 12, color: C.muted }}>
                  Recogida incluida · Sin contratos forzosos
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={onSeeTarifas}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: C.emerald, color: '#062019' }}
              >
                Ver tarifas <ArrowRight className="size-4" />
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
              <p
                style={{
                  color: C.muted,
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                Tarifa plana · Plan 15
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 14vw, 140px)',
                  lineHeight: 1,
                  color: C.gold,
                  marginTop: 8,
                }}
              >
                $1.75
              </p>
              <p
                style={{
                  color: C.textDim,
                  fontSize: 15,
                  marginTop: 4,
                  maxWidth: 320,
                }}
              >
                por entrega · pago diario anticipado · 1 a 15 entregas al día
              </p>
              <div className="flex flex-wrap justify-center gap-2 w-full mt-6">
                {['Pago diario', 'Sin contratos', 'Recogida incluida'].map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${C.emerald}1A`,
                      color: C.emerald,
                      border: `1px solid ${C.emerald}55`,
                    }}
                  >
                    <Check className="size-3" /> {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===================== TARIFAS =====================
function Tarifas({ onSolicitar }: { onSolicitar: (planName: string) => void }) {
  const planes = [
    {
      id: 'plan-5',
      name: 'Plan 5',
      icon: <FileText className="size-5" />,
      price: 2.25,
      volume: '1 a 5 sobres al día',
      features: ['Recogida incluida', 'Seguimiento en tiempo real', 'Pago diario por adelantado'],
      best: false,
    },
    {
      id: 'plan-10',
      name: 'Plan 10',
      icon: <Package className="size-5" />,
      price: 2.0,
      volume: '1 a 10 entregas al día',
      features: ['Recogida incluida', 'Seguimiento en tiempo real', 'Pago diario por adelantado'],
      best: false,
    },
    {
      id: 'plan-15',
      name: 'Plan 15',
      icon: <Building2 className="size-5" />,
      price: 1.75,
      volume: '1 a 15 entregas al día',
      features: ['Recogida incluida', 'Ejecutiva asignada', 'Pago diario por adelantado'],
      best: true,
    },
  ]

  return (
    <Section
      id="tarifas"
      eyebrow="Tarifas por unidad"
      title="Paga solo por lo que envías"
      subtitle="Sin contratos forzosos. Elige la tarifa según tu volumen diario de envíos."
    >
      <div className="grid md:grid-cols-3 gap-5">
        {planes.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl p-6 flex flex-col relative"
            style={{
              background: p.best
                ? `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`
                : C.card,
              border: p.best ? `1px solid ${C.gold}` : `1px solid ${C.borderLight}`,
            }}
          >
            {p.best && (
              <span
                className="absolute -top-3 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: C.gold, color: '#1a1206' }}
              >
                <Sparkles className="size-3" /> Mejor precio
              </span>
            )}
            <div
              className="size-11 rounded-lg flex items-center justify-center mb-4"
              style={{
                background: p.best ? `${C.gold}22` : `${C.emerald}22`,
                color: p.best ? C.gold : C.emerald,
              }}
            >
              {p.icon}
            </div>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: C.text,
              }}
            >
              {p.name}
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{p.volume}</p>

            <div className="mt-4 mb-5">
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 40,
                  color: p.best ? C.gold : C.emerald,
                  lineHeight: 1,
                }}
              >
                ${p.price.toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: C.textDim, marginLeft: 6 }}>por entrega</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check
                    className="size-4 mt-0.5 flex-shrink-0"
                    style={{ color: p.best ? C.gold : C.emerald }}
                  />
                  <span style={{ fontSize: 13, color: C.textDim, lineHeight: 1.45 }}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSolicitar(p.name)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm w-full"
              style={{
                background: p.best ? C.gold : C.emerald,
                color: p.best ? '#1a1206' : '#062019',
              }}
            >
              Solicitar <ChevronRight className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Nota */}
      <div
        className="mt-6 rounded-xl p-4 flex items-start gap-3"
        style={{
          background: `${C.emerald}0F`,
          border: `1px solid ${C.emerald}33`,
        }}
      >
        <ShieldCheck className="size-5 flex-shrink-0" style={{ color: C.emerald }} />
        <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>
          El cobro es <strong style={{ color: C.text }}>diario y anticipado</strong>. Sin facturas
          pendientes ni sorpresas al final del mes.
        </p>
      </div>
    </Section>
  )
}

// ===================== DELTAS (App Deltas + Micro-distribuidores) =====================
function Deltas() {
  return (
    <Section
      id="deltas"
      eyebrow="Parte de Fuerza Delta"
      title="App Deltas + Micro-distribuidores de zona"
      subtitle="Un ecosistema logístico completo: motorizados con app propia y una red de micro-distribuidores locales para cubrir más zonas."
    >
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Card 1 — App Deltas */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
            border: `1px solid ${C.emerald}55`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center"
              style={{ background: `${C.blue}22`, color: C.blue }}
            >
              <Smartphone className="size-6" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.emerald, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
                Para motorizados y clientes
              </p>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: C.text,
                }}
              >
                App Deltas
              </h3>
            </div>
          </div>
          <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.55, marginBottom: 16 }}>
            Plataforma propia para motorizados y clientes. Todo el flujo de entregas en tiempo real
            desde tu celular.
          </p>
          <ul className="space-y-2.5">
            {[
              'Rastreo en tiempo real',
              'Asignación automática de rutas',
              'Notificaciones push al cliente',
              'Historial y comprobantes digitales',
              'Panel de control para motorizados',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="size-4 mt-0.5 flex-shrink-0" style={{ color: C.emerald }} />
                <span style={{ fontSize: 13.5, color: C.textDim, lineHeight: 1.45 }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 2 — Micro-distribuidores */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
            border: `1px solid ${C.gold}55`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center"
              style={{ background: `${C.gold}22`, color: C.gold }}
            >
              <Store className="size-6" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
                Red de zona
              </p>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: C.text,
                }}
              >
                Micro-distribuidores de zona
              </h3>
            </div>
          </div>
          <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.55, marginBottom: 16 }}>
            Red de personas que retiran sobres en el coworking y entregan en su zona. Ideal para
            cubrir áreas alejadas.
          </p>
          <ul className="space-y-2.5">
            {[
              { pre: 'Mínimo ', strong: '10 sobres por zona', post: '' },
              { pre: 'Pago fijo de ', strong: '$1 por sobre', post: '' },
              { pre: 'Aceptación voluntaria', strong: '', post: '' },
              { pre: 'Retiro en el coworking', strong: '', post: '' },
              { pre: 'Plazo de entrega ', strong: '24-48 horas', post: '' },
              { pre: 'Pago al retirar (efectivo o transferencia)', strong: '', post: '' },
              { pre: 'Respaldo de Fuerza Delta si rechazan', strong: '', post: '' },
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="size-4 mt-0.5 flex-shrink-0" style={{ color: C.gold }} />
                <span style={{ fontSize: 13.5, color: C.textDim, lineHeight: 1.45 }}>
                  {f.pre}
                  {f.strong && <strong style={{ color: C.text }}>{f.strong}</strong>}
                  {f.post}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}

// ===================== CTA 16+ ENTREGAS =====================
function Cta16({ onSeePlanes }: { onSeePlanes: () => void }) {
  return (
    <section id="cta-16" style={{ padding: '40px 0' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div
          className="rounded-2xl p-6 sm:p-10 grid lg:grid-cols-[1fr_auto] gap-6 items-center"
          style={{
            background: `linear-gradient(135deg, ${C.gold}22 0%, ${C.emerald}11 100%)`,
            border: `1px solid ${C.gold}55`,
          }}
        >
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ background: `${C.gold}22`, color: C.gold, border: `1px solid ${C.gold}55` }}
            >
              <Sparkles className="size-3.5" /> Plan Integral GRATIS
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(24px, 3vw, 32px)',
                color: C.text,
                lineHeight: 1.15,
              }}
            >
              Contrata <span style={{ color: C.gold }}>16 o más entregas diarias</span>
            </h2>
            <p
              style={{ color: C.textDim, fontSize: 15, marginTop: 12, lineHeight: 1.55, maxWidth: 640 }}
            >
              y obtén <strong style={{ color: C.emerald }}>GRATIS todos los meses</strong> el Plan
              Integral de Marketing y Publicidad, con <strong style={{ color: C.text }}>Enlace Express</strong>{' '}
              (Call Center + Vendedores P2P) incluido.
            </p>
          </div>
          <button
            onClick={onSeePlanes}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm whitespace-nowrap justify-self-start lg:justify-self-end"
            style={{ background: C.gold, color: '#1a1206' }}
          >
            Ver Tarifas Planas <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ===================== BENEFICIOS DEL PLAN INTEGRAL =====================
function Beneficios({ onSeePlanes }: { onSeePlanes: () => void }) {
  const items = [
    { icon: <Bike className="size-5" />, label: 'Entregas diarias' },
    { icon: <Globe className="size-5" />, label: 'Sitio web profesional' },
    { icon: <FileText className="size-5" />, label: 'Catálogo PDF (DimarCatalog)' },
    { icon: <ShoppingBag className="size-5" />, label: 'Espacio en funda' },
    { icon: <Store className="size-5" />, label: 'Productos en marketplace' },
    { icon: <Users className="size-5" />, label: 'Clientes potenciales' },
    { icon: <Newspaper className="size-5" />, label: 'Clasificados (Dimarads)' },
    { icon: <Headphones className="size-5" />, label: 'Enlace Express (Call Center + P2P)' },
    { icon: <BookOpen className="size-5" />, label: 'Revista-Directorio (DimarRevista)' },
  ]
  return (
    <Section
      id="beneficios"
      eyebrow="Plan Integral incluido"
      title="Todo lo que recibes GRATIS cada mes"
      subtitle="Cada plan incluye acceso completo al ecosistema ImpulsePymes360."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-xl p-5 flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div
              className="size-11 rounded-lg flex items-center justify-center mb-3"
              style={{ background: `${C.emerald}22`, color: C.emerald }}
            >
              {it.icon}
            </div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
              {it.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onSeePlanes}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
          style={{ background: C.emerald, color: '#062019' }}
        >
          Ver todos los planes <ArrowRight className="size-4" />
        </button>
      </div>
    </Section>
  )
}

// ===================== CONTACTO =====================
function Contacto({ onSeePlanes }: { onSeePlanes: () => void }) {
  return (
    <Section
      id="contacto"
      eyebrow="Contacto"
      title="¿Listo para activar tu plan?"
      subtitle="Contáctanos y empieza a ahorrar en tus envíos hoy mismo."
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${C.emerald}22 0%, ${C.card} 100%)`,
            border: `1px solid ${C.emerald}55`,
          }}
        >
          <div
            className="size-12 rounded-full flex items-center justify-center"
            style={{ background: C.emerald, color: '#062019' }}
          >
            <Phone className="size-6" />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              WhatsApp
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: C.text,
              }}
            >
              {WHATSAPP_DISPLAY}
            </p>
          </div>
        </a>
        <button
          onClick={onSeePlanes}
          className="rounded-xl p-6 flex items-center gap-4 text-left transition-transform hover:scale-[1.02]"
          style={{ background: C.card, border: `1px solid ${C.borderLight}` }}
        >
          <div
            className="size-12 rounded-full flex items-center justify-center"
            style={{ background: C.gold, color: '#1a1206' }}
          >
            <Sparkles className="size-6" />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
              Planes
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 20,
                color: C.text,
              }}
            >
              Ver Planes y Activar
            </p>
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
      links: ['Marketplace', 'DimarClub', 'PubliBags', 'Fuerza Delta', 'Planes'],
    },
    {
      title: 'Ecosistema',
      links: ['Socios', 'Proveedores', 'Mensajería B2B', 'CRM', 'Email Marketing'],
    },
    {
      title: 'Más servicios',
      links: ['App Deltas', 'Micro-distribuidores', 'Enlace Express', 'DimarCatalog', 'Dimarads'],
    },
    {
      title: 'Contacto',
      links: [WHATSAPP_DISPLAY, EMAIL_DISPLAY, WEB_DISPLAY, 'Guayaquil, Ecuador'],
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
              <h4
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: C.text,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
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

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: C.text,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Truck className="size-4" style={{ color: C.emerald }} />
              Fuerza <span style={{ color: C.emerald }}>Delta</span>
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
