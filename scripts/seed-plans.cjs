/**
 * seed-plans.cjs — Seed ImpulsePymes360 plan products + add-ons into the marketplace.
 *
 * Idempotent: safe to run multiple times. Creates (or updates):
 *   - 1 system User  (info@impulsepymes360.com, role SUPPLIER)
 *   - 1 Supplier     (ImpulsePymes360)
 *   - 1 Category     (Planes Integrales, slug planes-integrales)
 *   - 7 Products     (6 plans + 1 combo PubliBags)
 *
 * Modelo nuevo (sin mensajería, con todos los servicios digitales incluidos):
 *   - Plan 1: STARTER     $0   - 10 secciones Web Express, 67 espacios bolso
 *   - Plan 2: EMPRENDEDOR $155 - 20 secciones Web Express, 120 espacios bolso
 *   - Plan 3: COMERCIAL   $265 - 30 secciones Web Express, 220 espacios bolso
 *   - Plan 4: PREMIUM     $315 - 40 secciones Web Express, 260 espacios bolso
 *   - Plan 5: ELITE       $345 - 50 secciones Web Express, 280 espacios bolso
 *   - Plan 6: CORPORATIVO $395 - 60 secciones Web Express, 320 espacios bolso
 *
 * Todos los planes incluyen:
 *   - Email marketing, Social Studio, Autoposter, Formularios, Encuestas,
 *     Reseñas, Chat en vivo, CRM, Centro de IA, Bandeja unificada, Reservas
 *   - 2 espacios en directorio comercial internacional
 *   - 2 espacios en calendario-directorio
 *
 * Combo PubliBags ($44): 2 bolsos + 2 calendarios directorio + 2 empastados álbum-directorio
 *
 * Run with:  node scripts/seed-plans.cjs
 */
const { PrismaClient } = require('/home/z/my-project/node_modules/@prisma/client')

const db = new PrismaClient()

// ---------- Data: 6 planes nuevos ----------
const PLANS = [
  { id: 'starter',      name: 'Starter',      displayName: 'Plan Starter',      price: 0,   webSections: 10, bagSpaces: 67,  dimaPhrases: 5,  popular: false },
  { id: 'emprendedor',  name: 'Emprendedor', displayName: 'Plan Emprendedor',  price: 155, webSections: 20, bagSpaces: 120, dimaPhrases: 10, popular: false },
  { id: 'comercial',    name: 'Comercial',   displayName: 'Plan Comercial',   price: 265, webSections: 30, bagSpaces: 220, dimaPhrases: 15, popular: true  },
  { id: 'premium',      name: 'Premium',     displayName: 'Plan Premium',     price: 315, webSections: 40, bagSpaces: 260, dimaPhrases: 30, popular: false },
  { id: 'elite',        name: 'Élite',       displayName: 'Plan Élite',       price: 345, webSections: 50, bagSpaces: 280, dimaPhrases: 35, popular: false },
  { id: 'corporativo',  name: 'Corporativo', displayName: 'Plan Corporativo', price: 395, webSections: 60, bagSpaces: 320, dimaPhrases: 40, popular: false },
]

// Combo PubliBags — el producto de inversión
const COMBO = {
  id: 'combo-publibags',
  name: 'Combo PubliBags (Inversión)',
  description: '2 bolsos PubliBags + 2 calendarios directorio + 2 empastados para álbum-directorio. Genera 5% de interés compuesto mensual sobre tu inversión.',
  price: 44,
}

const PLAN_TAGS = JSON.stringify(['plan', 'impulsepymes360', 'suscripcion'])
const COMBO_TAGS = JSON.stringify(['combo', 'publibags', 'inversion', 'impulsepymes360'])
const DUMMY_HASH = '$2a$10$placeholderhashnotvalidbutnotusedImpulsePymes360'

function planDescription(p) {
  return `Plan ${p.name} ImpulsePymes360 — ${p.webSections} secciones Web Express, ${p.bagSpaces} espacios en bolso reutilizable, 2 espacios en directorio comercial internacional, 2 espacios en calendario-directorio. Incluye TODOS los servicios digitales: Email marketing, Social Studio, Autoposter, Formularios, Encuestas, Reseñas, Chat en vivo, CRM, Centro de IA, Bandeja unificada, Reservas. Sin mensajería (disponible como add-on).`
}

