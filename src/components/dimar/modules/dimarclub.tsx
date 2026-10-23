'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Network,
  Sprout,
  HandHeart,
  Smartphone,
  Check,
  CheckCircle2,
  Coins,
  ArrowDown,
  ArrowRight,
  Phone,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  CreditCard,
  Truck,
  Wrench,
  Ambulance,
  Leaf,
  GraduationCap,
  Briefcase,
  Gift,
  Building2,
  Target,
  Home,
  PiggyBank,
  Smile,
  Heart,
  Percent,
  Layers,
  HandCoins,
  Info,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ---------- Paleta oscura (mismo sistema que PubliBags / Fuerza Delta) ----------
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
}

const WHATSAPP_URL =
  'https://wa.me/593992689844?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20DimarClub'
const WHATSAPP_DISPLAY = '+593 99 268 9844'
const EMAIL_DISPLAY = 'info@impulsepymes360.com'
const WEB_DISPLAY = 'impulsepymes360.com'

type Accent = 'emerald' | 'gold' | 'purple'

// ---------- Componente principal ----------
export function DimarClubModule() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [mobileNav, setMobileNav] = useState(false)

  // Inyectar Google Fonts (Outfit + DM Sans)
  useEffect(() => {
    const id = 'dimarclub-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const onTareas = () => {
    toast('Próximamente: Hub de Tareas CPA', 'info')
    setModule('affiliates')
  }

  return (
    <div
      className="dimarclub-satellite"
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
        onConocerRed={() => scrollTo('red')}
        onSeePlanes={() => setModule('planes')}
      />

      {/* ===== ¿Qué es DimarClub? ===== */}
      <QueEs />

      {/* ===== Hub de Tareas CPA ===== */}
      <TareasCPA onCta={onTareas} />

      {/* ===== Red Universal de 3 Niveles ===== */}
      <RedUniversal />

      {/* ===== Beneficios Exclusivos ===== */}
      <Beneficios onSeePlanes={() => setModule('planes')} />

      {/* ===== Rangos de Socios Operativos ===== */}
      <Rangos />

      {/* ===== Sistema de 6 Frascos ===== */}
      <Frascos />

      {/* ===== Stats ===== */}
      <Stats />

      {/* ===== CTA + Contacto ===== */}
      <CtaContacto
        onSeePlanes={() => setModule('planes')}
        onWhats={() => window.open(WHATSAPP_URL, '_blank')}
      />

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
    { href: '#que-es', label: 'Qué es' },
    { href: '#tareas', label: 'Tareas CPA' },
    { href: '#red', label: 'Red Universal' },
    { href: '#beneficios', label: 'Beneficios' },
    { href: '#rangos', label: 'Rangos' },
    { href: '#frascos', label: 'Frascos' },
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
          <Users className="size-5" style={{ color: C.purple }} />
          Dimar<span style={{ color: C.emerald }}>Club</span>
        </a>
        <nav className="hidden xl:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: C.textDim,
                fontSize: 14,
                padding: '8px 10px',
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
            className="xl:hidden p-2 rounded-md"
            style={{ color: C.text, background: C.card }}
            onClick={() => setMobileNav(!mobileNav)}
            aria-label="Menú"
          >
            {mobileNav ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {mobileNav && (
        <div className="xl:hidden border-t" style={{ borderColor: C.border, background: C.card }}>
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
function Hero({ onConocerRed, onSeePlanes }: { onConocerRed: () => void; onSeePlanes: () => void }) {
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
          background: `radial-gradient(circle, ${C.purple}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[1280px] mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{
                background: `${C.purple}1A`,
                color: C.purple,
                border: `1px solid ${C.purple}55`,
              }}
            >
              <Sparkles className="size-3.5" />
              Comunidad · Red de Afiliados · Incubadora · Ecuador
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
              Bienvenido a <span style={{ color: C.purple }}>DimarClub</span>
            </h1>
            <p style={{ color: C.textDim, fontSize: 17, marginTop: 18, lineHeight: 1.55, maxWidth: 560 }}>
              La comunidad donde cada persona puede{' '}
              <strong style={{ color: C.emerald }}>consumir</strong>,{' '}
              <strong style={{ color: C.emerald }}>recomendar</strong>,{' '}
              <strong style={{ color: C.emerald }}>emprender</strong> y{' '}
              <strong style={{ color: C.emerald }}>crecer</strong>. Una Red Universal de 3 Niveles
              donde todos ganan <strong style={{ color: C.emerald }}>el 3% de cada uno de sus 3 niveles</strong> y
              todos pueden llegar lejos.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={onConocerRed}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: C.purple, color: '#fff' }}
              >
                Conocer la Red <ArrowRight className="size-4" />
              </button>
              <button
                onClick={onSeePlanes}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: 'transparent', color: C.text, border: `1px solid ${C.borderLight}` }}
              >
                Ver Planes
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
                Tu red completa
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(80px, 14vw, 140px)',
                  lineHeight: 1,
                  color: C.emerald,
                  marginTop: 8,
                }}
              >
                1.110
              </p>
              <p style={{ color: C.textDim, fontSize: 15, marginTop: 8, maxWidth: 320 }}>
                personas en tu red completa
              </p>
              <div className="flex flex-wrap justify-center gap-2 w-full mt-6">
                {[
                  { label: '3 Niveles', color: C.purple },
                  { label: '3% por nivel', color: C.emerald },
                  { label: '$41.700/mes presupuesto', color: C.gold },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background: `${chip.color}1A`,
                      color: chip.color,
                      border: `1px solid ${chip.color}55`,
                    }}
                  >
                    <Check className="size-3" /> {chip.label}
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

// ===================== ¿QUÉ ES DIMARCLUB? =====================
function QueEs() {
  const roles = [
    {
      icon: <Users className="size-6" />,
      title: 'Comunidad',
      desc: 'Personas que consumen productos y servicios de calidad, con beneficios exclusivos y precios preferenciales.',
      color: C.emerald,
    },
    {
      icon: <Network className="size-6" />,
      title: 'Red de Afiliados',
      desc: 'Cada miembro puede construir su propia Red Universal de 3 Niveles y ganar comisiones por el consumo de su red.',
      color: C.purple,
    },
    {
      icon: <Sprout className="size-6" />,
      title: 'Incubadora',
      desc: 'Capital semilla, capacitación y asesoramiento para que los miembros conviertan sus ideas en emprendimientos reales.',
      color: C.gold,
    },
    {
      icon: <HandHeart className="size-6" />,
      title: 'Mano de Obra',
      desc: 'Los miembros participan en la producción de los emprendimientos propios: fundas, chocolate, artesanías y más.',
      color: C.rose,
    },
  ]
  return (
    <Section
      id="que-es"
      accent="purple"
      eyebrow="¿Qué es DimarClub?"
      title="Mucho más que una comunidad"
      subtitle="DimarClub es el corazón humano de ImpulsePymes360. Es donde las personas se conectan, consumen, producen, recomiendan y construyen patrimonio juntas. No es solo una red de afiliados: es un ecosistema donde todos crecen."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((r) => (
          <div
            key={r.title}
            className="rounded-xl p-5"
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div
              className="size-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${r.color}22`, color: r.color }}
            >
              {r.icon}
            </div>
            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: C.text,
                marginBottom: 6,
              }}
            >
              {r.title}
            </h3>
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== HUB DE TAREAS CPA =====================
function TareasCPA({ onCta }: { onCta: () => void }) {
  const features = [
    'Gana de $0.10 a $0.25 por cada tarea completada',
    'También ganas CPA por las tareas de tu red',
    'Verificación automática — sin trámites',
    'Se acredita en tu billetera al cierre del mes',
    'Sistema de 3 strikes contra el fraude',
  ]
  const tasks = [
    { emoji: '📤', title: 'Comparte la promoción 2x1', provider: 'Ferretería Pepito', reward: '+$0.25' },
    { emoji: '▶️', title: 'Mira el video de Reciclarte', provider: 'Reciclarte', reward: '+$0.15' },
    { emoji: '🔔', title: 'Suscríbete al canal de Auki', provider: 'Auki', reward: '+$0.20' },
  ]
  return (
    <Section
      id="tareas"
      accent="gold"
      eyebrow="Nuevo · Gana dinero por tareas simples"
      title="Hub de Tareas CPA"
      subtitle="Completa tareas simples desde tu celular y gana CPA real por cada acción. Comparte promociones, mira videos de proveedores, suscríbete a sus canales, lee noticias y visita productos. Cada tarea genera valor para ti y para la comunidad."
    >
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Info */}
        <div>
          <ul className="space-y-3 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 mt-0.5 flex-shrink-0" style={{ color: C.gold }} />
                <span style={{ fontSize: 14, color: C.textDim, lineHeight: 1.5 }}>{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
            style={{ background: C.gold, color: '#1a1206' }}
          >
            Ver tareas disponibles <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Mock panel */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
            border: `1px solid ${C.gold}55`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="size-9 rounded-lg flex items-center justify-center"
                style={{ background: `${C.gold}22`, color: C.gold }}
              >
                <Smartphone className="size-5" />
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Tareas destacadas
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Esta semana</p>
              </div>
            </div>
            <div className="text-right">
              <p style={{ fontSize: 11, color: C.muted }}>CPA total</p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 26,
                  color: C.gold,
                  lineHeight: 1,
                }}
              >
                $1.45
              </p>
            </div>
          </div>
          <div className="space-y-2.5">
            {tasks.map((t) => (
              <div
                key={t.title}
                className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: C.bg, border: `1px solid ${C.border}` }}
              >
                <div
                  className="size-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: C.card2 }}
                >
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
                    {t.title}
                  </p>
                  <p style={{ fontSize: 11, color: C.muted }}>{t.provider}</p>
                </div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold flex-shrink-0"
                  style={{ background: `${C.gold}22`, color: C.gold }}
                >
                  {t.reward}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: C.muted, marginTop: 12, textAlign: 'center' }}>
            Ejemplos ilustrativos · Verificación automática al completar
          </p>
        </div>
      </div>
    </Section>
  )
}

