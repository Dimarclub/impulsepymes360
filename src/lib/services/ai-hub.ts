// Servicio central de IA para el Centro de IA (DimarClub/ImpulsePymes360)
// Usa z-ai-web-dev-sdk en backend únicamente.
// Provee helpers reutilizables por las rutas /api/ai-hub/*.

import ZAI from 'z-ai-web-dev-sdk'
import type { ChatMessage } from 'z-ai-web-dev-sdk'

let zaiInstance: ZAI | null = null

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

// ---------- Contexto de negocio del usuario ----------

export interface UserBusinessContext {
  userId: string
  name: string
  role: string
  supplier?: {
    companyName: string
    category?: string | null
    city?: string | null
    topProducts?: string[]
  } | null
}

/**
 * Construye un contexto de negocio legible para la IA a partir del usuario.
 * Si es supplier, incluye companyName, categoría y top productos.
 */
export async function buildUserContext(
  userId: string,
  name: string,
  role: string
): Promise<UserBusinessContext> {
  const ctx: UserBusinessContext = { userId, name, role }
  return ctx
}

/**
 * Genera el bloque de texto que se inyecta en el system prompt para
 * que la IA sepa quién es el usuario y su negocio.
 */
export function contextToPrompt(ctx: UserBusinessContext): string {
  const parts: string[] = [
    `El usuario actual se llama ${ctx.name} y su rol en la plataforma es ${ctx.role}.`,
  ]
  if (ctx.supplier) {
    parts.push(`Su negocio es "${ctx.supplier.companyName}".`)
    if (ctx.supplier.category) parts.push(`Rubro: ${ctx.supplier.category}.`)
    if (ctx.supplier.city) parts.push(`Ciudad: ${ctx.supplier.city}.`)
    if (ctx.supplier.topProducts && ctx.supplier.topProducts.length > 0) {
      parts.push(`Productos principales: ${ctx.supplier.topProducts.join(', ')}.`)
    }
  }
  return parts.join(' ')
}

// ---------- Chat conversacional ----------

export interface ChatMessageInput {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithAI(
  message: string,
  history: ChatMessageInput[] = [],
  systemContext = ''
): Promise<string> {
  const zai = await getZAI()

  const systemPrompt = `Eres un asistente de negocios dentro de DimarClub, un marketplace B2C ecuatoriano con sistema de afiliados de 3 niveles, logística, CRM, email marketing y beneficios (envío gratis, lavado de auto gratis, odontología, grúa 24/7, ambulancia 24/7). Respondes en español ecuatoriano, cercano pero profesional. Ayudas con ventas, marketing, contenido, estrategia de embudos, atención al cliente y tareas operativas. Sé concreto y accionable. Si te falta contexto, pregunta brevemente. ${systemContext}`

  const messages: ChatMessage[] = [
    { role: 'assistant', content: systemPrompt },
    ...history.slice(-10).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })

  return completion.choices?.[0]?.message?.content?.trim() || ''
}

// ---------- IA Contenido ----------

export type ContentType = 'post' | 'caption' | 'ad' | 'blog' | 'description'

export interface ContentRequest {
  type: ContentType
  topic: string
  tone?: string
  platform?: string
  length?: string
}

export interface ContentResult {
  content: string
  variations: string[]
}

