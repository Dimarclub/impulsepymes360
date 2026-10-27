import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { processIncomingMessage } from '../webhook/route'

// Simular mensaje entrante de WhatsApp (para testing sin API real)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const { fromPhone, fromName, messageBody } = body as { fromPhone: string; fromName: string; messageBody: string }
  if (!fromPhone || !messageBody) {
    return NextResponse.json({ error: 'fromPhone y messageBody son requeridos' }, { status: 400 })
  }
  // Reutilizar la lógica del webhook
  return processIncomingMessage(fromPhone, fromName || fromPhone, messageBody)
}
