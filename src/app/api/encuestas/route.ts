import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

const VALID_QUESTION_TYPES = ['text', 'rating', 'choice', 'scale'] as const
type QuestionType = (typeof VALID_QUESTION_TYPES)[number]

interface SurveyQuestion {
  text: string
  type: string
  required?: boolean
  options?: string[]
}

function sanitizeQuestions(raw: unknown): SurveyQuestion[] {
  if (!Array.isArray(raw)) return []
  const out: SurveyQuestion[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const q = item as Record<string, unknown>
    const text = String(q.text ?? '').trim()
    const type = String(q.type ?? 'text')
    if (!text) continue
    if (!VALID_QUESTION_TYPES.includes(type as QuestionType)) continue
    const question: SurveyQuestion = {
      text,
      type,
      required: Boolean(q.required),
    }
    if (type === 'choice' && Array.isArray(q.options)) {
      question.options = (q.options as unknown[])
        .map((o) => String(o).trim())
        .filter(Boolean)
    }
    out.push(question)
  }
  return out
}

export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const surveys = await db.survey.findMany({
    where: { userId: auth.id },
    include: { _count: { select: { responses: true } }, responses: true },
    orderBy: { createdAt: 'desc' },
  })

  const withStats = surveys.map((s) => {
    const ratings = s.responses
      .map((r) => r.rating)
      .filter((r): r is number => typeof r === 'number' && r > 0)
    const avg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0
    const { responses, ...rest } = s
    return {
      ...rest,
      _count: s._count,
      averageRating: avg,
    }
  })

  return NextResponse.json({ ok: true, surveys: withStats })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const title = String(body.title ?? '').trim()
  if (!title) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
  }
  const questions = sanitizeQuestions(body.questions)
  if (questions.length === 0) {
    return NextResponse.json(
      { error: 'Agrega al menos una pregunta válida' },
      { status: 400 }
    )
  }
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : null

  const survey = await db.survey.create({
    data: {
      userId: auth.id,
      title,
      description,
      questions: JSON.stringify(questions),
      isActive: body.isActive !== false,
    },
  })
  return NextResponse.json({ ok: true, survey }, { status: 201 })
}
