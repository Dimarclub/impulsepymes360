import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { generateMarketingContent, type ContentType } from '@/lib/services/ai-hub'

const VALID_TYPES: ContentType[] = ['post', 'caption', 'ad', 'blog', 'description']

// POST /api/ai-hub/content — "IA Contenido" (genera contenido de marketing con 3 variaciones)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    type?: ContentType
    topic?: string
    tone?: string
    platform?: string
    length?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const type = body.type && VALID_TYPES.includes(body.type) ? body.type : 'post'
  const topic = (body.topic || '').trim()
  if (!topic) {
    return NextResponse.json({ error: 'El tema es obligatorio' }, { status: 400 })
  }
  if (topic.length > 500) {
    return NextResponse.json({ error: 'El tema es demasiado largo' }, { status: 400 })
  }

  try {
    const result = await generateMarketingContent({
      type,
      topic,
      tone: body.tone,
      platform: body.platform,
      length: body.length,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[ai-hub/content] error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'No se pudo generar el contenido. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