// ===================== RED UNIVERSAL DE 3 NIVELES =====================
function RedUniversal() {
  const levels = [
    { n: 1, label: 'Tu Primer Nivel', people: '10 personas', color: C.emerald },
    { n: 2, label: 'Tu Segundo Nivel', people: '100 personas', color: C.purple },
    { n: 3, label: 'Tu Tercer Nivel', people: '1.000 personas', color: C.gold },
  ]
  return (
    <Section
      id="red"
      accent="emerald"
      eyebrow="Red Universal de 3 Niveles"
      title="Todos ganan igual. Todos pueden llegar lejos."
      subtitle="No importa cuándo entras ni cuánto inviertes. Todos ganan el 3% de cada uno de sus 3 niveles. La misma oportunidad para todos."
    >
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Levels stack */}
        <div className="space-y-3">
          {levels.map((lvl, idx) => (
            <div key={lvl.n}>
              <div
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{
                  background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
                  border: `1px solid ${lvl.color}55`,
                }}
              >
                <div
                  className="size-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: `${lvl.color}22`, color: lvl.color, fontFamily: "'Outfit', sans-serif", fontSize: 22 }}
                >
                  N{lvl.n}
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{lvl.label}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{lvl.people}</p>
                </div>
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold"
                  style={{ background: `${lvl.color}22`, color: lvl.color }}
                >
                  3% de comisión
                </span>
              </div>
              {idx < levels.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="size-5" style={{ color: C.muted }} />
                </div>
              )}
            </div>
          ))}

          {/* Highlight box */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4 mt-2"
            style={{
              background: `linear-gradient(135deg, ${C.gold}22 0%, ${C.card} 100%)`,
              border: `1px solid ${C.gold}55`,
            }}
          >
            <div
              className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: C.gold, color: '#1a1206' }}
            >
              <Coins className="size-6" />
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: C.gold,
                  lineHeight: 1,
                }}
              >
                1.110 personas
              </p>
              <p style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>en tu red completa</p>
            </div>
          </div>
        </div>

        {/* Right column: notes */}
        <div className="space-y-4">
          <div
            className="rounded-xl p-4"
            style={{ background: C.card, border: `1px solid ${C.borderLight}` }}
          >
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55 }}>
              Con una red completa y un consumo promedio de{' '}
              <strong style={{ color: C.text }}>$250 por persona</strong>, el presupuesto de tu red sería{' '}
              <strong style={{ color: C.emerald }}>$41.700/mes</strong>. De ahí sale el 3% para cada
              nivel.
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: `${C.purple}0F`, border: `1px solid ${C.purple}33` }}
          >
            <div className="flex items-start gap-2 mb-2">
              <Info className="size-4 mt-0.5 flex-shrink-0" style={{ color: C.purple }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>Presupuesto de comisiones</p>
            </div>
            <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55 }}>
              Base <strong style={{ color: C.text }}>12%</strong> de las ventas de cada red · sube a{' '}
              <strong style={{ color: C.text }}>13%</strong>,{' '}
              <strong style={{ color: C.text }}>14%</strong> o hasta{' '}
              <strong style={{ color: C.gold }}>15% máximo</strong> si el fondo no alcanza. El sobrante
              va a la cartera del fundador (N0).
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ===================== BENEFICIOS EXCLUSIVOS =====================
function Beneficios({ onSeePlanes }: { onSeePlanes: () => void }) {
  const items = [
    { icon: <HandCoins className="size-5" />, title: 'Préstamos con Fondo de Garantía', desc: 'Sin importar tu buró de crédito. Capital semilla desde $5.000 con garantía de DimarClub.' },
    { icon: <TrendingUp className="size-5" />, title: 'Inversión al 3% Mensual', desc: 'Tu capital se acumula y genera utilidad mensual. Retiro después de 5 años.' },
    { icon: <CreditCard className="size-5" />, title: 'Línea de Crédito del 75%', desc: 'Sobre tus haberes por cobrar. Compra mercancía al por mayor y monta tu propio negocio.' },
    { icon: <Truck className="size-5" />, title: 'Entrega a Domicilio Gratis', desc: 'En todas tus compras del marketplace. Fuerza Delta entrega por ti.' },
    { icon: <Wrench className="size-5" />, title: 'Servicios Técnicos Gratis', desc: 'Electricidad, mecánica, sanitarios, computadoras. Solo mano de obra, tú pones los materiales.' },
    { icon: <Ambulance className="size-5" />, title: 'Ambulancia Gratis', desc: 'Emergencias dentro de la ciudad. También auxilio mecánico y grúa para tu auto.' },
    { icon: <Leaf className="size-5" />, title: 'Medicina Ancestral', desc: 'Consultas gratuitas con terapeutas de medicina ancestral. Sin químicos, con enfoque natural.' },
    { icon: <GraduationCap className="size-5" />, title: 'Capacitación Ser-Hacer-Tener', desc: 'Reingeniería interior y formación técnica. Aprende a gestionar tu dinero y tu vida.' },
    { icon: <Briefcase className="size-5" />, title: 'Oportunidades de Trabajo', desc: 'Cargos administrativos y operativos según tu preparación y experiencia.' },
    { icon: <Gift className="size-5" />, title: 'Fundas Numeradas con Descuentos', desc: 'Las fundas Publibags van numeradas y reemplazan a los cupones tradicionales. Descuentos exclusivos para miembros.' },
    { icon: <Users className="size-5" />, title: 'Reuniones Semanales', desc: 'Sábados 10 AM. Presentaciones de negocio, capacitación y comunidad.' },
    { icon: <Building2 className="size-5" />, title: 'Coworking', desc: '$150/mes con salón de eventos incluido. Servicios básicos, café y 10 horas de salón.' },
    { icon: <Target className="size-5" />, title: 'Hub de Tareas CPA', desc: 'Gana CPA real completando tareas simples: comparte, mira videos, suscríbete, visita productos. También ganas por las tareas de tu red.', destacado: true },
  ]
  return (
    <Section
      id="beneficios"
      accent="gold"
      eyebrow="Beneficios Exclusivos"
      title="¿Qué ganas siendo parte de DimarClub?"
      subtitle="Beneficios reales, no promesas. Cada miembro accede a un ecosistema completo de servicios."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-xl p-4 transition-transform hover:scale-[1.02]"
            style={{
              background: it.destacado
                ? `linear-gradient(135deg, ${C.gold}22 0%, ${C.card} 100%)`
                : C.card,
              border: it.destacado ? `1px solid ${C.gold}` : `1px solid ${C.borderLight}`,
            }}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center mb-3"
              style={{
                background: it.destacado ? `${C.gold}33` : `${C.emerald}22`,
                color: it.destacado ? C.gold : C.emerald,
              }}
            >
              {it.icon}
            </div>
            <h4
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                marginBottom: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {it.title}
              {it.destacado && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                  style={{ background: C.gold, color: '#1a1206' }}
                >
                  Destacado
                </span>
              )}
            </h4>
            <p style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.45 }}>{it.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={onSeePlanes}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
          style={{ background: C.gold, color: '#1a1206' }}
        >
          Ver Planes <ArrowRight className="size-4" />
        </button>
      </div>
    </Section>
  )
}

