import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// GET — lista cursos creados por el usuario actual (cualquier estado).
// Solo SUPPLIER/ADMIN.
export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const courses = await db.course.findMany({
    where: { userId: auth.id },
    include: {
      _count: { select: { lessons: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const result = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    coverImage: c.coverImage,
    category: c.category,
    isPublished: c.isPublished,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _count: {
      lessons: c._count.lessons,
      enrollments: c._count.enrollments,
    },
  }))

  return NextResponse.json({ ok: true, courses: result })
}
