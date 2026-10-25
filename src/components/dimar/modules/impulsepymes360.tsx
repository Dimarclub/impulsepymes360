'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Rocket,
  Users,
  Globe,
  ShoppingCart,
  ClipboardList,
  Newspaper,
  Truck,
  Smartphone,
  Clock,
  ShoppingBag,
  ArrowRight,
  Phone,
  Menu,
  X,
  Sparkles,
  Check,
  ChevronRight,
  CreditCard,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { ModuleId } from '@/lib/types'

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
  cyan: '#22D3EE',
  pink: '#EC4899',
  sky: '#60A5FA',
}

const WHATSAPP_URL =
  'https://wa.me/593992689844?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20ImpulsePymes360'
const WHATSAPP_DISPLAY = '+593 99 268 9844'
const CONTACT_EMAIL = 'info@impulsepymes360.com'

// ---------- Los 9 elementos del sistema ----------
interface ElementoItem {
  n: number
  icon: ReactNode
  title: string
  desc: string
  color: string
  target: ModuleId
  soon?: boolean
}

const ELEMENTOS: ElementoItem[] = [
  {
    n: 1,
    icon: <Users className="size-6" />,
    title: 'Comunidad de consumidores',
    desc: 'Comunidad de potenciales consumidores y divulgadores que consumen y recomiendan sus productos o servicios a cambio de una comisión.',
    color: C.purple,
    target: 'dimarclub',
  },
  {
    n: 2,
    icon: <Globe className="size-6" />,
    title: 'Sitio web profesional',
    desc: 'Un sitio web para el posicionamiento de su empresa en el mundo digital.',
    color: C.cyan,
    target: 'web-express',
  },
  {
    n: 3,
    icon: <ShoppingCart className="size-6" />,
    title: 'Tienda online Marketplace B2C 24/7',
    desc: 'Una tienda online o Marketplace B2C 24/7 donde sus productos están siempre disponibles para la venta.',
    color: C.emerald,
    target: 'marketplace',
  },
  {
    n: 4,
    icon: <ClipboardList className="size-6" />,
    title: 'Directorio digital',
    desc: 'Una ficha con su perfil empresarial en un directorio digital.',
    color: C.amber,
    target: 'directorio',
  },
  {
    n: 5,
    icon: <Newspaper className="size-6" />,
    title: 'Anuncios clasificados',
    desc: 'Una ficha con su perfil empresarial en un portal de anuncios clasificados.',
    color: C.rose,
    target: 'marketplace',
    soon: true,
  },
  {
    n: 6,
    icon: <Truck className="size-6" />,
    title: 'Mensajería y logística',
    desc: 'Servicio exclusivo de mensajería y logística con tarifas planas y app propia para motorizados.',
    color: C.gold,
    target: 'fuerza-delta',
  },
  {
    n: 7,
    icon: <Smartphone className="size-6" />,
    title: 'Social Media',
    desc: 'Social media, toda una comunidad de más de diez mil miembros compartiendo sus productos y servicios por medio de redes sociales.',
    color: C.pink,
    target: 'social-studio',
  },
  {
    n: 8,
    icon: <Clock className="size-6" />,
    title: 'Programador de campañas',
    desc: 'Programador de campañas publicitarias de acuerdo al plan, con auto-poster inteligente.',
    color: C.sky,
    target: 'social-automation',
  },
  {
    n: 9,
    icon: <ShoppingBag className="size-6" />,
    title: 'Publicidad física y móvil (PubliBags)',
    desc: 'Publicidad física y móvil, un código QR con la dirección de su sitio web, oferta, promoción en bolsos que se regalan a miembros de la comunidad para exhibirlos constantemente en la calle.',
    color: C.emerald,
    target: 'publibags',
  },
]

// ---------- Componente principal ----------
export function ImpulsePymes360Module() {
  const setModule = useAppStore((s) => s.setModule)
  const toast = useAppStore((s) => s.toast)
  const [mobileNav, setMobileNav] = useState(false)

  // Inyectar Google Fonts (Outfit + DM Sans)
  useEffect(() => {
    const id = 'impulsepymes360-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
  }, [])

  const go = (target: ModuleId, soon?: boolean) => {
    if (soon) {
      toast('Próximamente: anuncios clasificados', 'info')
      return
    }
    setModule(target)
  }

  return (
    <div
      className="impulsepymes360-portal"
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
        onPlanes={() => setModule('planes')}
      />

      <Hero
        onElementos={() => scrollTo('elementos')}
        onPlanes={() => setModule('planes')}
        onWhats={() => window.open(WHATSAPP_URL, '_blank')}
      />

      <Elementos onDescubrir={go} />

      <CtaMidPlanes onCta={() => setModule('planes')} />

      <CtaPlanes onCta={() => setModule('planes')} />

      <Footer onBackToPortal={() => setModule('marketplace')} />
    </div>
  )
}

