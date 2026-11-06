import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// POST /api/ai-hub/knowledge/search — busca artículos por query (title + content + tags)
// Esto es lo que la IA puede usar para responder preguntas basadas en conocimiento del negocio.
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: { query?: string; limit?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const query = (body.query || '').trim()
  if (!query) {
    return NextResponse.json({ ok: true, articles: [] })
  }

  const limit = Math.min(20, Math.max(1, body.limit || 10))
  const articles = await db.knowledgeArticle.findMany({
    where: {
      userId: auth.id,
      isPublished: true,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { tags: { contains: query } },
        { category: { contains: query } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ ok: true, articles })
}