function planLongDescription(p) {
  const priceLabel = p.price === 0 ? 'GRATIS' : `$${p.price} / mes`
  return [
    `# ${p.displayName} — ImpulsePymes360`,
    '',
    `**Precio:** ${priceLabel}`,
    '',
    '## Incluye',
    `- Sitio web profesional (Web Express): **${p.webSections} secciones**`,
    `- Espacio en bolso reutilizable: **${p.bagSpaces} espacios**`,
    `- Espacio en directorio comercial internacional: **2**`,
    `- Espacio en calendario-directorio: **2**`,
    '',
    '## Servicios digitales incluidos',
    '- Email marketing',
    '- Social Studio (contenido redes)',
    '- Autoposter (programación)',
    '- Formularios',
    '- Encuestas',
    '- Reseñas',
    '- Chat en vivo',
    '- CRM (embudos, contactos)',
    '- Centro de IA',
    '- Bandeja unificada',
    '- Reservas',
    '',
    '## Sin mensajería incluida',
    'La mensajería (Fuerza Delta) está disponible como add-on pagado por separado.',
    '',
    '## Soporte',
    '- Activación en menos de 24h',
    '- WhatsApp: +593 99 268 9844',
    '- Email: info@impulsepymes360.com',
  ].join('\n')
}

async function main() {
  console.log('🌱 Seed ImpulsePymes360 plans + combo PubliBags...\n')

  // ---------- 1. User (system supplier) ----------
  let user = await db.user.findUnique({ where: { email: 'info@impulsepymes360.com' } })
  if (!user) {
    user = await db.user.create({
      data: {
        email: 'info@impulsepymes360.com',
        name: 'ImpulsePymes360',
        role: 'SUPPLIER',
        password: DUMMY_HASH,
        city: 'Guayaquil',
        phone: '+593992689844',
        affiliateCode: 'IMPUL-360',
      },
    })
    console.log(`  ✓ User created: ${user.email} (${user.id})`)
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: { role: 'SUPPLIER', phone: '+593992689844', city: 'Guayaquil' },
    })
    console.log(`  ✓ User already exists: ${user.email} (${user.id}) — updated`)
  }

  // ---------- 2. Supplier ----------
  let supplier = await db.supplier.findUnique({ where: { userId: user.id } })
  if (!supplier) {
    supplier = await db.supplier.create({
      data: {
        userId: user.id,
        companyName: 'ImpulsePymes360',
        taxId: null,
        phone: '+593992689844',
        address: 'Ecuador',
        city: 'Guayaquil',
        category: 'Servicios',
        verified: true,
        rating: 5,
      },
    })
    console.log(`  ✓ Supplier created: ${supplier.companyName} (${supplier.id})`)
  } else {
    supplier = await db.supplier.update({
      where: { id: supplier.id },
      data: { verified: true, category: 'Servicios', phone: '+593992689844' },
    })
    console.log(`  ✓ Supplier already exists: ${supplier.companyName} (${supplier.id}) — updated`)
  }

  // ---------- 3. Category ----------
  let category = await db.category.findUnique({ where: { slug: 'planes-integrales' } })
  if (!category) {
    category = await db.category.create({
      data: {
        name: 'Planes Integrales',
        slug: 'planes-integrales',
        icon: 'CreditCard',
        color: '#F5A623',
        parentId: null,
      },
    })
    console.log(`  ✓ Category created: ${category.name} (${category.id})`)
  } else {
    category = await db.category.update({
      where: { id: category.id },
      data: { icon: 'CreditCard', color: '#F5A623' },
    })
    console.log(`  ✓ Category already exists: ${category.name} (${category.id}) — updated`)
  }

  // ---------- 4. Products (planes + combo) ----------
  let created = 0
  let updated = 0

  // Planes
  for (const p of PLANS) {
    const slug = `plan-${p.id}`
    const sku = `PLAN-${p.id.toUpperCase()}`
    const data = {
      name: p.displayName,
      slug,
      description: planDescription(p),
      longDescription: planLongDescription(p),
      price: p.price,
      costPrice: 0,
      compareAtPrice: null,
      stock: 999999,
      sku,
      imageUrl: null,
      tags: PLAN_TAGS,
      categoryId: category.id,
      supplierId: supplier.id,
      rating: p.popular ? 5 : 0,
      reviewCount: 0,
      featured: !!p.popular,
      status: 'ACTIVE',
    }
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) {
      await db.product.update({ where: { id: existing.id }, data })
      updated++
      const priceLabel = p.price === 0 ? 'GRATIS' : `$${p.price}/mes`
      console.log(`  ↻ Plan updated:  ${data.name}  (${priceLabel})`)
    } else {
      await db.product.create({ data })
      created++
      const priceLabel = p.price === 0 ? 'GRATIS' : `$${p.price}/mes`
      console.log(`  ✓ Plan created:  ${data.name}  (${priceLabel})`)
    }
  }

  // Combo PubliBags (inversión)
  const comboSlug = 'combo-publibags'
  const comboData = {
    name: COMBO.name,
    slug: comboSlug,
    description: COMBO.description,
    longDescription: [
      '# Combo PubliBags — Inversión',
      '',
      '**Precio:** $44 USD',
      '',
      '## Incluye',
      '- 2 bolsos PubliBags reutilizables (para regalar)',
      '- 2 calendarios directorio',
      '- 2 empastados para álbum-directorio',
      '',
      '## Beneficio de inversión',
      '- Genera **5% de interés compuesto mensual** sobre tu inversión',
      '- El interés se acumula mes a mes (compuesto)',
      '- Disponible para N1 y N2 (cabezas de red que invierten)',
      '- N3 (clientes/proveedores) solo consumen',
      '',
      '## Marketplace vs Inversión',
      '- Las compras del marketplace generan comisión del 1% (3% total: 1% N1 + 1% N2 + 1% N3)',
      '- Las compras de Combo PubliBags son INVERSIÓN y generan 5% mensual compuesto',
      '',
      '## Contacto',
      '- WhatsApp: +593 99 268 9844',
      '- Email: info@impulsepymes360.com',
    ].join('\n'),
    price: COMBO.price,
    costPrice: 0,
    compareAtPrice: null,
    stock: 999999,
    sku: 'COMBO-PUBLIBAGS',
    imageUrl: null,
    tags: COMBO_TAGS,
    categoryId: category.id,
    supplierId: supplier.id,
    rating: 5,
    reviewCount: 0,
    featured: true,
    status: 'ACTIVE',
  }
  const existingCombo = await db.product.findUnique({ where: { slug: comboSlug } })
  if (existingCombo) {
    await db.product.update({ where: { id: existingCombo.id }, data: comboData })
    updated++
    console.log(`  ↻ Combo updated:  ${COMBO.name}  ($${COMBO.price})`)
  } else {
    await db.product.create({ data: comboData })
    created++
    console.log(`  ✓ Combo created:  ${COMBO.name}  ($${COMBO.price})`)
  }

  // ---------- 5. Seed en la tabla Plan (para subscripciones) ----------
  console.log('\n--- Sincronizando tabla Plan ---')
  for (const p of PLANS) {
    const planName = p.id.toUpperCase()
    const existingPlan = await db.plan.findFirst({ where: { name: planName } })
    const planData = {
      name: planName,
      displayName: p.displayName,
      price: p.price,
      description: planDescription(p),
      maxWebSections: p.webSections,
      hasEmail: true,
      hasSocialStudio: true,
      hasAutoposter: true,
      hasForms: true,
      hasSurveys: true,
      hasReviews: true,
      hasChat: true,
      hasCrm: true,
      hasAiHub: true,
      hasInbox: true,
      hasReservas: true,
      bagSpaces: p.bagSpaces,
      dimaPhrases: p.dimaPhrases,
      directorioInternationalSpaces: 2,
      calendarioSpaces: 2,
      maxProducts: 999999,
      maxAffiliateRate: 3,
      maxAdSpaces: 0,
      hasWebExpress: true,
      hasDirectorio: true,
      hasLogistica: false,
      hasSocial: true,
      featured: !!p.popular,
    }
    if (existingPlan) {
      await db.plan.update({ where: { id: existingPlan.id }, data: planData })
      console.log(`  ↻ Plan record updated: ${planName}`)
    } else {
      await db.plan.create({ data: planData })
      console.log(`  ✓ Plan record created: ${planName}`)
    }
  }

  // Eliminar planes viejos (STARTER, CRECIMIENTO, PREMIUM, ENTERPRISE legacy)
  const legacyNames = ['CRECIMIENTO', 'ENTERPRISE']
  for (const name of legacyNames) {
    const legacy = await db.plan.findFirst({ where: { name } })
    if (legacy) {
      await db.plan.delete({ where: { id: legacy.id } })
      console.log(`  🗑️  Legacy plan removed: ${name}`)
    }
  }

  // Eliminar add-ons viejos (sobre-individual, entrega-express, solo-publibags-qr) ya no se incluyen
  // pero los dejamos en DB si ya existen para no romper órdenes pasadas
  // (no los eliminamos automáticamente)

  console.log(`\n✅ Seed completado: ${created} productos creados, ${updated} actualizados`)
  console.log(`   Supplier ID: ${supplier.id}`)
  console.log(`   Category ID: ${category.id}`)
  console.log(`   User ID:     ${user.id}`)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
