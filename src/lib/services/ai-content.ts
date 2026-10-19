// Servicio de generación de contenido con IA usando z-ai-web-dev-sdk
// Genera captions promocionales desde datos de productos del catálogo Dimarclub

import ZAI from 'z-ai-web-dev-sdk'

export interface ProductContext {
  name: string
  price: number
  compareAtPrice?: number | null
  description?: string | null
  category?: string | null
  supplier?: string | null
}

export interface GeneratedContent {
  caption: string
  hashtags: string[]
  variations: string[]
}

let zaiInstance: ZAI | null = null

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

const SYSTEM_PROMPT = `Eres un experto en marketing de redes sociales para Dimarclub, un marketplace B2C ecuatoriano con sistema de afiliados de 3 niveles. Generas contenido promocional en español (tono ecuatoriano cercano), destacando beneficios como: envío a domicilio gratis, lavado de autos gratis, atención odontológica, grúa 24/7, ambulancia 24/7. Usas emojis con moderación y hashtags relevantes. El tono es entusiasta pero honesto.`

export async function generateProductPost(
  product: ProductContext,
  platform: string = 'INSTAGRAM',
  tone: string = 'entusiasta'
): Promise<GeneratedContent> {
  try {
    const zai = await getZAI()
    const discount = product.compareAtPrice
      ? `${Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF (antes $${product.compareAtPrice.toFixed(2)})`
      : 'precio especial'

    const platformHint =
      platform === 'TIKTOK' ? 'Tono juvenil, tendencia, máximo 150 caracteres'
      : platform === 'X' ? 'Conciso, máximo 280 caracteres, directo'
      : platform === 'LINKEDIN' ? 'Tono profesional, enfocado en valor de negocio'
      : 'Tono visual, hasta 2200 caracteres, con llamada a la acción'

    const userPrompt = `Genera un post promocional para el siguiente producto de Dimarclub:
- Producto: ${product.name}
- Precio: $${product.price.toFixed(2)} (${discount})
- Categoría: ${product.category || 'General'}
- Proveedor: ${product.supplier || 'Dimarclub'}
- Descripción: ${product.description || 'Producto de calidad'}

Plataforma: ${platform}
Tono: ${tone}

${platformHint}

Responde SOLO en formato JSON válido:
{"caption": "...", "hashtags": ["#dimarclub", ...], "variations": ["variación 1", "variación 2", "variación 3"]}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content || ''
    // Extraer JSON de la respuesta (puede venir con markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as GeneratedContent
      } catch {
        // fallback
      }
    }
    // Fallback: generar contenido simple
    return fallbackContent(product, platform)
  } catch (e) {
    console.error('AI generation error:', (e as Error).message)
    return fallbackContent(product, platform)
  }
}

export async function generateBulkCaptions(
  products: ProductContext[],
  platform: string = 'INSTAGRAM'
): Promise<Record<string, GeneratedContent>> {
  const results: Record<string, GeneratedContent> = {}
  // Procesar en paralelo con límite de concurrencia
  const batchSize = 3
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const entries = await Promise.all(
      batch.map(async (p) => [p.name, await generateProductPost(p, platform)] as const)
    )
    for (const [name, content] of entries) results[name] = content
  }
  return results
}

function fallbackContent(product: ProductContext, platform: string): GeneratedContent {
  const discount = product.compareAtPrice
    ? ` 🔥 ${Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF`
    : ''
  const caption = `¡${product.name} ya disponible en Dimarclub! 💚\n\n✅ Precio: $${product.price.toFixed(2)}${discount}\n✅ Envío a domicilio GRATIS\n✅ Gana 3% por comprar + 2% por recomendar\n\n${product.description || 'Producto de calidad garantizada.'}\n\n👉 Compra en dimarclub.com\n\n#Dimarclub #Marketplace #Ecuador #ComunidadQueGana`
  const hashtags = ['#Dimarclub', '#Marketplace', '#Ecuador', '#ComunidadQueGana', `#${(product.category || 'Shopping').replace(/\s/g, '')}`]
  const variations = [
    caption,
    `¿Necesitas ${product.name}? En Dimarclub lo tienes con envío gratis 🚚\n\n$${product.price.toFixed(2)} · Compra y gana comisiones 💰\n\n#Dimarclub`,
    `${product.name} al mejor precio 🛍️\n\n$${product.price.toFixed(2)} en Dimarclub\nEnvío gratis + beneficios exclusivos\n\n¡Únete a la comunidad! 🌎`,
  ]
  return { caption, hashtags, variations }
}
