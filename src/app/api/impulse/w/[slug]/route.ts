import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Visualizador público de sitio Web Express (sin auth)
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await db.websiteExpress.findUnique({
    where: { slug },
    include: {
      provider: {
        select: {
          id: true, companyName: true, category: true, city: true, logoUrl: true, coverUrl: true,
          phone: true, mobile: true, address: true, description: true, affiliateRate: true,
        },
      },
    },
  })
  if (!site || !site.published) {
    return NextResponse.json({ error: 'Sitio no encontrado o no publicado' }, { status: 404 })
  }
  // Incrementar vistas
  await db.websiteExpress.update({ where: { id: site.id }, data: { views: { increment: 1 } } })
  // Buscar el supplier asociado para traer productos del marketplace
  const providerUserId = await db.provider.findUnique({ where: { id: site.provider.id }, select: { userId: true } })
  const supplier = providerUserId ? await db.supplier.findFirst({ where: { userId: providerUserId.userId } }) : null
  let marketplaceProducts: unknown[] = []
  if (supplier) {
    marketplaceProducts = await db.product.findMany({
      where: { supplierId: supplier.id, status: 'ACTIVE' },
      take: 6,
      orderBy: { featured: 'desc' },
      select: { id: true, name: true, price: true, compareAtPrice: true, imageUrl: true, slug: true },
    })
  }
  return NextResponse.json({
    site: {
      ...site,
      businessHours: site.businessHours ? JSON.parse(site.businessHours) : null,
      socialLinks: site.socialLinks ? JSON.parse(site.socialLinks) : null,
    },
    products: marketplaceProducts,
  })
}
