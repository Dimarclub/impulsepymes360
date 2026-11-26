import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const db = db

/**
 * GET /api/setup?token=SETUP_TOKEN
 * Crea los datos iniciales del sistema (idempotente):
 * - 6 planes (Starter gratis → Corporativo $395)
 * - Combo PubliBags ($44)
 * - Usuario admin
 * - Categorías base
 * - Usuario sistema ImpulsePymes360 + supplier + frases demo
 *
 * El token se configura en la env var SETUP_TOKEN.
 * Si no está configurada, usa "dimar-setup-2024".
 * Ejecutar UNA sola vez después del primer deploy.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const results: string[] = []

    // ---------- 1. Usuario ADMIN ----------
    const adminEmail = 'admin@dimarclub.com'
    let admin = await db.user.findUnique({ where: { email: adminEmail } })
    if (!admin) {
      admin = await db.user.create({
        data: {
          email: adminEmail,
          name: 'Carlos Dimar',
          role: 'ADMIN',
          phone: '099111111',
          city: 'Guayaquil',
          affiliateCode: 'DIMAR-001',
          password: await bcrypt.hash('dimar123', 10),
        },
      })
      results.push('Admin creado: admin@dimarclub.com / dimar123')
    } else {
      results.push('Admin ya existe')
    }

    // ---------- 2. Categoría Planes Integrales ----------
    let cat = await db.category.findUnique({ where: { slug: 'planes-integrales' } })
    if (!cat) {
      cat = await db.category.create({
        data: { name: 'Planes Integrales', slug: 'planes-integrales', icon: 'CreditCard', color: '#F5A623', parentId: null },
      })
      results.push('Categoria Planes Integrales creada')
    } else {
      results.push('Categoria ya existe')
    }

    // ---------- 3. Usuario + Supplier ImpulsePymes360 ----------
    let sysUser = await db.user.findUnique({ where: { email: 'info@impulsepymes360.com' } })
    if (!sysUser) {
      sysUser = await db.user.create({
        data: {
          email: 'info@impulsepymes360.com',
          name: 'ImpulsePymes360',
          role: 'SUPPLIER',
          password: await bcrypt.hash('impulse360', 10),
          city: 'Guayaquil',
          phone: '+593992689844',
          affiliateCode: 'IMPUL-360',
        },
      })
      results.push('Usuario ImpulsePymes360 creado')
    } else {
      results.push('Usuario ImpulsePymes360 ya existe')
    }

    let supplier = await db.supplier.findUnique({ where: { userId: sysUser.id } })
    if (!supplier) {
      supplier = await db.supplier.create({
        data: {
          userId: sysUser.id,
          companyName: 'ImpulsePymes360',
          phone: '+593992689844',
          address: 'Ecuador',
          city: 'Guayaquil',
          category: 'Servicios',
          verified: true,
          rating: 5,
        },
      })
      results.push('Supplier ImpulsePymes360 creado')
    } else {
      results.push('Supplier ya existe')
    }

    // ---------- 4. Planes (tabla Plan) ----------
    const PLANS = [
      { name: 'STARTER', displayName: 'Plan Starter', price: 0, webSections: 10, bagSpaces: 67, dimaPhrases: 5, featured: false },
      { name: 'EMPRENDEDOR', displayName: 'Plan Emprendedor', price: 155, webSections: 20, bagSpaces: 120, dimaPhrases: 10, featured: false },
      { name: 'COMERCIAL', displayName: 'Plan Comercial', price: 265, webSections: 30, bagSpaces: 220, dimaPhrases: 15, featured: true },
      { name: 'PREMIUM', displayName: 'Plan Premium', price: 315, webSections: 40, bagSpaces: 260, dimaPhrases: 30, featured: false },
      { name: 'ELITE', displayName: 'Plan Élite', price: 345, webSections: 50, bagSpaces: 280, dimaPhrases: 35, featured: false },
      { name: 'CORPORATIVO', displayName: 'Plan Corporativo', price: 395, webSections: 60, bagSpaces: 320, dimaPhrases: 40, featured: false },
    ]
    for (const p of PLANS) {
      const existing = await db.plan.findFirst({ where: { name: p.name } })
      const data = {
        name: p.name,
        displayName: p.displayName,
        price: p.price,
        description: `${p.displayName} — ${p.webSections} secciones web, ${p.bagSpaces} espacios bolso, ${p.dimaPhrases} frases Dima. Todos los servicios digitales incluidos.`,
        maxWebSections: p.webSections,
        hasEmail: true, hasSocialStudio: true, hasAutoposter: true, hasForms: true,
        hasSurveys: true, hasReviews: true, hasChat: true, hasCrm: true,
        hasAiHub: true, hasInbox: true, hasReservas: true,
        bagSpaces: p.bagSpaces,
        dimaPhrases: p.dimaPhrases,
        directorioInternationalSpaces: 2,
        calendarioSpaces: 2,
        maxProducts: 999999,
        maxAffiliateRate: 3,
        maxAdSpaces: 0,
        hasWebExpress: true, hasDirectorio: true, hasLogistica: false, hasSocial: true,
        featured: p.featured,
      }
      if (existing) {
        await db.plan.update({ where: { id: existing.id }, data })
        results.push(`Plan ${p.name} actualizado`)
      } else {
        await db.plan.create({ data })
        results.push(`Plan ${p.name} creado ($${p.price})`)
      }
    }

    // ---------- 5. Productos (planes + combo en marketplace) ----------
    for (const p of PLANS) {
      const slug = `plan-${p.name.toLowerCase()}`
      const data = {
        name: p.displayName,
        slug,
        description: `${p.displayName} ImpulsePymes360 — ${p.webSections} secciones, ${p.bagSpaces} espacios bolso, ${p.dimaPhrases} frases Dima`,
        longDescription: `${p.displayName} — incluye todos los servicios digitales: Email, Social Studio, Autoposter, Formularios, Encuestas, Resenas, Chat, CRM, Centro IA, Bandeja, Reservas.`,
        price: p.price,
        costPrice: 0,
        stock: 999999,
        sku: `PLAN-${p.name}`,
        categoryId: cat.id,
        supplierId: supplier.id,
        featured: p.featured,
        status: 'ACTIVE',
      }
      const existing = await db.product.findUnique({ where: { slug } })
      if (existing) {
        await db.product.update({ where: { id: existing.id }, data })
      } else {
        await db.product.create({ data })
      }
    }
    results.push('6 planes en marketplace')

    const comboSlug = 'combo-publibags'
    const comboData = {
      name: 'Combo PubliBags (Inversion)',
      slug: comboSlug,
      description: '2 bolsos + 2 calendarios + 2 empastados. Inversion al 5% mensual compuesto.',
      longDescription: 'Combo PubliBags — Inversion con 5% interes compuesto mensual. Incluye 2 bolsos reutilizables con QR de Dima, 2 calendarios directorio y 2 empastados album-directorio.',
      price: 44,
      costPrice: 0,
      stock: 999999,
      sku: 'COMBO-PUBLIBAGS',
      categoryId: cat.id,
      supplierId: supplier.id,
      rating: 5,
      featured: true,
      status: 'ACTIVE',
    }
    const existingCombo = await db.product.findUnique({ where: { slug: comboSlug } })
    if (existingCombo) {
      await db.product.update({ where: { id: existingCombo.id }, data: comboData })
    } else {
      await db.product.create({ data: comboData })
    }
    results.push('Combo PubliBags $44 listo')

    // ---------- 6. Sucursal demo de ImpulsePymes360 ----------
    const branchCount = await db.supplierBranch.count({ where: { supplierId: supplier.id } })
    if (branchCount === 0) {
      await db.supplierBranch.create({
        data: {
          supplierId: supplier.id,
          name: 'Matriz Guayaquil',
          city: 'Guayaquil',
          sector: 'Centro',
          address: 'Ecuador',
          phone: '+593992689844',
          isMain: true,
        },
      })
      results.push('Sucursal demo creada')
    }

    return NextResponse.json({
      ok: true,
      message: 'Setup completado',
      results,
      credentials: {
        admin: 'admin@dimarclub.com / dimar123',
        supplier: 'info@impulsepymes360.com / impulse360',
      },
    })
  } catch (error) {
    console.error('[setup] error:', error)
    return NextResponse.json(
      { error: 'Error en setup', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
  }
}
