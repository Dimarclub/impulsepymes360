import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser, requireRole } from '@/lib/security/auth'

/**
 * /api/cpa-tasks
 *
 * Sistema de Tareas CPA (Cost-Per-Action) — ImpulsePymes360
 *
 * GET  (publico/auth): retorna todas las tareas ACTIVE dentro del rango de
 *                      fechas (startDate <= now <= endDate) y con cupo
 *                      disponible (currentParticipants < maxParticipants o
 *                      maxParticipants null). Si el usuario está autenticado,
 *                      incluye el estado de su completitud para cada tarea.
 *
 * POST (supplier/admin): crea una nueva tarea CPA. El createdBy se deriva del
 *                      usuario autenticado.
 */

const VALID_TYPES = new Set([
  'VIDEO', 'SHARE', 'VISIT', 'SUBSCRIBE',
  'PHOTO_BOLSO', 'PHOTO_STORE', 'PHOTO_STICKER',
])

const PHOTO_TYPES = new Set(['PHOTO_BOLSO', 'PHOTO_STORE', 'PHOTO_STICKER'])
const VIDEO_TYPES = new Set(['VIDEO', 'SHARE', 'VISIT', 'SUBSCRIBE'])

// ---------- GET ----------
export async function GET() {
  const now = new Date()
  const user = await getSessionUser()

  console.log('[cpa-tasks GET] db.cpaTask:', typeof (db as any).cpaTask, '| db.user:', typeof (db as any).user)
  try {
    const tasks = await db.cpaTask.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      include: user
        ? { completions: { where: { userId: user.id }, select: { id: true, status: true, photoUrl: true, rewardAmount: true, completedAt: true, reviewedAt: true, adminNotes: true } } }
        : false,
    })

    // Filtrar por cupo disponible
    const available = tasks.filter((t) => {
      if (t.maxParticipants == null) return true
      return t.currentParticipants < t.maxParticipants
    })

    return NextResponse.json({ ok: true, tasks: available })
  } catch (err) {
    console.error('[cpa-tasks GET] error:', err)
    return NextResponse.json({ ok: true, tasks: [] })
  }
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; role: string; name: string }

  let body: {
    title?: string
    description?: string
    type?: string
    videoUrl?: string | null
    imageUrl?: string | null
    offerTitle?: string | null
    offerUrl?: string | null
    productId?: string | null
    commission?: number | string
    maxParticipants?: number | string | null
    endDate?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const title = (body.title || '').trim()
  if (!title) {
    return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
  }
  const type = (body.type || 'VIDEO').toUpperCase()
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Tipo de tarea inválido' }, { status: 400 })
  }
  if (!body.endDate) {
    return NextResponse.json({ error: 'La fecha de fin es obligatoria' }, { status: 400 })
  }
  const endDate = new Date(body.endDate)
  if (isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Fecha de fin inválida' }, { status: 400 })
  }
  if (endDate <= new Date()) {
    return NextResponse.json({ error: 'La fecha de fin debe ser futura' }, { status: 400 })
  }

  // Validar videoUrl requerido para tareas de video
  if (VIDEO_TYPES.has(type)) {
    const v = (body.videoUrl || '').trim()
    if (!v) {
      return NextResponse.json(
        { error: 'Para tareas de video debes proporcionar la URL del video' },
        { status: 400 },
      )
    }
  }

  const commission = Number(body.commission ?? 0.15)
  if (isNaN(commission) || commission < 0) {
    return NextResponse.json({ error: 'Comisión inválida' }, { status: 400 })
  }

  let maxParticipants: number | null = null
  if (body.maxParticipants != null && body.maxParticipants !== '' && body.maxParticipants !== 0) {
    const n = Number(body.maxParticipants)
    if (isNaN(n) || n < 1) {
      return NextResponse.json({ error: 'maxParticipants inválido' }, { status: 400 })
    }
    maxParticipants = n
  }

  try {
    const task = await db.cpaTask.create({
      data: {
        title,
        description: body.description?.trim() || null,
        type,
        videoUrl: body.videoUrl?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        offerTitle: body.offerTitle?.trim() || null,
        offerUrl: body.offerUrl?.trim() || null,
        productId: body.productId?.trim() || null,
        commission,
        maxParticipants,
        currentParticipants: 0,
        startDate: new Date(),
        endDate,
        status: 'ACTIVE',
        createdBy: user.id,
      },
    })

    // Notificar a todos los clientes/afiliados/socios (mejor-effort, capped a 200)
    try {
      const recipients = await db.user.findMany({
        where: { role: { in: ['CLIENT', 'AFFILIATE', 'PARTNER'] } },
        select: { id: true },
        take: 200,
      })
      if (recipients.length > 0) {
        await db.notification.createMany({
          data: recipients.map((r) => ({
            userId: r.id,
            type: 'CPA_TASK_NEW',
            title: 'Nueva tarea CPA disponible',
            message: `¡${title} está disponible! Completa la tarea y gana $${commission.toFixed(2)}.`,
            link: '/?module=cpa-tasks',
          })),
        })
      }
    } catch (notifErr) {
      console.error('[cpa-tasks POST] notif error:', notifErr)
    }

    return NextResponse.json({ ok: true, task }, { status: 201 })
  } catch (err) {
    console.error('[cpa-tasks POST] create error:', err)
    return NextResponse.json({ error: 'No se pudo crear la tarea' }, { status: 500 })
  }
}

export const _internals = { PHOTO_TYPES, VIDEO_TYPES }
