import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// GET /api/ai-hub/knowledge — lista artículos del usuario ordenados por updatedAt desc
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const articles = await db.knowledgeArticle.findMany({
    where: { userId: auth.id },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(articles)
}

// POST /api/ai-hub/knowledge — crea artículo de conocimiento
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    title?: string
    content?: string
    category?: string
    tags?: string
    isPublished?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  const content = (body.content || '').trim()
  if (!title || !content) {
    return NextResponse.json(
      { error: 'Título y contenido son obligatorios' },
      { status: 400 }
    )
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'Título demasiado largo (máx 200)' }, { status: 400 })
  }

  const article = await db.knowledgeArticle.create({
    data: {
      userId: auth.id,
      title,
      content,
      category: body.category?.trim() || null,
      tags: body.tags?.trim() || null,
      isPublished: body.isPublished !== false,
    },
  })
  return NextResponse.json(article, { status: 201 })
}
