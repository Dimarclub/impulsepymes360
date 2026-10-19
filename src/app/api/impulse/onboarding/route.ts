import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Onboarding: crea usuario + proveedor + suscripción + Web Express + QR
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    // Datos del usuario
    name, email, password, phone, mobile, city,
    // Datos del negocio
    companyName, taxId, address, category, description, logoUrl,
    // Plan
    planId, affiliateRate,
    // Web Express
    heroTitle, heroSubtitle, heroImageUrl, aboutText, contactEmail, contactPhone, contactWhatsapp, contactAddress, template, primaryColor, accentColor,
    // Espacios PubliBags
    selectedSpaceIds,
  } = body

  // Validaciones
  if (!name || !email || !password || !companyName || !planId) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 409 })
  }
  const plan = await db.plan.findUnique({ where: { id: planId } })
  if (!plan) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
  }
  // Validar rate de afiliado según plan
  if (affiliateRate > plan.maxAffiliateRate) {
    return NextResponse.json({ error: `El plan ${plan.displayName} permite máximo ${plan.maxAffiliateRate}% de comisión a afiliados` }, { status: 400 })
  }

  // 1. Crear usuario (rol SUPPLIER)
  const slugBase = slugify(companyName)
  const user = await db.user.create({
    data: {
      email, name, password: await bcrypt.hash(password, 10),
      role: 'SUPPLIER', phone: mobile || phone, city,
    },
  })

  // 2. Crear proveedor
  const websiteSlug = await generateUniqueSlug(slugBase)
  const provider = await db.provider.create({
    data: {
      userId: user.id, companyName, taxId, phone, mobile, address, city, category, description, logoUrl,
      websiteSlug, affiliateRate: Math.min(affiliateRate, plan.maxAffiliateRate),
      status: 'ACTIVE', verified: false,
    },
  })

  // 3. Crear suscripción
  await db.subscription.create({
    data: {
      providerId: provider.id, planId, status: 'ACTIVE', amount: plan.price,
      paymentMethod: 'TARJETA', nextBillingDate: new Date(Date.now() + 30 * 86400000),
    },
  })

  // 4. Crear sitio Web Express
  await db.websiteExpress.create({
    data: {
      providerId: provider.id, slug: websiteSlug,
      template: template || 'modern', primaryColor: primaryColor || '#0d9488', accentColor: accentColor || '#d97706',
      heroTitle: heroTitle || `${companyName} — ${category || 'Bienvenidos'}`,
      heroSubtitle: heroSubtitle || description || '',
      heroImageUrl: heroImageUrl || null,
      aboutText: aboutText || description || null,
      contactEmail: contactEmail || email,
      contactPhone: contactPhone || phone,
      contactWhatsapp: contactWhatsapp || mobile,
      contactAddress: contactAddress || address,
      businessHours: JSON.stringify({ mon: '9-18', tue: '9-18', wed: '9-18', thu: '9-18', fri: '9-18', sat: '9-14', sun: 'closed' }),
      socialLinks: null,
      metaTitle: `${companyName} — ${category || ''}`,
      metaDescription: description || `${companyName} en ${city || 'Ecuador'}`,
      published: true,
    },
  })

  // 5. Generar QR dinámico
  const qrCode = await db.qRCode.create({
    data: {
      providerId: provider.id,
      code: (companyName.slice(0, 4).toUpperCase()) + String(Math.floor(Math.random() * 9000) + 1000),
      targetUrl: `/w/${websiteSlug}`,
      type: 'WEBSITE',
    },
  })

  // 6. Asignar espacios PubliBags seleccionados
  if (selectedSpaceIds && Array.isArray(selectedSpaceIds)) {
    if (selectedSpaceIds.length > plan.maxAdSpaces) {
      return NextResponse.json({ error: `El plan ${plan.displayName} permite máximo ${plan.maxAdSpaces} espacios` }, { status: 400 })
    }
    for (const spaceId of selectedSpaceIds) {
      await db.adSpace.update({
        where: { id: spaceId, status: 'AVAILABLE' },
        data: { providerId: provider.id, status: 'SOLD', soldAt: new Date(), qrCodeId: qrCode.id },
      })
    }
  }

  return NextResponse.json({
    providerId: provider.id,
    websiteSlug,
    qrCode: qrCode.code,
    websiteUrl: `/w/${websiteSlug}`,
    message: 'Onboarding completado. Se han creado tus perfiles en todos los elementos de ImpulsePymes360.',
  }, { status: 201 })
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = base
  let counter = 1
  while (await db.provider.findFirst({ where: { websiteSlug: slug } })) {
    slug = `${base}-${counter++}`
  }
  return slug
}
