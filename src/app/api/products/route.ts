import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const categoryId = searchParams.get('categoryId')
  const supplierId = searchParams.get('supplierId')
  const featured = searchParams.get('featured') === 'true'
  const sort = searchParams.get('sort') || 'newest'
  const limit = parseInt(searchParams.get('limit') || '100')

  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (q) where.name = { contains: q }
  if (categoryId) where.categoryId = categoryId
  if (supplierId) where.supplierId = supplierId
  if (featured) where.featured = true

  let orderBy: Record<string, string> = { createdAt: 'desc' }
  if (sort === 'price-asc') orderBy = { price: 'asc' }
  if (sort === 'price-desc') orderBy = { price: 'desc' }
  if (sort === 'rating') orderBy = { rating: 'desc' }

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
    include: { category: true, supplier: true },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const product = await db.product.create({
    data: {
      ...body,
      slug: body.slug || slugify(`${body.name}-${body.sku || Date.now()}`),
      compareAtPrice: body.compareAtPrice ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      status: body.status || 'ACTIVE',
    },
  })
  return NextResponse.json(product, { status: 201 })
}