// ===================== RANGOS DE SOCIOS OPERATIVOS =====================
function Rangos() {
  const rangos = [
    { emoji: '🔥', name: 'Fénix', price: 300, bono: '+0.2%', desc: 'El punto de entrada. Inversión mínima, misma oportunidad.', color: C.rose },
    { emoji: '⚡', name: 'Delta', price: 600, bono: '+0.3%', desc: 'Para quienes quieren crecer más rápido.', color: C.amber },
    { emoji: '💎', name: 'Omega', price: 900, bono: '+0.4%', desc: 'Mayor inversión, mayor retorno mensual.', color: C.emerald },
    { emoji: '👑', name: 'Sigma', price: 1200, bono: '+0.5%', desc: 'Para líderes que quieren construir patrimonio.', color: C.purple },
    { emoji: '🏆', name: 'Alpha', price: 1500, bono: '+0.6%', desc: 'El rango más alto. Máximo retorno y liderazgo.', color: C.gold },
  ]
  return (
    <Section
      id="rangos"
      accent="gold"
      eyebrow="Rangos de Socios Operativos"
      title="5 rangos. Una sola meta: crecer juntos."
      subtitle="Los socios operativos invierten desde $300 y ganan un bono adicional sobre las ventas de su red. A mayor rango, mayor bono. Todos ganan además el 3% de su red de 3 niveles."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {rangos.map((r) => (
          <div
            key={r.name}
            className="rounded-2xl p-5 relative flex flex-col"
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
              border: `1px solid ${r.color}55`,
            }}
          >
            <div
              className="absolute -top-3 -left-3 size-10 rounded-full flex items-center justify-center text-lg"
              style={{ background: C.bg, border: `1px solid ${r.color}55` }}
            >
              {r.emoji}
            </div>
            <div className="mt-3">
              <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Rango
              </p>
              <h3
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: C.text,
                }}
              >
                {r.name}
              </h3>
            </div>
            <div className="mt-4">
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 32,
                  color: r.color,
                  lineHeight: 1,
                }}
              >
                ${r.price.toLocaleString('es-EC')}
              </p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>inversión mensual</p>
            </div>
            <div
              className="mt-3 mb-3 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-bold"
              style={{ background: `${C.gold}22`, color: C.gold }}
            >
              {r.bono} de bono
            </div>
            <p style={{ fontSize: 12.5, color: C.textDim, lineHeight: 1.45, marginTop: 'auto' }}>
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div
        className="mt-6 rounded-xl p-4 flex items-start gap-3"
        style={{ background: `${C.emerald}0F`, border: `1px solid ${C.emerald}33` }}
      >
        <Info className="size-5 flex-shrink-0 mt-0.5" style={{ color: C.emerald }} />
        <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55 }}>
          <strong style={{ color: C.text }}>Todos los socios</strong> ganan el{' '}
          <strong style={{ color: C.emerald }}>3% de su Red Universal de 3 Niveles</strong>, más el{' '}
          <strong style={{ color: C.emerald }}>3% de su inversión mensual</strong>, más el{' '}
          <strong style={{ color: C.gold }}>bono según su rango</strong>, más el{' '}
          <strong style={{ color: C.purple }}>CPA de las tareas completadas</strong>.
        </p>
      </div>
    </Section>
  )
}

