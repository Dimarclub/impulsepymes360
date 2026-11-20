import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import {
  Store, MapPin, Phone, MessageCircle, Star, BadgeCheck, Package,
  ArrowLeft, ExternalLink, Navigation, Clock, ShoppingBag, Search,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ============================================================
// Página pública del proveedor del marketplace: /proveedor/[id]
// Se enlaza desde los resultados de búsqueda del Robot Dima.
// Recibe el Supplier.id (cuid) que devuelve /api/dima/search.
// ============================================================

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n || 0)

// ---- Metadata SEO dinámica por proveedor ----
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supplier = await db.supplier.findUnique({
    where: { id },
    select: {
      companyName: true,
      category: true,
      city: true,
      address: true,
      description: true,
    },
  })
  if (!supplier) return { title: 'Proveedor no encontrado · DimarClub' }
  const title = `${supplier.companyName} · Marketplace DimarClub`
  const desc =
    supplier.description ||
    `${supplier.companyName}${
      supplier.category ? ` — ${supplier.category}` : ''
    }${supplier.city ? ` en ${supplier.city}` : ''}. Productos, sucursales y contacto directo.`
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
      siteName: 'DimarClub',
    },
  }
}

export default async function SupplierStorefrontPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // ---- 1. Cargar supplier con todo lo necesario ----
  const supplier = await db.supplier.findUnique({
    where: { id },
    include: {
      branches: { where: { isActive: true }, orderBy: { isMain: 'desc' } },
      products: {
        where: { status: 'ACTIVE' },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        take: 24,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          imageUrl: true,
          description: true,
          featured: true,
          stock: true,
        },
      },
      searchPhrases: {
        where: { status: 'ACTIVE' },
        select: { phrase: true, isPremium: true },
        take: 8,
      },
    },
  })

  if (!supplier) notFound()

  // ---- 2. Verificar si tiene sitio Web Express publicado ----
  // (Provider comparte userId con Supplier)
  const provider = await db.provider.findUnique({
    where: { userId: supplier.userId },
    select: {
      websiteSlug: true,
      logoUrl: true,
      coverUrl: true,
      description: true,
      mobile: true,
      website: { select: { slug: true, published: true, template: true } },
    },
  })
  const websiteSlug =
    provider?.website?.published ? provider.website.slug : null
  const logoUrl = provider?.logoUrl || null
  const coverUrl = provider?.coverUrl || null
  const description = supplier.description || provider?.description || null
  const mobile = provider?.mobile || null

  // ---- 3. Contacto efectivo ----
  const whatsappNumber = (supplier.phone || mobile || '').replace(/\D/g, '')
  const phoneDisplay = supplier.phone || mobile || null

  // ---- 4. Vistas (no bloqueante) ----
  db.supplier
    .update({ where: { id }, data: { /* campo plano, sin contador dedicado */ } })
    .catch(() => {})

  const mainBranch =
    supplier.branches.find((b) => b.isMain) || supplier.branches[0] || null

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background">
      {/* ====== Top bar: volver a Dima ====== */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a
            href="/dima"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} /> Volver a Dima
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ShoppingBag size={16} /> Ir al marketplace
          </a>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* ====== Hero del proveedor ====== */}
        <section className="rounded-2xl border bg-white overflow-hidden shadow-sm">
          {/* Cover */}
          <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary/30 to-accent/30">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={supplier.companyName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* Header content */}
          <div className="px-5 md:px-8 pb-6 -mt-12 md:-mt-16 relative">
            <div className="flex flex-col md:flex-row md:items-end md:gap-5 gap-4">
              {/* Logo / avatar */}
              <div className="size-20 md:size-28 rounded-2xl border-4 border-white bg-primary/10 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={supplier.companyName} className="w-full h-full object-cover" />
                ) : (
                  <Store className="size-10 md:size-12 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {supplier.companyName}
                  </h1>
                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <BadgeCheck size={14} /> Verificado
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {supplier.category && (
                    <span className="inline-flex items-center gap-1">
                      <Package size={14} /> {supplier.category}
                    </span>
                  )}
                  {(supplier.city || mainBranch?.city) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} /> {mainBranch?.city || supplier.city}
                    </span>
                  )}
                  {supplier.rating > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Star size={14} fill="currentColor" /> {supplier.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2 md:justify-end">
                {whatsappNumber && (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
                {phoneDisplay && (
                  <a
                    href={`tel:${phoneDisplay}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
                  >
                    <Phone size={16} /> Llamar
                  </a>
                )}
                {websiteSlug && (
                  <a
                    href={`/w/${websiteSlug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
                  >
                    <ExternalLink size={16} /> Sitio web
                  </a>
                )}
              </div>
            </div>

            {description && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {description}
              </p>
            )}

            {supplier.address && !mainBranch && (
              <p className="mt-3 text-sm text-muted-foreground inline-flex items-center gap-1">
                <Navigation size={14} /> {supplier.address}
              </p>
            )}
          </div>
        </section>

        {/* ====== Banner Web Express (si aplica) ====== */}
        {websiteSlug && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 md:p-5 flex items-start md:items-center gap-3 flex-col md:flex-row">
            <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <ExternalLink size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Este proveedor tiene un sitio web personalizado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mira su catálogo completo, horarios y redes en su página Web Express.
              </p>
            </div>
            <a
              href={`/w/${websiteSlug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Ver sitio web <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* ====== Sucursales ====== */}
        {supplier.branches.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              <Store size={18} className="text-primary" />
              Sucursales ({supplier.branches.length})
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {supplier.branches.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border bg-white p-4 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{b.name}</p>
                    {b.isMain && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground inline-flex items-start gap-1">
                    <Navigation size={12} className="mt-0.5 shrink-0" />
                    {[b.address, b.city, b.sector].filter(Boolean).join(', ')}
                  </p>
                  {b.phone && (
                    <a
                      href={`tel:${b.phone}`}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      <Phone size={12} /> {b.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====== Productos ====== */}
        {supplier.products.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              <Package size={18} className="text-primary" />
              Productos ({supplier.products.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {supplier.products.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-square bg-muted/30 relative">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <Package size={28} />
                      </div>
                    )}
                    {p.featured && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full">
                        Destacado
                      </span>
                    )}
                    {p.compareAtPrice && p.compareAtPrice > p.price ? (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                        -{Math.round((1 - p.price / p.compareAtPrice) * 100)}%
                      </span>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
                      {p.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-primary">
                        {usd(p.price)}
                      </span>
                      {p.compareAtPrice && p.compareAtPrice > p.price && (
                        <span className="text-[11px] text-muted-foreground line-through">
                          {usd(p.compareAtPrice)}
                        </span>
                      )}
                    </div>
                    {p.stock > 0 ? (
                      <p className="text-[10px] text-emerald-600 mt-1">En stock</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">Agotado</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-dashed bg-muted/10 p-8 text-center">
            <Package size={32} className="mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Aún no hay productos publicados</p>
            <p className="text-xs text-muted-foreground mt-1">
              Este proveedor todavía no cargó productos en el marketplace.
            </p>
          </section>
        )}

        {/* ====== Frases de posicionamiento (premium) ====== */}
        {supplier.searchPhrases.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              <Search size={18} className="text-primary" />
              Aparece en búsquedas de Dima por:
            </h2>
            <div className="flex flex-wrap gap-2">
              {supplier.searchPhrases.map((sp, i) => (
                <span
                  key={i}
                  className={`text-xs px-3 py-1 rounded-full ${
                    sp.isPremium
                      ? 'bg-amber-100 text-amber-700 font-semibold'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {sp.isPremium ? '★ ' : ''}{sp.phrase}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ====== Footer ====== */}
        <footer className="mt-10 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Proveedor del marketplace <strong className="text-foreground">DimarClub · ImpulsePymes360</strong>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            ¿Buscas más proveedores?{' '}
            <a href="/dima" className="text-primary hover:underline">Vuelve a preguntarle a Dima</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
