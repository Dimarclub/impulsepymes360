import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireRole } from '@/lib/security/auth'

/**
 * /api/cpa-tasks/[id]
 *
 * GET    (publico/auth):  retorna una tarea con el estado de completitud del
 *                         usuario actual (si está autenticado).
 * PATCH  (admin):         actualiza una tarea (cambiar status, comisión,
 *                         fechas, etc.).
 * DELETE (admin|owner):   elimina una tarea. El creador (SUPPLIER) puede
 *                         eliminar sus propias tareas.
 */

// ---------- GET ----------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getSessionUser()

  try {
    const task = await db.cpaTask.findUnique({
      where: { id },
      include: user
        ? { completions: { where: { userId: user.id } } }
        : false,
    })
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, task })
  } catch (err) {
    console.error('[cpa-tasks/[id] GET] error:', err)
    return NextResponse.json({ error: 'Error al obtener la tarea' }, { status: 500 })
  }
}

// ---------- PATCH ----------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const allowed = new Set([
    'title', 'description', 'type', 'videoUrl', 'imageUrl',
    'offerTitle', 'offerUrl', 'productId', 'commission',
    'maxParticipants', 'endDate', 'status',
  ])
  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) data[k] = v
  }

  // Cast endDate
  if (typeof data.endDate === 'string') {
    const d = new Date(data.endDate as string)
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: 'endDate inválida' }, { status: 400 })
    }
    data.endDate = d
  }

  // Cast commission
  if (data.commission != null) {
    const c = Number(data.commission)
    if (isNaN(c) || c < 0) {
      return NextResponse.json({ error: 'Comisión inválida' }, { status: 400 })
    }
    data.commission = c
  }

  // Cast maxParticipants
  if (data.maxParticipants != null && data.maxParticipants !== '') {
    const n = Number(data.maxParticipants)
    if (isNaN(n) || n < 1) {
      return NextResponse.json({ error: 'maxParticipants inválido' }, { status: 400 })
    }
    data.maxParticipants = n
  } else if (data.maxParticipants === '') {
    data.maxParticipants = null
  }

  try {
    const updated = await db.cpaTask.update({ where: { id }, data })
    return NextResponse.json({ ok: true, task: updated })
  } catch (err) {
    console.error('[cpa-tasks/[id] PATCH] error:', err)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
}

// ---------- DELETE ----------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string }

  const { id } = await params

  try {
    const task = await db.cpaTask.findUnique({ where: { id }, select: { createdBy: true } })
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }
    if (user.role !== 'ADMIN' && task.createdBy !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar esta tarea' }, { status: 403 })
    }

    await db.cpaTask.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[cpa-tasks/[id] DELETE] error:', err)
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  }
}
