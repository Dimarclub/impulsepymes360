import { NextRequest, NextResponse } from 'next/server'
import { getEmailProvider } from '@/lib/services/email'

/**
 * GET /api/dima/test-email?token=dimar-setup-2024&to=tu@gmail.com
 *
 * Envía un email de prueba y retorna el resultado (incluye errores de Resend).
 * Útil para debuggear por qué no llegan los emails de forgot-password.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const token = searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const to = searchParams.get('to') || 'test@example.com'

    // Información del entorno (sin exponer secretos)
    const envInfo = {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || '(no configurado)',
      EMAIL_FROM: process.env.EMAIL_FROM || '(no configurado)',
      RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_length: process.env.RESEND_API_KEY?.length || 0,
    }

    // Intentar enviar email
    const provider = getEmailProvider()
    const result = await provider.send({
      to,
      subject: 'Test de email — Dimarclub',
      html: `
        <h2>Test de email</h2>
        <p>Si recibes este email, Resend está funcionando correctamente.</p>
        <p>From: ${process.env.EMAIL_FROM || '(no configurado)'}</p>
        <p>Provider: ${process.env.EMAIL_PROVIDER || '(no configurado)'}</p>
      `,
      text: 'Test de email — si recibes esto, Resend funciona.',
    })

    return NextResponse.json({
      env: envInfo,
      sendResult: result,
    })
  } catch (error) {
    console.error('[test-email] error:', error)
    return NextResponse.json(
      {
        error: 'Error en test-email',
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
