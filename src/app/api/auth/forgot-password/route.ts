import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getEmailProvider } from '@/lib/services/email'

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 *
 * Genera un token único de 32 chars, lo guarda en el User con expiración de 1 hora,
 * y envía email con el link de reseteo.
 *
 * Seguridad:
 * - Si el email no existe, igual retorna 200 (evita user enumeration)
 * - Token expira en 1 hora
 * - Genera nuevo token en cada request (invalida el anterior)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Buscar usuario
    const user = await db.user.findUnique({ where: { email } }).catch(() => null)

    if (user) {
      // Generar token único de 32 bytes (64 chars hex)
      const resetToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // +1 hora

      // Guardar token en el usuario (invalida cualquier token anterior)
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiresAt: expiresAt,
        },
      })

      // Construir URL de reset (dominio dinámico según el entorno)
      const baseUrl = process.env.NEXTAUTH_URL ||
                      process.env.NEXT_PUBLIC_APP_URL ||
                      (req.nextUrl.origin as string)
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`

      // Intentar enviar email
      const emailProvider = getEmailProvider()
      const emailResult = await emailProvider.send({
        to: email,
        subject: 'Dimarclub — Recuperación de contraseña',
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #00A886; margin-bottom: 16px;">Recuperación de contraseña</h2>
            <p style="color: #333; line-height: 1.6; margin-bottom: 16px;">
              Hola <strong>${user.name}</strong>,
            </p>
            <p style="color: #333; line-height: 1.6; margin-bottom: 16px;">
              Recibimos una solicitud para restablecer tu contraseña en Dimarclub.
              Si no fuiste tú, puedes ignorar este email.
            </p>
            <p style="margin-bottom: 24px;">
              <a href="${resetUrl}"
                 style="display: inline-block; background: #00A886; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Restablecer mi contraseña
              </a>
            </p>
            <p style="color: #999; font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
              O copia y pega este enlace en tu navegador:<br>
              <span style="color: #00A886; word-break: break-all;">${resetUrl}</span>
            </p>
            <p style="color: #999; font-size: 12px; margin-bottom: 0;">
              El enlace expira en 1 hora.<br>
              Si no solicitaste este cambio, ignora este correo y tu contraseña seguirá siendo la misma.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;">
            <p style="color: #999; font-size: 11px; text-align: center;">
              Dimarclub — Marketplace con red de afiliados<br>
              dimarclub.com
            </p>
          </div>
        `,
        text: `Hola ${user.name},\n\nRecibimos una solicitud para restablecer tu contraseña en Dimarclub.\n\nVe al siguiente enlace para hacerlo (expira en 1 hora):\n${resetUrl}\n\nSi no fuiste tú, ignora este email.\n\nDimarclub — dimarclub.com`,
      }).catch((err) => {
        console.error('[forgot-password] email send error:', err)
        return null
      })

      // Log para debug
      console.log(`[forgot-password] token generated for ${email}, email sent:`, !!emailResult)
    }

    // Siempre retornar 200 OK con mensaje genérico (evita user enumeration)
    return NextResponse.json({
      ok: true,
      message: 'Si el email existe en nuestra base de datos, recibirás un enlace de recuperación en breve.',
    })
  } catch (error) {
    console.error('[forgot-password] error:', error)
    // Igual retornar 200 OK genérico para no filtrar info
    return NextResponse.json({
      ok: true,
      message: 'Si el email existe en nuestra base de datos, recibirás un enlace de recuperación en breve.',
    })
  }
}
