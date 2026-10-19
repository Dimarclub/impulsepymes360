'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import { ImageUpload } from '@/components/dimar/image-upload'
import { useAppStore } from '@/lib/store'
import type { WebsiteExpress } from '@/lib/types'
import {
  Globe,
  Eye,
  Pencil,
  ExternalLink,
  Loader2,
  Save,
  Sparkles,
  LayoutTemplate,
  Palette,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
  Music2,
  ShoppingCart,
  Store,
  ChevronRight,
  ArrowRight,
  Plus,
  Search,
  Check,
  Settings2,
} from 'lucide-react'

// ===================== Tipos locales =====================

interface BusinessHours {
  mon: string
  tue: string
  wed: string
  thu: string
  fri: string
  sat: string
  sun: string
}

interface SocialLinks {
  instagram?: string
  facebook?: string
  tiktok?: string
  whatsapp?: string
}

interface ProviderLite {
  companyName: string
  category?: string | null
  city?: string | null
  logoUrl?: string | null
  coverUrl?: string | null
  description?: string | null
  phone?: string | null
  mobile?: string | null
  address?: string | null
}

interface SiteWithProvider extends WebsiteExpress {
  provider?: ProviderLite | null
  updatedAt?: string
  metaTitle?: string | null
  metaDescription?: string | null
}

interface PreviewProduct {
  id: string
  name: string
  price: number
  compareAtPrice?: number | null
  imageUrl?: string | null
  slug: string
}

/** Sitio normalizado para el preview (businessHours/socialLinks ya parseados). */
interface PreviewSite {
  id: string
  slug: string
  template: string
  primaryColor: string
  accentColor: string
  heroTitle: string
  heroSubtitle: string
  heroImageUrl: string
  aboutText: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  contactAddress: string
  businessHours: BusinessHours | null
  socialLinks: SocialLinks | null
  published: boolean
  views: number
  updatedAt: string
  provider: ProviderLite | null
}

interface EditorForm {
  template: string
  primaryColor: string
  accentColor: string
  heroTitle: string
  heroSubtitle: string
  heroImageUrl: string
  aboutText: string
  contactEmail: string
  contactPhone: string
  contactWhatsapp: string
  contactAddress: string
  businessHours: BusinessHours
  socialLinks: SocialLinks
  metaTitle: string
  metaDescription: string
  published: boolean
}

// ===================== Constantes =====================

const TEMPLATES = [
  {
    key: 'classic',
    label: 'Clásico',
    desc: 'Hero dividido en dos columnas, secciones apiladas verticalmente.',
  },
  {
    key: 'modern',
    label: 'Moderno',
    desc: 'Hero a pantalla completa con overlay, fondos alternados.',
  },
  {
    key: 'minimal',
    label: 'Minimal',
    desc: 'Sin imagen hero, tipografía limpia y mucho espacio en blanco.',
  },
  {
    key: 'vibrant',
    label: 'Vibrante',
    desc: 'Colores bold, gradientes y divisores diagonales.',
  },
] as const

const COLOR_PRESETS = [
  { label: 'Esmeralda / Ámbar', primary: '#0d9488', accent: '#d97706' },
  { label: 'Azul / Marino', primary: '#2563eb', accent: '#1e3a8a' },
  { label: 'Rojo / Naranja', primary: '#dc2626', accent: '#f97316' },
  { label: 'Púrpura / Rosa', primary: '#9333ea', accent: '#ec4899' },
  { label: 'Gris / Dorado', primary: '#475569', accent: '#d4af37' },
] as const

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABELS: Record<string, string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

const EMPTY_HOURS: BusinessHours = {
  mon: '9-18',
  tue: '9-18',
  wed: '9-18',
  thu: '9-18',
  fri: '9-18',
  sat: '9-14',
  sun: 'closed',
}

const EMPTY_SOCIAL: SocialLinks = {}

// ===================== Helpers =====================

function parseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    const v = JSON.parse(raw)
    return (v ?? fallback) as T
  } catch {
    return fallback
  }
}

function safeStr(v: string | null | undefined): string {
  return (v ?? '').trim()
}

function normalizePhone(n: string): string {
  return (n || '').replace(/[^\d]/g, '')
}

function whatsappUrl(n?: string | null): string | null {
  const digits = normalizePhone(n || '')
  if (!digits) return null
  return `https://wa.me/${digits}`
}

function socialUrl(platform: keyof SocialLinks, handle?: string | null): string | null {
  if (!handle) return null
  const h = handle.trim().replace(/^@/, '')
  if (!h) return null
  if (h.startsWith('http')) return h
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${h}`
    case 'facebook':
      return `https://facebook.com/${h}`
    case 'tiktok':
      return `https://tiktok.com/@${h}`
    case 'whatsapp':
      return whatsappUrl(h)
    default:
      return h
  }
}

