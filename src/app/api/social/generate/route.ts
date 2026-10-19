import { NextRequest, NextResponse } from 'next/server'
import { generateProductPost, generateBulkCaptions } from '@/lib/services/ai-content'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Generar contenido con IA desde un producto
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const body = await req.json()

  // Generación individual desde un producto
  if (body.productId) {
    const product = await db.product.findUnique({
      where: { id: body.productId },
      include: { category: true, supplier: true },
    })
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    const content = await generateProductPost(
      {
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        description: product.description,
        category: product.category?.name,
        supplier: product.supplier?.companyName,
      },
      body.platform || 'INSTAGRAM',
      body.tone || 'entusiasta'
    )
    return NextResponse.json(content)
  }

  // Generación masiva desde una categoría o lista de productos
  if (body.categoryId || body.bulk) {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE', ...(body.categoryId ? { categoryId: body.categoryId } : {}) },
      include: { category: true, supplier: true },
      take: body.count || 5,
    })
    const contexts = products.map((p) => ({
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      description: p.description,
      category: p.category?.name,
      supplier: p.supplier?.companyName,
    }))
    const results = await generateBulkCaptions(contexts, body.platform || 'INSTAGRAM')
    return NextResponse.json({ generated: Object.keys(results).length, results })
  }

  // Generación libre desde un prompt
  if (body.prompt) {
    const content = await generateProductPost(
      { name: body.prompt, price: 0, description: body.description || '' },
      body.platform || 'INSTAGRAM',
      body.tone || 'entusiasta'
    )
    return NextResponse.json(content)
  }

  return NextResponse.json({ error: 'Especifica productId, categoryId o prompt' }, { status: 400 })
}
