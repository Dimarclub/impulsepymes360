import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const VALID_CATEGORIES = [
  'Bazar',
  'Papelería',
  'Cosméticos',
  'Juguetes',
  'Electrónica',
  'Ropa',
  'Comida',
  'Restaurantes',
  'Servicios',
  'Otro',
] as const
type Category = (typeof VALID_CATEGORIES)[number]

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

// POST /api/dima/register-supplier
// Registro público de un nuevo proveedor desde la PWA Dima.
// Crea: User (role=SUPPLIER) + Supplier + 1 SupplierBranch (principal)
//       + hasta 5 SearchPhrase (plan Starter, gratis).
// Validaciones: email único, password ≥ 6, companyName y city no vacíos.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      name,
      email,
      password,
      phone,
      companyName,
      city,
      category,
      address,
      branchName,
      branchCity,
      branchAddress,
      branchPhone,
      phrases,
    } = body as {
      name?: string
      email?: string
      password?: string
      phone?: string
      companyName?: string
      city?: string
      category?: string
      address?: string
      branchName?: string
      branchCity?: string
      branchAddress?: string
      branchPhone?: string
      phrases?: string[]
    }

    // ---- Validaciones básicas ----
    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos requeridos (nombre, email, contraseña)' },
        { status: 400 }
      )
    }
    if (typeof email !== 'string' || !isEmail(email)) {
      return NextResponse.json(
        { ok: false, error: 'Email inválido' },
        { status: 400 }
      )
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { ok: false, error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }
    if (!companyName || !companyName.trim()) {
      return NextResponse.json(
        { ok: false, error: 'El nombre de la empresa es obligatorio' },
        { status: 400 }
      )
    }
    if (!city || !city.trim()) {
      return NextResponse.json(
        { ok: false, error: 'La ciudad es obligatoria' },
        { status: 400 }
      )
    }

    // Email único
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      )
    }

    // Categoría validada (si no es válida → Otro)
    const catRaw = String(category ?? '').trim()
    const finalCategory: Category =
      (VALID_CATEGORIES as readonly string[]).includes(catRaw)
        ? (catRaw as Category)
        : 'Otro'

    // Frases (máx 5, plan Starter)
    const rawPhrases = Array.isArray(phrases) ? phrases : []
    const cleanPhrases = rawPhrases
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter((p) => p.length > 0)
      .slice(0, 5)

    // Datos de sucursal (con defaults)
    const bName = (branchName && branchName.trim()) || 'Matriz'
    const bAddress =
      (branchAddress && branchAddress.trim()) || (address && address.trim()) || ''
    const bCity = (branchCity && branchCity.trim()) || (city && city.trim()) || ''
    const bPhone =
      (branchPhone && branchPhone.trim()) || (phone && phone.trim()) || null

    if (!bAddress || !bCity) {
      return NextResponse.json(
        { ok: false, error: 'Falta la dirección o ciudad de la sucursal principal' },
        { status: 400 }
      )
    }

    // Generar código de afiliado único
    const code =
      name.slice(0, 4).toUpperCase() +
      '-' +
      String(Math.floor(Math.random() * 9000) + 1000)

    const created = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: name.trim().slice(0, 100),
          email: email.trim().toLowerCase(),
          password: await bcrypt.hash(password, 10),
          role: 'SUPPLIER',
          phone: phone?.trim() || null,
          city: city.trim().slice(0, 100),
          address: address?.trim() || null,
          affiliateCode: code,
        },
      })

      const supplier = await tx.supplier.create({
        data: {
          userId: u.id,
          companyName: companyName.trim().slice(0, 150),
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          city: city.trim().slice(0, 100),
          category: finalCategory,
          verified: false,
          rating: 0,
        },
      })

      // Sucursal principal
      await tx.supplierBranch.create({
        data: {
          supplierId: supplier.id,
          name: bName,
          city: bCity,
          address: bAddress,
          phone: bPhone,
          whatsapp: null,
          isMain: true,
          isActive: true,
        },
      })

      // Frases iniciales (máx 5, plan Starter — gratis)
      for (const p of cleanPhrases) {
        await tx.searchPhrase.create({
          data: {
            supplierId: supplier.id,
            phrase: p.toLowerCase(),
            category: finalCategory,
            isPremium: false,
            status: 'ACTIVE',
            monthlyPrice: 0, // incluida en el plan Starter
            paidUntil: null, // no requiere pago
          },
        })
      }

      return { u, supplier }
    })

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: created.u.id,
          email: created.u.email,
          name: created.u.name,
          role: created.u.role,
        },
        supplierId: created.supplier.id,
        message:
          'Proveedor registrado. Revisa tu email para activar tu cuenta.',
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error('[dima/register-supplier] error:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: 'Error al registrar el proveedor' },
      { status: 500 }
    )
  }
}
