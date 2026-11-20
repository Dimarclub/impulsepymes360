import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

/**
 * GET /api/dima/reset-admin?token=dimar-setup-2024
 * Resetea la contraseña del admin a "dimar123" — útil si el login no funciona.
 * Idempotente y seguro (solo el admin con el token puede ejecutarlo).
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const adminEmail = 'admin@dimarclub.com'
    const newPassword = 'dimar123'
    const hashed = await bcrypt.hash(newPassword, 10)

    const admin = await db.user.findUnique({ where: { email: adminEmail } })
    if (!admin) {
      // Si no existe, lo crea
      await db.user.create({
        data: {
          email: adminEmail,
          name: 'Carlos Dimar',
          role: 'ADMIN',
          phone: '099111111',
          city: 'Guayaquil',
          affiliateCode: 'DIMAR-001',
          password: hashed,
        },
      })
      return NextResponse.json({
        ok: true,
        message: 'Admin creado con contraseña dimar123',
        credentials: 'admin@dimarclub.com / dimar123',
      })
    }

    // Si existe, resetea la contraseña
    await db.user.update({
      where: { id: admin.id },
      data: { password: hashed },
    })

    return NextResponse.json({
      ok: true,
      message: 'Contraseña del admin reseteada a dimar123',
      credentials: 'admin@dimarclub.com / dimar123',
      previousPassword: admin.password.substring(0, 10) + '...',
    })
  } catch (error) {
    console.error('[reset-admin] error:', error)
    return NextResponse.json(
      { error: 'Error al resetear admin', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
    await db.$disconnect()
  }
}
