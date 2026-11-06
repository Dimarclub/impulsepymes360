import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { generateVoiceScript, type VoicePurpose } from '@/lib/services/ai-hub'

const VALID_PURPOSES: VoicePurpose[] = ['welcome', 'followup', 'appointment']

// POST /api/ai-hub/voice — "IA de Voz" (genera script para llamada telefónica)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    purpose?: VoicePurpose
    businessName?: string
    customerName?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const purpose = body.purpose && VALID_PURPOSES.includes(body.purpose) ? body.purpose : 'welcome'
  const businessName = (body.businessName || '').trim()
  const customerName = (body.customerName || '').trim()
  if (!businessName || !customerName) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios (businessName, customerName)' },
      { status: 400 }
    )
  }

  try {
    const result = await generateVoiceScript({ purpose, businessName, customerName })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[ai-hub/voice] error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'No se pudo generar el guion. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
