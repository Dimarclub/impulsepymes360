import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function main() {
  console.log('🌱 Iniciando seed de Dimarclub...')

  // Hashear la contraseña por defecto
  const DEFAULT_PASSWORD = 'dimar123'
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
  const pwd = () => hashedPassword

  // Limpiar
  await db.emailCampaign.deleteMany()
  await db.emailSubscriber.deleteMany()
  await db.crmActivity.deleteMany()
  await db.crmContact.deleteMany()
  await db.advertisement.deleteMany()
  await db.partnerContribution.deleteMany()
  await db.partner.deleteMany()
  await db.delivery.deleteMany()
  await db.courier.deleteMany()
  await db.commission.deleteMany()
  await db.cartItem.deleteMany()
  await db.cart.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.product.deleteMany()
  await db.supplier.deleteMany()
  await db.category.deleteMany()
  await db.application.deleteMany()
  await db.user.deleteMany()

  // ---------- Categorías y subcategorías ----------
  const catDefs = [
    { name: 'Electrónica', icon: 'Smartphone', color: '#0d9488', subs: ['Celulares', 'Laptops', 'Audio', 'Accesorios'] },
    { name: 'Hogar', icon: 'Home', color: '#65a30d', subs: ['Cocina', 'Muebles', 'Limpieza', 'Decoración'] },
    { name: 'Moda', icon: 'Shirt', color: '#db2777', subs: ['Hombres', 'Mujeres', 'Niños', 'Calzado'] },
    { name: 'Alimentos', icon: 'ShoppingBasket', color: '#ea580c', subs: ['Básicos', 'Bebidas', 'Snacks', 'Orgánicos'] },
    { name: 'Salud', icon: 'HeartPulse', color: '#dc2626', subs: ['Farmacia', 'Cuidado personal', 'Vitaminas', 'Equipos'] },
    { name: 'Automotriz', icon: 'Car', color: '#0891b2', subs: ['Repuestos', 'Accesorios', 'Lubricantes', 'Herramientas'] },
    { name: 'Servicios', icon: 'Wrench', color: '#7c3aed', subs: ['Técnico', 'Limpieza', 'Eventos', 'Consultoría'] },
  ]
  const categoryMap: Record<string, string> = {}
  for (const c of catDefs) {
    const parent = await db.category.create({ data: { name: c.name, slug: slugify(c.name), icon: c.icon, color: c.color } })
    categoryMap[c.name] = parent.id
    for (const s of c.subs) {
      await db.category.create({ data: { name: s, slug: slugify(`${c.name}-${s}`), icon: 'Tag', color: c.color, parentId: parent.id } })
    }
  }
  console.log('✓ Categorías creadas')

  // ---------- Usuarios (con red de afiliados de 3 niveles) ----------
  // Admin
  const admin = await db.user.create({ data: { email: 'admin@dimarclub.com', name: 'Carlos Dimar', role: 'ADMIN', phone: '099111111', city: 'Guayaquil', affiliateCode: 'DIMAR-001' } })

  // Nivel raíz: Ana (sponsor admin)
  const ana = await db.user.create({ data: { email: 'ana@dimarclub.com', name: 'Ana Mendoza', role: 'AFFILIATE', phone: '099222222', city: 'Quito', sponsorId: admin.id, affiliateCode: 'ANA-002' } })
  // N1: Luis, María (sponsor Ana)
  const luis = await db.user.create({ data: { email: 'luis@dimarclub.com', name: 'Luis Torres', role: 'AFFILIATE', phone: '099333333', city: 'Cuenca', sponsorId: ana.id, affiliateCode: 'LUIS-003' } })
  const maria = await db.user.create({ data: { email: 'maria@dimarclub.com', name: 'María Vera', role: 'AFFILIATE', phone: '099444444', city: 'Guayaquil', sponsorId: ana.id, affiliateCode: 'MARI-004' } })
  // N2: Pedro (sponsor Luis), Sofía (sponsor María)
  const pedro = await db.user.create({ data: { email: 'pedro@dimarclub.com', name: 'Pedro López', role: 'CLIENT', phone: '099555555', city: 'Manta', sponsorId: luis.id, affiliateCode: 'PEDR-005' } })
  const sofia = await db.user.create({ data: { email: 'sofia@dimarclub.com', name: 'Sofía Ruiz', role: 'CLIENT', phone: '099666666', city: 'Ambato', sponsorId: maria.id, affiliateCode: 'SOFI-006' } })
  // N3: Diego (sponsor Pedro), Carmen (sponsor Sofía)
  const diego = await db.user.create({ data: { email: 'diego@dimarclub.com', name: 'Diego Paz', role: 'CLIENT', phone: '099777777', city: 'Loja', sponsorId: pedro.id, affiliateCode: 'DIEG-007' } })
  const carmen = await db.user.create({ data: { email: 'carmen@dimarclub.com', name: 'Carmen Soto', role: 'CLIENT', phone: '099888888', city: 'Portoviejo', sponsorId: sofia.id, affiliateCode: 'CARM-008' } })

  // Clientes adicionales
  const jose = await db.user.create({ data: { email: 'jose@dimarclub.com', name: 'José Quiroga', role: 'CLIENT', phone: '099000000', city: 'Guayaquil', sponsorId: ana.id, affiliateCode: 'JOSE-009' } })
  const elena = await db.user.create({ data: { email: 'elena@dimarclub.com', name: 'Elena Castro', role: 'CLIENT', phone: '099121212', city: 'Quito', sponsorId: luis.id, affiliateCode: 'ELEN-010' } })

  // Proveedores (usuarios con rol SUPPLIER)
  const sup1User = await db.user.create({ data: { email: 'ventas@tecnoexpress.com', name: 'TecnoExpress', role: 'SUPPLIER', phone: '042222333', city: 'Guayaquil', affiliateCode: 'TECN-011' } })
  const sup2User = await db.user.create({ data: { email: 'contacto@hogartotal.com', name: 'Hogar Total', role: 'SUPPLIER', phone: '043334445', city: 'Quito', affiliateCode: 'HOGA-012' } })
  const sup3User = await db.user.create({ data: { email: 'info@modafashion.com', name: 'Moda Fashion', role: 'SUPPLIER', phone: '074445556', city: 'Cuenca', affiliateCode: 'MODA-013' } })
  const sup4User = await db.user.create({ data: { email: 'pedidos@frescaysano.com', name: 'Fresca y Sano', role: 'SUPPLIER', phone: '042556667', city: 'Guayaquil', affiliateCode: 'FRES-014' } })
  const sup5User = await db.user.create({ data: { email: 'ventas@autopartesdim.com', name: 'Autopartes DIM', role: 'SUPPLIER', phone: '042667778', city: 'Daule', affiliateCode: 'AUTO-015' } })

  const sup1 = await db.supplier.create({ data: { userId: sup1User.id, companyName: 'TecnoExpress', taxId: '0991234567001', phone: '042222333', address: 'Av. 9 de Octubre', city: 'Guayaquil', category: 'Electrónica', verified: true, rating: 4.7 } })
  const sup2 = await db.supplier.create({ data: { userId: sup2User.id, companyName: 'Hogar Total', taxId: '1792345678001', phone: '043334445', address: 'Av. Amazonas', city: 'Quito', category: 'Hogar', verified: true, rating: 4.5 } })
  const sup3 = await db.supplier.create({ data: { userId: sup3User.id, companyName: 'Moda Fashion', taxId: '0803456789001', phone: '074445556', address: 'Calle Larga', city: 'Cuenca', category: 'Moda', verified: true, rating: 4.3 } })
  const sup4 = await db.supplier.create({ data: { userId: sup4User.id, companyName: 'Fresca y Sano', taxId: '0994567890001', phone: '042556667', address: 'Malecón', city: 'Guayaquil', category: 'Alimentos', verified: true, rating: 4.8 } })
  const sup5 = await db.supplier.create({ data: { userId: sup5User.id, companyName: 'Autopartes DIM', taxId: '0995678901001', phone: '042667778', address: 'Vía a Daule', city: 'Daule', category: 'Automotriz', verified: false, rating: 4.1 } })
  console.log('✓ Usuarios y red de afiliados creada')

  // ---------- Productos ----------
  const products = [
    // Electrónica - TecnoExpress
    { name: 'Smartphone Galaxy A55 128GB', cat: 'Celulares', sup: sup1.id, price: 449.99, compare: 549.99, stock: 45, sku: 'TEC-001', featured: true, desc: 'Pantalla AMOLED 6.6", 8GB RAM, cámara 50MP triple.' },
    { name: 'Laptop HP Pavilion 15 i5', cat: 'Laptops', sup: sup1.id, price: 749.00, compare: 899.00, stock: 20, sku: 'TEC-002', featured: true, desc: 'Intel Core i5 12ª gen, 16GB RAM, SSD 512GB.' },
    { name: 'Audífonos Bluetooth JBL Tune', cat: 'Audio', sup: sup1.id, price: 59.99, compare: 79.99, stock: 120, sku: 'TEC-003', featured: false, desc: 'Cancelación de ruido, 35h batería.' },
    { name: 'Cargador Rápido USB-C 65W', cat: 'Accesorios', sup: sup1.id, price: 24.99, stock: 200, sku: 'TEC-004', featured: false, desc: 'Carga rápida compatible con múltiples dispositivos.' },
    { name: 'Smartwatch Series 7', cat: 'Accesorios', sup: sup1.id, price: 199.00, compare: 249.00, stock: 35, sku: 'TEC-005', featured: true, desc: 'GPS, monitor cardíaco, resistencia al agua.' },
    // Hogar - Hogar Total
    { name: 'Olla Arrocera Digital 5L', cat: 'Cocina', sup: sup2.id, price: 65.00, compare: 85.00, stock: 60, sku: 'HOG-001', featured: true, desc: '12 funciones, vaporera incluida.' },
    { name: 'Set Sartenes Antiadherentes 7pzs', cat: 'Cocina', sup: sup2.id, price: 89.99, stock: 40, sku: 'HOG-002', featured: false, desc: 'Inducción, apto lavavajillas.' },
    { name: 'Aspiradora Robot Inteligente', cat: 'Limpieza', sup: sup2.id, price: 189.00, compare: 259.00, stock: 25, sku: 'HOG-003', featured: true, desc: 'Mapeo láser, control por app.' },
    { name: 'Lámpara LED de Pie Minimalista', cat: 'Decoración', sup: sup2.id, price: 45.00, stock: 70, sku: 'HOG-004', featured: false, desc: '3 temperaturas de color, regulable.' },
    { name: 'Mesa Comedor Roble 6 Puestos', cat: 'Muebles', sup: sup2.id, price: 349.00, compare: 449.00, stock: 12, sku: 'HOG-005', featured: true, desc: 'Madera maciza, acabado natural.' },
    // Moda - Moda Fashion
    { name: 'Camiseta Polo Hombre Pima', cat: 'Hombres', sup: sup3.id, price: 29.99, compare: 39.99, stock: 150, sku: 'MOD-001', featured: false, desc: 'Algodón pima peruano, varias tallas.' },
    { name: 'Vestido Casual Verano Mujer', cat: 'Mujeres', sup: sup3.id, price: 39.99, compare: 54.99, stock: 80, sku: 'MOD-002', featured: true, desc: 'Tejido fresco, estampado floral.' },
    { name: 'Zapatillas Deportivas Unisex', cat: 'Calzado', sup: sup3.id, price: 59.99, stock: 95, sku: 'MOD-003', featured: true, desc: 'Suela amortiguada, ultraligera.' },
    { name: 'Jeans Skinny Slim Fit', cat: 'Hombres', sup: sup3.id, price: 44.99, compare: 59.99, stock: 110, sku: 'MOD-004', featured: false, desc: 'Denim elástico, tiro medio.' },
    { name: 'Mochila Escolar Impermeable', cat: 'Niños', sup: sup3.id, price: 34.99, stock: 130, sku: 'MOD-005', featured: false, desc: 'Compartimento laptop, reflejante.' },
    // Alimentos - Fresca y Sano
    { name: 'Aceite de Oliva Extra Virgen 1L', cat: 'Básicos', sup: sup4.id, price: 12.50, compare: 16.00, stock: 300, sku: 'FRE-001', featured: true, desc: 'Prensado en frío, origen español.' },
    { name: 'Café Gourmet Molido 500g', cat: 'Bebidas', sup: sup4.id, price: 9.99, stock: 250, sku: 'FRE-002', featured: false, desc: 'Tueste medio, altura ecuatoriana.' },
    { name: 'Snack Mix Frutos Secos 1kg', cat: 'Snacks', sup: sup4.id, price: 15.99, compare: 21.00, stock: 180, sku: 'FRE-003', featured: true, desc: 'Almendras, nuez, maní, uva pasa.' },
    { name: 'Miel Orgánica de Abeja 750ml', cat: 'Orgánicos', sup: sup4.id, price: 11.50, stock: 140, sku: 'FRE-004', featured: false, desc: '100% pura, sin azúcar añadida.' },
    { name: 'Quinoa Premium 2kg', cat: 'Básicos', sup: sup4.id, price: 8.99, stock: 220, sku: 'FRE-005', featured: false, desc: 'Grano entero, alto en proteína.' },
    // Automotriz - Autopartes DIM
    { name: 'Llanta A/T 265/65 R17', cat: 'Repuestos', sup: sup5.id, price: 129.00, compare: 159.00, stock: 50, sku: 'AUT-001', featured: true, desc: 'Todo terreno, 10 capas.' },
    { name: 'Batería 12V 75Ah', cat: 'Repuestos', sup: sup5.id, price: 99.00, stock: 40, sku: 'AUT-002', featured: false, desc: 'Bajo mantenimiento, 18 meses garantía.' },
    { name: 'Aceite Sintético 5W30 5L', cat: 'Lubricantes', sup: sup5.id, price: 45.00, compare: 59.00, stock: 90, sku: 'AUT-003', featured: true, desc: 'Motor gasolina, cambio extendido.' },
    { name: 'Kit Pastillas de Freno Delanteras', cat: 'Repuestos', sup: sup5.id, price: 38.50, stock: 75, sku: 'AUT-004', featured: false, desc: 'Cerámicas, bajo polvo.' },
    { name: 'Cargador de Auto USB Dual 36W', cat: 'Accesorios', sup: sup5.id, price: 14.99, stock: 200, sku: 'AUT-005', featured: false, desc: 'Carga rápida, voltímetro integrado.' },
  ]

  const imgSeeds = ['ecommerce', 'product', 'shopping', 'gadget', 'retail', 'store']
  for (const p of products) {
    const cat = await db.category.findFirst({ where: { name: p.cat } })
    const imgIdx = imgSeeds[Math.floor(Math.random() * imgSeeds.length)]
    await db.product.create({
      data: {
        name: p.name,
        slug: slugify(`${p.name}-${p.sku}`),
        description: p.desc,
        longDescription: p.desc + ' Producto de calidad garantizado por Dimarclub con entrega a domicilio gratis.',
        price: p.price,
        compareAtPrice: p.compare ?? null,
        stock: p.stock,
        sku: p.sku,
        imageUrl: `https://picsum.photos/seed/${p.sku}/600/600`,
        tags: JSON.stringify([imgIdx]),
        categoryId: cat!.id,
        supplierId: p.sup,
        rating: 4 + Math.random(),
        reviewCount: Math.floor(Math.random() * 80) + 5,
        featured: p.featured ?? false,
        status: 'ACTIVE',
      },
    })
  }
  console.log('✓ Productos creados')

  // ---------- Socios (capital) ----------
  const partnerUser1 = await db.user.create({ data: { email: 'socio1@dimarclub.com', name: 'Roberto Aguilar', role: 'PARTNER', phone: '098111222', city: 'Guayaquil', sponsorId: ana.id, affiliateCode: 'ROBE-021' } })
  const partnerUser2 = await db.user.create({ data: { email: 'socio2@dimarclub.com', name: 'Patricia Salazar', role: 'PARTNER', phone: '098222333', city: 'Quito', sponsorId: maria.id, affiliateCode: 'PATR-022' } })
  const part1 = await db.partner.create({ data: { userId: partnerUser1.id, totalContribution: 1500, totalReturns: 135, status: 'ACTIVE' } })
  await db.partnerContribution.create({ data: { partnerId: part1.id, amount: 500, returnRate: 3, monthlyReturn: 15, status: 'ACTIVE', date: new Date(Date.now() - 90 * 86400000) } })
  await db.partnerContribution.create({ data: { partnerId: part1.id, amount: 1000, returnRate: 3, monthlyReturn: 30, status: 'ACTIVE', date: new Date(Date.now() - 45 * 86400000) } })
  const part2 = await db.partner.create({ data: { userId: partnerUser2.id, totalContribution: 800, totalReturns: 48, status: 'ACTIVE' } })
  await db.partnerContribution.create({ data: { partnerId: part2.id, amount: 800, returnRate: 3, monthlyReturn: 24, status: 'ACTIVE', date: new Date(Date.now() - 60 * 86400000) } })
  console.log('✓ Socios creados')

  // ---------- Mensajeros ----------
  const courierDefs = [
    { name: 'Mario Chávez', email: 'mario.courier@dimarclub.com', phone: '097111222', vehicle: 'MOTORCYCLE', plate: 'MOT-123A', zone: 'Norte Guayaquil' },
    { name: 'Lucía Ramírez', email: 'lucia.courier@dimarclub.com', phone: '097222333', vehicle: 'BICYCLE', zone: 'Centro Quito' },
    { name: 'Javier Méndez', email: 'javier.courier@dimarclub.com', phone: '097333444', vehicle: 'PICKUP', plate: 'PIC-456B', zone: 'Cuenca' },
    { name: 'Andrés Vallejo', email: 'andres.courier@dimarclub.com', phone: '097444555', vehicle: 'TRUCK', plate: 'TRK-789C', zone: 'Costa' },
    { name: 'Fernando Pazmiño', email: 'fernando.courier@dimarclub.com', phone: '097555666', vehicle: 'TAXI', plate: 'TAX-012D', zone: 'Guayaquil' },
  ]
  for (const c of courierDefs) {
    const u = await db.user.create({ data: { email: c.email, name: c.name, role: 'COURIER', phone: c.phone, city: c.zone, sponsorId: ana.id, affiliateCode: 'COUR-' + c.plate } })
    await db.courier.create({ data: { userId: u.id, vehicleType: c.vehicle, vehicleModel: c.vehicle, licensePlate: c.plate ?? null, licenseNumber: 'LIC-' + c.plate, available: Math.random() > 0.4, rating: 4 + Math.random(), zone: c.zone } })
  }
  console.log('✓ Mensajeros creados')

  // ---------- Pedidos (con comisiones) ----------
  const allProducts = await db.product.findMany({ take: 10 })
  const buyers = [ana, luis, maria, jose, elena, pedro]
  let orderCount = 0
  for (let i = 0; i < 12; i++) {
    const buyer = buyers[i % buyers.length]
    const items = [allProducts[i % allProducts.length], allProducts[(i + 3) % allProducts.length]]
    const subtotal = items.reduce((s, it) => s + it.price * (1 + (i % 3)), 0)
    const commission = +(subtotal * 0.08).toFixed(2)
    const total = +(subtotal).toFixed(2)
    const status = ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PENDING', 'DELIVERED'][i % 5]
    const daysAgo = i * 2
    const order = await db.order.create({
      data: {
        orderNumber: 'DM-' + String(1000 + i),
        userId: buyer.id,
        subtotal,
        commission,
        total,
        status,
        paymentStatus: status === 'CANCELLED' ? 'REFUNDED' : 'PAID',
        paymentMethod: i % 2 === 0 ? 'TARJETA' : 'EFECTIVO',
        shippingAddress: 'Calle Principal ' + (i + 1) + ' y Secundaria',
        city: buyer.city,
        createdAt: new Date(Date.now() - daysAgo * 86400000),
        items: {
          create: items.map((it) => ({ productId: it.id, quantity: 1 + (i % 3), price: it.price })),
        },
      },
    })

    // Comisiones: N0 al comprador (si es afiliado), y a su cadena de sponsors hasta 3 niveles
    if (buyer.role === 'AFFILIATE' || buyer.role === 'CLIENT') {
      // N0 - venta propia
      await db.commission.create({ data: { userId: buyer.id, orderId: order.id, sourceUserId: buyer.id, amount: +(subtotal * 0.03).toFixed(2), level: 0, rate: 3, status: 'PAID' } })
      // Cadena de sponsors
      let current = buyer
      for (let lvl = 1; lvl <= 3; lvl++) {
        if (!current.sponsorId) break
        const sponsor = await db.user.findUnique({ where: { id: current.sponsorId } })
        if (!sponsor) break
        await db.commission.create({ data: { userId: sponsor.id, orderId: order.id, sourceUserId: buyer.id, amount: +(subtotal * 0.02).toFixed(2), level: lvl, rate: 2, status: 'PAID' } })
        current = sponsor
      }
    }
    orderCount++
  }
  console.log(`✓ ${orderCount} pedidos y comisiones creados`)

  // ---------- Publicidad ----------
  await db.advertisement.create({ data: { title: 'Gran Liquidación Electrónica', imageUrl: 'https://picsum.photos/seed/ad1/1200/300', targetUrl: '#', placement: 'HEADER', supplierId: sup1.id, startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000), status: 'ACTIVE', price: 250 } })
  await db.advertisement.create({ data: { title: 'Hogar Total - Renueva tu Cocina', imageUrl: 'https://picsum.photos/seed/ad2/400/600', targetUrl: '#', placement: 'SIDEBAR_LEFT', supplierId: sup2.id, startDate: new Date(), endDate: new Date(Date.now() + 20 * 86400000), status: 'ACTIVE', price: 120 } })
  await db.advertisement.create({ data: { title: 'Moda Fashion Colección Verano', imageUrl: 'https://picsum.photos/seed/ad3/400/600', targetUrl: '#', placement: 'SIDEBAR_RIGHT', supplierId: sup3.id, startDate: new Date(), endDate: new Date(Date.now() + 15 * 86400000), status: 'ACTIVE', price: 120 } })
  await db.advertisement.create({ data: { title: 'Fresca y Sano - Orgánicos', imageUrl: 'https://picsum.photos/seed/ad4/800/200', targetUrl: '#', placement: 'FOOTER', supplierId: sup4.id, startDate: new Date(), endDate: new Date(Date.now() + 10 * 86400000), status: 'ACTIVE', price: 90 } })
  console.log('✓ Anuncios creados')

  // ---------- CRM ----------
  const crmDefs = [
    { name: 'Distribuidora El Sol', email: 'compras@elsol.com', company: 'El Sol Cía.', stage: 'PROPOSAL', value: 5000, source: 'MARKETPLACE' },
    { name: 'Farmacia SaludPlus', email: 'gerencia@saludplus.com', company: 'SaludPlus', stage: 'QUALIFIED', value: 3200, source: 'WEB' },
    { name: 'Taller Mecánico Pérez', email: 'perez@taller.com', company: 'Taller Pérez', stage: 'NEGOTIATION', value: 1800, source: 'REFERRAL' },
    { name: 'Boutique Linda', email: 'linda@boutique.com', company: 'Boutique Linda', stage: 'WON', value: 2500, source: 'MARKETING' },
    { name: 'Comercial El Trebol', email: 'trebol@comercial.com', company: 'El Trébol', stage: 'LEAD', value: 0, source: 'WEB' },
    { name: 'Restaurante La Costa', email: 'lacosta@rest.com', company: 'La Costa', stage: 'QUALIFIED', value: 1500, source: 'REFERRAL' },
    { name: 'Ferretería Industrial', email: 'ventas@ferreind.com', company: 'Ferre Industrial', stage: 'LOST', value: 4000, source: 'MARKETING' },
    { name: 'Floristería Gardenias', email: 'gardenias@flor.com', company: 'Gardenias', stage: 'PROPOSAL', value: 900, source: 'WEB' },
  ]
  for (const c of crmDefs) {
    await db.crmContact.create({ data: { name: c.name, email: c.email, company: c.company, stage: c.stage, value: c.value, source: c.source, phone: '09' + Math.floor(1000000 + Math.random() * 8999999), notes: 'Contacto potencial para proveedores.' } })
  }
  console.log('✓ Contactos CRM creados')

  // ---------- Email marketing ----------
  const subs = [
    { email: 'cliente1@gmail.com', name: 'Cliente Uno', segment: 'CLIENTS' },
    { email: 'cliente2@gmail.com', name: 'Cliente Dos', segment: 'CLIENTS' },
    { email: 'afiliado1@gmail.com', name: 'Afiliado Uno', segment: 'AFFILIATES' },
    { email: 'afiliado2@gmail.com', name: 'Afiliado Dos', segment: 'AFFILIATES' },
    { email: 'proveedor1@gmail.com', name: 'Prov Uno', segment: 'SUPPLIERS' },
    { email: 'socio1@gmail.com', name: 'Socio Uno', segment: 'PARTNERS' },
  ]
  for (const s of subs) await db.emailSubscriber.create({ data: s })
  await db.emailCampaign.create({ data: { name: 'Bienvenida Nuevos Miembros', subject: '¡Bienvenido a Dimarclub!', content: 'Hola {nombre}, te damos la bienvenida a la comunidad Dimarclub...', template: 'NEW_MEMBER', audience: 'CLIENTS', status: 'SENT', sentAt: new Date(Date.now() - 5 * 86400000), recipientCount: 142, openCount: 98, clickCount: 34 } })
  await db.emailCampaign.create({ data: { name: 'Promo Electrónica Mes', subject: '🔥 Hasta 30% en Electrónica', content: 'Aprovecha nuestras ofertas en electrónica esta semana...', template: 'PROMOTION', audience: 'ALL', status: 'SENT', sentAt: new Date(Date.now() - 2 * 86400000), recipientCount: 540, openCount: 312, clickCount: 89 } })
  await db.emailCampaign.create({ data: { name: 'Comisiones Octubre', subject: 'Tus comisiones del mes', content: 'Has generado comisiones por recomendar Dimarclub...', template: 'COMMISSION', audience: 'AFFILIATES', status: 'SCHEDULED', scheduledAt: new Date(Date.now() + 3 * 86400000), recipientCount: 0 } })
  await db.emailCampaign.create({ data: { name: 'Newsletter Mensual', subject: 'Novedades Dimarclub - Octubre', content: 'Las últimas novedades de tu marketplace...', template: 'NEWSLETTER', audience: 'ALL', status: 'DRAFT', recipientCount: 0 } })
  console.log('✓ Campañas de email creadas')

  // ---------- Solicitudes ----------
  await db.application.create({ data: { type: 'SUPPLIER', name: 'TechStore Guayaquil', email: 'ventas@techstore.com', phone: '049998887', details: JSON.stringify({ category: 'Electrónica', city: 'Guayaquil' }) } })
  await db.application.create({ data: { type: 'COURIER', name: 'Pedro Veloz', email: 'pedro.veloz@gmail.com', phone: '096555444', details: JSON.stringify({ vehicleType: 'MOTORCYCLE', zone: 'Sur Guayaquil' }) } })
  await db.application.create({ data: { type: 'PARTNER', name: 'Inversionista Anónimo', email: 'inv@capital.com', phone: '098777666', details: JSON.stringify({ amount: 5000 }) } })

  // Crear carritos vacíos para clientes
  for (const u of [ana, luis, jose]) {
    await db.cart.create({ data: { userId: u.id } })
  }

  // Hashear todas las contraseñas (el default del schema es texto plano "dimar123")
  console.log('🔒 Hasheando contraseñas...')
  await db.user.updateMany({
    where: { password: 'dimar123' },
    data: { password: hashedPassword },
  })

  console.log('🎉 Seed completado.')
  console.log('   Credenciales de acceso: email + contraseña "dimar123"')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
