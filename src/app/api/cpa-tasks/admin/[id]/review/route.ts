import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/cpa-tasks/admin/[id]/review
 *
 * PATCH (admin): revisa una completion PENDING_REVIEW de una tarea de foto.
 *
 * Body:
 *   - completionId: string  (requerido)
 *   - action: 'approve' | 'reject'
 *   - adminNotes?: string
 *
 * approve:  status=COMPLETED, reviewedAt=now, reviewedBy=admin.
 *           Acredita la comisión al CooperativeAccount del usuario (CPA_REWARD).
 * reject:   status=REJECTED, reviewedAt=now, reviewedBy=admin, adminNotes.
 *           Decrementa currentParticipants (porque la foto no contó).
 *
 * Notifica al usuario el resultado.
 */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const admin = auth as { id: string; name: string }

  const { id: taskId } = await params

  let body: { completionId?: string; action?: string; adminNotes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const completionId = (body.completionId || '').trim()
  const action = (body.action || '').toLowerCase()
  if (!completionId) {
    return NextResponse.json({ error: 'completionId es requerido' }, { status: 400 })
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action debe ser approve o reject' }, { status: 400 })
  }

  try {
    const completion = await db.cpaCompletion.findUnique({
      where: { id: completionId },
      include: { task: true },
    })
    if (!completion) {
      return NextResponse.json({ error: 'Completion no encontrada' }, { status: 404 })
    }
    if (completion.taskId !== taskId) {
      return NextResponse.json({ error: 'La completion no pertenece a esta tarea' }, { status: 400 })
    }
    if (completion.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: `La completion ya fue revisada (estado: ${completion.status})` },
        { status: 400 },
      )
    }

    const reward = completion.rewardAmount
    let newBalance: number | null = null

    if (action === 'approve') {
      // Acreditar comisión
      await db.$transaction(async (tx) => {
        await tx.cpaCompletion.update({
          where: { id: completionId },
          data: {
            status: 'COMPLETED',
            reviewedAt: new Date(),
            reviewedBy: admin.id,
            adminNotes: body.adminNotes?.trim() || null,
          },
        })

        let account = await tx.cooperativeAccount.findUnique({ where: { userId: completion.userId } })
        if (!account) {
          account = await tx.cooperativeAccount.create({ data: { userId: completion.userId } })
        }
        const updated = await tx.cooperativeAccount.update({
          where: { userId: completion.userId },
          data: {
            balance: { increment: reward },
            totalEarned: { increment: reward },
          },
        })
        newBalance = updated.balance

        await tx.cooperativeTransaction.create({
          data: {
            accountId: account.id,
            type: 'CPA_REWARD',
            amount: reward,
            description: `Comisión por tarea CPA (foto aprobada): ${completion.task.title}`,
            referenceId: completion.taskId,
            status: 'COMPLETED',
          },
        })

        // ===== FACTOR MULTIPLICADOR: comisión a los 3 niveles de la red =====
        const sponsorCommission = +(reward * 0.02).toFixed(2) // 2% por nivel
        if (sponsorCommission > 0) {
          let currentUser = await tx.user.findUnique({
            where: { id: completion.userId },
            select: { id: true, sponsorId: true, name: true },
          })

          for (let lvl = 1; lvl <= 3; lvl++) {
            if (!currentUser?.sponsorId) break
            const sponsor = await tx.user.findUnique({
              where: { id: currentUser.sponsorId },
              select: { id: true, name: true, sponsorId: true },
            })
            if (!sponsor) break

            let sponsorAccount = await tx.cooperativeAccount.findUnique({ where: { userId: sponsor.id } })
            if (!sponsorAccount) {
              sponsorAccount = await tx.cooperativeAccount.create({ data: { userId: sponsor.id } })
            }
            await tx.cooperativeAccount.update({
              where: { userId: sponsor.id },
              data: {
                balance: { increment: sponsorCommission },
                totalEarned: { increment: sponsorCommission },
              },
            })

            await tx.cooperativeTransaction.create({
              data: {
                accountId: sponsorAccount.id,
                type: 'CPA_REWARD',
                amount: sponsorCommission,
                description: `Comisión N${lvl} por tarea CPA (foto) de ${currentUser.name}: ${completion.task.title}`,
                referenceId: completion.taskId,
                status: 'COMPLETED',
              },
            })

            currentUser = sponsor
          }
        }
      })

      try {
        await db.notification.create({
          data: {
            userId: completion.userId,
            type: 'CPA_PHOTO_APPROVED',
            title: '¡Tu foto fue aprobada!',
            message: `Tu foto para "${completion.task.title}" fue aprobada. Ganaste $${reward.toFixed(2)}, ya están en tu billetera.`,
            link: '/?module=cooperativa',
          },
        })
      } catch (notifErr) {
        console.error('[cpa-tasks/admin/review] notif error:', notifErr)
      }

      return NextResponse.json({
        ok: true,
        action: 'approve',
        reward,
        newBalance,
        message: 'Foto aprobada y comisión acreditada.',
      })
    } else {
      // reject
      await db.$transaction(async (tx) => {
        await tx.cpaCompletion.update({
          where: { id: completionId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedBy: admin.id,
            adminNotes: body.adminNotes?.trim() || 'Rechazada por el administrador',
          },
        })
        // Decrementar currentParticipants porque esta foto no cuenta
        await tx.cpaTask.update({
          where: { id: taskId },
          data: { currentParticipants: { decrement: 1 } },
        })
      })

      try {
        await db.notification.create({
          data: {
            userId: completion.userId,
            type: 'CPA_PHOTO_REJECTED',
            title: 'Tu foto fue rechazada',
            message: `Tu foto para "${completion.task.title}" fue rechazada. ${body.adminNotes || ''}`.trim(),
            link: '/?module=cpa-tasks',
          },
        })
      } catch (notifErr) {
        console.error('[cpa-tasks/admin/review] notif error:', notifErr)
      }

      return NextResponse.json({
        ok: true,
        action: 'reject',
        message: 'Foto rechazada.',
      })
    }
  } catch (err) {
    console.error('[cpa-tasks/admin/review] error:', err)
    return NextResponse.json({ error: 'No se pudo revisar la completion' }, { status: 500 })
  }
}
