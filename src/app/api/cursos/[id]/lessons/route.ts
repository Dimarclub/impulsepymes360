import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// POST — crea lección en un curso. Solo owner/admin del curso.
export async function POST(
  req: NextRequest,
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

  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? '').trim()
  if (!title) {
    return NextResponse.json({ error: 'El título de la lección es obligatorio' }, { status: 400 })
  }
  const content = typeof body.content === 'string' ? body.content : ''
  const videoUrl =
    typeof body.videoUrl === 'string' && body.videoUrl.trim()
      ? body.videoUrl.trim()
      : null

  let duration: number | null = null
  if (body.duration !== undefined && body.duration !== null && body.duration !== '') {
    const n = Number(body.duration)
    if (Number.isFinite(n) && n >= 0) duration = Math.floor(n)
  }

  // Calcular el siguiente orden si no viene explícito
  let order = 0
  if (typeof body.order === 'number' && Number.isFinite(body.order)) {
    order = Math.floor(body.order)
  } else {
    const last = await db.courseLesson.findFirst({
      where: { courseId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    order = (last?.order ?? -1) + 1
  }

  const lesson = await db.courseLesson.create({
    data: {
      id: randomUUID(),
      courseId: id,
      title,
      content,
      videoUrl,
      duration,
      order,
    },
  })
  return NextResponse.json({ ok: true, lesson }, { status: 201 })
}
