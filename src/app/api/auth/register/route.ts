import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Registro público de clientes/afiliados (con código de referido opcional)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, password, role, sponsorCode, phone, city } = body as {
    name: string
    email: string
    password: string
    role?: string
    sponsorCode?: string
    phone?: string
    city?: string
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 })
  }

  // Resolver sponsor por código de afiliado
  let sponsorId: string | undefined
  if (sponsorCode) {
    const sponsor = await db.user.findFirst({ where: { affiliateCode: sponsorCode } })
    if (sponsor) sponsorId = sponsor.id
  }

  // Generar código de afiliado único
  const code = name.slice(0, 4).toUpperCase() + '-' + String(Math.floor(Math.random() * 9000) + 1000)

  const user = await db.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: role === 'AFFILIATE' ? 'AFFILIATE' : 'CLIENT',
      phone,
      city,
      sponsorId,
      affiliateCode: code,
    },
  })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    affiliateCode: user.affiliateCode,
  }, { status: 201 })
}
