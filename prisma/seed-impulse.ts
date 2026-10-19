/* ImpulsePymes360 - Seed de planes, edición PubliBags, proveedor demo */
import { db } from '../src/lib/db'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function main() {
  console.log('🌱 Iniciando seed ImpulsePymes360...')

  // Limpiar datos previos
  await db.adSpace.deleteMany()
  await db.adEdition.deleteMany()
  await db.qRCode.deleteMany()
  await db.websiteExpress.deleteMany()
  await db.subscription.deleteMany()
  await db.provider.deleteMany()
  await db.plan.deleteMany()

  // ---------- Planes ----------
  const plans = [
    {
      name: 'STARTER',
      displayName: 'Starter',
      price: 29,
      description: 'Para emprendedores que empiezan en el mundo digital.',
      maxProducts: 10, maxAdSpaces: 1, maxShipments: 5, maxAffiliateRate: 1,
      hasWebExpress: true, hasDirectorio: true, hasLogistica: true, hasSocial: false,
    },
    {
      name: 'CRECIMIENTO',
      displayName: 'Crecimiento',
      price: 79,
      description: 'Para negocios en expansión que necesitan más canales.',
      maxProducts: 50, maxAdSpaces: 3, maxShipments: 20, maxAffiliateRate: 3,
      hasWebExpress: true, hasDirectorio: true, hasLogistica: true, hasSocial: true,
      featured: true,
    },
    {
      name: 'PREMIUM',
      displayName: 'Premium',
      price: 199,
      description: 'Para empresas consolidadas que quieren dominar el mercado.',
      maxProducts: 200, maxAdSpaces: 6, maxShipments: 100, maxAffiliateRate: 5,
      hasWebExpress: true, hasDirectorio: true, hasLogistica: true, hasSocial: true,
    },
    {
      name: 'ENTERPRISE',
      displayName: 'Enterprise',
      price: 499,
      description: 'Solución a medida para grandes empresas y cadenas.',
      maxProducts: 9999, maxAdSpaces: 20, maxShipments: 9999, maxAffiliateRate: 5,
      hasWebExpress: true, hasDirectorio: true, hasLogistica: true, hasSocial: true,
    },
  ]
  const planMap: Record<string, string> = {}
  for (const p of plans) {
    const plan = await db.plan.create({ data: p })
    planMap[p.name] = plan.id
  }
  console.log('✓ 4 planes creados')

  // ---------- Edición PubliBags ----------
  const edition = await db.adEdition.create({
    data: {
      name: 'Edición Noviembre 2025 - Guayaquil',
      slug: 'nov-2025-gye',
      city: 'Guayaquil',
      totalSpaces: 80,
      bagSize: '48x48',
      printQuantity: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 86400000),
      status: 'OPEN',
    },
  })
  // Crear 80 espacios
  for (let i = 1; i <= 80; i++) {
    await db.adSpace.create({
      data: {
        editionId: edition.id,
        position: i,
        type: i % 10 === 0 ? 'IMAGE' : 'QR',
        status: 'AVAILABLE',
        price: i <= 10 ? 35 : 20, // primeros 10 más caros (destacados)
      },
    })
  }
  console.log('✓ Edición PubliBags con 80 espacios creada')

  // ---------- Proveedor demo (TecnoExpress) ----------
  const supplierUser = await db.user.findFirst({ where: { role: 'SUPPLIER' } })
  if (!supplierUser) {
    console.log('Falta usuario SUPPLIER. Ejecuta prisma/seed.ts primero')
    return
  }

  const provider = await db.provider.create({
    data: {
      userId: supplierUser.id,
      companyName: 'TecnoExpress',
      taxId: '0991234567001',
      phone: '042222333',
      mobile: '099222333',
      address: 'Av. 9 de Octubre y Boyacá',
      city: 'Guayaquil',
      category: 'Electrónica',
      description: 'Tecnología y gadgets al mejor precio. Smartphones, laptops, accesorios y más.',
      logoUrl: 'https://picsum.photos/seed/tecnoexpress-logo/300/300',
      coverUrl: 'https://picsum.photos/seed/tecnoexpress-cover/1200/400',
      websiteSlug: 'tecnoexpress',
      affiliateRate: 3,
      status: 'ACTIVE',
      verified: true,
    },
  })

  // Suscripción al plan Crecimiento
  await db.subscription.create({
    data: {
      providerId: provider.id,
      planId: planMap['CRECIMIENTO'],
      status: 'ACTIVE',
      amount: 79,
      paymentMethod: 'TARJETA',
      nextBillingDate: new Date(Date.now() + 30 * 86400000),
    },
  })

  // Sitio Web Express
  await db.websiteExpress.create({
    data: {
      providerId: provider.id,
      slug: 'tecnoexpress',
      template: 'modern',
      primaryColor: '#0d9488',
      accentColor: '#d97706',
      heroTitle: 'TecnoExpress — Tecnología al mejor precio',
      heroSubtitle: 'Smartphones, laptops y accesorios con envío gratis a todo Ecuador',
      heroImageUrl: 'https://picsum.photos/seed/tecno-hero/1200/600',
      aboutText: 'Somos una empresa ecuatoriana con más de 10 años de experiencia en tecnología. Ofrecemos productos originales con garantía y servicio técnico especializado.',
      contactEmail: 'ventas@tecnoexpress.com',
      contactPhone: '042222333',
      contactWhatsapp: '59399222333',
      contactAddress: 'Av. 9 de Octubre y Boyacá, Guayaquil',
      businessHours: JSON.stringify({ mon: '9-18', tue: '9-18', wed: '9-18', thu: '9-18', fri: '9-18', sat: '9-14', sun: 'closed' }),
      socialLinks: JSON.stringify({ instagram: '@tecnoexpress_ec', facebook: 'TecnoExpressEC', tiktok: '@tecnoexpress' }),
      metaTitle: 'TecnoExpress — Tecnología en Ecuador',
      metaDescription: 'Compra smartphones, laptops y accesorios con garantía y envío gratis.',
      published: true,
      views: 342,
    },
  })

  // QR Code para el proveedor
  await db.qRCode.create({
    data: {
      providerId: provider.id,
      code: 'TECNO001',
      targetUrl: '/w/tecnoexpress',
      type: 'WEBSITE',
      scans: 128,
      uniqueScans: 96,
      lastScanAt: new Date(Date.now() - 2 * 86400000),
    },
  })

  // Reservar 3 espacios en la edición para TecnoExpress
  const availableSpaces = await db.adSpace.findMany({ where: { editionId: edition.id, status: 'AVAILABLE' }, take: 3, orderBy: { position: 'asc' } })
  for (const space of availableSpaces) {
    await db.adSpace.update({
      where: { id: space.id },
      data: { providerId: provider.id, status: 'SOLD', soldAt: new Date() },
    })
  }
  console.log('✓ Proveedor demo TecnoExpress creado (suscripción + Web Express + QR + 3 espacios)')

  console.log('🎉 Seed ImpulsePymes360 completado.')
  console.log('   Planes: Starter $29, Crecimiento $79, Premium $199, Enterprise $499')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
