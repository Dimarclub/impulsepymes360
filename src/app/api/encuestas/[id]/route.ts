import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const survey = await db.survey.findUnique({
    where: { id },
    include: { responses: { orderBy: { createdAt: 'desc' } } },
  })
  if (!survey) {
    return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: auth.role, name: '', email: '' }, survey.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, survey })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.survey.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: auth.role, name: '', email: '' }, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim()
  }
  if (typeof body.description === 'string') {
    data.description = body.description.trim() || null
  }
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive
  }
  if (Array.isArray(body.questions)) {
    const questions = sanitizeQuestions(body.questions)
    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Agrega al menos una pregunta válida' },
        { status: 400 }
      )
    }
    data.questions = JSON.stringify(questions)
  }
  const updated = await db.survey.update({ where: { id }, data })
  return NextResponse.json({ ok: true, survey: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const existing = await db.survey.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
  }
  if (!isOwnerOrAdmin({ id: auth.id, role: auth.role, name: '', email: '' }, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }
  await db.survey.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