export async function generateMarketingContent(
  req: ContentRequest
): Promise<ContentResult> {
  const zai = await getZAI()
  const tone = req.tone || 'profesional'
  const platform = req.platform || 'Instagram'
  const length = req.length || 'medio'

  const typeLabels: Record<ContentType, string> = {
    post: 'un post para redes sociales',
    caption: 'un caption corto',
    ad: 'un anuncio publicitario pagado',
    blog: 'un artículo de blog',
    description: 'una descripción de producto',
  }

  const lengthHints: Record<string, string> = {
    corto: 'Máximo 80 palabras.',
    medio: 'Entre 120 y 180 palabras.',
    largo: 'Entre 250 y 400 palabras.',
  }

  const platformHints: Record<string, string> = {
    Instagram: 'Tono visual, con 3-5 hashtags relevantes al final y CTA clara.',
    Facebook: 'Tono cercano, invita a comentar y compartir.',
    TikTok: 'Tono juvenil, directo, máximo 150 caracteres, tendencia.',
    'X (Twitter)': 'Conciso, máximo 280 caracteres.',
    LinkedIn: 'Tono profesional, enfocado en valor de negocio.',
    WhatsApp: 'Directo, con emoji moderado y CTA al final.',
  }

  const systemPrompt = `Eres un copywriter experto en marketing digital para mercados latinoamericanos. Generas ${typeLabels[req.type]} en español ecuatoriano, tono ${tone}. Plataforma: ${platform}. ${platformHints[platform] || ''} ${lengthHints[length] || ''}`

  const userPrompt = `Tema: ${req.topic}

Genera ${typeLabels[req.type]} y responde SOLO con un JSON válido con esta forma exacta:
{
  "content": "versión principal del contenido",
  "variations": ["variación 1 alternativa", "variación 2 alternativa", "variación 3 alternativa"]
}

Las 3 variaciones deben tener enfoques distintos (por ejemplo: emocional, beneficio, urgencia) pero sobre el mismo tema.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices?.[0]?.message?.content || ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as ContentResult
      if (parsed.content && Array.isArray(parsed.variations)) {
        return parsed
      }
    } catch {
      // fallback
    }
  }
  return {
    content: raw || `Contenido sobre ${req.topic}`,
    variations: [raw || ''],
  }
}

// ---------- IA Correos ----------

export interface EmailRequest {
  subject?: string
  goal: string
  audience: string
  productName: string
  keyBenefits: string[]
}

export interface EmailResult {
  subject: string
  body: string
  previewText: string
}

export async function generateEmailCampaign(
  req: EmailRequest
): Promise<EmailResult> {
  const zai = await getZAI()

  const systemPrompt = `Eres un especialista en email marketing para negocios ecuatorianos. Escribes correos que convierten: asuntos que abren, previews que enganchan y cuerpos con CTA claras. Tono profesional pero cercano. Español ecuatoriano. Usa emojis con moderación.`

  const userPrompt = `Genera una campaña de email con estos datos:
- Objetivo: ${req.goal}
- Audiencia: ${req.audience}
- Producto: ${req.productName}
- Beneficios clave: ${req.keyBenefits.join(', ')}
${req.subject ? `- Asunto sugerido (puedes mejorarlo): ${req.subject}` : ''}

Responde SOLO con un JSON válido:
{
  "subject": "asunto del correo (máximo 60 caracteres, que genere apertura)",
  "previewText": "texto de previsualización (máximo 100 caracteres, complementa el asunto)",
  "body": "cuerpo del correo en texto plano, con saludo, beneficio principal, lista de beneficios, CTA clara y despedida. Usa saltos de línea."
}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices?.[0]?.message?.content || ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as EmailResult
      if (parsed.subject && parsed.body) return parsed
    } catch {
      // fallback
    }
  }
  return {
    subject: req.subject || `Novedades sobre ${req.productName}`,
    previewText: `Descubre ${req.productName} hoy`,
    body: raw || `Hola,\n\nTe presentamos ${req.productName}.\n\nSaludos.`,
  }
}

// ---------- IA Reseñas ----------

export interface ReviewRequest {
  reviewText: string
  rating: number
  customerName?: string
  tone?: string
}

export interface ReviewResult {
  responses: string[]
}

export async function generateReviewResponses(
  req: ReviewRequest
): Promise<ReviewResult> {
  const zai = await getZAI()
  const tone = req.tone || 'profesional'
  const customerName = req.customerName || 'el cliente'
  const rating = Math.max(0, Math.min(5, req.rating))

  const systemPrompt = `Eres experto en reputación online y atención al cliente para negocios ecuatorianos. Escribes respuestas a reseñas que son profesionales, empáticas y que mejoran la imagen del negocio. Tono ${tone}. Español ecuatoriano. Cada respuesta debe ser distinta en enfoque pero igualmente apropiada al rating.`

  const strategy =
    rating >= 4
      ? 'Reseña POSITIVA: agradece, menciona el beneficio que destacó el cliente e invita a volver.'
      : rating === 3
        ? 'Reseña NEUTRA: agradece el feedback, reconoce el punto de mejora y compromete una solución.'
        : 'Reseña NEGATIVA: muestra empatía, pide disculpas si aplica, ofrece solucionar el problema y proporciona un canal de contacto directo.'

  const userPrompt = `Genera 3 respuestas distintas para la siguiente reseña de un cliente:
- Cliente: ${customerName}
- Rating: ${rating}/5 estrellas
- Reseña: "${req.reviewText}"

Estrategia: ${strategy}

Responde SOLO con un JSON válido:
{
  "responses": [
    "respuesta 1 (enfoque empático)",
    "respuesta 2 (enfoque accionable)",
    "respuesta 3 (enfoque cercano)"
  ]
}

Cada respuesta debe ser de 2 a 4 oraciones, firmada genéricamente como "El equipo de DimarClub".`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices?.[0]?.message?.content || ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as ReviewResult
      if (Array.isArray(parsed.responses) && parsed.responses.length > 0) {
        return parsed
      }
    } catch {
      // fallback
    }
  }
  return {
    responses: [
      `Gracias ${customerName} por tu reseña. Valoramos tu opinión y trabajamos para mejorar cada día. — El equipo de DimarClub`,
    ],
  }
}

