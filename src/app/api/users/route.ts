import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/security/auth'

// Lista de usuarios (solo admin)
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const users = await db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, city: true, phone: true, affiliateCode: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
  return NextResponse.json(users)
}

// Crear usuario (solo admin). Crea User + entidades asociadas
// según el rol: SUPPLIER (+ Supplier + 1 SupplierBranch + hasta 5 SearchPhrase),
// COURIER (+ Courier), PARTNER (+ Partner + 1 PartnerContribution).
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({}))
  const {
    name, email, password, role, phone, city,
    companyName, category, address,
    branchName, branchCity, branchAddress, branchPhone,
    phrases,
    vehicleType, zone,
    contributionAmount,
  } = body as {
    name?: string
    email?: string
    password?: string
    role?: string
    phone?: string
    city?: string
    companyName?: string
    category?: string
    address?: string
    branchName?: string
    branchCity?: string
    branchAddress?: string
    branchPhone?: string
    phrases?: string[]
    vehicleType?: string
    zone?: string
    contributionAmount?: number
  }

  // Validaciones básicas
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos (nombre, email, contraseña)' },
      { status: 400 }
    )
  }
  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json(
      { error: 'La contraseña debe tener al menos 6 caracteres' },
      { status: 400 }
    )
  }

  const validRoles = ['CLIENT', 'AFFILIATE', 'SUPPLIER', 'COURIER', 'PARTNER', 'ADMIN']
  const userRole = role && validRoles.includes(role) ? role : 'CLIENT'

  // Email único
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta con este email' },
      { status: 409 }
    )
  }

  // Generar código de afiliado único
  const code =
    name.slice(0, 4).toUpperCase() +
    '-' +
    String(Math.floor(Math.random() * 9000) + 1000)

  const isSupplier = userRole === 'SUPPLIER'
  const isCourier = userRole === 'COURIER'
  const isPartner = userRole === 'PARTNER'

  try {
    const created = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: name.trim().slice(0, 100),
          email: email.trim().toLowerCase(),
          password: await bcrypt.hash(password, 10),
          role: userRole,
          phone: phone?.trim() || null,
          city: city?.trim() || null,
          address: address?.trim() || null,
          affiliateCode: code,
        },
      })

      let supplier: { id: string } | null = null
      if (isSupplier) {
        supplier = await tx.supplier.create({
          data: {
            userId: u.id,
            companyName: companyName?.trim() || name.trim(),
            phone: phone?.trim() || null,
            address: address?.trim() || null,
            city: city?.trim() || null,
            category: category?.trim() || null,
            verified: true, // admin-created → verificado
          },
        })

        // Sucursal principal si branchCity viene
        if (branchCity && branchCity.trim() && branchAddress && branchAddress.trim()) {
          await tx.supplierBranch.create({
            data: {
              supplierId: supplier.id,
              name: (branchName && branchName.trim()) || 'Matriz',
              city: branchCity.trim(),
              address: branchAddress.trim(),
              phone: branchPhone?.trim() || phone?.trim() || null,
              isMain: true,
              isActive: true,
            },
          })
        }

        // Hasta 5 frases
        const cleanPhrases = Array.isArray(phrases)
          ? phrases
              .map((p) => (typeof p === 'string' ? p.trim() : ''))
              .filter((p) => p.length > 0)
              .slice(0, 5)
          : []
        for (const p of cleanPhrases) {
          await tx.searchPhrase.create({
            data: {
              supplierId: supplier.id,
              phrase: p.toLowerCase(),
              category: category?.trim() || null,
              isPremium: false,
              status: 'ACTIVE',
              monthlyPrice: 0,
              paidUntil: null,
            },
          })
        }
      }

      if (isCourier) {
        await tx.courier.create({
          data: {
            userId: u.id,
            vehicleType: vehicleType || 'MOTORCYCLE',
            zone: zone?.trim() || null,
            available: true,
          },
        })
      }

      if (isPartner) {
        const amount =
          Number.isFinite(Number(contributionAmount)) && Number(contributionAmount) > 0
            ? Number(contributionAmount)
            : 300
        const monthly = +(amount * 0.03).toFixed(2)
        await tx.partner.create({
          data: {
            userId: u.id,
            totalContribution: amount,
            totalReturns: monthly,
            status: 'ACTIVE',
            contributions: {
              create: {
                amount,
                returnRate: 3,
                monthlyReturn: monthly,
                status: 'ACTIVE',
              },
            },
          },
        })
      }

      return { u, supplier, isCourier, isPartner }
    })

    return NextResponse.json(
      {
        id: created.u.id,
        name: created.u.name,
        email: created.u.email,
        role: created.u.role,
        affiliateCode: created.u.affiliateCode,
        supplierId: created.supplier?.id || null,
      },
      { status: 201 }
    )
  } catch (e) {
    console.error('[api/users] POST error:', e)
    return NextResponse.json(
      { error: 'No se pudo crear el usuario' },
      { status: 500 }
    )
  }
}
