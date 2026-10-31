'use client'

import { useEffect, useState } from 'react'
import {
  Phone,
  Menu,
  X,
  ArrowRight,
  ArrowDown,
  Share2,
  Rocket,
  Users,
  Target,
  Eye,
  Leaf,
  Recycle,
  Heart,
  HandCoins,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Wrench,
  Ambulance,
  Car,
  Droplets,
  Laptop,
  ShieldCheck,
  Network,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ---------- Paleta oscura (mismo sistema que PubliBags / Fuerza Delta / DimarClub) ----------
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
  text: '#E8EDF5',
  textDim: '#A0AEC8',
  muted: '#6B7FA0',
  success: '#22C55E',
  rose: '#F43F5E',
  amber: '#F59E0B',
  cyan: '#22D3EE',
  pink: '#EC4899',
  sky: '#60A5FA',
}

const WHATSAPP_URL =
  'https://wa.me/593992689844?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20DimarClub'
const WHATSAPP_DISPLAY = '+593 99 268 9844'

// ---------- Componente principal ----------
export function PresentacionModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [mobileNav, setMobileNav] = useState(false)

  // Inyectar Google Fonts (Outfit + DM Sans)
  useEffect(() => {
    const id = 'presentacion-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const onShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = 'Mira esta presentación de DimarClub 🚀'
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`
    if (navigator.share) {
      navigator
        .share({ title: 'Presentación DimarClub', text, url })
        .catch(() => window.open(waUrl, '_blank'))
    } else {
      window.open(waUrl, '_blank')
    }
    toast('Compartiendo presentación…', 'info')
  }

  return (
    <div
      className="presentacion-satellite"
      style={{
        background: C.bg,
        color: C.text,
        minHeight: '100vh',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <Navbar mobileNav={mobileNav} setMobileNav={setMobileNav} onShare={onShare} onJoin={() => scrollTo('cta')} />

      <Hero />
      <QueEs />
      <Fundamentos />
      <Ovm />
      <BeneficiosSocios />
      <PlanCompensacion />
      <Capacitacion />
      <MedioAmbiente />
      <Recursos />
      <CtaFinal />

      <Footer onBackToPortal={() => setModule('marketplace')} />
    </div>
  )
}

// ===================== NAVBAR =====================
function Navbar({
  mobileNav,
  setMobileNav,
  onShare,
  onJoin,
}: {
  mobileNav: boolean
  setMobileNav: (v: boolean) => void
  onShare: () => void
  onJoin: () => void
}) {
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
        <button
          onClick={() => scrollTo('top')}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: C.text,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Dimar<span style={{ color: C.emerald }}>Club</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onShare}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: 'transparent', color: C.gold, border: `1px solid ${C.gold}66` }}
          >
            <Share2 className="size-4" /> Compartir
          </button>
          <button
            onClick={onJoin}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: C.emerald, color: '#062019' }}
          >
            Únete <ArrowRight className="size-4" />
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: C.card, color: C.text, border: `1px solid ${C.borderLight}` }}
          >
            <Phone className="size-3.5" /> {WHATSAPP_DISPLAY}
          </a>
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
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={() => {
                onShare()
                setMobileNav(false)
              }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.gold }}
            >
              <Share2 className="size-4 inline mr-2" /> Compartir presentación
            </button>
            <button
              onClick={() => {
                onJoin()
                setMobileNav(false)
              }}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.emerald }}
            >
              Únete a DimarClub <ArrowRight className="size-4 inline" />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.textDim }}
            >
              <Phone className="size-4 inline mr-2" /> WhatsApp: {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

// ===================== HERO =====================
function Hero() {
  return (
    <section
      id="top"
      style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 96px' }}
    >
      <div
        style={{
          position: 'absolute',
          top: -160,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.emerald}26 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.gold}1A 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[1080px] mx-auto px-4 relative text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-8"
          style={{ background: `${C.emerald}1A`, color: C.emerald, border: `1px solid ${C.emerald}55` }}
        >
          <Sparkles className="size-3.5" /> Presentación de Negocios DimarClub
        </div>

        {/* Big quote */}
        <blockquote
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 500,
            fontSize: 'clamp(18px, 2.4vw, 26px)',
            lineHeight: 1.45,
            color: C.textDim,
            fontStyle: 'italic',
            maxWidth: 880,
            margin: '0 auto 36px',
            borderLeft: `3px solid ${C.emerald}`,
            paddingLeft: 22,
            textAlign: 'left',
          }}
        >
          “Nuestros ingresos tienen que ser tan grandes como nuestras metas y nuestros sueños. De lo
          contrario, tendremos que renunciar a ellos y ser contratados para ayudar a construir los
          sueños de otros a cambio de un sueldo que apenas nos alcanza para subsistir.”
        </blockquote>

        <h1
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(48px, 9vw, 110px)',
            lineHeight: 1,
            letterSpacing: -2,
            color: C.text,
            marginBottom: 14,
          }}
        >
          DIMAR<span style={{ color: C.emerald }}>CLUB</span>
        </h1>
        <p
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 500,
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: C.gold,
            maxWidth: 720,
            margin: '0 auto 32px',
            lineHeight: 1.5,
          }}
        >
          Comunidad de emprendedores con incubadora de emprendimientos, sistema financiero y de
          comercialización
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold text-base"
            style={{ background: C.emerald, color: '#062019' }}
          >
            <Phone className="size-5" /> Quiero unirme
          </a>
          <button
            onClick={() => scrollTo('que-es')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-base"
            style={{ background: 'transparent', color: C.text, border: `1px solid ${C.borderLight}` }}
          >
            Ver presentación <ArrowDown className="size-4" />
          </button>
        </div>
      </div>
    </section>
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
    <section id={id} style={{ padding: '56px 0', borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div style={{ maxWidth: 760, marginBottom: 32 }}>
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
              fontSize: 'clamp(26px, 3.6vw, 40px)',
              color: C.text,
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: C.textDim, fontSize: 15, marginTop: 12, lineHeight: 1.6 }}>{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

// ===================== 2. ¿QUÉ ES DIMARCLUB? =====================
function QueEs() {
  return (
    <Section id="que-es" eyebrow="¿Qué es?" title="¿Qué es DimarClub?">
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{ background: C.card, border: `1px solid ${C.border}`, lineHeight: 1.7 }}
      >
        <p style={{ color: C.textDim, fontSize: 16 }}>
          <span style={{ color: C.emerald, fontWeight: 700 }}>DIMARCLUB</span> es una comunidad de
          emprendedores con incubadora de emprendimientos con su propio sistema financiero y de
          comercialización que consiste en una plataforma de comercio electrónico o{' '}
          <strong style={{ color: C.text }}>Marketplace B2C</strong> que gana comisiones por las
          ventas. Esta comisión es variable, por lo tanto cada cliente especifica en su backoffice.
        </p>
        <p style={{ color: C.textDim, fontSize: 16, marginTop: 16 }}>
          Y una comunidad de potenciales socios consumidores (<em>prosumidores</em>) que aportan con
          capital a partir de <strong style={{ color: C.gold }}>$300</strong> y ganan un{' '}
          <strong style={{ color: C.gold }}>3% mensual</strong> de utilidad de su aporte, y clientes
          que ingresan gratuitamente, quienes además de comprar los productos y servicios de la misma
          para satisfacer sus necesidades, recomiendan a sus familiares y amigos a cambio de
          beneficios por medio de un <strong style={{ color: C.text }}>sistema de afiliados de 3
          niveles</strong>. Todos pueden crear su red.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 mt-7">
          {[
            { k: 'Desde $300', v: 'Aporte de socios', c: C.gold },
            { k: '3% mensual', v: 'Utilidad del aporte', c: C.emerald },
            { k: '3 niveles', v: 'Sistema de afiliados', c: C.purple },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-xl p-4 text-center"
              style={{ background: C.card2, border: `1px solid ${C.border}` }}
            >
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 24, color: s.c }}>
                {s.k}
              </p>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ===================== 3. FUNDAMENTOS =====================
function Fundamentos() {
  const items = [
    { icon: HandCoins, label: 'Venta directa', c: C.emerald },
    { icon: TrendingUp, label: 'Apalancamiento', c: C.gold },
    { icon: Users, label: 'Trabajo en equipo', c: C.purple },
    { icon: Network, label: 'Marketing de afiliados', c: C.cyan },
    { icon: Heart, label: 'Marketing comunitario', c: C.pink },
    { icon: Recycle, label: 'Economía circular y participativa', c: C.emerald },
  ]
  return (
    <Section
      id="fundamentos"
      eyebrow="Fundamentos"
      title="Fundamentos de nuestra organización"
      subtitle="Pilares sobre los que construimos el modelo de DimarClub."
    >
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.label}
              className="rounded-xl p-5 flex items-center gap-3 transition-transform hover:-translate-y-1"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div
                className="size-11 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${it.c}1F`, color: it.c }}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.emerald, fontWeight: 700 }}>✓ Fundamento</p>
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    color: C.text,
                    marginTop: 2,
                  }}
                >
                  {it.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <InfoBox
          title="Economía circular y participativa"
          c={C.emerald}
          text="Modelo económico que busca reducir la generación de residuos mediante el diseño de productos y procesos que maximicen la vida útil de los materiales, extendiendo su ciclo de vida a través de la reutilización, reparación, renovación y reciclaje."
        />
        <InfoBox
          title="Economía popular y solidaria"
          c={C.gold}
          text="Modelo económico que prioriza el bienestar colectivo, la solidaridad y la cooperación por encima del lucro individual. Se caracteriza por la prevalencia del trabajo sobre el capital, la gestión democrática, el comercio justo, y el respeto por la naturaleza y las identidades culturales."
        />
      </div>
    </Section>
  )
}

