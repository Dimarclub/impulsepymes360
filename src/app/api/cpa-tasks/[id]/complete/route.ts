import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * /api/cpa-tasks/[id]/complete
 *
 * POST (auth): marca una tarea como completada por el usuario actual.
 *
 * Body:
 *   - videoWatched: boolean  (requerido para tareas de video)
 *   - shared?:      boolean
 *   - purchased?:   boolean
 *   - photoUrl?:    string   (requerido para tareas de foto → status PENDING_REVIEW)
 *   - strikeCount?: number   (anti-fraud: si llegó a 3 strikes, se bloquea)
 *
 * Reglas:
 *   - Si ya existe una completion COMPLETED/PENDING_REVIEW para este usuario y
 *     tarea, retorna 409 (no se puede completar dos veces).
 *   - Para tareas de video: requiere videoWatched === true.
 *   - Para tareas de foto: status = 'PENDING_REVIEW' + photoUrl requerido.
 *     NO se acredita comisión todavía (se acredita al aprobar el admin).
 *   - Para tareas de video: acredita comisión al CooperativeAccount del
 *     usuario (tipo CPA_REWARD). Crea el account si no existe.
 *   - Incrementa task.currentParticipants.
 *   - Crea una Notification al usuario.
 *
 * Retorna: { ok: true, reward, newBalance, status }
 */