// ===================== SISTEMA DE 6 FRASCOS =====================
function Frascos() {
  const frascos = [
    { icon: <Home className="size-5" />, pct: '50%', label: 'Necesidades', color: C.emerald },
    { icon: <TrendingUp className="size-5" />, pct: '10%', label: 'Libertad Financiera', color: C.gold },
    { icon: <PiggyBank className="size-5" />, pct: '10%', label: 'Ahorro', color: C.purple },
    { icon: <GraduationCap className="size-5" />, pct: '10%', label: 'Educación', color: C.rose },
    { icon: <Smile className="size-5" />, pct: '10%', label: 'Ocio', color: C.amber },
    { icon: <Heart className="size-5" />, pct: '10%', label: 'Donaciones', color: C.emerald },
  ]
  return (
    <Section
      id="frascos"
      accent="purple"
      eyebrow="Sistema de 6 Frascos"
      title="Tu dinero, organizado y trabajando para ti"
      subtitle="Cada vez que cobras, tu dinero se divide automáticamente en 6 frascos. Tú decides los porcentajes. Nosotros te ayudamos a organizarte."
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {frascos.map((f) => (
          <div
            key={f.label}
            className="rounded-xl p-4 text-center"
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ background: `${f.color}22`, color: f.color }}
            >
              {f.icon}
            </div>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: 28,
                color: f.color,
                lineHeight: 1,
              }}
            >
              {f.pct}
            </p>
            <p style={{ fontSize: 12, color: C.textDim, marginTop: 6, lineHeight: 1.3 }}>{f.label}</p>
          </div>
        ))}
      </div>

      <div
        className="mt-6 rounded-xl p-4 flex items-start gap-3"
        style={{ background: `${C.purple}0F`, border: `1px solid ${C.purple}33` }}
      >
        <Sparkles className="size-5 flex-shrink-0 mt-0.5" style={{ color: C.purple }} />
        <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.55 }}>
          Basado en el sistema de frascos de <strong style={{ color: C.text }}>T. Harv Eker</strong>.
          Educación financiera real para todos nuestros miembros.
        </p>
      </div>
    </Section>
  )
}

