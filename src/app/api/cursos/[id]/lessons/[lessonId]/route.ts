import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession, isOwnerOrAdmin } from '@/lib/security/auth'

// PATCH — actualiza una lección. Solo owner/admin del curso.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id, lessonId } = await params

  const course = await db.course.findUnique({ where: { id } })
  if (!course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, course.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }

  const existing = await db.courseLesson.findFirst({
    where: { id: lessonId, courseId: id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.title === 'string' && body.title.trim()) {
    data.title = body.title.trim()
  }
  if (typeof body.content === 'string') {
    data.content = body.content
  }
  if (typeof body.videoUrl === 'string') {
    data.videoUrl = body.videoUrl.trim() || null
  }
  if (body.duration !== undefined && body.duration !== null && body.duration !== '') {
    const n = Number(body.duration)
    if (Number.isFinite(n) && n >= 0) data.duration = Math.floor(n)
  }
  if (typeof body.order === 'number' && Number.isFinite(body.order)) {
    data.order = Math.floor(body.order)
  }

  const updated = await db.courseLesson.update({ where: { id: lessonId }, data })
  return NextResponse.json({ ok: true, lesson: updated })
}

// DELETE — elimina una lección. Solo owner/admin del curso.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const { id, lessonId } = await params

  const course = await db.course.findUnique({ where: { id } })
  if (!course) {
    return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  }
  if (!isOwnerOrAdmin(auth, course.userId)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
  }

  const existing = await db.courseLesson.findFirst({
    where: { id: lessonId, courseId: id },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
  }

  await db.courseLesson.delete({ where: { id: lessonId } })
  return NextResponse.json({ ok: true })
}
