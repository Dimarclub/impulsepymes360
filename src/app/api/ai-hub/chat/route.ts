import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { db } from '@/lib/db'
import { chatWithAI, buildUserContext, contextToPrompt } from '@/lib/services/ai-hub'

// POST /api/ai-hub/chat — "Pregúntale a la IA" (chat conversacional con contexto del usuario)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    message?: string
    history?: { role: 'user' | 'assistant'; content: string }[]
    context?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const message = (body.message || '').trim()
  if (!message) {
    return NextResponse.json({ error: 'El mensaje es obligatorio' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'El mensaje es demasiado largo (máx 2000 caracteres)' }, { status: 400 })
  }

  // Contexto de negocio: si es supplier, traer companyName + categoría + top productos
  let supplierData: {
    companyName: string
    category?: string | null
    city?: string | null
    topProducts?: string[]
  } | null = null
  try {
    const supplier = await db.supplier.findUnique({
      where: { userId: auth.id },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { name: true },
        },
      },
    })
    if (supplier) {
      supplierData = {
        companyName: supplier.companyName,
        category: supplier.category,
        city: supplier.city,
        topProducts: supplier.products.map((p) => p.name),
      }
    }
  } catch {
    // ignore — el contexto es best-effort
  }

  const ctx = await buildUserContext(auth.id, auth.name, auth.role)
  ctx.supplier = supplierData
  const systemContext = contextToPrompt(ctx)
  const fullContext = `${systemContext}${body.context ? `\nContexto adicional: ${body.context}` : ''}`

  try {
    const reply = await chatWithAI(message, body.history || [], fullContext)
    return NextResponse.json({ ok: true, reply })
  } catch (e) {
    console.error('[ai-hub/chat] error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'No se pudo generar la respuesta. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
