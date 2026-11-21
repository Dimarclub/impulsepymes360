import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

/**
 * POST /api/auth/reset-password
 * Body: { token: string, password: string }
 *
 * Valida el token (existe + no expirado) y actualiza la contraseña.
 * Invalida el token inmediatamente después de usarlo.
 *
 * Validaciones:
 * - Token existe
 * - Token no ha expirado
 * - Nueva contraseña mínimo 6 caracteres
 * - Token se elimina después de usar (one-shot)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = String(body.token || '').trim()
    const password = String(body.password || '')

    if (!token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Buscar usuario por token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() }, // todavía no expira
      },
    })

    if (!user) {
      // Token inválido o expirado
      return NextResponse.json(
        { error: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      )
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Actualizar contraseña + invalidar token (one-shot)
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    })
  } catch (error) {
    console.error('[reset-password] error:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la contraseña. Intenta de nuevo.' },
      { status: 500 }
    )
  }
}
