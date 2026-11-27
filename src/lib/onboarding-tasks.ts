import { db } from '@/lib/db'

/**
 * Las 6 etapas del "checklist del bolso" ahora son tareas PPA (CpaTask) del sistema.
 * Ya no existe un flujo paralelo: el progreso es un CpaCompletion por etapa y el
 * premio final es un CpaCompletion extra (así solo se puede reclamar una vez).
 * El modelo TaskProgress queda obsoleto; se importa de forma perezosa por usuario.
 */
export const ONBOARDING_OWNER = 'system:onboarding'
export const ONBOARDING_DAY = 'ONBOARDING' // completionDate fijo: una sola vez en la vida
export const ONBOARDING_REWARD_KEY = 'onboarding_reward_amount' // SiteSettings, USD (por defecto 0)

export type StepKey = 'scanDone' | 'identifyDone' | 'visitWebDone' | 'shareDone' | 'commentDone' | 'photoDone'

export interface OnboardingStep {
  key: StepKey
  type: string
  title: string
  description: string
  photo: boolean
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { key: 'scanDone', type: 'ONBOARD_SCAN', title: 'Escanear código QR', description: 'Escanea el QR del bolso o del grid', photo: false },
  { key: 'identifyDone', type: 'ONBOARD_IDENTIFY', title: 'Identificar empresa', description: 'Identifica qué empresa es el QR', photo: false },
  { key: 'visitWebDone', type: 'ONBOARD_VISIT', title: 'Visitar sitio web', description: 'Navega el sitio autogenerado', photo: false },
  { key: 'shareDone', type: 'ONBOARD_SHARE', title: 'Compartir oferta', description: 'Comparte en WhatsApp o redes', photo: false },
  { key: 'commentDone', type: 'ONBOARD_COMMENT', title: 'Dejar comentario', description: 'Comenta en el sitio', photo: false },
  { key: 'photoDone', type: 'PHOTO_STORE', title: 'Foto en tienda', description: 'Visita la tienda y sube tu foto (la revisa el administrador)', photo: true },
]
const REWARD_TYPE = 'ONBOARD_REWARD'

const FAR_FUTURE = new Date('2099-12-31T00:00:00Z')

async function ensureTask(type: string, title: string, description: string) {
  const found = await db.cpaTask.findFirst({
    where: { createdBy: ONBOARDING_OWNER, type },
    orderBy: { createdAt: 'asc' },
  })
  if (found) return found
  return db.cpaTask.create({
    data: { title, description, type, commission: 0, endDate: FAR_FUTURE, status: 'ACTIVE', createdBy: ONBOARDING_OWNER },
  })
}

/** Garantiza que existan las 6 tareas + la tarea de premio. */
export async function ensureOnboardingTasks() {
  const steps = [] as Array<{ step: OnboardingStep; taskId: string }>
  for (const step of ONBOARDING_STEPS) {
    const t = await ensureTask(step.type, step.title, step.description)
    steps.push({ step, taskId: t.id })
  }
  const reward = await ensureTask(REWARD_TYPE, 'Premio del checklist del bolso', 'Premio por completar las 6 tareas del bolso')
  return { steps, rewardTaskId: reward.id }
}

async function createOnce(data: {
  taskId: string
  userId: string
  status: string
  rewardAmount: number
  photoUrl?: string | null
}) {
  const existing = await db.cpaCompletion.findFirst({
    where: { taskId: data.taskId, userId: data.userId, completionDate: ONBOARDING_DAY },
  })
  if (existing) return existing
  try {
    return await db.cpaCompletion.create({ data: { ...data, completionDate: ONBOARDING_DAY } })
  } catch {
    // carrera: otra petición ya la creó
    return db.cpaCompletion.findFirst({
      where: { taskId: data.taskId, userId: data.userId, completionDate: ONBOARDING_DAY },
    })
  }
}

/** Importa una sola vez el progreso antiguo (TaskProgress) a completions PPA. */
async function importLegacy(userId: string, ctx: Awaited<ReturnType<typeof ensureOnboardingTasks>>) {
  const legacy = await db.taskProgress.findUnique({ where: { userId } })
  if (!legacy) return
  const already = await db.cpaCompletion.count({
    where: { userId, completionDate: ONBOARDING_DAY, taskId: { in: [...ctx.steps.map((s) => s.taskId), ctx.rewardTaskId] } },
  })
  if (already > 0) return
  for (const { step, taskId } of ctx.steps) {
    if (legacy[step.key]) {
      await createOnce({ taskId, userId, status: 'COMPLETED', rewardAmount: 0, photoUrl: step.photo ? legacy.photoUrl : null })
    }
  }
  if (legacy.rewardClaimed) {
    await createOnce({ taskId: ctx.rewardTaskId, userId, status: 'COMPLETED', rewardAmount: 0 })
  }
}

