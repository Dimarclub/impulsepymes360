/**
 * seed-plans.cjs — Seed ImpulsePymes360 plan products + add-ons into the marketplace.
 *
 * Idempotent: safe to run multiple times. Creates (or updates):
 *   - 1 system User  (info@impulsepymes360.com, role SUPPLIER)
 *   - 1 Supplier     (ImpulsePymes360)
 *   - 1 Category     (Planes Integrales, slug planes-integrales)
 *   - 9 Products     (6 plans + 3 add-ons)
 *
 * Run with:  node scripts/seed-plans.cjs
 */
const { PrismaClient } = require('/home/z/my-project/node_modules/@prisma/client')

const db = new PrismaClient()

// ---------- Data ----------
const PLANS = [
  { id: 'basico',       name: 'Básico',        price: 122, pages: 3,  emails: 1,  products: 5,  sobres: 11, qr: 2, qrProd: 1, popular: false },
  { id: 'emprendedor',  name: 'Emprendedor',   price: 253, pages: 5,  emails: 3,  products: 15, sobres: 25, qr: 3, qrProd: 2, popular: false },
  { id: 'comercial',    name: 'Comercial',     price: 363, pages: 7,  emails: 5,  products: 25, sobres: 35, qr: 4, qrProd: 3, popular: true  },
  { id: 'premium',      name: 'Premium',       price: 478, pages: 10, emails: 7,  products: 35, sobres: 45, qr: 5, qrProd: 4, popular: false },
  { id: 'elite',        name: 'Élite',         price: 592, pages: 12, emails: 10, products: 45, sobres: 56, qr: 5, qrProd: 4, popular: false },
  { id: 'corporativo',  name: 'Corporativo',   price: 736, pages: 15, emails: 15, products: 60, sobres: 66, qr: 6, qrProd: 5, popular: false },
]

const ADDONS = [
  { id: 'sobre-individual',  name: 'Sobre individual (retiro horario fijo)',                price: 2.25, unit: '/ unidad' },
  { id: 'entrega-express',   name: 'Entrega Express (retiro y entrega inmediata)',          price: 4.00, unit: '/ unidad' },
  { id: 'solo-publibags-qr', name: 'Solo espacio PubliBags con QR (sin plan integral)',     price: 57.00, unit: '/ mes'   },
]

const PLAN_TAGS = JSON.stringify(['plan', 'impulsepymes360', 'suscripcion'])
const ADDON_TAGS = JSON.stringify(['addon', 'servicio'])

const DUMMY_HASH = '$2a$10$placeholderhashnotvalidbutnotusedImpulsePymes360'

function planDescription(p) {
  return `Plan integral ImpulsePymes360 — ${p.pages} páginas web, ${p.emails} emails, ${p.products} productos marketplace, ${p.sobres} sobres Fuerza Delta, ${p.qr} QR + ${p.qrProd} prod PubliBags. Incluye dominio propio, comunidad y directorio.`
}

function planLongDescription(p) {
  return [
    `# Plan ${p.name} — ImpulsePymes360`,
    '',
    `**Precio:** $${p.price} / mes`,
    '',
    '## Incluye',
    `- Sitio web profesional: **${p.pages} páginas**`,
    `- Emails corporativos: **${p.emails}**`,
    `- Productos en marketplace DimarClub: **${p.products}**`,
    `- Sobres Fuerza Delta: **${p.sobres}**`,
    `- Espacios PubliBags con QR: **${p.qr} QR + ${p.qrProd} producto(s)**`,
    '',
    '## Todos los planes incluyen',
    '- Dominio propio (.com / .ec)',
    '- Comunidad de consumidores DimarClub',
    '- Espacio en directorio + álbum coleccionable',
    '',
    '## Soporte',
    '- Activación en menos de 24h',
    '- WhatsApp: +593 99 268 9844',
    '- Email: info@impulsepymes360.com',
  ].join('\n')
}

async function main() {
  console.log('🌱 Seed ImpulsePymes360 plans + add-ons...\n')

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
    // ensure role + phone are right (idempotent update)
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

  // ---------- 4. Products (plans + add-ons) ----------
  let created = 0
  let updated = 0

  // Plans
  for (const p of PLANS) {
    const slug = `plan-${p.id}`
    const sku = `PLAN-${p.id.toUpperCase()}`
    const data = {
      name: `Plan ${p.name}`,
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
      console.log(`  ↻ Plan updated:  ${data.name}  ($${p.price}/mes)`)
    } else {
      await db.product.create({ data })
      created++
      console.log(`  ✓ Plan created:  ${data.name}  ($${p.price}/mes)`)
    }
  }

  // Add-ons
  for (const a of ADDONS) {
    const slug = `addon-${a.id}`
    const sku = `ADDON-${a.id.toUpperCase()}`
    const data = {
      name: a.name,
      slug,
      description: `${a.name} — ImpulsePymes360. Precio unitario: $${a.price.toFixed(2)} ${a.unit}.`,
      longDescription: [
        `# ${a.name}`,
        '',
        `**Add-on ImpulsePymes360**`,
        '',
        `Precio: **$${a.price.toFixed(2)} ${a.unit}**`,
        '',
        'Servicio complementario a cualquier plan integral. Disponible por separado sin necesidad de contratar un plan mensual.',
        '',
        'Contacto: info@impulsepymes360.com · WhatsApp +593 99 268 9844',
      ].join('\n'),
      price: a.price,
      costPrice: 0,
      compareAtPrice: null,
      stock: 999999,
      sku,
      imageUrl: null,
      tags: ADDON_TAGS,
      categoryId: category.id,
      supplierId: supplier.id,
      rating: 0,
      reviewCount: 0,
      featured: false,
      status: 'ACTIVE',
    }
    const existing = await db.product.findUnique({ where: { slug } })
    if (existing) {
      await db.product.update({ where: { id: existing.id }, data })
      updated++
      console.log(`  ↻ Add-on updated: ${a.name}  ($${a.price.toFixed(2)}${a.unit})`)
    } else {
      await db.product.create({ data })
      created++
      console.log(`  ✓ Add-on created: ${a.name}  ($${a.price.toFixed(2)}${a.unit})`)
    }
  }

  console.log(`\n✅ Seeded 9 products (${created} created, ${updated} updated) under supplier ImpulsePymes360, category Planes Integrales`)
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
