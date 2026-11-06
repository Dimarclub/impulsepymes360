import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { requireSession, requireRole } from '@/lib/security/auth'

// GET — lista cursos publicados para todos los usuarios autenticados.
// Incluye _count de lessons y enrollments + flag `enrolled` para el usuario actual.
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // IDs en los que el usuario actual está inscrito
  const myEnrollments = await db.courseEnrollment.findMany({
    where: { userId: auth.id },
    select: { courseId: true, progress: true, completedAt: true },
  })
  const enrolledMap = new Map(myEnrollments.map((e) => [e.courseId, e]))

  const result = courses.map((c) => {
    const env = enrolledMap.get(c.id)
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      category: c.category,
      isPublished: c.isPublished,
      createdAt: c.createdAt,
      instructor: c.user,
      _count: {
        lessons: c._count.lessons,
        enrollments: c._count.enrollments,
      },
      enrolled: !!env,
      progress: env?.progress ?? 0,
      completedAt: env?.completedAt ?? null,
    }
  })

  return NextResponse.json({ ok: true, courses: result })
}

// POST — crea curso en draft. Solo SUPPLIER/ADMIN.
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? '').trim()
  if (!title) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
  }
  const description =
    typeof body.description === 'string' && body.description.trim()
      ? body.description.trim()
      : null
  const category =
    typeof body.category === 'string' && body.category.trim()
      ? body.category.trim()
      : null
  const coverImage =
    typeof body.coverImage === 'string' && body.coverImage.trim()
      ? body.coverImage.trim()
      : null

  const course = await db.course.create({
    data: {
      id: randomUUID(),
      userId: auth.id,
      title,
      description,
      category,
      coverImage,
      isPublished: false,
      updatedAt: new Date(),
    },
  })
  return NextResponse.json({ ok: true, course }, { status: 201 })
}