function InfoBox({ title, text, c }: { title: string; text: string; c: string }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ background: `linear-gradient(135deg, ${c}14 0%, ${C.card} 100%)`, border: `1px solid ${c}44` }}
    >
      <h4
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: 17,
          color: c,
          marginBottom: 8,
        }}
      >
        {title}
      </h4>
      <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.6 }}>{text}</p>
    </div>
  )
}

// ===================== 4. OBJETIVO / VISIÓN / MISIÓN =====================
function Ovm() {
  const cards = [
    { icon: Target, t: 'Objetivo', c: C.gold, d: 'Hacer que cada uno de nuestros miembros logre su libertad financiera.' },
    { icon: Eye, t: 'Visión', c: C.emerald, d: 'Ser el mejor sistema de comercialización y crecimiento personal.' },
    { icon: Rocket, t: 'Misión', c: C.purple, d: 'Ayudar a cambiar el estilo de vida de nuestros miembros proporcionándoles una oportunidad de negocio y capacitación.' },
  ]
  return (
    <Section
      id="ovm"
      eyebrow="Dirección"
      title="Objetivo, Visión y Misión"
      subtitle="El rumbo que guía cada decisión de la comunidad."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.t}
              className="rounded-2xl p-6 transition-transform hover:-translate-y-1"
              style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${c.c}` }}
            >
              <div
                className="size-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${c.c}1F`, color: c.c }}
              >
                <Icon className="size-6" />
              </div>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 22,
                  color: C.text,
                  marginBottom: 8,
                }}
              >
                {c.t}
              </h3>
              <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.6 }}>{c.d}</p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ===================== 5. BENEFICIOS PARA SOCIOS =====================
