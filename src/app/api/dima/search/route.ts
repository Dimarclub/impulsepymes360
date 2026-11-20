import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/dima/search — búsqueda pública con IA (no requiere auth)
// Body: { query, city?, sector?, lat?, lng?, limit? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      query,
      city,
      sector,
      limit,
    } = body as {
      query: string
      city?: string
      sector?: string
      lat?: number
      lng?: number
      limit?: number
    }

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Consulta demasiado corta', results: [], aiContext: null },
        { status: 400 }
      )
    }

    const q = query.trim()
    const max = Math.min(Math.max(limit || 20, 1), 50)

    // ---- 1. Procesar query con IA para extraer intención + city + sector + category ----
    let aiContext: {
      intention: string
      city: string | null
      sector: string | null
      category: string | null
    } = {
      intention: q,
      city: city || null,
      sector: sector || null,
      category: null,
    }

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content:
              'Eres Dima, un asistente que extrae intención de búsqueda de un proveedor en Ecuador. ' +
              'Devuelve EXCLUSIVAMENTE un JSON válido con las claves: ' +
              'intention (texto corto de lo que el usuario busca, sin ciudad), ' +
              'city (nombre de ciudad en Ecuador o null), ' +
              'sector (sector/barrio o null), ' +
              'category (categoría comercial probable como BAZAR, PAPELERIA, RESTAURANTE, MAYORISTA, TURISMO, COSMETICOS, IMPORTADORA, JUGUETES, TECNOLOGIA, MODA, COMIDA, SALUD, SERVICIOS o null). ' +
              'No incluyas explicaciones, solo el JSON.',
          },
          { role: 'user', content: q },
        ],
        thinking: { type: 'disabled' },
      })
      const raw = completion.choices?.[0]?.message?.content || ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        aiContext = {
          intention: parsed.intention || q,
          city: parsed.city || city || null,
          sector: parsed.sector || sector || null,
          category: parsed.category || null,
        }
      }
    } catch {
      // Si la IA falla, seguimos con el query en crudo + filtros pasados.
    }

    // ---- 2. Búsqueda en SearchPhrase (status=ACTIVE) ----
    // Incluimos branches del supplier para que los resultados traigan
    // whatsapp/sector/address de la sucursal principal incluso cuando el
    // proveedor se encuentra solo por frase (no por texto de perfil).
    const now = new Date()
    const allPhrases = await db.searchPhrase.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ paidUntil: null }, { paidUntil: { gte: now } }],
      },
      include: {
        supplier: { include: { branches: { where: { isActive: true } } } },
      },
    })

    const qLower = q.toLowerCase()
    const aiIntentionLower = (aiContext.intention || q).toLowerCase()
    const matchedPhrases = allPhrases.filter((p) => {
      const phraseLower = p.phrase.toLowerCase()
      if (phraseLower.includes(qLower) || qLower.includes(phraseLower)) return true
      if (phraseLower.includes(aiIntentionLower) || aiIntentionLower.includes(phraseLower)) return true
      const tokens = qLower.split(/\s+/).filter((t) => t.length >= 4)
      return tokens.some((t) => phraseLower.includes(t))
    })

    if (matchedPhrases.length > 0) {
      db.searchPhrase
        .updateMany({
          where: { id: { in: matchedPhrases.map((p) => p.id) } },
          data: { searchCount: { increment: 1 } },
        })
        .catch(() => {})
    }

    // ---- 3. Búsqueda en Product (status=ACTIVE) ----
    const productOr: any[] = [
      { name: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
    ]
    if (aiContext.category) {
      productOr.push({ tags: { contains: aiContext.category } })
    }
    const products = await db.product.findMany({
      where: { status: 'ACTIVE', OR: productOr },
      include: { supplier: true, category: true },
      take: max,
    })

    // ---- 4. Búsqueda en Supplier con branches activas ----
    const supplierOr: any[] = [
      { companyName: { contains: q } },
      { category: { contains: q } },
      { city: { contains: q } },
      { address: { contains: q } },
    ]
    if (aiContext.city) {
      supplierOr.push({ city: { contains: aiContext.city } })
    }
    if (aiContext.category) {
      supplierOr.push({ category: { contains: aiContext.category } })
    }
    const suppliers = await db.supplier.findMany({
      where: {
        OR: supplierOr,
      },
      include: {
        branches: { where: { isActive: true } },
        searchPhrases: { where: { status: 'ACTIVE' } },
      },
      take: max,
    })

    // ---- 5. Búsqueda en Category ----
    const categoryOr: any[] = [
      { name: { contains: q } },
      { slug: { contains: q } },
    ]
    if (aiContext.category) {
      categoryOr.push({ name: { contains: aiContext.category } })
    }
    const categories = await db.category.findMany({
      where: { OR: categoryOr },
      take: 5,
    })

    // ---- 6. Ranking y armado de resultados ----
    // CAMBIO: añadimos `supplierId` y `storeUrl` para que el frontend pueda
    // enlazar al storefront público del proveedor en /proveedor/[id].
    type Result = {
      type: 'SUPPLIER' | 'PRODUCT' | 'CATEGORY'
      id: string
      supplierId: string | null  // siempre el Supplier.id del proveedor (para /proveedor/[id])
      storeUrl: string | null    // URL absoluta al storefront del proveedor
      name: string
      description?: string | null
      city?: string | null
      sector?: string | null
      address?: string | null
      phone?: string | null
      whatsapp?: string | null
      rating: number
      imageUrl?: string | null
      matchedPhrases: string[]
      branch?: { name: string; address: string; city: string } | null
      isPremium: boolean
      score: number
    }

    const results: Result[] = []

    // Helper para construir la URL pública del proveedor.
    // Todos los tipos de resultado que tengan supplierId enlazan a la misma tienda.
    const buildStoreUrl = (supplierId: string | null | undefined): string | null =>
      supplierId ? `/proveedor/${supplierId}` : null

    // Agrupar frases matcheadas por supplierId para evitar resultados
    // duplicados: antes, un proveedor con 5 frases que matcheaban aparecía
    // 5 veces. Ahora aparece 1 sola vez con las 5 frases en matchedPhrases.
    const phrasesBySupplier = new Map<string, typeof matchedPhrases>()
    for (const sp of matchedPhrases) {
      if (!sp.supplier) continue
      const arr = phrasesBySupplier.get(sp.supplierId) || []
      arr.push(sp)
      phrasesBySupplier.set(sp.supplierId, arr)
    }

    for (const [sid, phrases] of phrasesBySupplier) {
      const first = phrases[0]
      const supplier = first.supplier
      // Las branches ya vienen incluidas en sp.supplier.branches; si no,
      // buscamos en el array `suppliers` (puede traer más datos si matcheó por texto).
      const fallback = suppliers.find((s) => s.id === sid)
      const branches = supplier?.branches || fallback?.branches || []
      const branch = branches.find((b) => b.isMain) || branches[0] || null
      const isPremium = phrases.some((p) => p.isPremium)
      results.push({
        type: 'SUPPLIER',
        id: sid,
        supplierId: sid,
        storeUrl: buildStoreUrl(sid),
        name: supplier.companyName,
        description: supplier.category || phrases[0].phrase,
        city: branch?.city || supplier.city || null,
        sector: branch?.sector || null,
        address: branch?.address || supplier.address || null,
        phone: branch?.phone || supplier.phone || null,
        whatsapp: branch?.whatsapp || null,
        rating: supplier.rating || 0,
        imageUrl: null,
        matchedPhrases: phrases.map((p) => p.phrase),
        branch: branch ? { name: branch.name, address: branch.address, city: branch.city } : null,
        isPremium,
        score: 100 + (isPremium ? 50 : 0) + (supplier.rating || 0),
      })
    }

    for (const s of suppliers) {
      if (results.some((r) => r.type === 'SUPPLIER' && r.id === s.id)) continue
      const branch = s.branches.find((b) => b.isMain) || s.branches[0] || null
      const matchedForThis = s.searchPhrases
        .filter((p) => p.status === 'ACTIVE')
        .map((p) => p.phrase)
        .slice(0, 3)
      results.push({
        type: 'SUPPLIER',
        id: s.id,
        supplierId: s.id,
        storeUrl: buildStoreUrl(s.id),
        name: s.companyName,
        description: s.category || null,
        city: branch?.city || s.city || null,
        sector: branch?.sector || null,
        address: branch?.address || s.address || null,
        phone: branch?.phone || s.phone || null,
        whatsapp: branch?.whatsapp || null,
        rating: s.rating || 0,
        imageUrl: null,
        matchedPhrases: matchedForThis,
        branch: branch ? { name: branch.name, address: branch.address, city: branch.city } : null,
        isPremium: false,
        score:
          60 +
          (s.rating || 0) +
          (aiContext.city && branch?.city?.toLowerCase().includes(aiContext.city.toLowerCase()) ? 10 : 0),
      })
    }

    for (const p of products) {
      // CAMBIO: un producto arrastra el supplierId para que el cliente pueda
      // saltar a la tienda del proveedor que lo vende.
      const sid = p.supplierId || p.supplier?.id || null
      results.push({
        type: 'PRODUCT',
        id: p.id,
        supplierId: sid,
        storeUrl: buildStoreUrl(sid),
        name: p.name,
        description: p.description,
        city: p.supplier?.city || null,
        sector: null,
        address: p.supplier?.address || null,
        phone: p.supplier?.phone || null,
        whatsapp: null,
        rating: p.rating || 0,
        imageUrl: p.imageUrl,
        matchedPhrases: [],
        branch: null,
        isPremium: false,
        score: 40 + (p.rating || 0) + (p.featured ? 5 : 0),
      })
    }

    for (const c of categories) {
      results.push({
        type: 'CATEGORY',
        id: c.id,
        supplierId: null,
        storeUrl: null,
        name: c.name,
        description: c.slug,
        city: null,
        sector: null,
        address: null,
        phone: null,
        whatsapp: null,
        rating: 0,
        imageUrl: null,
        matchedPhrases: [],
        branch: null,
        isPremium: false,
        score: 20,
      })
    }

    results.sort((a, b) => b.score - a.score || b.rating - a.rating)
    const finalResults = results.slice(0, max)

    return NextResponse.json({
      ok: true,
      results: finalResults.map((r) => ({
        type: r.type,
        id: r.id,
        supplierId: r.supplierId,   // CAMBIO: incluido en la respuesta
        storeUrl: r.storeUrl,        // CAMBIO: URL lista para usar en el frontend
        name: r.name,
        description: r.description,
        city: r.city,
        sector: r.sector,
        address: r.address,
        phone: r.phone,
        whatsapp: r.whatsapp,
        rating: r.rating,
        imageUrl: r.imageUrl,
        matchedPhrases: r.matchedPhrases,
        branch: r.branch,
        isPremium: r.isPremium,
      })),
      aiContext,
    })
  } catch (e: any) {
    console.error('[dima/search] error:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: 'Error procesando búsqueda', results: [], aiContext: null },
      { status: 500 }
    )
  }
}
