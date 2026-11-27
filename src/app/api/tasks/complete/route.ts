import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { claimOnboardingReward } from '@/lib/onboarding-tasks'

/** Reclama el premio del checklist del bolso (una sola vez). */
export async function POST() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const r = await claimOnboardingReward(userId)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true, amount: r.amount })
}