function BeneficiosSocios() {
  const cards = [
    { emoji: '💰', t: 'Capital semilla', d: 'Capital semilla para emprendimientos propios.', c: C.gold },
    { emoji: '🏪', t: 'Plataforma', d: 'Plataforma para comercializar tus productos y servicios.', c: C.emerald },
    { emoji: '💼', t: 'Trabajo', d: 'Oportunidad de trabajo en cargos administrativos.', c: C.purple },
  ]
  return (
    <Section
      id="beneficios-socios"
      eyebrow="Beneficios"
      title="Beneficios para socios"
      subtitle="Por ser parte activa de la comunidad DimarClub."
    >
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.t}
            className="rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="text-4xl mb-3">{c.emoji}</div>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: c.c,
                marginBottom: 6,
              }}
            >
              {c.t}
            </h3>
            <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.55 }}>{c.d}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== 6. PLAN DE COMPENSACIÓN =====================
function PlanCompensacion() {
  const commissions = [
    { lvl: 'N0', pct: '3%', desc: 'Comisiones de autoconsumo o ventas propias', c: C.emerald },
    { lvl: 'N1', pct: '2%', desc: 'Comisiones de afiliados de primer nivel', c: C.gold },
    { lvl: 'N2', pct: '2%', desc: 'Comisiones de afiliados de segundo nivel', c: C.purple },
    { lvl: 'N3', pct: '2%', desc: 'Comisiones de afiliados de tercer nivel', c: C.cyan },
  ]
  const services = [
    { icon: Truck, t: 'Entrega a domicilio', d: 'Sin costo adicional.', c: C.emerald },
    { icon: Car, t: 'Grúa y auxilio mecánico', d: 'Servicio incluido.', c: C.gold },
    { icon: Wrench, t: 'Servicio técnico eléctrico', d: 'Solo mano de obra.', c: C.purple },
    { icon: Droplets, t: 'Servicio técnico sanitario', d: 'Solo mano de obra.', c: C.cyan },
    { icon: Laptop, t: 'Mantenimiento de computadoras', d: 'Solo mano de obra.', c: C.sky },
    { icon: Car, t: 'Lavado de auto y cambio de aceite', d: 'Solo mano de obra.', c: C.pink },
    { icon: Ambulance, t: 'Servicio de ambulancia', d: 'Para emergencias.', c: C.rose },
  ]
  return (
    <Section
      id="plan"
      eyebrow="Plan de Compensación"
      title="Beneficios para socios y clientes"
      subtitle="Comisiones por ventas y red de afiliados, más servicios incluidos."
    >
      {/* Comisiones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {commissions.map((c) => (
          <div
            key={c.lvl}
            className="rounded-2xl p-5 text-center transition-transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(180deg, ${c.c}18 0%, ${C.card} 100%)`,
              border: `1px solid ${c.c}55`,
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 36,
                color: c.c,
                lineHeight: 1,
              }}
            >
              {c.pct}
            </p>
            <p
              style={{
                fontSize: 11,
                color: C.muted,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginTop: 4,
              }}
            >
              {c.lvl}
            </p>
            <p style={{ fontSize: 13, color: C.textDim, marginTop: 8, lineHeight: 1.45 }}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* Servicios */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <h4
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: C.emerald,
            marginBottom: 14,
          }}
        >
          <ShieldCheck className="size-4 inline mr-2" />
          Servicios incluidos
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.t}
                className="rounded-lg p-3 flex items-center gap-3"
                style={{ background: C.card2, border: `1px solid ${C.border}` }}
              >
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${s.c}1F`, color: s.c }}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: C.text }}>
                    {s.t}
                  </p>
                  <p style={{ fontSize: 12, color: C.muted }}>{s.d}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// ===================== 7. CAPACITACIÓN =====================
function Capacitacion() {
  const sht = [
    { k: 'SER', c: C.emerald, d: 'Quién eres y en quién te conviertes. Valores, actitudes, mentalidad.' },
    { k: 'HACER', c: C.gold, d: 'Las acciones y disciplinas diarias que construyen resultados.' },
    { k: 'TENER', c: C.purple, d: 'Lo que obtienes como fruto de ser y hacer correctamente.' },
  ]
  const problemas = [
    { n: 1, t: 'Sistema educativo caduco', d: 'Basado en memorización y competencia, no en creatividad ni cooperación.' },
    { n: 2, t: 'Comercialización intermediada', d: 'Sistema basado en intermediación que encarece los productos.' },
    { n: 3, t: 'Concentración de riqueza', d: 'El 95% de la riqueza está en el 5% de la población.' },
    { n: 4, t: 'Sobrepoblación', d: 'Desafío global que presiona los recursos del planeta.' },
    { n: 5, t: 'Contaminación ambiental', d: 'Degradación acelerada de ecosistemas y biodiversidad.' },
    { n: 6, t: 'Calentamiento global', d: 'Cambio climático con impactos económicos y sociales.' },
    { n: 7, t: 'Sistema de salud fallido', d: 'Basado en sintomatología, no en prevención ni bienestar real.' },
  ]
  return (
    <Section
      id="capacitacion"
      eyebrow="Capacitación"
      title="Ser · Hacer · Tener"
      subtitle="Reingeniería interior: un individuo se convierte en mejor persona al obtener la capacidad de moldearse, rediseñarse, ajustar y afinar sus valores y actitudes."
    >
      {/* 3 big cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {sht.map((c) => (
          <div
            key={c.k}
            className="rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(180deg, ${c.c}14 0%, ${C.card} 100%)`,
              border: `1px solid ${c.c}55`,
            }}
          >
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: c.c,
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              {c.k}
            </p>
            <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.55 }}>{c.d}</p>
          </div>
        ))}
      </div>

      {/* 7 problemas */}
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <h4
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            color: C.rose,
            marginBottom: 6,
          }}
        >
          <AlertTriangle className="size-4 inline mr-2" />
          7 grandes problemas que enfrentamos en nuestra sociedad
        </h4>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
          DimarClub nace para ofrecer respuestas concretas a estos desafíos.
        </p>

        {/* Stats barra del problema #3 */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: C.card2, border: `1px solid ${C.border}` }}
        >
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Distribución de la riqueza
          </p>
          <div className="flex h-7 rounded-md overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <div style={{ width: '1%', background: C.emerald }} title="1% ricos" />
            <div style={{ width: '4%', background: C.gold }} title="4% solventes" />
            <div style={{ width: '5%', background: C.cyan }} title="5% aún trabajan" />
            <div style={{ width: '28%', background: C.rose }} title="28% fallecen" />
            <div style={{ width: '62%', background: C.muted }} title="62% en quiebra absoluta" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs">
            <Legend color={C.emerald} label="1% ricos" />
            <Legend color={C.gold} label="4% solventes" />
            <Legend color={C.cyan} label="5% aún trabajan" />
            <Legend color={C.rose} label="28% fallecen" />
            <Legend color={C.muted} label="62% quiebra" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {problemas.map((p) => (
            <div
              key={p.n}
              className="rounded-lg p-4"
              style={{ background: C.card2, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: C.rose, color: '#260610' }}
                >
                  {p.n}
                </span>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, color: C.text }}>
                  {p.t}
                </p>
              </div>
              <p style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      <span style={{ color: C.textDim }}>{label}</span>
    </div>
  )
}

