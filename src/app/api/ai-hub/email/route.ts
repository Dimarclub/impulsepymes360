import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { generateEmailCampaign } from '@/lib/services/ai-hub'

// POST /api/ai-hub/email — "IA Correos" (genera campaña de email: subject + previewText + body)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    subject?: string
    goal?: string
    audience?: string
    productName?: string
    keyBenefits?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const goal = (body.goal || '').trim()
  const audience = (body.audience || '').trim()
  const productName = (body.productName || '').trim()
  if (!goal || !audience || !productName) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios (goal, audience, productName)' },
      { status: 400 }
    )
  }

  const keyBenefits = Array.isArray(body.keyBenefits)
    ? body.keyBenefits.filter((b) => typeof b === 'string' && b.trim()).slice(0, 6)
    : []

  try {
    const result = await generateEmailCampaign({
      subject: body.subject,
      goal,
      audience,
      productName,
      keyBenefits,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[ai-hub/email] error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'No se pudo generar la campaña. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
