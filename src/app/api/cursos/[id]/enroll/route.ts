import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// POST — inscribe al usuario actual en el curso. Si ya inscrito, retorna el existente.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const course = await db.course.findUnique({ where: { id } })
  if (!course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }
  if (!course.isPublished) {
    return NextResponse.json(
      { error: 'El curso no está disponible para inscripción' },
      { status: 400 }
    )
  }

  const existing = await db.courseEnrollment.findUnique({
    where: {
      courseId_userId: { courseId: id, userId: auth.id },
    },
  })
  if (existing) {
    return NextResponse.json({ ok: true, enrollment: existing })
  }

  const enrollment = await db.courseEnrollment.create({
    data: {
      id: randomUUID(),
      courseId: id,
      userId: auth.id,
      progress: 0,
      completedLessons: '[]',
    },
  })
  return NextResponse.json({ ok: true, enrollment }, { status: 201 })
}