function formatPrice(n: number): string {
  return '$' + n.toLocaleString('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(d: string | Date | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

/** Convierte un WebsiteExpress (con businessHours/socialLinks como string) en PreviewSite. */
function toPreviewSite(s: SiteWithProvider): PreviewSite {
  return {
    id: s.id,
    slug: s.slug,
    template: s.template || 'classic',
    primaryColor: s.primaryColor || '#0d9488',
    accentColor: s.accentColor || '#d97706',
    heroTitle: safeStr(s.heroTitle),
    heroSubtitle: safeStr(s.heroSubtitle),
    heroImageUrl: safeStr(s.heroImageUrl),
    aboutText: safeStr(s.aboutText),
    contactEmail: safeStr(s.contactEmail),
    contactPhone: safeStr(s.contactPhone),
    contactWhatsapp: safeStr(s.contactWhatsapp),
    contactAddress: safeStr(s.contactAddress),
    businessHours: parseJSON<BusinessHours | null>(s.businessHours, null),
    socialLinks: parseJSON<SocialLinks | null>(s.socialLinks, null),
    published: s.published,
    views: s.views,
    updatedAt: s.updatedAt || '',
    provider: s.provider ?? null,
  }
}

// ===================== Mini preview de plantilla =====================

function TemplateMiniPreview({ template, primary, accent }: { template: string; primary: string; accent: string }) {
  return (
    <div
      className="h-16 w-full rounded-md overflow-hidden border bg-white relative"
      aria-hidden
    >
      {template === 'classic' && (
        <div className="flex h-full">
          <div className="w-1/2 p-1.5 flex flex-col justify-center gap-1">
            <div className="h-1.5 w-3/4 rounded" style={{ background: primary }} />
            <div className="h-1 w-full rounded bg-gray-200" />
            <div className="h-1 w-2/3 rounded bg-gray-200" />
            <div className="h-2 w-1/2 rounded mt-0.5" style={{ background: primary }} />
          </div>
          <div className="w-1/2" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
        </div>
      )}
      {template === 'modern' && (
        <div className="h-full relative" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="h-1.5 w-1/2 rounded bg-white/90" />
            <div className="h-1 w-1/3 rounded bg-white/60" />
            <div className="h-2 w-1/4 rounded bg-white mt-0.5" />
          </div>
        </div>
      )}
      {template === 'minimal' && (
        <div className="h-full flex flex-col items-center justify-center gap-1 bg-white">
          <div className="h-1 w-1/3 rounded bg-gray-800" />
          <div className="h-1 w-1/2 rounded bg-gray-300" />
          <div className="h-1.5 w-1/4 rounded mt-1" style={{ background: primary }} />
        </div>
      )}
      {template === 'vibrant' && (
        <div className="h-full relative" style={{ background: `linear-gradient(120deg, ${primary}, ${accent})` }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="h-2 w-3/4 rounded bg-white" />
            <div className="h-1 w-1/2 rounded bg-white/70" />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-3 bg-white"
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}
          />
        </div>
      )}
    </div>
  )
}

// ===================== WebsitePreview =====================

function SocialIcons({ social, size = 'sm' }: { social: SocialLinks | null; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'size-9' : 'size-7'
  const iconSz = size === 'md' ? 'size-4' : 'size-3.5'
  const items: { key: keyof SocialLinks; Icon: typeof Instagram; label: string }[] = [
    { key: 'instagram', Icon: Instagram, label: 'Instagram' },
    { key: 'facebook', Icon: Facebook, label: 'Facebook' },
    { key: 'tiktok', Icon: Music2, label: 'TikTok' },
    { key: 'whatsapp', Icon: MessageCircle, label: 'WhatsApp' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map(({ key, Icon, label }) => {
        const handle = social?.[key]
        const url = socialUrl(key, handle)
        if (!url) return null
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            className={`${sz} grid place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-900 hover:text-white transition-colors`}
          >
            <Icon className={iconSz} />
          </a>
        )
      })}
    </div>
  )
}

function WebsitePreview({ site, products }: { site: PreviewSite; products: PreviewProduct[] }) {
  const primary = site.primaryColor || '#0d9488'
  const accent = site.accentColor || '#d97706'
  const template = site.template || 'classic'
  const company = site.provider?.companyName || 'Mi Negocio'
  const logo = site.provider?.logoUrl || null
  const cover = site.provider?.coverUrl || null
  const heroImg = site.heroImageUrl || cover || null
  const hours = site.businessHours
  const social = site.socialLinks || {}
  const initial = company.charAt(0).toUpperCase()
  const year = new Date().getFullYear()

  const heroTitle = site.heroTitle || company
  const heroSubtitle = site.heroSubtitle || site.provider?.description || ''

  // Fondos por plantilla
  const aboutBg = template === 'modern' ? 'bg-gray-50' : 'bg-white'
  const productsBg =
    template === 'modern' ? 'bg-white' : template === 'vibrant' ? 'bg-gray-50' : 'bg-gray-50'
  const contactBg = template === 'minimal' ? 'bg-white' : 'bg-gray-50'

  return (
    <div className="bg-white text-gray-900 scroll-smooth" style={{ color: '#111827' }}>
      {/* ---------- Nav bar ---------- */}
      <header
        className="sticky top-0 z-20"
        style={{ background: template === 'minimal' ? '#ffffff' : primary, color: template === 'minimal' ? '#111827' : '#ffffff' }}
      >
        <div className="border-b" style={{ borderColor: template === 'minimal' ? '#e5e7eb' : 'rgba(255,255,255,0.15)' }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              {logo ? (
                <img src={logo} alt={company} className="h-8 w-8 rounded-full object-cover bg-white/20" />
              ) : (
                <div
                  className="h-8 w-8 rounded-full grid place-items-center font-bold text-sm shrink-0"
                  style={{
                    background: template === 'minimal' ? primary : 'rgba(255,255,255,0.2)',
                    color: template === 'minimal' ? '#fff' : '#fff',
                  }}
                >
                  {initial}
                </div>
              )}
              <span className="font-bold truncate">{company}</span>
            </div>
            <nav className="hidden sm:flex items-center gap-5 text-sm">
              <a href="#inicio" className="opacity-90 hover:opacity-100">Inicio</a>
              <a href="#nosotros" className="opacity-90 hover:opacity-100">Nosotros</a>
              <a href="#productos" className="opacity-90 hover:opacity-100">Productos</a>
              <a href="#contacto" className="opacity-90 hover:opacity-100">Contacto</a>
            </nav>
            <a
              href="#contacto"
              className="text-xs font-semibold px-3.5 py-2 rounded-lg shrink-0"
              style={{
                background: template === 'minimal' ? primary : accent,
                color: '#fff',
              }}
            >
              Contactar
            </a>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      {template === 'classic' && (
        <section id="inicio" className="max-w-5xl mx-auto px-4 py-12 sm:py-16 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: primary }}>
              {heroTitle}
            </h1>
            {heroSubtitle && <p className="mt-3 text-gray-600 text-base sm:text-lg">{heroSubtitle}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#productos"
                className="text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm"
                style={{ background: primary }}
              >
                Ver productos
              </a>
              <a
                href="#contacto"
                className="border-2 px-5 py-2.5 rounded-lg font-semibold text-sm"
                style={{ borderColor: primary, color: primary }}
              >
                Contactar
              </a>
            </div>
          </div>
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
            {heroImg ? (
              <img src={heroImg} alt={company} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
            )}
          </div>
        </section>
      )}

      {template === 'modern' && (
        <section
          id="inicio"
          className="relative min-h-[380px] sm:min-h-[460px] flex items-center justify-center text-center text-white overflow-hidden"
        >
          {heroImg ? (
            <>
              <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}e6, ${accent}cc)` }} />
            </>
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
          )}
          <div className="relative z-10 max-w-2xl px-4 py-16">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{heroTitle}</h1>
            {heroSubtitle && <p className="mt-4 text-lg text-white/90">{heroSubtitle}</p>}
            <div className="mt-7 flex flex-wrap gap-3 justify-center">
              <a
                href="#productos"
                className="bg-white px-5 py-2.5 rounded-lg font-semibold text-sm"
                style={{ color: primary }}
              >
                Ver productos
              </a>
              <a
                href="#contacto"
                className="border-2 border-white px-5 py-2.5 rounded-lg font-semibold text-sm"
              >
                Contactar
              </a>
            </div>
          </div>
        </section>
      )}

      {template === 'minimal' && (
        <section id="inicio" className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: primary }}>
            {company}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">{heroTitle}</h1>
          {heroSubtitle && <p className="mt-4 text-lg text-gray-500">{heroSubtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
            <a href="#productos" className="font-semibold inline-flex items-center gap-1" style={{ color: primary }}>
              Ver productos <ArrowRight className="size-4" />
            </a>
            <span className="text-gray-300">·</span>
            <a href="#contacto" className="font-semibold inline-flex items-center gap-1" style={{ color: primary }}>
              Contactar <ArrowRight className="size-4" />
            </a>
          </div>
        </section>
      )}

      {template === 'vibrant' && (
        <section
          id="inicio"
          className="relative py-20 text-center text-white overflow-hidden"
          style={{ background: `linear-gradient(120deg, ${primary}, ${accent})` }}
        >
          <div className="max-w-2xl mx-auto px-4 relative z-10">
            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {company}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-none">{heroTitle}</h1>
            {heroSubtitle && <p className="mt-4 text-lg font-semibold text-white/90">{heroSubtitle}</p>}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <a
                href="#productos"
                className="bg-white px-6 py-3 rounded-full font-bold uppercase text-xs tracking-wide"
                style={{ color: primary }}
              >
                Ver productos
              </a>
              <a
                href="#contacto"
                className="border-2 border-white px-6 py-3 rounded-full font-bold uppercase text-xs tracking-wide"
              >
                Contactar
              </a>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-10 bg-white"
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }}
          />
        </section>
      )}

      {/* ---------- ABOUT ---------- */}
      <section id="nosotros" className={aboutBg}>
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className={template === 'minimal' ? 'max-w-2xl mx-auto text-center' : ''}>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: accent }}
            >
              Nosotros
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: template === 'vibrant' ? primary : '#111827' }}
            >
              {template === 'vibrant' ? `Sobre ${company}` : `Conoce a ${company}`}
            </h2>
            {site.aboutText ? (
              <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                {site.aboutText}
              </p>
            ) : (
              <p className="text-gray-400 italic">
                {site.provider?.description || 'Aún no hemos agregado una descripción.'}
              </p>
            )}
            {site.provider?.category && (
              <div className="mt-5">
                <span
                  className="inline-flex items-center text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  <Store className="size-3.5 mr-1.5" />
                  {site.provider.category}
                  {site.provider.city ? ` · ${site.provider.city}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ---------- PRODUCTS ---------- */}
      <section id="productos" className={productsBg}>
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                Catálogo
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: template === 'vibrant' ? primary : '#111827' }}
              >
                Nuestros productos
              </h2>
            </div>
            {products.length > 0 && (
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: primary }}
              >
                Ver todo <ChevronRight className="size-4" />
              </a>
            )}
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
              <ShoppingCart className="size-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Aún no hay productos publicados en el marketplace.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Los productos que publiques aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl bg-white border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center"
                        style={{ background: `linear-gradient(135deg, ${primary}15, ${accent}15)` }}
                      >
                        <ShoppingCart className="size-7" style={{ color: primary }} />
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{p.name}</h3>
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="font-bold" style={{ color: primary }}>
                        {formatPrice(p.price)}
                      </span>
                      {p.compareAtPrice && p.compareAtPrice > p.price ? (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(p.compareAtPrice)}
                        </span>
                      ) : null}
                    </div>
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-xs font-semibold inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md"
                      style={{ background: `${primary}12`, color: primary }}
                    >
                      Ver en marketplace
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- CONTACT ---------- */}
      <section id="contacto" className={contactBg}>
        <div className="max-w-5xl mx-auto px-4 py-14">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
              Contacto
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: template === 'vibrant' ? primary : '#111827' }}
            >
              Hablemos
            </h2>
            <p className="text-gray-500 mt-1 text-sm">Estamos para ayudarte.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tarjeta de datos */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500">Datos de contacto</h3>
              {site.contactEmail && (
                <a href={`mailto:${site.contactEmail}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:opacity-80">
                  <Mail className="size-4 shrink-0" style={{ color: primary }} />
                  <span className="truncate">{site.contactEmail}</span>
                </a>
              )}
              {site.contactPhone && (
                <a href={`tel:${normalizePhone(site.contactPhone)}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:opacity-80">
                  <Phone className="size-4 shrink-0" style={{ color: primary }} />
                  <span>{site.contactPhone}</span>
                </a>
              )}
              {site.contactWhatsapp && (
                <a
                  href={whatsappUrl(site.contactWhatsapp) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:opacity-80"
                >
                  <MessageCircle className="size-4 shrink-0" style={{ color: '#25D366' }} />
                  <span>WhatsApp: {site.contactWhatsapp}</span>
                </a>
              )}
              {site.contactAddress && (
                <div className="flex items-start gap-2.5 text-sm text-gray-700">
                  <MapPin className="size-4 shrink-0 mt-0.5" style={{ color: primary }} />
                  <span>{site.contactAddress}</span>
                </div>
              )}
              {!site.contactEmail && !site.contactPhone && !site.contactWhatsapp && !site.contactAddress && (
                <p className="text-sm text-gray-400 italic">Sin datos de contacto.</p>
              )}
            </div>

            {/* Tarjeta de horarios */}
            <div className="rounded-xl bg-white border border-gray-200 p-5">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
                <Clock className="size-4" style={{ color: primary }} /> Horarios
              </h3>
              {hours ? (
                <ul className="space-y-1.5 text-sm">
                  {DAY_KEYS.map((d) => {
                    const val = hours[d]
                    const closed = !val || val.toLowerCase() === 'closed' || val.toLowerCase() === 'cerrado'
                    return (
                      <li key={d} className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">{DAY_LABELS[d]}</span>
                        <span className={closed ? 'text-red-500 font-medium' : 'text-gray-800 font-medium'}>
                          {closed ? 'Cerrado' : val}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">Sin horarios definidos.</p>
              )}
            </div>

            {/* Tarjeta de redes */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 sm:col-span-2 lg:col-span-1">
              <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">
                Síguenos
              </h3>
              <SocialIcons social={social} size="md" />
              {!social.instagram && !social.facebook && !social.tiktok && !social.whatsapp && (
                <p className="text-sm text-gray-400 italic">Sin redes configuradas.</p>
              )}
              {site.contactWhatsapp && (
                <a
                  href={whatsappUrl(site.contactWhatsapp) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 w-full text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
                  style={{ background: '#25D366' }}
                >
                  <MessageCircle className="size-4" />
                  Escríbenos por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer style={{ background: template === 'minimal' ? '#111827' : primary, color: '#fff' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt={company} className="h-7 w-7 rounded-full object-cover bg-white/20" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/20 grid place-items-center font-bold text-xs">
                  {initial}
                </div>
              )}
              <span className="font-bold">{company}</span>
            </div>
            <SocialIcons social={social} />
          </div>
          <div className="mt-5 pt-5 border-t border-white/15 text-center text-xs text-white/70">
            © {year} {company}. Todos los derechos reservados.
          </div>
          <div className="mt-2 text-center text-xs text-white/60">
            Sitio creado con <span className="font-semibold">Web Express</span> by ImpulsePymes360
          </div>
        </div>
      </footer>
    </div>
  )
}

// ===================== Browser frame =====================

function BrowserFrame({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-2">
          <div className="bg-white border border-border rounded-md px-3 py-1 text-xs text-muted-foreground truncate flex items-center gap-1.5">
            <Globe className="size-3 shrink-0" />
            dimarclub.com/w/{slug}
          </div>
        </div>
      </div>
      <div className="max-h-[68vh] overflow-y-auto scroll-thin">{children}</div>
    </div>
  )
}

// ===================== Módulo principal =====================

export function WebExpressModule() {
  const toast = useAppStore((s) => s.toast)
  const setModule = useAppStore((s) => s.setModule)
  const currentUser = useAppStore((s) => s.currentUser)

  const [sites, setSites] = useState<SiteWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'gallery' | 'editor'>('gallery')

  // Datos públicos del sitio seleccionado (productos + parseado)
  const [publicData, setPublicData] = useState<{ site: PreviewSite; products: PreviewProduct[] } | null>(null)
  const [publicLoading, setPublicLoading] = useState(false)
  const publicCache = useMemo(() => new Map<string, { site: PreviewSite; products: PreviewProduct[] }>(), [])

  // Formulario del editor
  const [form, setForm] = useState<EditorForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [dirty, setDirty] = useState(false)

  const selected = useMemo(
    () => sites.find((s) => s.id === selectedId) ?? null,
    [sites, selectedId],
  )

  // ---- Cargar lista de sitios ----
  const fetchSites = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/impulse/websites')
      if (!res.ok) throw new Error('Error al cargar')
      const data = (await res.json()) as SiteWithProvider[]
      setSites(data)
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id)
      } else if (data.length === 0) {
        setSelectedId(null)
      }
    } catch {
      toast('Error al cargar tus sitios web', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast, selectedId])

  useEffect(() => {
    void fetchSites()
     
  }, [])

  // ---- Cargar datos públicos del sitio seleccionado (gallery mode) ----
  const loadPublicData = useCallback(
    async (slug: string, force = false) => {
      if (!force && publicCache.has(slug)) {
        setPublicData(publicCache.get(slug)!)
        return
      }
      setPublicLoading(true)
      try {
        const res = await fetch(`/api/impulse/w/${encodeURIComponent(slug)}`)
        if (!res.ok) {
          // 404 si no está publicado — usamos datos de la lista
          throw new Error('not-published')
        }
        const data = (await res.json()) as { site: PreviewSite; products: PreviewProduct[] }
        publicCache.set(slug, data)
        setPublicData(data)
      } catch {
        // Fallback: construir desde el objeto de la lista
        const s = sites.find((x) => x.slug === slug)
        if (s) {
          const fallback: { site: PreviewSite; products: PreviewProduct[] } = {
            site: toPreviewSite(s),
            products: [],
          }
          publicCache.set(slug, fallback)
          setPublicData(fallback)
        } else {
          setPublicData(null)
        }
      } finally {
        setPublicLoading(false)
      }
    },
    [publicCache, sites],
  )

  // ---- Cargar datos públicos del sitio seleccionado (gallery + editor) ----
  useEffect(() => {
    if (selected) {
      void loadPublicData(selected.slug)
    }
  }, [selectedId, selected, loadPublicData])

  // ---- Sincronizar formulario al entrar a editor mode o cambiar sitio ----
  useEffect(() => {
    if (!selected || mode !== 'editor') {
      setForm(null)
      setDirty(false)
      return
    }
    // Usar publicData si disponible (ya parseado), sino parsear del selected
    const base =
      publicData?.site?.id === selected.id
        ? publicData.site
        : toPreviewSite(selected)
    setForm({
      template: base.template,
      primaryColor: base.primaryColor,
      accentColor: base.accentColor,
      heroTitle: base.heroTitle,
      heroSubtitle: base.heroSubtitle,
      heroImageUrl: base.heroImageUrl,
      aboutText: base.aboutText,
      contactEmail: base.contactEmail,
      contactPhone: base.contactPhone,
      contactWhatsapp: base.contactWhatsapp,
      contactAddress: base.contactAddress,
      businessHours: base.businessHours ?? { ...EMPTY_HOURS },
      socialLinks: base.socialLinks ?? { ...EMPTY_SOCIAL },
      metaTitle: safeStr(selected.metaTitle),
      metaDescription: safeStr(selected.metaDescription),
      published: base.published,
    })
    setDirty(false)
     
  }, [selectedId, mode])

  // ---- Handlers de formulario ----
  const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    setDirty(true)
  }
  const updateHours = (day: keyof BusinessHours, value: string) => {
    setForm((prev) =>
      prev ? { ...prev, businessHours: { ...prev.businessHours, [day]: value } } : prev,
    )
    setDirty(true)
  }
  const updateSocial = (platform: keyof SocialLinks, value: string) => {
    setForm((prev) =>
      prev ? { ...prev, socialLinks: { ...prev.socialLinks, [platform]: value } } : prev,
    )
    setDirty(true)
  }

  // ---- Guardar ----
  const handleSave = async () => {
    if (!form || !selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/impulse/websites/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: form.template,
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
          heroTitle: form.heroTitle || null,
          heroSubtitle: form.heroSubtitle || null,
          heroImageUrl: form.heroImageUrl || null,
          aboutText: form.aboutText || null,
          contactEmail: form.contactEmail || null,
          contactPhone: form.contactPhone || null,
          contactWhatsapp: form.contactWhatsapp || null,
          contactAddress: form.contactAddress || null,
          businessHours: form.businessHours,
          socialLinks: form.socialLinks,
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
          published: form.published,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const updated = (await res.json()) as WebsiteExpress
      // Actualizar lista
      setSites((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
      )
      // Invalidar caché pública
      publicCache.delete(selected.slug)
      setDirty(false)
      toast('¡Sitio actualizado!')
      // Recargar preview público si estamos en gallery (no, estamos en editor)
      // Refrescar publicData con los nuevos valores para el live preview
      setPublicData((prev) => {
        if (!prev || prev.site.id !== selected.id) return prev
        return {
          site: {
            ...prev.site,
            template: form.template,
            primaryColor: form.primaryColor,
            accentColor: form.accentColor,
            heroTitle: form.heroTitle,
            heroSubtitle: form.heroSubtitle,
            heroImageUrl: form.heroImageUrl,
            aboutText: form.aboutText,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
            contactWhatsapp: form.contactWhatsapp,
            contactAddress: form.contactAddress,
            businessHours: form.businessHours,
            socialLinks: form.socialLinks,
            published: form.published,
          },
          products: prev.products,
        }
      })
    } catch {
      toast('Error al guardar el sitio', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ---- Toggle published (rápido, desde toolbar) ----
  const togglePublished = async (next: boolean) => {
    if (!selected) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/impulse/websites/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: next }),
      })
      if (!res.ok) throw new Error('Error')
      setSites((prev) =>
        prev.map((s) => (s.id === selected.id ? { ...s, published: next } : s)),
      )
      setForm((prev) => (prev ? { ...prev, published: next } : prev))
      publicCache.delete(selected.slug)
      toast(next ? 'Sitio publicado' : 'Sitio despublicado', 'info')
    } catch {
      toast('Error al cambiar estado', 'error')
    } finally {
      setPublishing(false)
    }
  }

  // ---- Live preview site (editor mode) ----
  const livePreviewSite = useMemo<PreviewSite | null>(() => {
    if (!form || !selected) return null
    const base =
      publicData?.site?.id === selected.id
        ? publicData.site
        : toPreviewSite(selected)
    return {
      ...base,
      template: form.template,
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      heroTitle: form.heroTitle,
      heroSubtitle: form.heroSubtitle,
      heroImageUrl: form.heroImageUrl,
      aboutText: form.aboutText,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      contactWhatsapp: form.contactWhatsapp,
      contactAddress: form.contactAddress,
      businessHours: form.businessHours,
      socialLinks: form.socialLinks,
      published: form.published,
    }
  }, [form, selected, publicData])

  const liveProducts = publicData?.products ?? []

  // ===================== Render =====================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <Globe className="size-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Web Express</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Tu sitio web profesional, generado automáticamente y 100% editable. Visualízalo, edítalo y compártelo.
          </p>
        </div>
        {sites.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setModule('impulse-wizard')}>
            <Plus className="size-4" />
            Crear otro sitio
          </Button>
        )}
      </div>

      {/* Empty state */}
      {sites.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center text-center gap-5">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
              <Globe className="size-8 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg font-semibold">Aún no tienes un sitio Web Express</h3>
              <p className="text-sm text-muted-foreground">
                Activa tu plan ImpulsePymes360 y generamos tu sitio web profesional automáticamente:
                catálogo, contacto, horarios y redes sociales.
              </p>
            </div>
            <Button size="lg" onClick={() => setModule('impulse-wizard')}>
              <Sparkles className="size-4" />
              Crear mi sitio web
            </Button>
            {currentUser?.role === 'CLIENT' && (
              <p className="text-xs text-muted-foreground">
                Solo proveedores con plan ImpulsePymes360 pueden crear sitios.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar: lista de sitios */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Mis sitios ({sites.length})
              </h2>
            </div>
            <div className="space-y-2 max-h-[78vh] overflow-y-auto scroll-thin pr-1">
              {sites.map((s) => {
                const isActive = s.id === selectedId
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedId(s.id)
                      setMode('gallery')
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="size-10 rounded-lg shrink-0 grid place-items-center font-bold text-white text-sm"
                        style={{ background: `linear-gradient(135deg, ${s.primaryColor}, ${s.accentColor})` }}
                      >
                        {(s.provider?.companyName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">
                            {s.provider?.companyName || 'Sin nombre'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-mono">/w/{s.slug}</div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
                            {s.template}
                          </Badge>
                          {s.published ? (
                            <Badge className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                              Borrador
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                      <Eye className="size-3" />
                      {s.views} vistas
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main area */}
          {selected && (
            <div className="space-y-4 min-w-0">
              {/* Toolbar */}
              <Card className="p-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                      <button
                        onClick={() => setMode('gallery')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          mode === 'gallery'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Eye className="size-4" />
                        Ver sitio
                      </button>
                      <button
                        onClick={() => setMode('editor')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          mode === 'editor'
                            ? 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Pencil className="size-4" />
                        Editar
                      </button>
                    </div>
                    <a
                      href={`/w/${encodeURIComponent(selected.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <ExternalLink className="size-4" />
                      <span className="hidden sm:inline">Visitar URL</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Eye className="size-3.5" />
                      <span className="font-medium text-foreground">{selected.views}</span> vistas
                    </div>
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pub-toggle" className="text-xs text-muted-foreground">
                        {publishing ? '...' : selected.published ? 'Publicado' : 'Borrador'}
                      </Label>
                      <Switch
                        id="pub-toggle"
                        checked={selected.published}
                        disabled={publishing}
                        onCheckedChange={togglePublished}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Gallery mode */}
              {mode === 'gallery' && (
                <div className="space-y-4">
                  {publicLoading ? (
                    <Skeleton className="h-[68vh] w-full rounded-xl" />
                  ) : publicData ? (
                    <BrowserFrame slug={selected.slug}>
                      <WebsitePreview site={publicData.site} products={publicData.products} />
                    </BrowserFrame>
                  ) : (
                    <Card className="p-10 text-center text-sm text-muted-foreground">
                      No se pudo cargar la vista previa.
                    </Card>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Eye className="size-3.5" /> Vistas totales
                      </div>
                      <div className="text-2xl font-bold">{selected.views}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Globe className="size-3.5" /> Estado
                      </div>
                      <div className="text-sm font-semibold">
                        {selected.published ? (
                          <span className="text-emerald-600">● Publicado</span>
                        ) : (
                          <span className="text-muted-foreground">● Borrador</span>
                        )}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <LayoutTemplate className="size-3.5" /> Plantilla
                      </div>
                      <div className="text-sm font-semibold capitalize">{selected.template}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Clock className="size-3.5" /> Actualizado
                      </div>
                      <div className="text-sm font-semibold">{formatDate(selected.updatedAt)}</div>
                    </Card>
                  </div>
                </div>
              )}

              {/* Editor mode */}
              {mode === 'editor' && form && livePreviewSite && (
                <div className="grid xl:grid-cols-2 gap-4">
                  {/* Form */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Settings2 className="size-4 text-primary" />
                            Editor del sitio
                          </CardTitle>
                          {dirty && (
                            <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                              Sin guardar
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          Los cambios se reflejan en la vista previa en tiempo real.
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <Tabs defaultValue="design" className="w-full">
                      <TabsList className="grid grid-cols-4 w-full">
                        <TabsTrigger value="design" className="text-xs gap-1">
                          <Palette className="size-3.5" />
                          <span className="hidden sm:inline">Diseño</span>
                        </TabsTrigger>
                        <TabsTrigger value="content" className="text-xs gap-1">
                          <FileText className="size-3.5" />
                          <span className="hidden sm:inline">Contenido</span>
                        </TabsTrigger>
                        <TabsTrigger value="contact" className="text-xs gap-1">
                          <Phone className="size-3.5" />
                          <span className="hidden sm:inline">Contacto</span>
                        </TabsTrigger>
                        <TabsTrigger value="seo" className="text-xs gap-1">
                          <Search className="size-3.5" />
                          <span className="hidden sm:inline">SEO</span>
                        </TabsTrigger>
                      </TabsList>

                      {/* ---- Diseño ---- */}
                      <TabsContent value="design" className="space-y-4 mt-3">
                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">Plantilla</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {TEMPLATES.map((t) => (
                              <button
                                key={t.key}
                                type="button"
                                onClick={() => update('template', t.key)}
                                className={`text-left rounded-lg border p-2.5 transition-colors ${
                                  form.template === t.key
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'border-border hover:bg-muted/50'
                                }`}
                              >
                                <TemplateMiniPreview
                                  template={t.key}
                                  primary={form.primaryColor}
                                  accent={form.accentColor}
                                />
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs font-semibold">{t.label}</span>
                                  {form.template === t.key && (
                                    <Check className="size-3.5 text-primary" />
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                                  {t.desc}
                                </p>
                              </button>
                            ))}
                          </div>
                        </Card>

                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">Colores</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Color principal</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={form.primaryColor}
                                  onChange={(e) => update('primaryColor', e.target.value)}
                                  className="size-9 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
                                />
                                <Input
                                  value={form.primaryColor}
                                  onChange={(e) => update('primaryColor', e.target.value)}
                                  className="font-mono text-xs h-9"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Color de acento</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={form.accentColor}
                                  onChange={(e) => update('accentColor', e.target.value)}
                                  className="size-9 rounded-md border border-input cursor-pointer bg-transparent p-0.5"
                                />
                                <Input
                                  value={form.accentColor}
                                  onChange={(e) => update('accentColor', e.target.value)}
                                  className="font-mono text-xs h-9"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Combinaciones predefinidas</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {COLOR_PRESETS.map((p) => {
                                const active =
                                  form.primaryColor.toLowerCase() === p.primary.toLowerCase() &&
                                  form.accentColor.toLowerCase() === p.accent.toLowerCase()
                                return (
                                  <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => {
                                      update('primaryColor', p.primary)
                                      update('accentColor', p.accent)
                                    }}
                                    className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                                      active
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-muted/50'
                                    }`}
                                  >
                                    <span className="flex gap-0.5 shrink-0">
                                      <span className="size-3.5 rounded-full border border-black/10" style={{ background: p.primary }} />
                                      <span className="size-3.5 rounded-full border border-black/10" style={{ background: p.accent }} />
                                    </span>
                                    <span className="truncate">{p.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </Card>
                      </TabsContent>

                      {/* ---- Contenido ---- */}
                      <TabsContent value="content" className="space-y-4 mt-3">
                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">Sección Hero</Label>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Título principal</Label>
                            <Input
                              value={form.heroTitle}
                              onChange={(e) => update('heroTitle', e.target.value)}
                              placeholder="Ej. Tecnología al mejor precio"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Subtítulo</Label>
                            <Input
                              value={form.heroSubtitle}
                              onChange={(e) => update('heroSubtitle', e.target.value)}
                              placeholder="Ej. Envío gratis a todo Ecuador"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Imagen del hero</Label>
                            <ImageUpload
                              value={form.heroImageUrl}
                              onChange={(url) => update('heroImageUrl', url)}
                            />
                          </div>
                        </Card>

                        <Card className="p-4 space-y-1.5">
                          <Label className="text-sm font-semibold">Sección Nosotros</Label>
                          <Label className="text-xs text-muted-foreground">Descripción de tu negocio</Label>
                          <Textarea
                            value={form.aboutText}
                            onChange={(e) => update('aboutText', e.target.value)}
                            placeholder="Cuenta la historia de tu negocio, tu experiencia y qué te diferencia..."
                            rows={5}
                          />
                        </Card>
                      </TabsContent>

                      {/* ---- Contacto ---- */}
                      <TabsContent value="contact" className="space-y-4 mt-3">
                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">Datos de contacto</Label>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <Input
                                type="email"
                                value={form.contactEmail}
                                onChange={(e) => update('contactEmail', e.target.value)}
                                placeholder="ventas@minegocio.com"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Teléfono</Label>
                              <Input
                                value={form.contactPhone}
                                onChange={(e) => update('contactPhone', e.target.value)}
                                placeholder="04 2222 333"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">WhatsApp (con código de país)</Label>
                              <Input
                                value={form.contactWhatsapp}
                                onChange={(e) => update('contactWhatsapp', e.target.value)}
                                placeholder="59399222333"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Dirección</Label>
                              <Input
                                value={form.contactAddress}
                                onChange={(e) => update('contactAddress', e.target.value)}
                                placeholder="Av. Principal 123, Ciudad"
                              />
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">Horarios de atención</Label>
                          <p className="text-xs text-muted-foreground">
            Escribe el rango (ej. <code className="bg-muted px-1 rounded">9-18</code>) o <code className="bg-muted px-1 rounded">closed</code> si no atiendes.
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {DAY_KEYS.map((d) => (
                              <div key={d} className="flex items-center gap-2">
                                <Label className="text-xs w-20 shrink-0 text-muted-foreground">
                                  {DAY_LABELS[d]}
                                </Label>
                                <Input
                                  value={form.businessHours[d] ?? ''}
                                  onChange={(e) => updateHours(d, e.target.value)}
                                  placeholder="9-18 o closed"
                                  className="h-8 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </Card>

                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">Redes sociales</Label>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Instagram className="size-3.5" /> Instagram
                              </Label>
                              <Input
                                value={form.socialLinks.instagram ?? ''}
                                onChange={(e) => updateSocial('instagram', e.target.value)}
                                placeholder="@minegocio"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Facebook className="size-3.5" /> Facebook
                              </Label>
                              <Input
                                value={form.socialLinks.facebook ?? ''}
                                onChange={(e) => updateSocial('facebook', e.target.value)}
                                placeholder="MiNegocioEC"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Music2 className="size-3.5" /> TikTok
                              </Label>
                              <Input
                                value={form.socialLinks.tiktok ?? ''}
                                onChange={(e) => updateSocial('tiktok', e.target.value)}
                                placeholder="@minegocio"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MessageCircle className="size-3.5" /> WhatsApp
                              </Label>
                              <Input
                                value={form.socialLinks.whatsapp ?? ''}
                                onChange={(e) => updateSocial('whatsapp', e.target.value)}
                                placeholder="59399222333"
                              />
                            </div>
                          </div>
                        </Card>
                      </TabsContent>

                      {/* ---- SEO ---- */}
                      <TabsContent value="seo" className="space-y-4 mt-3">
                        <Card className="p-4 space-y-3">
                          <Label className="text-sm font-semibold">SEO y estado</Label>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Meta título (SEO)</Label>
                            <Input
                              value={form.metaTitle}
                              onChange={(e) => update('metaTitle', e.target.value)}
                              placeholder="Mi Negocio — Ciudad | Dimarclub"
                              maxLength={60}
                            />
                            <p className="text-[10px] text-muted-foreground text-right">
                              {form.metaTitle.length}/60
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Meta descripción</Label>
                            <Textarea
                              value={form.metaDescription}
                              onChange={(e) => update('metaDescription', e.target.value)}
                              placeholder="Describe tu negocio en 1-2 frases para Google."
                              rows={3}
                              maxLength={160}
                            />
                            <p className="text-[10px] text-muted-foreground text-right">
                              {form.metaDescription.length}/160
                            </p>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm font-medium">Sitio publicado</Label>
                              <p className="text-xs text-muted-foreground">
                                Si está apagado, solo tú puedes verlo.
                              </p>
                            </div>
                            <Switch
                              checked={form.published}
                              onCheckedChange={(v) => update('published', v)}
                            />
                          </div>
                        </Card>
                      </TabsContent>
                    </Tabs>

                    {/* Botón guardar */}
                    <div className="sticky bottom-0 z-10">
                      <Card className="p-3 bg-background/95 backdrop-blur">
                        <Button
                          onClick={handleSave}
                          disabled={saving || !dirty}
                          className="w-full"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Guardando…
                            </>
                          ) : (
                            <>
                              <Save className="size-4" />
                              Guardar cambios
                            </>
                          )}
                        </Button>
                      </Card>
                    </div>
                  </div>

                  {/* Live preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Eye className="size-4 text-primary" />
                        Vista previa en vivo
                      </h3>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {form.template}
                      </Badge>
                    </div>
                    <div className="xl:sticky xl:top-4">
                      <BrowserFrame slug={selected.slug}>
                        <WebsitePreview site={livePreviewSite} products={liveProducts} />
                      </BrowserFrame>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WebExpressModule
