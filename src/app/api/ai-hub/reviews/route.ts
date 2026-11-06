import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { generateReviewResponses } from '@/lib/services/ai-hub'

// POST /api/ai-hub/reviews — "IA Reseñas" (genera 3 opciones de respuesta profesional)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    reviewText?: string
    rating?: number
    customerName?: string
    tone?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const reviewText = (body.reviewText || '').trim()
  if (!reviewText) {
    return NextResponse.json({ error: 'El texto de la reseña es obligatorio' }, { status: 400 })
  }
  if (reviewText.length > 2000) {
    return NextResponse.json({ error: 'Reseña demasiado larga' }, { status: 400 })
  }

  const rating = typeof body.rating === 'number' ? body.rating : 0
  if (rating < 0 || rating > 5) {
    return NextResponse.json({ error: 'Rating inválido (0-5)' }, { status: 400 })
  }

  try {
    const result = await generateReviewResponses({
      reviewText,
      rating,
      customerName: body.customerName,
      tone: body.tone,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[ai-hub/reviews] error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'No se pudieron generar respuestas. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
