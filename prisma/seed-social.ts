/* Dimarclub Social - Seed de datos de redes sociales */
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Iniciando seed Social de Dimarclub...')

  // Tomar el admin y un afiliado existentes
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' } })
  const affiliate = await db.user.findFirst({ where: { role: 'AFFILIATE' } })
  const supplier = await db.user.findFirst({ where: { role: 'SUPPLIER' } })
  if (!admin || !affiliate || !supplier) {
    console.log('Faltan usuarios base. Ejecuta primero prisma/seed.ts')
    return
  }

  // Limpiar datos social previos
  await db.automationRule.deleteMany()
  await db.bioPage.deleteMany()
  await db.mediaAsset.deleteMany()
  await db.mediaFolder.deleteMany()
  await db.socialPostAccount.deleteMany()
  await db.socialPost.deleteMany()
  await db.socialAccount.deleteMany()

  // ---------- Cuentas sociales ----------
  const accounts = [
    { platform: 'INSTAGRAM', handle: '@dimarclub_ec', displayName: 'Dimarclub Ecuador', followers: 12400 },
    { platform: 'FACEBOOK', handle: 'DimarclubEC', displayName: 'Dimarclub', followers: 8900 },
    { platform: 'TIKTOK', handle: '@dimarclub', displayName: 'Dimarclub', followers: 23100 },
    { platform: 'X', handle: '@dimarclub_ec', displayName: 'Dimarclub', followers: 3400 },
    { platform: 'WHATSAPP', handle: '+593999000111', displayName: 'Dimarclub WhatsApp', followers: 1200 },
  ]
  const adminAccounts = []
  for (const a of accounts) {
    const acc = await db.socialAccount.create({
      data: { userId: admin.id, platform: a.platform, handle: a.handle, displayName: a.displayName, followerCount: a.followers, connected: true, token: 'mock_token_' + a.platform.toLowerCase() },
    })
    adminAccounts.push(acc)
  }

  // Cuenta del afiliado (Instagram)
  const affAcc = await db.socialAccount.create({
    data: { userId: affiliate.id, platform: 'INSTAGRAM', handle: '@ana.afiliada', displayName: 'Ana Mendoza', followerCount: 1850, connected: true, token: 'mock_token_aff' },
  })

  // Cuenta del proveedor
  const supAcc = await db.socialAccount.create({
    data: { userId: supplier.id, platform: 'FACEBOOK', handle: 'TecnoExpressEC', displayName: 'TecnoExpress', followerCount: 5200, connected: true, token: 'mock_token_sup' },
  })
  console.log('✓ Cuentas sociales creadas')

  // ---------- Carpetas de medios ----------
  const folder1 = await db.mediaFolder.create({ data: { userId: admin.id, name: 'Promociones Octubre', color: '#0d9488' } })
  const folder2 = await db.mediaFolder.create({ data: { userId: admin.id, name: 'Productos Destacados', color: '#d97706' } })
  const folder3 = await db.mediaFolder.create({ data: { userId: admin.id, name: 'Beneficios Dimarclub', color: '#7c3aed' } })

  // Assets de medios (imágenes placeholder)
  const assetSeeds = ['promo1', 'promo2', 'promo3', 'product1', 'product2', 'benefit1', 'benefit2']
  for (const seed of assetSeeds) {
    await db.mediaAsset.create({
      data: {
        userId: admin.id,
        name: `${seed}.jpg`,
        url: `https://picsum.photos/seed/${seed}/800/800`,
        type: 'IMAGE',
        size: Math.floor(Math.random() * 500000) + 100000,
        folderId: seed.startsWith('promo') ? folder1.id : seed.startsWith('product') ? folder2.id : folder3.id,
        tags: JSON.stringify([seed.startsWith('promo') ? 'promo' : seed.startsWith('product') ? 'producto' : 'beneficio']),
      },
    })
  }
  console.log('✓ Carpetas y assets de medios creados')

  // ---------- Posts ----------
  const products = await db.product.findMany({ take: 8, include: { category: true, supplier: true } })
  const postDefs = [
    { caption: '🔥 ¡Gran liquidación en electrónica! Hasta 30% OFF en smartphones, laptops y más.\n\nEnvío GRATIS a todo Ecuador 🚚\nGana comisiones por recomendar 💰\n\n👉 dimarclub.com\n\n#Dimarclub #Ofertas #Ecuador', status: 'PUBLISHED', daysAgo: 5, platform: 'INSTAGRAM', productId: products[0]?.id },
    { caption: '¿Sabías que con Dimarclub ganas 3% por cada compra? 💚\n\nY 2% adicional por cada nivel de tu red de afiliados (3 niveles).\n\n¡Convierte tus compras en ingresos!\n\n#Dimarclub #Afiliados #IngresosExtra', status: 'PUBLISHED', daysAgo: 3, platform: 'FACEBOOK', productId: null },
    { caption: '🚚 Envío a domicilio GRATIS en todas tus compras\n🚙 Lavado de autos gratis mensual\n🦷 Atención odontológica para el titular\n🆘 Grúa y asistencia mecánica 24/7\n🚑 Ambulancia 24/7\n\n¡Todo siendo parte de Dimarclub!\n\n#Dimarclub #Beneficios #Ecuador', status: 'PUBLISHED', daysAgo: 2, platform: 'TIKTOK', productId: null },
    { caption: `✨ ${products[1]?.name || 'Producto'} ya disponible!\n\n$${products[1]?.price.toFixed(2) || '0.00'} · ${products[1]?.category?.name || ''}\n\nCalidad garantizada + envío gratis 📦\n\n#Dimarclub`, status: 'PUBLISHED', daysAgo: 1, platform: 'INSTAGRAM', productId: products[1]?.id },
    { caption: `🛍️ ${products[2]?.name || 'Producto'} al mejor precio!\n\nSolo $${products[2]?.price.toFixed(2) || '0.00'} en Dimarclub\n\n¡Compra y gana! 💚`, status: 'SCHEDULED', scheduledInHours: 6, platform: 'INSTAGRAM', productId: products[2]?.id },
    { caption: '💡 Tip: Usa tu código de afiliado en cada recomendación. Cada compra de tu red te genera comisiones automáticas.\n\n#Dimarclub #TipsAfiliados', status: 'SCHEDULED', scheduledInHours: 24, platform: 'X', productId: null },
    { caption: `Nuevo en Dimarclub: ${products[3]?.name || 'producto'}\n\n$${products[3]?.price.toFixed(2) || '0.00'} · ${products[3]?.category?.name || ''}\n\n#Dimarclub #Novedades`, status: 'DRAFT', platform: 'FACEBOOK', productId: products[3]?.id },
  ]

  for (const p of postDefs) {
    const publishedAt = p.status === 'PUBLISHED' ? new Date(Date.now() - (p.daysAgo || 0) * 86400000) : null
    const scheduledAt = p.scheduledInHours ? new Date(Date.now() + p.scheduledInHours * 3600000) : null
    const account = p.platform === 'INSTAGRAM' ? adminAccounts[0] : p.platform === 'FACEBOOK' ? adminAccounts[1] : p.platform === 'TIKTOK' ? adminAccounts[2] : p.platform === 'X' ? adminAccounts[3] : adminAccounts[4]
    const post = await db.socialPost.create({
      data: {
        userId: admin.id,
        caption: p.caption,
        mediaUrls: JSON.stringify([`https://picsum.photos/seed/post${Date.now()}/800/800`]),
        mediaType: 'IMAGE',
        productId: p.productId || null,
        affiliateCode: admin.affiliateCode,
        status: p.status,
        scheduledAt,
        publishedAt,
        likes: p.status === 'PUBLISHED' ? Math.floor(Math.random() * 500) + 50 : 0,
        comments: p.status === 'PUBLISHED' ? Math.floor(Math.random() * 80) + 5 : 0,
        shares: p.status === 'PUBLISHED' ? Math.floor(Math.random() * 120) + 10 : 0,
        reach: p.status === 'PUBLISHED' ? Math.floor(Math.random() * 8000) + 1000 : 0,
        clicks: p.status === 'PUBLISHED' ? Math.floor(Math.random() * 300) + 30 : 0,
        attributedOrders: p.status === 'PUBLISHED' ? Math.floor(Math.random() * 12) : 0,
        attributedRevenue: p.status === 'PUBLISHED' ? Math.random() * 800 : 0,
      },
    })
    await db.socialPostAccount.create({
      data: { postId: post.id, accountId: account.id, status: p.status === 'PUBLISHED' ? 'PUBLISHED' : 'PENDING', permalink: p.status === 'PUBLISHED' ? `https://${p.platform.toLowerCase()}.com/dimarclub/post${post.id.slice(-6)}` : null },
    })
  }
  console.log('✓ Posts creados')

  // ---------- Link in Bio ----------
  await db.bioPage.create({
    data: {
      userId: affiliate.id,
      slug: 'ana-dimarclub',
      title: 'Ana Mendoza · Dimarclub',
      subtitle: 'Afiliada Dimarclub 🌎 Compra con beneficios y gana comisiones',
      avatarUrl: 'https://picsum.photos/seed/ana-avatar/200/200',
      theme: 'emerald',
      affiliateCode: affiliate.affiliateCode,
      links: JSON.stringify([
        { label: '🛍️ Ver catálogo', url: '/?ref=' + affiliate.affiliateCode, icon: 'ShoppingBag', type: 'internal' },
        { label: '🎁 Beneficios Dimarclub', url: '/?ref=' + affiliate.affiliateCode + '&module=benefits', icon: 'Gift', type: 'internal' },
        { label: '💰 Hazte afiliado', url: '/?ref=' + affiliate.affiliateCode + '&module=register', icon: 'Users', type: 'internal' },
        { label: '📱 WhatsApp', url: 'https://wa.me/593999222222', icon: 'MessageCircle', type: 'external' },
        { label: '📸 Instagram', url: 'https://instagram.com/ana.afiliada', icon: 'Instagram', type: 'external' },
      ]),
      views: 1240,
      clicks: 380,
    },
  })
  await db.bioPage.create({
    data: {
      userId: admin.id,
      slug: 'dimarclub',
      title: 'Dimarclub Oficial',
      subtitle: 'Compra, recomienda y gana 🌎 El marketplace con comunidad',
      avatarUrl: 'https://picsum.photos/seed/dimar-avatar/200/200',
      theme: 'amber',
      affiliateCode: admin.affiliateCode,
      links: JSON.stringify([
        { label: '🛍️ Marketplace', url: '/', icon: 'ShoppingBag', type: 'internal' },
        { label: '🤝 Hazte afiliado', url: '/?module=register', icon: 'Users', type: 'internal' },
        { label: '🏢 Registra tu empresa', url: '/?module=register&type=supplier', icon: 'Store', type: 'internal' },
        { label: '💼 Sé socio inversor', url: '/?module=register&type=partner', icon: 'HandCoins', type: 'internal' },
        { label: '📧 Contacto', url: 'mailto:soporte@dimarclub.com', icon: 'Mail', type: 'external' },
      ]),
      views: 5400,
      clicks: 1820,
    },
  })
  console.log('✓ Páginas Link in Bio creadas')

  // ---------- Reglas de automatización ----------
  await db.automationRule.create({
    data: {
      userId: admin.id,
      name: 'Productos destacados diarios',
      type: 'BULK_PRODUCT',
      config: JSON.stringify({ categoryId: null, frequency: 'DAILY', platforms: ['INSTAGRAM', 'FACEBOOK'], template: 'featured', count: 2 }),
      status: 'ACTIVE',
      lastRunAt: new Date(Date.now() - 86400000),
      postsCreated: 14,
    },
  })
  await db.automationRule.create({
    data: {
      userId: admin.id,
      name: 'Beneficios semanales',
      type: 'RECURRING',
      config: JSON.stringify({ frequency: 'WEEKLY', platforms: ['TIKTOK', 'INSTAGRAM'], template: 'benefits' }),
      status: 'ACTIVE',
      lastRunAt: new Date(Date.now() - 3 * 86400000),
      postsCreated: 8,
    },
  })
  await db.automationRule.create({
    data: {
      userId: admin.id,
      name: 'Digest de afiliados (lunes)',
      type: 'DAILY_DIGEST',
      config: JSON.stringify({ frequency: 'WEEKLY_MONDAY', platforms: ['X'], template: 'digest' }),
      status: 'PAUSED',
      postsCreated: 3,
    },
  })
  console.log('✓ Reglas de automatización creadas')

  console.log('🎉 Seed Social completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
