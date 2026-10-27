import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { PublicWebsiteView } from '@/components/dimar/public-website'

// Página pública del sitio Web Express: /w/[slug]
// Renderiza el sitio web standalone del proveedor (no redirige)
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await db.websiteExpress.findUnique({
    where: { slug },
    select: { metaTitle: true, metaDescription: true, provider: { select: { companyName: true } } },
  })
  if (!site) return { title: 'Sitio no encontrado' }
  return {
    title: site.metaTitle || `${site.provider.companyName} — ImpulsePymes360`,
    description: site.metaDescription || '',
  }
}

export default async function PublicWebsitePage(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Fetch data server-side
  const site = await db.websiteExpress.findUnique({
    where: { slug },
    include: {
      provider: {
        select: {
          id: true, companyName: true, category: true, city: true, logoUrl: true, coverUrl: true,
          phone: true, mobile: true, address: true, description: true, affiliateRate: true,
          websiteSlug: true,
        },
      },
    },
  })
  if (!site || !site.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <div className="size-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-2xl">D</span>
          </div>
          <h1 className="text-xl font-bold">Sitio no encontrado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            El sitio que buscas no existe o no está publicado.
          </p>
          <a href="/" className="inline-block mt-4 text-primary hover:underline text-sm">
            ← Volver a Dimarclub
          </a>
        </div>
      </div>
    )
  }

  // Incrementar vistas
  await db.websiteExpress.update({ where: { id: site.id }, data: { views: { increment: 1 } } }).catch(() => {})

  // Buscar productos del marketplace
  const supplier = await db.supplier.findFirst({ where: { userId: site.providerId } })
  let products: Array<{ id: string; name: string; price: number; compareAtPrice: number | null; imageUrl: string | null; slug: string; description: string | null; featured: boolean }> = []
  if (supplier) {
    products = await db.product.findMany({
      where: { supplierId: supplier.id, status: 'ACTIVE' },
      take: 12,
      orderBy: { featured: 'desc' },
      select: { id: true, name: true, price: true, compareAtPrice: true, imageUrl: true, slug: true, description: true, featured: true },
    })
  }

  const siteData = {
    ...site,
    businessHours: site.businessHours ? JSON.parse(site.businessHours) : null,
    socialLinks: site.socialLinks ? JSON.parse(site.socialLinks) : null,
    featuredProducts: site.featuredProducts ? JSON.parse(site.featuredProducts) : null,
  }

  return <PublicWebsiteView site={siteData} products={products} />
}
