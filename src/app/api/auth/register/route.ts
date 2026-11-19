import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Registro público de clientes/afiliados (con código de referido opcional)
// Para SUPPLIER acepta además: branches[], phrases[], categories[], subcategories[]
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    name, email, password, role, sponsorCode, phone, city,
    companyName, taxId, address, category,
    branches, phrases, categories, subcategories,
  } = body as {
    name: string
    email: string
    password: string
    role?: string
    sponsorCode?: string
    phone?: string
    city?: string
    // Campos SUPPLIER
    companyName?: string
    taxId?: string
    address?: string
    category?: string
    branches?: Array<{
      name: string
      city: string
      sector?: string | null
      address: string
      phone?: string | null
      whatsapp?: string | null
      isMain?: boolean
    }>
    phrases?: string[]
    categories?: string[]
    subcategories?: string[]
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

  const isSupplier = role === 'SUPPLIER'
  const userRole = role === 'AFFILIATE' ? 'AFFILIATE' : isSupplier ? 'SUPPLIER' : 'CLIENT'

  // Crear usuario + supplier + branches + phrases en una transacción atómica
  const user = await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: userRole,
        phone,
        city,
        sponsorId,
        affiliateCode: code,
      },
    })

    let supplier: { id: string } | null = null
    if (isSupplier) {
      supplier = await tx.supplier.create({
        data: {
          userId: u.id,
          companyName: companyName || name,
          taxId: taxId || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          category: category || null,
          verified: false,
        },
      })

      // Crear sucursales (máximo 5)
      if (Array.isArray(branches) && branches.length > 0) {
        const validBranches = branches.slice(0, 5).filter((b) => b.name && b.city && b.address)
        for (const b of validBranches) {
          await tx.supplierBranch.create({
            data: {
              supplierId: supplier!.id,
              name: b.name,
              city: b.city,
              sector: b.sector || null,
              address: b.address,
              phone: b.phone || null,
              whatsapp: b.whatsapp || null,
              isMain: !!b.isMain,
              isActive: true,
            },
          })
        }
      }

      // Crear frases iniciales (máximo 5 = plan Starter)
      if (Array.isArray(phrases) && phrases.length > 0) {
        const validPhrases = phrases.slice(0, 5).filter((p) => p && p.trim().length > 0)
        for (const p of validPhrases) {
          await tx.searchPhrase.create({
            data: {
              supplierId: supplier!.id,
              phrase: p.trim().toLowerCase(),
              category: category || null,
              isPremium: false,
              status: 'ACTIVE',
              monthlyPrice: 0, // incluida en el plan Starter
              paidUntil: null, // incluida en el plan, no requiere pago
            },
          })
        }
      }
    }

    return { u, supplier }
  })

  return NextResponse.json({
    id: user.u.id,
    name: user.u.name,
    email: user.u.email,
    role: user.u.role,
    affiliateCode: user.u.affiliateCode,
    supplierId: user.supplier?.id || null,
  }, { status: 201 })
}