// ===================== NAVBAR =====================
function Navbar({
  mobileNav,
  setMobileNav,
  onPlanes,
}: {
  mobileNav: boolean
  setMobileNav: (v: boolean) => void
  onPlanes: () => void
}) {
  const links = [
    { href: '#elementos', label: 'Elementos' },
    { href: '#planes', label: 'Planes' },
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
            fontSize: 20,
            color: C.text,
            textDecoration: 'none',
            letterSpacing: -0.5,
          }}
        >
          IMPULSE<span style={{ color: C.emerald }}>PYMES</span>360
        </a>

        <span
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: `${C.emerald}1A`, color: C.emerald, border: `1px solid ${C.emerald}55` }}
        >
          <Sparkles className="size-3" /> Sistema Integral
        </span>

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
            WhatsApp
          </a>
          <button
            onClick={onPlanes}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold"
            style={{ background: C.gold, color: '#1a1206' }}
          >
            <CreditCard className="size-3.5" /> Ver Planes
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
            <button
              onClick={() => {
                setMobileNav(false)
                onPlanes()
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold"
              style={{ color: C.gold }}
            >
              Ver Planes
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

// ===================== HERO =====================
function Hero({
  onElementos,
  onPlanes,
  onWhats,
}: {
  onElementos: () => void
  onPlanes: () => void
  onWhats: () => void
}) {
  return (
    <section id="top" style={{ position: 'relative', overflow: 'hidden', padding: '64px 0 88px' }}>
      {/* glow */}
      <div
        style={{
          position: 'absolute',
          top: -160,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.emerald}22 0%, ${C.purple}11 45%, transparent 70%)`,
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
              <Rocket className="size-3.5" />
              Sistema de comercialización integral y omnicanal
            </div>

            <h1
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(34px, 5.4vw, 56px)',
                lineHeight: 1.05,
                letterSpacing: -1,
                color: C.text,
              }}
            >
              El sistema que <span style={{ color: C.emerald }}>impulsa</span> tu negocio
            </h1>

            <p style={{ color: C.textDim, fontSize: 17, marginTop: 20, lineHeight: 1.6, maxWidth: 580 }}>
              ImpulsePymes360 es un sistema de comercialización integral y omnicanal diseñado para impulsar
              las ventas y el posicionamiento de pequeñas y medianas empresas tanto en el mercado digital
              como en el mercado físico.
            </p>

            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={onElementos}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: C.emerald, color: '#062019' }}
              >
                Descubrir los elementos <ArrowRight className="size-4" />
              </button>
              <button
                onClick={onPlanes}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: C.gold, color: '#1a1206' }}
              >
                <CreditCard className="size-4" /> Ver Planes
              </button>
              <button
                onClick={onWhats}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm"
                style={{ background: 'transparent', color: C.text, border: `1px solid ${C.borderLight}` }}
              >
                <Phone className="size-4" /> Hablar por WhatsApp
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7">
              {['9 elementos', 'Omnicanal', 'Digital + Físico', 'Desde $122/mes'].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: C.textDim }}
                >
                  <Check className="size-3.5" style={{ color: C.emerald }} /> {b}
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual: big "9" */}
          <div className="relative">
            <div
              className="rounded-2xl p-8 flex flex-col items-center justify-center text-center"
              style={{
                background: `linear-gradient(135deg, ${C.card} 0%, ${C.card2} 100%)`,
                border: `1px solid ${C.borderLight}`,
                minHeight: 360,
              }}
            >
              <p style={{ color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase' }}>
                Elementos del sistema
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900,
                  fontSize: 'clamp(96px, 16vw, 168px)',
                  lineHeight: 1,
                  color: C.emerald,
                  marginTop: 6,
                  textShadow: `0 0 60px ${C.emerald}44`,
                }}
              >
                9
              </p>
              <p style={{ color: C.textDim, fontSize: 15, marginTop: 4, maxWidth: 320 }}>
                Un solo sistema integral que reúne 9 elementos omnicanal para impulsar tu pyme en lo
                digital y lo físico.
              </p>

              <div className="grid grid-cols-3 gap-2 w-full mt-7">
                {ELEMENTOS.slice(0, 9).map((el) => (
                  <div
                    key={el.n}
                    className="rounded-lg p-2 flex flex-col items-center justify-center gap-1"
                    style={{ background: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <span style={{ color: el.color }}>{el.icon}</span>
                    <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {el.n}
                    </span>
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

// ===================== 9 ELEMENTOS =====================
function Elementos({ onDescubrir }: { onDescubrir: (t: ModuleId, soon?: boolean) => void }) {
  return (
    <Section
      id="elementos"
      eyebrow="Los 9 elementos del sistema"
      title="Un ecosistema omnicanal para tu pyme"
      subtitle="Cada elemento trabaja solo o en conjunto con los demás. Contrata un plan integral y actívalos todos con una sola cuota mensual."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ELEMENTOS.map((el) => (
          <div
            key={el.n}
            className="group rounded-2xl p-6 relative transition-transform hover:-translate-y-1"
            style={{
              background: C.card,
              border: `1px solid ${C.borderLight}`,
              transition: 'transform .2s, border-color .2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = el.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.borderLight
            }}
          >
            {/* Número esquina */}
            <span
              className="absolute top-4 right-4 size-7 rounded-full flex items-center justify-center font-bold text-xs"
              style={{ background: `${el.color}1A`, color: el.color, border: `1px solid ${el.color}55` }}
            >
              {el.n}
            </span>

            {/* Icono */}
            <div
              className="size-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
              style={{ background: `${el.color}22`, color: el.color }}
            >
              {el.icon}
            </div>

            <h3
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                color: C.text,
                marginBottom: 8,
                lineHeight: 1.25,
                paddingRight: 32,
              }}
            >
              {el.title}
            </h3>

            <p style={{ fontSize: 13.5, color: C.textDim, lineHeight: 1.55, marginBottom: 18 }}>
              {el.desc}
            </p>

            <button
              onClick={() => onDescubrir(el.target, el.soon)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
              style={{ color: el.color }}
            >
              {el.soon ? 'Próximamente' : 'Descubrir'}
              <ChevronRight className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* CTA centrado a los planes */}
      <div className="text-center mt-10">
        <button
          onClick={() => onDescubrir('planes')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
          style={{ background: C.emerald, color: '#062019' }}
        >
          Ver los 6 planes integrales <ArrowRight className="size-4" />
        </button>
      </div>
    </Section>
  )
}

// ===================== CTA MID PLANES =====================
function CtaMidPlanes({ onCta }: { onCta: () => void }) {
  const beneficios = [
    'Una sola cuota mensual',
    'Activa los 9 elementos',
    'Sin costos ocultos',
  ]
  return (
    <section style={{ padding: '32px 0' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div
          className="rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{
            background: `linear-gradient(135deg, ${C.card2} 0%, ${C.card} 100%)`,
            border: `1px solid ${C.borderLight}`,
          }}
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {beneficios.map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5 text-sm" style={{ color: C.textDim }}>
                <Check className="size-4" style={{ color: C.emerald }} /> {b}
              </span>
            ))}
          </div>
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm shrink-0"
            style={{ background: C.gold, color: '#1a1206' }}
          >
            <CreditCard className="size-4" /> Ver Planes Integrales
          </button>
        </div>
      </div>
    </section>
  )
}

// ===================== CTA PLANES =====================
function CtaPlanes({ onCta }: { onCta: () => void }) {
  return (
    <section id="planes" style={{ padding: '56px 0' }}>
      <div className="max-w-[1280px] mx-auto px-4">
        <div
          className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${C.emerald}22 0%, ${C.purple}1A 50%, ${C.gold}1A 100%)`,
            border: `1px solid ${C.borderLight}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -120,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 520,
              height: 520,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${C.emerald}22 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div className="relative">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{ background: `${C.emerald}22`, color: C.emerald, border: `1px solid ${C.emerald}55` }}
            >
              <Sparkles className="size-3.5" /> Planes integrales
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(26px, 3.8vw, 40px)',
                color: C.text,
                lineHeight: 1.15,
                letterSpacing: -0.5,
                maxWidth: 760,
                margin: '0 auto',
              }}
            >
              ¿Listo para <span style={{ color: C.emerald }}>activar todos los elementos</span>?
            </h2>
            <p style={{ color: C.textDim, fontSize: 16, marginTop: 16, maxWidth: 640, margin: '16px auto 0', lineHeight: 1.55 }}>
              Contrata un plan integral y accede a los 9 elementos del ecosistema con una sola cuota
              mensual. Desde $122/mes.
            </p>
            <button
              onClick={onCta}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-base mt-8"
              style={{ background: C.emerald, color: '#062019' }}
            >
              Ver Planes Integrales <ArrowRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ===================== FOOTER =====================
function Footer({ onBackToPortal }: { onBackToPortal: () => void }) {
  const cols: { title: string; links: string[] }[] = [
    {
      title: 'ImpulsePymes360',
      links: ['Marketplace', 'DimarClub', 'PubliBags', 'Cooperativa', 'Afiliados'],
    },
    {
      title: 'Ecosistema',
      links: ['Socios', 'Proveedores', 'Mensajería', 'CRM', 'Email Marketing'],
    },
    {
      title: 'Más Servicios',
      links: ['Grid 360', 'Web Express', 'Social Studio', 'Directorio', 'Alertas'],
    },
    {
      title: 'Contacto',
      links: [`WhatsApp ${WHATSAPP_DISPLAY}`, CONTACT_EMAIL, 'Guayaquil, Ecuador', 'Lun–Sáb 8am–8pm'],
    },
    {
      title: 'Legal',
      links: ['Términos', 'Privacidad', 'Política de devoluciones', 'PQRS'],
    },
  ]
  return (
    <footer
      id="contacto"
      style={{ background: '#070C18', borderTop: `1px solid ${C.border}`, padding: '48px 0 24px' }}
    >
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
                letterSpacing: -0.5,
              }}
            >
              IMPULSE<span style={{ color: C.emerald }}>PYMES</span>360
            </span>
            <span style={{ fontSize: 12, color: C.muted }}>· Sistema de comercialización integral</span>
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
  children: ReactNode
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
