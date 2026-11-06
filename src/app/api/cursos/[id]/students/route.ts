import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// GET — lista estudiantes inscritos con progreso. Solo owner/admin del curso.
export async function GET(
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
  if (!isOwnerOrAdmin(auth, course.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }

  const enrollments = await db.courseEnrollment.findMany({
    where: { courseId: id },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  const students = enrollments.map((e) => {
    let completedLessons: string[] = []
    try {
      const parsed = JSON.parse(e.completedLessons)
      if (Array.isArray(parsed)) {
        completedLessons = parsed.filter((x) => typeof x === 'string')
      }
    } catch {
      completedLessons = []
    }
    return {
      id: e.id,
      userId: e.userId,
      name: e.user.name,
      email: e.user.email,
      progress: e.progress,
      completedLessonsCount: completedLessons.length,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
    }
  })

  return NextResponse.json({ ok: true, students })
}
