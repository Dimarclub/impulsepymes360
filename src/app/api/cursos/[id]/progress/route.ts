import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// POST — marca lección como completada/no completada. Recalcula progress.
// Body: { lessonId, completed }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const enrollment = await db.courseEnrollment.findUnique({
    where: {
      courseId_userId: { courseId: id, userId: auth.id },
    },
  })
  if (!enrollment) {
    return NextResponse.json(
      { error: 'No estás inscrito en este curso' },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const lessonId = String(body.lessonId ?? '').trim()
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId es obligatorio' }, { status: 400 })
  }
  const completed = body.completed !== false

  // Verificar que la lección pertenezca al curso
  const lesson = await db.courseLesson.findFirst({
    where: { id: lessonId, courseId: id },
    select: { id: true },
  })
  if (!lesson) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  // Parsear completedLessons
  let completedLessons: string[] = []
  try {
    const parsed = JSON.parse(enrollment.completedLessons)
    if (Array.isArray(parsed)) {
      completedLessons = parsed.filter((x) => typeof x === 'string')
    }
  } catch {
    completedLessons = []
  }

  if (completed) {
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    }
  } else {
    completedLessons = completedLessons.filter((l) => l !== lessonId)
  }

  // Calcular nuevo progreso
  const totalLessons = await db.courseLesson.count({ where: { courseId: id } })
  const completedCount = completedLessons.length
  const progress = totalLessons > 0
    ? Math.round((completedCount / totalLessons) * 100)
    : 0
  const allCompleted = totalLessons > 0 && completedCount === totalLessons
  const completedAt = allCompleted
    ? enrollment.completedAt ?? new Date()
    : null

  const updated = await db.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      completedLessons: JSON.stringify(completedLessons),
      progress,
      completedAt,
    },
  })

  return NextResponse.json({
    ok: true,
    progress: updated.progress,
    completedAt: updated.completedAt,
    completedLessons,
  })
}
