import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/cpa-tasks/admin
 *
 * GET (admin): retorna TODAS las tareas CPA (cualquier estado) para gestión.
 *              Incluye el creador (User.name) y el conteo de completions por
 *              estado. Marca como EXPIRED las que ya pasaron su endDate.
 */

const STATUS_ORDER: Record<string, number> = {
  ACTIVE: 0,
  PAUSED: 1,
  COMPLETED: 2,
  EXPIRED: 3,
}

export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  try {
    const tasks = await db.cpaTask.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        completions: {
          select: {
            id: true, status: true, rewardAmount: true,
            photoUrl: true, completedAt: true, reviewedAt: true, adminNotes: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    // Marcar EXPIRED en DB para las ACTIVE/PAUSED que ya pasaron su endDate
    const now = new Date()
    const toExpire = tasks.filter(
      (t) => t.endDate < now && (t.status === 'ACTIVE' || t.status === 'PAUSED'),
    )
    if (toExpire.length > 0) {
      try {
        await db.cpaTask.updateMany({
          where: { id: { in: toExpire.map((t) => t.id) } },
          data: { status: 'EXPIRED' },
        })
      } catch (err) {
        console.error('[cpa-tasks/admin GET] expire update error:', err)
      }
    }

    // Lookup creators
    const creatorIds = Array.from(new Set(tasks.map((t) => t.createdBy)))
    const creators = creatorIds.length
      ? await db.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true, email: true, role: true } })
      : []
    const creatorById = new Map(creators.map((c) => [c.id, c]))

    const result = tasks
      .map((t) => {
        const effectiveStatus = t.endDate < now && (t.status === 'ACTIVE' || t.status === 'PAUSED')
          ? 'EXPIRED'
          : t.status
        const completions = t.completions || []
        const completed = completions.filter((c) => c.status === 'COMPLETED')
        const pendingReview = completions.filter((c) => c.status === 'PENDING_REVIEW')
        const rejected = completions.filter((c) => c.status === 'REJECTED')
        const totalPaid = completed.reduce((s, c) => s + c.rewardAmount, 0)
        const creator = creatorById.get(t.createdBy)
        return {
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
          status: effectiveStatus,
          createdAt: t.createdAt,
          createdBy: t.createdBy,
          creator: creator ? { name: creator.name, email: creator.email, role: creator.role } : null,
          stats: {
            total: completions.length,
            completed: completed.length,
            pendingReview: pendingReview.length,
            rejected: rejected.length,
            totalPaid,
          },
          pendingCompletions: pendingReview.map((c) => ({
            id: c.id,
            photoUrl: c.photoUrl,
            completedAt: c.completedAt,
            user: c.user,
          })),
        }
      })
      .sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 99
        const sb = STATUS_ORDER[b.status] ?? 99
        if (sa !== sb) return sa - sb
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    return NextResponse.json({ ok: true, tasks: result })
  } catch (err) {
    console.error('[cpa-tasks/admin GET] error:', err)
    return NextResponse.json({ ok: true, tasks: [] })
  }
}
