import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface SurveyQuestion {
  text: string
  type: string
  required?: boolean
  options?: string[]
}

function parseQuestions(raw: string): SurveyQuestion[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SurveyQuestion[]
  } catch {
    return []
  }
}

function asString(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.map(asString).join(', ')
  return String(v)
}

function asNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const survey = await db.survey.findUnique({ where: { id } })
  if (!survey) {
    return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
  }
  if (!survey.isActive) {
    return NextResponse.json({ error: 'Esta encuesta no está activa' }, { status: 410 })
  }
  const questions = parseQuestions(survey.questions)
  const body = await req.json().catch(() => ({}))
  const answers: Record<string, unknown> =
    body && typeof body === 'object' && body.answers && typeof body.answers === 'object'
      ? (body.answers as Record<string, unknown>)
      : (body && typeof body === 'object' ? (body as Record<string, unknown>) : {})

  // Validar preguntas requeridas
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const v = answers[String(i)]
    const present =
      v !== undefined && v !== null && asString(v).trim() !== ''
    if (q.required && !present) {
      return NextResponse.json(
        { error: `La pregunta "${q.text}" es obligatoria` },
        { status: 400 }
      )
    }
  }

  // Rating global opcional (suele venir de una pregunta tipo rating destacada o un campo aparte)
  let rating: number | null = null
  if (body.rating !== undefined && body.rating !== null) {
    rating = asNumber(body.rating)
  } else {
    // Tomar el primer rating del body si existe
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (q.type === 'rating') {
        const n = asNumber(answers[String(i)])
        if (n !== null) {
          rating = n
          break
        }
      }
    }
  }

  const respondentName =
    typeof body.respondentName === 'string' ? body.respondentName.trim() : null
  const respondentEmail =
    typeof body.respondentEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.respondentEmail)
      ? body.respondentEmail.trim()
      : null

  const response = await db.surveyResponse.create({
    data: {
      surveyId: id,
      respondentName,
      respondentEmail,
      answers: JSON.stringify(answers),
      rating: rating,
    },
  })

  // Promedio actualizado para mostrar en pantalla de agradecimiento
  const all = await db.surveyResponse.findMany({
    where: { surveyId: id },
    select: { rating: true },
  })
  const ratings = all
    .map((r) => r.rating)
    .filter((r): r is number => typeof r === 'number' && r > 0)
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0

  return NextResponse.json(
    {
      ok: true,
      message: '¡Gracias por tu respuesta!',
      responseId: response.id,
      averageRating,
    },
    { status: 201 }
  )
}