// ===================== STATS =====================
function Stats() {
  const stats = [
    { icon: <Users className="size-5" />, value: '1.110', label: 'Miembros por red completa', color: C.emerald },
    { icon: <Layers className="size-5" />, value: '3', label: 'Niveles de red', color: C.purple },
    { icon: <Percent className="size-5" />, value: '3%', label: 'Por nivel', color: C.gold },
    { icon: <Coins className="size-5" />, value: '3%', label: 'Por inversión mensual', color: C.emerald },
    { icon: <CreditCard className="size-5" />, value: '75%', label: 'Línea de crédito', color: C.purple },
    { icon: <Target className="size-5" />, value: '$0.10+', label: 'Por tarea CPA', color: C.gold },
  ]
  return (
    <Section
      id="stats"
      accent="emerald"
      eyebrow="DimarClub en números"
      title="Lo que estamos construyendo juntos"
      subtitle=""
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 text-center"
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ background: `${s.color}22`, color: s.color }}
            >
              {s.icon}
            </div>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: 30,
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <p style={{ fontSize: 11.5, color: C.textDim, marginTop: 6, lineHeight: 1.35 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ===================== CTA + CONTACTO =====================
function CtaContacto({ onSeePlanes, onWhats }: { onSeePlanes: () => void; onWhats: () => void }) {
  return (
    <section id="contacto" style={{ padding: '60px 0', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 400,
          background: `radial-gradient(ellipse, ${C.purple}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="max-w-[1280px] mx-auto px-4 relative">
        <div
          className="rounded-2xl p-8 sm:p-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${C.purple}22 0%, ${C.emerald}11 100%)`,
            border: `1px solid ${C.purple}55`,
          }}
        >
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: C.text,
              lineHeight: 1.1,
            }}
          >
            ¿Listo para ser parte de <span style={{ color: C.purple }}>DimarClub</span>?
          </h2>
          <p
            style={{
              color: C.textDim,
              fontSize: 16,
              marginTop: 14,
              maxWidth: 580,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.55,
            }}
          >
            Únete a la comunidad donde todos ganan. Construye tu red, emprende y crece con nosotros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={onSeePlanes}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm"
              style={{ background: C.gold, color: '#1a1206' }}
            >
              Ver Planes <ArrowRight className="size-4" />
            </button>
            <button
              onClick={onWhats}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold text-sm"
              style={{ background: C.emerald, color: '#062019' }}
            >
              <Phone className="size-4" /> Hablar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
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
      links: ['Cooperativa', 'Incubadora', 'Hub de Tareas CPA', 'Coworking', 'Afiliados'],
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
              <Users className="size-4" style={{ color: C.purple }} />
              Dimar<span style={{ color: C.emerald }}>Club</span>
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
  accent = 'emerald',
  children,
}: {
  id: string
  eyebrow: string
  title: string
  subtitle?: string
  accent?: Accent
  children: React.ReactNode
}) {
  const accentColor = accent === 'gold' ? C.gold : accent === 'purple' ? C.purple : C.emerald
  return (
    <section id={id} style={{ padding: '56px 0' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div style={{ maxWidth: 720, marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: accentColor,
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