// ===================== 8. MEDIO AMBIENTE =====================
function MedioAmbiente() {
  const rs = [
    { k: 'Reciclar', c: C.emerald },
    { k: 'Reducir', c: C.gold },
    { k: 'Reutilizar', c: C.purple },
  ]
  const compromisos = [
    'Decir no al consumo de productos industrializados',
    'Decir no a productos envasados en empaques desechables',
    'Consumir productos en estado natural',
    'Reducir el consumo de gas',
  ]
  return (
    <Section
      id="ambiente"
      eyebrow="Medio Ambiente"
      title="Empezar a cuidar el medio ambiente es urgente"
      subtitle="Las 3R como guía de nuestras decisiones diarias."
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {rs.map((r) => (
          <div
            key={r.k}
            className="rounded-2xl p-6 text-center transition-transform hover:-translate-y-1"
            style={{
              background: `linear-gradient(180deg, ${r.c}14 0%, ${C.card} 100%)`,
              border: `1px solid ${r.c}55`,
            }}
          >
            <div
              className="size-12 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ background: r.c, color: '#062019' }}
            >
              <Recycle className="size-6" />
            </div>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, color: r.c }}>
              {r.k}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: `linear-gradient(135deg, ${C.emerald}12 0%, ${C.card} 100%)`, border: `1px solid ${C.emerald}44` }}
      >
        <h4
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: C.emerald,
            marginBottom: 14,
          }}
        >
          <Leaf className="size-4 inline mr-2" />
          Nuestros compromisos
        </h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {compromisos.map((c) => (
            <div key={c} className="flex items-start gap-2">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" style={{ color: C.emerald }} />
              <p style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5 }}>{c}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ===================== 9. ¿DE DÓNDE SACAMOS LOS RECURSOS? =====================
function Recursos() {
  const emprendimientos = [
    { emoji: '🍫', t: 'Auki', d: 'Compra y procesamiento de cacao, venta de chocolate puro sin químicos.', c: C.gold },
    { emoji: '🍾', t: 'Reciclarte', d: 'Reciclamos botellas de vidrio y las convertimos en arte útil.', c: C.emerald },
    { emoji: '🛒', t: 'Mi Tienda', d: 'Comercializamos +10.000 productos importados (belleza, cuidado personal, juguetería, bazar).', c: C.cyan },
    { emoji: '🥬', t: 'El Agricultor', d: 'Producimos y comercializamos frutas, verduras, víveres.', c: C.success },
    { emoji: '🚌', t: 'DimarTours', d: 'Tours a costa, sierra y oriente, comisiones de hotelería y turismo.', c: C.purple },
    { emoji: '🛵', t: 'Fuerza Delta', d: 'Mensajería B2B.', c: C.amber },
    { emoji: '🏠', t: 'Proyecto Fénix', d: 'Compra, venta y alquiler de bienes raíces.', c: C.sky },
    { emoji: '🏨', t: 'En 2 años', d: 'Transporte, hotelería, turismo, alimentación. Construcción de 4 hoteles con contenedores (Costa, Sierra, Oriente, Matriz Quito). 4 buses de dos pisos para transporte. Tours por Ecuador.', c: C.pink },
  ]
  return (
    <Section
      id="recursos"
      eyebrow="Recursos"
      title="¿De dónde sacamos los recursos para pagar estos beneficios?"
      subtitle="Creamos emprendimientos propios de la comunidad."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {emprendimientos.map((e) => (
          <div
            key={e.t}
            className="rounded-2xl p-5 transition-transform hover:-translate-y-1"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderTop: `3px solid ${e.c}`,
            }}
          >
            <div className="text-3xl mb-3">{e.emoji}</div>
            <h4
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: e.c,
                marginBottom: 6,
              }}
            >
              {e.t}
            </h4>
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55 }}>{e.d}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== 10. CTA FINAL =====================
function CtaFinal() {
  return (
    <section
      id="cta"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '88px 0',
        background: `linear-gradient(135deg, ${C.emerald}18 0%, ${C.bg} 60%)`,
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 720,
          height: 480,
          background: `radial-gradient(ellipse, ${C.emerald}26 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[820px] mx-auto px-4 relative text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: `${C.emerald}1A`, color: C.emerald, border: `1px solid ${C.emerald}55` }}
        >
          <Rocket className="size-3.5" /> Tu momento es ahora
        </div>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(30px, 5vw, 52px)',
            color: C.text,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          Únete a <span style={{ color: C.emerald }}>DIMARCLUB</span> y empieza a construir tus sueños
        </h2>
        <p style={{ color: C.textDim, fontSize: 16, marginTop: 16, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
          Recibe beneficios por lo que has hecho siempre: comprar en otras tiendas.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg"
            style={{ background: C.emerald, color: '#062019' }}
          >
            <Phone className="size-5" /> Hablar por WhatsApp
          </a>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 18 }}>{WHATSAPP_DISPLAY} · Ecuador</p>
      </div>
    </section>
  )
}

// ===================== FOOTER =====================
function Footer({ onBackToPortal }: { onBackToPortal: () => void }) {
  return (
    <footer style={{ background: '#070C18', borderTop: `1px solid ${C.border}`, padding: '40px 0 24px' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 20, color: C.text }}>
              Dimar<span style={{ color: C.emerald }}>Club</span>
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>· por ImpulsePymes360</span>
          </div>
          <button
            onClick={onBackToPortal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold"
            style={{ background: C.card, color: C.textDim, border: `1px solid ${C.border}` }}
          >
            <ArrowRight className="size-4 rotate-180" /> Volver al portal
          </button>
        </div>

        <div className="mt-6 pt-6 text-center" style={{ borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 12, color: C.muted }}>
            © 2026 DimarClub · ImpulsePymes360
          </p>
        </div>
      </div>
    </footer>
  )
}

// ===================== UTIL =====================
function scrollTo(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
