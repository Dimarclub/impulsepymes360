import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, isOwnerOrAdmin } from '@/lib/security/auth'

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
  const questions = parseQuestions(survey.questions)

  const responses = survey.responses.map((r) => {
    let answers: Record<string, unknown> = {}
    try {
      answers = JSON.parse(r.answers) as Record<string, unknown>
    } catch {
      answers = {}
    }
    return {
      id: r.id,
      respondentName: r.respondentName,
      respondentEmail: r.respondentEmail,
      rating: r.rating,
      answers,
      createdAt: r.createdAt,
    }
  })

  // Stats globales: rating promedio + distribución por pregunta
  const allRatings = responses
    .map((r) => r.rating)
    .filter((r): r is number => typeof r === 'number' && r > 0)
  const averageRating =
    allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : 0

  const ratingDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
  for (const r of allRatings) {
    ratingDistribution[r] = (ratingDistribution[r] ?? 0) + 1
  }

  const questionStats = questions.map((q, idx) => {
    const key = String(idx)
    const collected = responses
      .map((r) => r.answers[key])
      .filter((v) => v !== undefined && v !== null && asString(v).trim() !== '')
    if (q.type === 'rating' || q.type === 'scale') {
      const nums = collected.map(asNumber).filter((n): n is number => n !== null)
      const avg =
        nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      const dist: Record<string, number> = {}
      for (const n of nums) {
        const k = String(n)
        dist[k] = (dist[k] ?? 0) + 1
      }
      return {
        index: idx,
        text: q.text,
        type: q.type,
        count: nums.length,
        average: avg,
        distribution: dist,
      }
    }
    if (q.type === 'choice') {
      const dist: Record<string, number> = {}
      for (const v of collected) {
        const s = asString(v)
        dist[s] = (dist[s] ?? 0) + 1
      }
      return {
        index: idx,
        text: q.text,
        type: q.type,
        count: collected.length,
        options: q.options ?? [],
        distribution: dist,
      }
    }
    return {
      index: idx,
      text: q.text,
      type: q.type,
      count: collected.length,
      answers: collected.map(asString),
    }
  })

  return NextResponse.json({
    ok: true,
    responses,
    stats: {
      total: responses.length,
      averageRating,
      ratingDistribution,
      questionStats,
    },
  })
}
