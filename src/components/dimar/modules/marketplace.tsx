'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Gift,
  Megaphone,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Product, Category, Advertisement } from '@/lib/types'
import { ProductCard } from '@/components/dimar/product-card'

function AdBanner({ ad }: { ad: Advertisement }) {
  return (
    <a
      href={ad.targetUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block group relative overflow-hidden rounded-2xl"
    >
      <img
        src={ad.imageUrl}
        alt={ad.title}
        className="w-full object-cover max-h-48 md:max-h-56 group-hover:scale-[1.02] transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
        <div className="text-white">
          <Badge className="bg-white/20 text-white border-0 mb-1">
            <Megaphone className="size-3 mr-1" /> Publicidad
          </Badge>
          <p className="font-semibold text-sm md:text-base drop-shadow">{ad.title}</p>
        </div>
        <ArrowRight className="size-5 text-white opacity-80 group-hover:translate-x-1 transition-transform shrink-0" />
      </div>
    </a>
  )
}

export function MarketplaceModule() {
  const setModule = useAppStore((s) => s.setModule)

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<string>('newest')

  const [products, setProducts] = useState<Product[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const [headerAd, setHeaderAd] = useState<Advertisement | null>(null)
  const [footerAd, setFooterAd] = useState<Advertisement | null>(null)
  const [sideAds, setSideAds] = useState<Advertisement[]>([])
  const [mainBanners, setMainBanners] = useState<Array<{ id: string; title: string; imageUrl?: string | null; videoUrl?: string | null; gifUrl?: string | null; linkUrl?: string | null }>>([])
  const [brandLogos, setBrandLogos] = useState<Array<{ id: string; name: string; logoUrl: string; linkUrl?: string | null }>>([])
  const [featuredSuppliers, setFeaturedSuppliers] = useState<Array<{ id: string; companyName: string; logoUrl?: string | null; city?: string | null; category?: string | null; rating: number }>>([])

  const catalogRef = useRef<HTMLDivElement>(null)

  // Static-ish data: categories, ads, featured
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {})

    fetch('/api/products?featured=true&limit=10')
      .then((r) => r.json())
      .then(setFeatured)
      .catch(() => {})

    fetch('/api/ads?placement=HEADER')
      .then((r) => r.json())
      .then((a: Advertisement[]) => a[0] && setHeaderAd(a[0]))
      .catch(() => {})

    fetch('/api/ads?placement=FOOTER')
      .then((r) => r.json())
      .then((a: Advertisement[]) => a[0] && setFooterAd(a[0]))
      .catch(() => {})

    // Sidebar: combine SIDEBAR_RIGHT + SIDEBAR_LEFT
    Promise.all([
      fetch('/api/ads?placement=SIDEBAR_RIGHT').then((r) => r.json()),
      fetch('/api/ads?placement=SIDEBAR_LEFT').then((r) => r.json()),
    ])
      .then(([right, left]) =>
        setSideAds([
          ...(right as Advertisement[]),
          ...(left as Advertisement[]),
        ])
      )
      .catch(() => {})

    // Banners principales + logos de marcas + proveedores destacados
    fetch('/api/banners').then((r) => r.json()).then(setMainBanners).catch(() => {})
    fetch('/api/brand-logos').then((r) => r.json()).then(setBrandLogos).catch(() => {})
    fetch('/api/suppliers').then((r) => r.json()).then((data: Array<{ id: string; companyName: string; logoUrl?: string | null; city?: string | null; category?: string | null; rating: number; verified?: boolean }>) => {
      setFeaturedSuppliers(data.filter((s) => s.verified).slice(0, 6))
    }).catch(() => {})
  }, [])

  // Catalog: refetch when filters change
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (selectedCat !== 'all') params.set('categoryId', selectedCat)
    if (sort) params.set('sort', sort)
    params.set('limit', '48')

    startTransition(() => setLoading(true))
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((p: Product[]) => { if (!cancelled) setProducts(p) })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) startTransition(() => setLoading(false)) })
    return () => { cancelled = true }
  }, [search, selectedCat, sort, startTransition])

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      {/* ===== Banner publicitario 1320×330 + slider de logos ===== */}
      <section className="space-y-3">
        {mainBanners.length > 0 ? (
          <div className="relative w-full rounded-2xl overflow-hidden bg-muted" style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <div className="relative" style={{ aspectRatio: '1320/330' }}>
              {mainBanners.map((banner, idx) => (
                <div key={banner.id} className={cn('absolute inset-0 transition-opacity duration-500', idx === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                  <a href={banner.linkUrl || '#'} target={banner.linkUrl && banner.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block w-full h-full">
                    {banner.videoUrl ? (
                      <video src={banner.videoUrl} autoPlay muted loop className="w-full h-full object-cover" />
                    ) : banner.gifUrl ? (
                      <img src={banner.gifUrl} alt={banner.title} className="w-full h-full object-cover" />
                    ) : banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent text-primary-foreground p-6">
                        <p className="text-lg md:text-2xl font-bold text-center">{banner.title}</p>
                      </div>
                    )}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-gradient-to-br from-muted to-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-sm" style={{ maxWidth: '1320px', aspectRatio: '1320/330', margin: '0 auto' }}>
            Espacio publicitario disponible — 1320×330 · Configura banners desde el admin
          </div>
        )}

        {/* Slider de logos de marcas/proveedores */}
        {brandLogos.length > 0 && (
          <div className="rounded-xl border bg-card p-3 overflow-hidden">
            <div className="flex items-center gap-6 overflow-x-auto scroll-thin py-1">
              {brandLogos.map((logo) => (
                <a key={logo.id} href={logo.linkUrl || '#'} target={logo.linkUrl && logo.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="shrink-0 hover:opacity-70 transition-opacity" title={logo.name}>
                  <img src={logo.logoUrl} alt={logo.name} className="h-10 w-auto object-contain" style={{ maxHeight: '40px' }} />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== Category pills ===== */}
      <div className="flex gap-2 overflow-x-auto scroll-thin pb-2 -mx-1 px-1">
        <button
          onClick={() => setSelectedCat('all')}
          className={cn(
            'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition',
            selectedCat === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card border-border hover:border-primary/40 text-foreground'
          )}
        >
          Todas
        </button>
        {categories.map((cat) => {
          const active = selectedCat === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition',
                active
                  ? 'text-primary-foreground border-transparent'
                  : 'bg-card border-border hover:border-primary/40 text-foreground'
              )}
              style={
                active
                  ? { backgroundColor: cat.color || 'var(--primary)' }
                  : undefined
              }
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* ===== Featured products ===== */}
      {featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-accent" /> Productos destacados
            </h2>
            <Button variant="ghost" size="sm" onClick={scrollToCatalog} className="text-muted-foreground">
              Ver todo <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto scroll-thin pb-2 -mx-1 px-1">
            {featured.map((p) => (
              <div key={p.id} className="w-40 sm:w-44 md:w-52 shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Main catalog + sidebar ads ===== */}
      <div className="flex gap-6">
        <div className="flex-1 min-w-0" ref={catalogRef}>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-lg font-bold">Catálogo</h2>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-40 lg:w-56"
                  aria-label="Buscar productos"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-36 sm:w-40">
                  <SlidersHorizontal className="size-4 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                  <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                  <SelectItem value="rating">Mejor valorados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile search */}
          <div className="relative sm:hidden mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Buscar productos"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Search className="size-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No se encontraron productos</p>
              <p className="text-xs mt-1">
                Prueba con otra búsqueda o categoría
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Proveedores destacados + espacios publicitarios (lg+) */}
        {(featuredSuppliers.length > 0 || sideAds.length > 0) && (
          <aside className="hidden lg:flex flex-col gap-4 w-60 shrink-0">
            {/* Título general de la columna */}
            <div className="flex items-center gap-2 px-1 pb-1 border-b-2 border-primary/30">
              <Store className="size-5 text-primary" />
              <h3 className="text-sm font-bold text-primary">Proveedores Destacados</h3>
            </div>

            {/* Lista de proveedores destacados */}
            {featuredSuppliers.length > 0 && (
              <div className="rounded-xl border bg-card p-3">
                <div className="space-y-2">
                  {featuredSuppliers.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {s.logoUrl ? <img src={s.logoUrl} alt={s.companyName} className="w-full h-full object-cover" /> : <Store className="size-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.companyName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.category || s.city || 'Proveedor'}</p>
                      </div>
                      {s.rating > 0 && <span className="text-[10px] text-amber-600 flex items-center gap-0.5 shrink-0">★ {s.rating.toFixed(1)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Espacios publicitarios */}
            {sideAds.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Espacios Publicitarios</h3>
                {sideAds.map((ad) => (
                  <a key={ad.id} href={ad.targetUrl || '#'} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-xl">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge className="bg-white/20 text-white border-0 mb-1 text-[9px]"><Megaphone className="size-2.5 mr-0.5" /> Ad</Badge>
                      <p className="text-white text-xs font-medium drop-shadow line-clamp-2">{ad.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

    </div>
  )
}
