import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/security/auth'
import { generateFunnelStructure } from '@/lib/services/ai-hub'

// POST /api/ai-hub/funnel — "IA Embudos" (sugiere estructura de embudo: stages + acciones)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  let body: {
    businessType?: string
    productName?: string
    priceRange?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const businessType = (body.businessType || '').trim()
  const productName = (body.productName || '').trim()
  const priceRange = (body.priceRange || '').trim()
  if (!businessType || !productName || !priceRange) {
    return NextResponse.json(
      { error: 'Faltan campos obligatorios (businessType, productName, priceRange)' },
      { status: 400 }
    )
  }

  try {
    const result = await generateFunnelStructure({
      businessType,
      productName,
      priceRange,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[ai-hub/funnel] error:', (e as Error).message)
    return NextResponse.json(
      { ok: false, error: 'No se pudo generar el embudo. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