// ---------- IA Embudos ----------

export interface FunnelRequest {
  businessType: string
  productName: string
  priceRange: string
}

export interface FunnelStage {
  name: string
  description: string
  color: string
}

export interface FunnelResult {
  stages: FunnelStage[]
  suggestedActions: string[]
}

export async function generateFunnelStructure(
  req: FunnelRequest
): Promise<FunnelResult> {
  const zai = await getZAI()

  const systemPrompt = `Eres consultor experto en embudos de venta (funnel marketing) para PyMEs ecuatorianas. Diseñas embudos con etapas claras, acciones concretas y métricas. Español ecuatoriano.`

  const userPrompt = `Diseña un embudo de ventas para:
- Tipo de negocio: ${req.businessType}
- Producto/servicio principal: ${req.productName}
- Rango de precio: ${req.priceRange}

Responde SOLO con un JSON válido:
{
  "stages": [
    { "name": "Nombre etapa", "description": "qué pasa en esta etapa", "color": "emerald" },
    ...4 a 6 etapas, desde atracción hasta fidelización...
  ],
  "suggestedActions": [
    "acción concreta 1",
    "acción concreta 2",
    ...5 a 8 acciones accionables para implementar el embudo...
  ]
}

Los colores deben ser uno de: emerald, amber, cyan, rose, purple, sky.`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices?.[0]?.message?.content || ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as FunnelResult
      if (Array.isArray(parsed.stages) && Array.isArray(parsed.suggestedActions)) {
        return parsed
      }
    } catch {
      // fallback
    }
  }
  return {
    stages: [
      { name: 'Atracción', description: 'Captar atención del público objetivo', color: 'emerald' },
      { name: 'Interés', description: 'Generar interés con contenido de valor', color: 'amber' },
      { name: 'Decisión', description: 'Facilitar la decisión de compra', color: 'cyan' },
      { name: 'Acción', description: 'Concretar la venta', color: 'rose' },
      { name: 'Fidelización', description: 'Mantener al cliente y fomentar recompra', color: 'purple' },
    ],
    suggestedActions: [
      'Crea contenido en redes alineado a tu producto',
      'Implementa un formulario de captura de leads',
      'Configura una secuencia de email de bienvenida',
      'Ofrece una promoción de primera compra',
      'Solicita reseñas post-compra',
    ],
  }
}

// ---------- IA de Voz ----------

export type VoicePurpose = 'welcome' | 'followup' | 'appointment'

export interface VoiceRequest {
  purpose: VoicePurpose
  businessName: string
  customerName: string
}

export interface VoiceResult {
  script: string
  duration: string
}

export async function generateVoiceScript(
  req: VoiceRequest
): Promise<VoiceResult> {
  const zai = await getZAI()

  const purposeMap: Record<VoicePurpose, { label: string; goal: string }> = {
    welcome: {
      label: 'bienvenida a nuevo cliente',
      goal: 'saludar, presentarte brevemente y ofrecer ayuda inmediata',
    },
    followup: {
      label: 'seguimiento post-compra',
      goal: 'agradecer la compra, preguntar cómo le fue con el producto y ofrecer soporte',
    },
    appointment: {
      label: 'agendamiento de cita',
      goal: 'recordar la cita y confirmar hora y lugar, ofreciendo alternativa si necesita reagendar',
    },
  }

  const purpose = purposeMap[req.purpose]

  const systemPrompt = `Eres guionista de llamadas comerciales para negocios ecuatorianos. Escribes guiones claros, amables y efectivos que el agente pueda leer en menos de 90 segundos. Tono cercano y profesional. Español ecuatoriano.`

  const userPrompt = `Escribe un guion de llamada telefónica con:
- Propósito: ${purpose.label}
- Negocio: ${req.businessName}
- Cliente: ${req.customerName}
- Objetivo: ${purpose.goal}

El guion debe incluir:
1. Saludo del agente (presentándose con nombre del negocio)
2. Verificación de identidad del cliente
3. Mensaje principal
4. CTA clara (preguntar si necesita algo más / confirmar / agendar)
5. Despedida cordial

Indica los párrafos del agente con "AGENTE:" y posibles respuestas del cliente entre paréntesis como (cliente responde).

Responde SOLO con un JSON válido:
{
  "script": "guion completo de la llamada",
  "duration": "duración estimada en formato mm:ss"
}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const raw = completion.choices?.[0]?.message?.content || ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as VoiceResult
      if (parsed.script) return parsed
    } catch {
      // fallback
    }
  }
  return {
    script: raw || `Hola ${req.customerName}, te llamo de ${req.businessName}...`,
    duration: '01:00',
  }
}
