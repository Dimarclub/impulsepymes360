'use client'

import {
  ShoppingBag, MapPin, Phone, Mail, Clock, MessageCircle, Instagram,
  Facebook, Music2, ArrowRight, Star, ExternalLink, Truck, Gift,
} from 'lucide-react'
import type { WebsiteExpress, Provider, MediaFolder } from '@/lib/types'

interface PublicSiteData {
  id: string
  slug: string
  template: string
  primaryColor: string
  accentColor: string
  heroTitle: string | null
  heroSubtitle: string | null
  heroImageUrl: string | null
  aboutText: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  contactAddress: string | null
  businessHours: Record<string, string> | null
  socialLinks: Record<string, string> | null
  featuredProducts: string[] | null
  metaTitle: string | null
  metaDescription: string | null
  provider: {
    id: string
    companyName: string
    category: string | null
    city: string | null
    logoUrl: string | null
    coverUrl: string | null
    phone: string | null
    mobile: string | null
    address: string | null
    description: string | null
    affiliateRate: number
    websiteSlug: string
  }
}

interface Product {
  id: string
  name: string
  price: number
  compareAtPrice: number | null
  imageUrl: string | null
  slug: string
  description: string | null
  featured: boolean
}

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

const DAYS: Record<string, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves',
  fri: 'Viernes', sat: 'Sábado', sun: 'Domingo',
}

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram, facebook: Facebook, tiktok: Music2, whatsapp: MessageCircle,
}

