import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * /api/cpa-tasks/mine
 *
 * GET (auth): retorna todas las tareas + el estado de completitud del usuario
 *             actual. Agrupa en { available, completed, pending, rejected }.
 */

const PHOTO_TYPES = new Set(['PHOTO_BOLSO', 'PHOTO_STORE', 'PHOTO_STICKER'])

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string }

  try {
    const now = new Date()
    const [tasks, myCompletions] = await Promise.all([
      db.cpaTask.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.cpaCompletion.findMany({
        where: { userId: user.id },
        include: { task: true },
      }),
    ])

    const completionByTask = new Map(myCompletions.map((c) => [c.taskId, c]))

    const available: any[] = []
    const completed: any[] = []
    const pending: any[] = []
    const rejected: any[] = []

    for (const t of tasks) {
      const c = completionByTask.get(t.id)
      const isPhoto = PHOTO_TYPES.has(t.type)
      const hasCupo = t.maxParticipants == null || t.currentParticipants < t.maxParticipants
      const taskData = {
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        videoUrl: t.videoUrl,
        imageUrl: t.imageUrl,
        offerTitle: t.offerTitle,
        offerUrl: t.offerUrl,
        productId: t.productId,
        commission: t.commission,
        maxParticipants: t.maxParticipants,
        currentParticipants: t.currentParticipants,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        isPhoto,
      }
      if (!c) {
        if (hasCupo) available.push(taskData)
      } else if (c.status === 'COMPLETED') {
        completed.push({ ...taskData, completion: { rewardAmount: c.rewardAmount, completedAt: c.completedAt } })
      } else if (c.status === 'PENDING_REVIEW') {
        pending.push({ ...taskData, completion: { photoUrl: c.photoUrl, completedAt: c.completedAt } })
      } else if (c.status === 'REJECTED') {
        rejected.push({ ...taskData, completion: { photoUrl: c.photoUrl, adminNotes: c.adminNotes, completedAt: c.completedAt, reviewedAt: c.reviewedAt } })
      }
    }

    // Also include expired completed tasks (historial)
    const pastCompletions = await db.cpaCompletion.findMany({
      where: {
        userId: user.id,
        task: { OR: [{ status: 'COMPLETED' }, { status: 'EXPIRED' }, { endDate: { lt: now } }] },
      },
      include: { task: true },
      orderBy: { completedAt: 'desc' },
    })
    for (const c of pastCompletions) {
      if (completed.find((x) => x.id === c.taskId)) continue
      completed.push({
        id: c.taskId,
        title: c.task.title,
        type: c.task.type,
        commission: c.rewardAmount,
        endDate: c.task.endDate,
        isPhoto: PHOTO_TYPES.has(c.task.type),
        completion: { rewardAmount: c.rewardAmount, completedAt: c.completedAt },
      })
    }

    const totalEarned = myCompletions
      .filter((c) => c.status === 'COMPLETED')
      .reduce((s, c) => s + c.rewardAmount, 0)

    return NextResponse.json({
      ok: true,
      available,
      completed,
      pending,
      rejected,
      stats: {
        available: available.length,
        completed: completed.length,
        pending: pending.length,
        rejected: rejected.length,
        totalEarned,
      },
    })
  } catch (err) {
    console.error('[cpa-tasks/mine GET] error:', err)
    return NextResponse.json({
      ok: true,
      available: [], completed: [], pending: [], rejected: [],
      stats: { available: 0, completed: 0, pending: 0, rejected: 0, totalEarned: 0 },
    })
  }
}
