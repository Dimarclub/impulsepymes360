import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const db = db

/**
 * GET /api/dima/create-user?token=dimar-setup-2024&email=X&password=Y&name=Z&role=W
 *
 * Crea un usuario nuevo (o actualiza si existe).
 * Token requerido para seguridad.
 *
 * Roles válidos: CLIENT, AFFILIATE, SUPPLIER, COURIER, PARTNER, ADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const token = searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const email = searchParams.get('email')?.trim().toLowerCase()
    const password = searchParams.get('password')?.trim()
    const name = searchParams.get('name')?.trim() || email?.split('@')[0] || 'Usuario'
    const role = (searchParams.get('role')?.toUpperCase() || 'CLIENT') as 'CLIENT' | 'AFFILIATE' | 'SUPPLIER' | 'COURIER' | 'PARTNER' | 'ADMIN'

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Uso: ?email=X&password=Y&name=Z&role=W' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const validRoles = ['CLIENT', 'AFFILIATE', 'SUPPLIER', 'COURIER', 'PARTNER', 'ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: `Rol inválido. Válidos: ${validRoles.join(', ')}` }, { status: 400 })
    }

    // Verificar si ya existe
    const existing = await db.user.findUnique({ where: { email } })
    const hashedPassword = await bcrypt.hash(password, 10)

    if (existing) {
      // Actualizar password y rol
      const updated = await db.user.update({
        where: { id: existing.id },
        data: { password: hashedPassword, role, name },
      })
      return NextResponse.json({
        ok: true,
        message: 'Usuario actualizado',
        user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role },
      })
    }

    // Crear nuevo usuario
    const affiliateCode = (name.slice(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000))
    const created = await db.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
        affiliateCode,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Usuario creado',
      user: {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        affiliateCode: created.affiliateCode,
      },
      credentials: `${email} / ${password}`,
    })
  } catch (error) {
    console.error('[create-user] error:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
  }
}