export function PublicWebsiteView({ site, products }: { site: PublicSiteData; products: Product[] }) {
  const primary = site.primaryColor || '#0d9488'
  const accent = site.accentColor || '#d97706'
  const provider = site.provider
  const template = site.template || 'modern'

  return (
    <div className="min-h-screen bg-white" style={{ ['--site-primary' as string]: primary, ['--site-accent' as string]: accent }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b" style={{ borderColor: `${primary}20` }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {provider.logoUrl ? (
              <img src={provider.logoUrl} alt={provider.companyName} className="size-9 rounded-lg object-cover" />
            ) : (
              <div className="size-9 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
                <span className="text-white font-bold">{provider.companyName.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="font-bold text-sm leading-tight text-gray-900">{provider.companyName}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{provider.category || ''}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <a href="#productos" className="text-gray-600 hover:text-gray-900 transition">Productos</a>
            <a href="#nosotros" className="text-gray-600 hover:text-gray-900 transition">Nosotros</a>
            <a href="#contacto" className="text-gray-600 hover:text-gray-900 transition">Contacto</a>
            <a
              href={`/?module=marketplace`}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
              style={{ background: primary }}
            >
              Ver en Dimarclub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      {template === 'minimal' ? (
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{site.heroTitle || provider.companyName}</h1>
          {site.heroSubtitle && <p className="mt-4 text-lg text-gray-600">{site.heroSubtitle}</p>}
          <div className="mt-8 flex justify-center gap-3">
            <a href="#productos" className="px-6 py-3 rounded-lg text-white font-medium" style={{ background: primary }}>Ver productos</a>
            <a href="#contacto" className="px-6 py-3 rounded-lg border-2 font-medium" style={{ borderColor: primary, color: primary }}>Contactar</a>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
          {site.heroImageUrl && (
            <div className="absolute inset-0 opacity-30">
              <img src={site.heroImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-white">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">{site.heroTitle || provider.companyName}</h1>
              {site.heroSubtitle && <p className="mt-4 text-lg md:text-xl opacity-90">{site.heroSubtitle}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#productos" className="px-6 py-3 rounded-lg bg-white font-medium text-sm" style={{ color: primary }}>
                  Ver productos
                </a>
                <a href="#contacto" className="px-6 py-3 rounded-lg border-2 border-white text-white font-medium text-sm hover:bg-white/10 transition">
                  Contactar
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits banner */}
      <section className="bg-gray-50 border-y" style={{ borderColor: `${primary}15` }}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex flex-col items-center gap-1.5">
              <Truck className="size-6" style={{ color: primary }} />
              <span className="text-gray-700">Envío gratis</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Gift className="size-6" style={{ color: accent }} />
              <span className="text-gray-700">Beneficios exclusivos</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Star className="size-6" style={{ color: primary }} />
              <span className="text-gray-700">Proveedor verificado</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShoppingBag className="size-6" style={{ color: accent }} />
              <span className="text-gray-700">Compra en marketplace</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section id="productos" className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Nuestros productos</h2>
              <p className="text-sm text-gray-500 mt-1">Compra con envío gratis y gana comisiones</p>
            </div>
            <a href={`/?module=marketplace`} className="hidden sm:flex items-center gap-1 text-sm font-medium" style={{ color: primary }}>
              Ver todo <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const discount = p.compareAtPrice ? Math.round((1 - p.price / p.compareAtPrice) * 100) : 0
              return (
                <a
                  key={p.id}
                  href={`/?module=marketplace`}
                  className="group rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    )}
                    {discount > 0 && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: accent }}>
                        -{discount}%
                      </span>
                    )}
                    {p.featured && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-0.5" style={{ background: primary }}>
                        <Star className="size-2.5 fill-white" /> Destacado
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-bold text-gray-900">{fmtUsd(p.price)}</span>
                      {p.compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through">{fmtUsd(p.compareAtPrice)}</span>
                      )}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* About */}
      {(site.aboutText || provider.description) && (
        <section id="nosotros" className="bg-gray-50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Sobre nosotros</h2>
            <p className="text-gray-600 leading-relaxed">{site.aboutText || provider.description}</p>
            {provider.city && (
              <p className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-1">
                <MapPin className="size-4" /> {provider.address}, {provider.city}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contacto" className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Contáctanos</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {site.contactPhone && (
            <a href={`tel:${site.contactPhone}`} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="size-10 rounded-full flex items-center justify-center" style={{ background: `${primary}15` }}>
                <Phone className="size-5" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{site.contactPhone}</p>
              </div>
            </a>
          )}
          {site.contactWhatsapp && (
            <a
              href={`https://wa.me/${site.contactWhatsapp.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:shadow-md transition"
            >
              <div className="size-10 rounded-full flex items-center justify-center" style={{ background: `${accent}15` }}>
                <MessageCircle className="size-5" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">WhatsApp</p>
                <p className="font-medium text-gray-900">{site.contactWhatsapp}</p>
              </div>
            </a>
          )}
          {site.contactEmail && (
            <a href={`mailto:${site.contactEmail}`} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:shadow-md transition">
              <div className="size-10 rounded-full flex items-center justify-center" style={{ background: `${primary}15` }}>
                <Mail className="size-5" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{site.contactEmail}</p>
              </div>
            </a>
          )}
          {site.contactAddress && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200">
              <div className="size-10 rounded-full flex items-center justify-center" style={{ background: `${accent}15` }}>
                <MapPin className="size-5" style={{ color: accent }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{site.contactAddress}</p>
              </div>
            </div>
          )}
        </div>

        {/* Business hours */}
        {site.businessHours && (
          <div className="mt-6 p-4 rounded-xl border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1.5">
              <Clock className="size-4" style={{ color: primary }} /> Horarios de atención
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              {Object.entries(site.businessHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="text-gray-600">{DAYS[day] || day}</span>
                  <span className={hours === 'closed' ? 'text-red-500' : 'text-gray-900 font-medium'}>
                    {hours === 'closed' ? 'Cerrado' : hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social */}
        {site.socialLinks && Object.keys(site.socialLinks).length > 0 && (
          <div className="mt-6 flex justify-center gap-3">
            {Object.entries(site.socialLinks).map(([network, handle]) => {
              const Icon = SOCIAL_ICONS[network] || ExternalLink
              const url = network === 'whatsapp'
                ? `https://wa.me/${handle.replace(/\D/g, '')}`
                : network === 'instagram'
                ? `https://instagram.com/${handle.replace('@', '')}`
                : network === 'facebook'
                ? `https://facebook.com/${handle}`
                : network === 'tiktok'
                ? `https://tiktok.com/@${handle.replace('@', '')}`
                : '#'
              return (
                <a key={network} href={url} target="_blank" rel="noopener noreferrer"
                  className="size-10 rounded-full flex items-center justify-center text-white"
                  style={{ background: primary }}
                  aria-label={network}
                >
                  <Icon className="size-5" />
                </a>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}>
              <span className="font-bold">{provider.companyName.slice(0, 2).toUpperCase()}</span>
            </div>
            <span className="font-bold">{provider.companyName}</span>
          </div>
          <p className="text-xs text-gray-400">
            Sitio creado con <span className="font-medium" style={{ color: accent }}>Web Express</span> by ImpulsePymes360
          </p>
          <p className="text-[10px] text-gray-500 mt-2">© {new Date().getFullYear()} {provider.companyName}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
