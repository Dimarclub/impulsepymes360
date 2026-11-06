import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// GET — curso con lecciones (ordenadas) + _count + enrolled + progress
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const course = await db.course.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      lessons: { orderBy: { order: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  })
  if (!course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  // Si no está publicado, solo owner/admin puede verlo
  if (!course.isPublished && !isOwnerOrAdmin(auth, course.userId)) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }

  const enrollment = await db.courseEnrollment.findUnique({
    where: {
      courseId_userId: { courseId: id, userId: auth.id },
    },
  })

  let completedLessons: string[] = []
  if (enrollment) {
    try {
      const parsed = JSON.parse(enrollment.completedLessons)
      if (Array.isArray(parsed)) {
        completedLessons = parsed.filter((x) => typeof x === 'string')
      }
    } catch {
      completedLessons = []
    }
  }

  const result = {
    id: course.id,
    title: course.title,
    description: course.description,
    coverImage: course.coverImage,
    category: course.category,
    isPublished: course.isPublished,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    userId: course.userId,
    instructor: course.user,
    lessons: course.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      content: l.content,
      videoUrl: l.videoUrl,
      duration: l.duration,
      order: l.order,
      completed: completedLessons.includes(l.id),
    })),
    _count: { enrollments: course._count.enrollments },
    enrolled: !!enrollment,
    progress: enrollment?.progress ?? 0,
    completedAt: enrollment?.completedAt ?? null,
    enrolledAt: enrollment?.enrolledAt ?? null,
  }

  return NextResponse.json({ ok: true, course: result })
}

// PATCH — actualiza curso. Solo owner/admin.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const existing = await db.course.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim()
  }
  if (typeof body.description === 'string') {
    data.description = body.description.trim() || null
  }
  if (typeof body.category === 'string') {
    data.category = body.category.trim() || null
  }
  if (typeof body.coverImage === 'string') {
    data.coverImage = body.coverImage.trim() || null
  }
  if (typeof body.isPublished === 'boolean') {
    data.isPublished = body.isPublished
  }

  const updated = await db.course.update({ where: { id }, data })
  return NextResponse.json({ ok: true, course: updated })
}

// DELETE — elimina curso (cascade lessons + enrollments vía onDelete: Cascade)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const existing = await db.course.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, existing.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }

  await db.course.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
