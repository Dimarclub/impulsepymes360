import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { completeStep, getOnboardingProgress, ONBOARDING_STEPS } from '@/lib/onboarding-tasks'

/**
 * Checklist del bolso (6 etapas) — ahora implementado sobre las tareas PPA (CpaTask/CpaCompletion).
 * Se mantiene la forma de la respuesta anterior para no romper las pantallas.
 */
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  return NextResponse.json(await getOnboardingProgress(userId))
}

export async function PATCH(req: Request) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  // Las etapas solo se marcan (true); no se pueden deshacer
  for (const step of ONBOARDING_STEPS) {
    if (body[step.key] === true) {
      const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl : undefined
      const r = await completeStep(userId, step.key, photoUrl)
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    }
  }
  return NextResponse.json(await getOnboardingProgress(userId))
}