const PHOTO_TYPES = new Set(['PHOTO_BOLSO', 'PHOTO_STORE', 'PHOTO_STICKER'])
const VIDEO_TYPES = new Set(['VIDEO', 'SHARE', 'VISIT', 'SUBSCRIBE'])
const NEW_TYPES = new Set(['PURCHASE_REGISTER', 'MONTHLY_STICKERS'])
const MIN_MONTHLY_CONSUMPTION = 250
const MAX_STRIKES = 3

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; name: string }

  const { id: taskId } = await params

  let body: {
    videoWatched?: boolean
    shared?: boolean
    purchased?: boolean
    photoUrl?: string
    strikeCount?: number
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const task = await db.cpaTask.findUnique({ where: { id: taskId } })
    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }
    if (task.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'La tarea no está activa' }, { status: 400 })
    }
    const now = new Date()
    if (task.startDate > now || task.endDate < now) {
      return NextResponse.json({ error: 'La tarea no está vigente' }, { status: 400 })
    }
    if (task.maxParticipants != null && task.currentParticipants >= task.maxParticipants) {
      return NextResponse.json({ error: 'La tarea ya no tiene cupo disponible' }, { status: 400 })
    }

    // Verificar si ya completó HOY (1 vez por día por tipo)
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const existing = await db.cpaCompletion.findFirst({
      where: { taskId, userId: user.id, completionDate: today },
    })
    if (existing && (existing.status === 'COMPLETED' || existing.status === 'PENDING_REVIEW')) {
      return NextResponse.json(
        { error: 'Ya completaste esta tarea hoy. Vuelve mañana.' },
        { status: 409 },
      )
    }

    const isPhoto = PHOTO_TYPES.has(task.type)
    const isVideo = VIDEO_TYPES.has(task.type)
    const isNewType = NEW_TYPES.has(task.type)

    // Validar consumo mensual obligatorio ($250/mes) si la tarea lo requiere
    if (task.requiresMonthlyConsumption) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const monthlyOrders = await db.order.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: startOfMonth },
          status: { in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'] },
        },
        _sum: { total: true },
      })
      const monthlyTotal = monthlyOrders._sum.total || 0
      // También contar compras externas aprobadas
      const externalTotal = await db.externalPurchase.aggregate({
        where: {
          userId: user.id,
          status: 'APPROVED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      })
      const totalConsumption = monthlyTotal + (externalTotal._sum.amount || 0)
      if (totalConsumption < MIN_MONTHLY_CONSUMPTION) {
        return NextResponse.json(
          { error: `Para reclamar esta tarea necesitas consumir $${MIN_MONTHLY_CONSUMPTION}/mes en el marketplace o registrar compras externas. Consumo actual: $${totalConsumption.toFixed(2)}` },
          { status: 403 },
        )
      }
    }

    // Anti-fraud: si llegó al máximo de strikes, bloquear
    const strikes = body.strikeCount ?? 0
    if (strikes >= MAX_STRIKES) {
      return NextResponse.json(
        { error: 'Has superado el límite de intentos fraudulentos en esta tarea' },
        { status: 403 },
      )
    }

    // Validar por tipo
    if (isVideo && body.videoWatched !== true) {
      return NextResponse.json(
        { error: 'Debes ver el video completo antes de reclamar' },
        { status: 400 },
      )
    }
    if (isPhoto) {
      const photo = (body.photoUrl || '').trim()
      if (!photo) {
        return NextResponse.json(
          { error: 'Debes subir una foto para esta tarea' },
          { status: 400 },
        )
      }
    }

    const reward = task.commission

    // ---------- PHOTO: PENDING_REVIEW (no acredita) ----------
    if (isPhoto) {
      const completion = await db.cpaCompletion.create({
        data: {
          taskId, userId: user.id,
          status: 'PENDING_REVIEW',
          photoUrl: body.photoUrl?.trim() || null,
          rewardAmount: reward,
          videoWatched: false,
          shared: body.shared ?? false,
          purchased: body.purchased ?? false,
          strikeCount: strikes,
          completionDate: today,
        },
      })

      // Notificar al usuario + admins (best-effort)
      try {
        await db.notification.create({
          data: {
            userId: user.id,
            type: 'CPA_PHOTO_SUBMITTED',
            title: 'Foto enviada para revisión',
            message: `Tu foto para "${task.title}" fue enviada. Queda pendiente de aprobación.`,
            link: '/?module=cpa-tasks',
          },
        })
        const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
        if (admins.length) {
          await db.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: 'CPA_PHOTO_REVIEW',
              title: 'Foto CPA pendiente de revisión',
              message: `${user.name} envió una foto para "${task.title}".`,
              link: '/?module=cpa-admin',
            })),
          })
        }
      } catch (notifErr) {
        console.error('[cpa-tasks/complete] notif error:', notifErr)
      }

      // Incrementar currentParticipants para foto también (cuenta el envío)
      try {
        await db.cpaTask.update({
          where: { id: taskId },
          data: { currentParticipants: { increment: 1 } },
        })
      } catch { /* best-effort */ }

      return NextResponse.json({
        ok: true,
        reward,
        newBalance: null,
        status: completion.status,
        message: 'Foto enviada a revisión. Te avisaremos cuando se apruebe.',
      })
    }

    // ---------- VIDEO/SHARE/VISIT/SUBSCRIBE: COMPLETED + acredita ----------
    let newBalance = 0

    await db.$transaction(async (tx) => {
      // Upsert completion
      await tx.cpaCompletion.create({
        data: {
          taskId, userId: user.id,
          status: 'COMPLETED',
          rewardAmount: reward,
          videoWatched: body.videoWatched ?? false,
          shared: body.shared ?? false,
          purchased: body.purchased ?? false,
          strikeCount: strikes,
          completionDate: today,
        },
      })

      // Acreditar comisión al CooperativeAccount
      let account = await tx.cooperativeAccount.findUnique({ where: { userId: user.id } })
      if (!account) {
        account = await tx.cooperativeAccount.create({ data: { userId: user.id } })
      }
      const updated = await tx.cooperativeAccount.update({
        where: { userId: user.id },
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
          description: `Comisión por tarea CPA: ${task.title}`,
          referenceId: taskId,
          status: 'COMPLETED',
        },
      })

      // Incrementar currentParticipants
      await tx.cpaTask.update({
        where: { id: taskId },
        data: { currentParticipants: { increment: 1 } },
      })

      // ===== FACTOR MULTIPLICADOR: comisión a los 3 niveles de la red =====
      // El usuario que completa la tarea gana el 100% de la recompensa
      // Sus padrinos (N1, N2, N3) ganan 2% cada uno de la recompensa
      const sponsorCommission = +(reward * 0.02).toFixed(2) // 2% por nivel
      if (sponsorCommission > 0) {
        let currentUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { id: true, sponsorId: true },
        })

        for (let lvl = 1; lvl <= 3; lvl++) {
          if (!currentUser?.sponsorId) break
          const sponsor = await tx.user.findUnique({
            where: { id: currentUser.sponsorId },
            select: { id: true, name: true, sponsorId: true },
          })
          if (!sponsor) break

          // Acreditar al sponsor
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
              description: `Comisión N${lvl} por tarea CPA de ${user.name}: ${task.title}`,
              referenceId: taskId,
              status: 'COMPLETED',
            },
          })

          currentUser = sponsor // subir al siguiente nivel
        }
      }
    })

    // Notificar al usuario (best-effort)
    try {
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'CPA_REWARD_CREDITED',
          title: '¡Comisión reclamada!',
          message: `Ganaste $${reward.toFixed(2)} por completar la tarea "${task.title}". Ya está en tu billetera cooperativa.`,
          link: '/?module=cooperativa',
        },
      })
    } catch (notifErr) {
      console.error('[cpa-tasks/complete] notif error:', notifErr)
    }

    return NextResponse.json({
      ok: true,
      reward,
      newBalance,
      status: 'COMPLETED',
      message: `¡Comisión de $${reward.toFixed(2)} acreditada a tu billetera!`,
    })
  } catch (err) {
    console.error('[cpa-tasks/complete] error:', err)
    return NextResponse.json({ error: 'No se pudo completar la tarea' }, { status: 500 })
  }
}