export async function getOnboardingProgress(userId: string) {
  const ctx = await ensureOnboardingTasks()
  await importLegacy(userId, ctx)
  const rows = await db.cpaCompletion.findMany({
    where: { userId, completionDate: ONBOARDING_DAY, taskId: { in: [...ctx.steps.map((s) => s.taskId), ctx.rewardTaskId] } },
  })
  const byTask = new Map(rows.map((r) => [r.taskId, r]))
  const out: Record<string, unknown> = {}
  for (const { step, taskId } of ctx.steps) {
    const c = byTask.get(taskId)
    out[step.key] = c?.status === 'COMPLETED'
    if (step.photo) {
      out.photoUrl = c?.photoUrl ?? null
      out.photoPending = c?.status === 'PENDING_REVIEW'
      out.photoRejected = c?.status === 'REJECTED'
      out.photoNotes = c?.status === 'REJECTED' ? c.adminNotes : null
    }
  }
  const completed = ctx.steps.every(({ step }) => out[step.key] === true)
  const reward = byTask.get(ctx.rewardTaskId)
  return {
    ...out,
    completed,
    rewardClaimed: reward?.status === 'COMPLETED',
    rewardClaimedAt: reward?.completedAt ?? null,
  }
}

/** Marca una etapa. Las etapas no se deshacen. */
export async function completeStep(userId: string, key: StepKey, photoUrl?: string) {
  const ctx = await ensureOnboardingTasks()
  const found = ctx.steps.find((s) => s.step.key === key)
  if (!found) return { ok: false as const, error: 'Etapa desconocida' }
  const existing = await db.cpaCompletion.findFirst({
    where: { taskId: found.taskId, userId, completionDate: ONBOARDING_DAY },
  })
  if (found.step.photo) {
    const url = (photoUrl || '').trim()
    if (!url) return { ok: false as const, error: 'Debes subir una foto para esta etapa' }
    if (existing?.status === 'COMPLETED' || existing?.status === 'PENDING_REVIEW') return { ok: true as const }
    if (existing?.status === 'REJECTED') {
      await db.cpaCompletion.update({
        where: { id: existing.id },
        data: { status: 'PENDING_REVIEW', photoUrl: url, adminNotes: null, reviewedAt: null, reviewedBy: null },
      })
    } else {
      await createOnce({ taskId: found.taskId, userId, status: 'PENDING_REVIEW', rewardAmount: 0, photoUrl: url })
    }
    try {
      const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      if (admins.length) {
        await db.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'CPA_PHOTO_REVIEW',
            title: 'Foto del checklist pendiente de revisión',
            message: 'Un usuario envió su foto en tienda del checklist del bolso.',
            link: '/?module=cpa-admin',
          })),
        })
      }
    } catch (e) {
      console.error('[onboarding] notif error:', e)
    }
    return { ok: true as const }
  }
  if (!existing) await createOnce({ taskId: found.taskId, userId, status: 'COMPLETED', rewardAmount: 0 })
  return { ok: true as const }
}

/** Reclama el premio final (una sola vez). El monto sale de SiteSettings; por defecto 0. */
export async function claimOnboardingReward(userId: string) {
  const progress = await getOnboardingProgress(userId)
  if (!progress.completed) return { ok: false as const, status: 400, error: 'Debes completar todas las tareas primero' }
  if (progress.rewardClaimed) return { ok: false as const, status: 409, error: 'Ya reclamaste esta recompensa' }

  const ctx = await ensureOnboardingTasks()
  const setting = await db.siteSettings.findUnique({ where: { key: ONBOARDING_REWARD_KEY } })
  const parsed = setting ? Number.parseFloat(setting.value) : 0
  const amount = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 0

  try {
    await db.$transaction(async (tx) => {
      // La restricción única (tarea, usuario, día) impide un doble reclamo simultáneo
      await tx.cpaCompletion.create({
        data: { taskId: ctx.rewardTaskId, userId, status: 'COMPLETED', rewardAmount: amount, completionDate: ONBOARDING_DAY },
      })
      if (amount > 0) {
        let account = await tx.cooperativeAccount.findUnique({ where: { userId } })
        if (!account) account = await tx.cooperativeAccount.create({ data: { userId } })
        await tx.cooperativeAccount.update({
          where: { userId },
          data: { balance: { increment: amount }, totalEarned: { increment: amount } },
        })
        await tx.cooperativeTransaction.create({
          data: {
            accountId: account.id,
            type: 'CPA_REWARD',
            amount,
            description: 'Premio por completar el checklist del bolso',
            referenceId: ctx.rewardTaskId,
            status: 'COMPLETED',
          },
        })
      }
    })
  } catch {
    return { ok: false as const, status: 409, error: 'Ya reclamaste esta recompensa' }
  }
  return { ok: true as const, amount }
}
