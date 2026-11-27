import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

type BranchInput = {
  name: string
  city: string
  sector: string | null
  address: string
  phone: string | null
  whatsapp: string | null
  isMain: boolean
}

class RegistrationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'RegistrationError'
  }
}

const text = (value: unknown, maxLength = 255): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function parseBranches(
  value: unknown,
  city: string,
  address: string,
  phone: string,
): BranchInput[] {
  if (value !== undefined && !Array.isArray(value)) {
    throw new RegistrationError('El formato de sucursales no es válido', 400)
  }

  const input = Array.isArray(value) ? value : []
  if (input.length > 5) {
    throw new RegistrationError('Se permite un máximo de 5 sucursales', 400)
  }

  const branches = input.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new RegistrationError(`La sucursal ${index + 1} no es válida`, 400)
    }
    const branch = item as Record<string, unknown>
    return {
      name: text(branch.name, 100) || (index === 0 ? 'Matriz' : `Sucursal ${index + 1}`),
      city: text(branch.city, 100) || city,
      sector: text(branch.sector, 100) || null,
      address: text(branch.address, 255) || address || 'Por completar',
      phone: text(branch.phone, 40) || phone || null,
      whatsapp: text(branch.whatsapp, 40) || null,
      isMain: branch.isMain === true,
    }
  })

  if (branches.length === 0 && city) {
    branches.push({
      name: 'Matriz',
      city,
      sector: null,
      address: address || 'Por completar',
      phone: phone || null,
      whatsapp: null,
      isMain: true,
    })
  }

  if (branches.some((branch) => !branch.city || !branch.address)) {
    throw new RegistrationError('Cada sucursal debe incluir ciudad y dirección', 400)
  }

  if (branches.length > 0) {
    const requestedMainIndex = branches.findIndex((branch) => branch.isMain)
    const mainIndex = requestedMainIndex >= 0 ? requestedMainIndex : 0
    branches.forEach((branch, index) => {
      branch.isMain = index === mainIndex
    })
  }

  return branches
}

function parseStringList(value: unknown, field: string, limit: number): string[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new RegistrationError(`El campo ${field} debe ser una lista de textos`, 400)
  }
  return Array.from(
    new Set(
      value
        .map((entry) => text(entry, 160))
        .filter(Boolean),
    ),
  ).slice(0, limit)
}

function prismaCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  return typeof error.code === 'string' ? error.code : undefined
}

// POST /api/auth/register
// Punto único de registro público para clientes, afiliados y proveedores.
// Si el rol es SUPPLIER, se crean en una sola transacción los registros que
// conectan marketplace/Dima (Supplier) con CMS/directorio (Provider).
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'El cuerpo de la solicitud no es válido' }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const name = text(body.name, 100)
  const email = text(body.email, 255).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const phone = text(body.phone || body.mobile, 40)
  const mobile = text(body.mobile || body.phone, 40)
  const city = text(body.city, 100)
  const address = text(body.address, 255)
  const requestedRole = text(body.role, 30).toUpperCase() || 'CLIENT'
  const allowedRoles = ['CLIENT', 'AFFILIATE', 'SUPPLIER', 'COURIER', 'PARTNER']

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'El email no tiene un formato válido' }, { status: 400 })
  }
  if (password.length < 6 || password.length > 128) {
    return NextResponse.json({ error: 'La contraseña debe tener entre 6 y 128 caracteres' }, { status: 400 })
  }
  if (!allowedRoles.includes(requestedRole)) {
    return NextResponse.json({ error: 'El tipo de cuenta solicitado no es válido' }, { status: 400 })
  }

  const isSupplier = requestedRole === 'SUPPLIER'
  const isCourier = requestedRole === 'COURIER'
  const isPartner = requestedRole === 'PARTNER'
  const companyName = text(body.companyName, 150)
  const category = text(body.category, 100)
  const description = text(body.description, 2000)
  const taxId = text(body.taxId, 40)
  const logoUrl = text(body.logoUrl, 1000)
  const planId = text(body.planId, 100) || null

  if (isSupplier && (!companyName || !city)) {
    return NextResponse.json(
      { error: 'Para registrar un proveedor, el nombre comercial y la ciudad son obligatorios' },
      { status: 400 },
    )
  }
  if (planId && !isSupplier) {
    return NextResponse.json({ error: 'Solo una cuenta de proveedor puede contratar este plan' }, { status: 400 })
  }

  let selectedSpaceIds: string[]
  let branches: BranchInput[]
  let phrases: string[]
  let categories: string[]
  try {
    selectedSpaceIds = parseStringList(body.selectedSpaceIds, 'selectedSpaceIds', 100)
    branches = isSupplier ? parseBranches(body.branches, city, address, phone) : []
    phrases = isSupplier ? parseStringList(body.phrases, 'phrases', 40) : []
    categories = parseStringList(body.categories, 'categories', 30)
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'El formato de registro no es válido' }, { status: 400 })
  }
  const sponsorCode = text(body.sponsorCode, 100)
  const requestedAffiliateRate =
    body.affiliateRate === undefined || body.affiliateRate === null
      ? null
      : Number(body.affiliateRate)

  if (
    requestedAffiliateRate !== null &&
    (!Number.isFinite(requestedAffiliateRate) || requestedAffiliateRate < 0)
  ) {
    return NextResponse.json({ error: 'La tasa de afiliación debe ser un número no negativo' }, { status: 400 })
  }
  if (selectedSpaceIds.length > 0 && !planId) {
    return NextResponse.json({ error: 'Se requiere un plan para reservar espacios PubliBags' }, { status: 400 })
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({ where: { email } })
      if (existingUser) {
        throw new RegistrationError('Este email ya está registrado', 409)
      }

      const plan = planId ? await tx.plan.findUnique({ where: { id: planId } }) : null
      if (planId && !plan) {
        throw new RegistrationError('Plan no encontrado', 404)
      }
      if (plan && selectedSpaceIds.length > plan.maxAdSpaces) {
        throw new RegistrationError(
          `El plan ${plan.displayName} permite máximo ${plan.maxAdSpaces} espacios`,
          400,
        )
      }
      if (plan && requestedAffiliateRate !== null && requestedAffiliateRate > plan.maxAffiliateRate) {
        throw new RegistrationError(
          `El plan ${plan.displayName} permite máximo ${plan.maxAffiliateRate}% de comisión`,
          400,
        )
      }

      let sponsorId: string | null = null
      if (sponsorCode) {
        const sponsor = await tx.user.findFirst({ where: { affiliateCode: sponsorCode } })
        sponsorId = sponsor?.id ?? null
      }

      const affiliatePrefix = name.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() || 'USER'
      let affiliateCode = ''
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = `${affiliatePrefix}-${randomBytes(4).toString('hex').toUpperCase()}`
        const duplicate = await tx.user.findFirst({ where: { affiliateCode: candidate } })
        if (!duplicate) {
          affiliateCode = candidate
          break
        }
      }
      if (!affiliateCode) {
        throw new RegistrationError('No se pudo generar el código de afiliado; intenta nuevamente', 503)
      }

      const user = await tx.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, 12),
          role: requestedRole,
          phone: phone || null,
          city: city || null,
          address: address || null,
          sponsorId,
          affiliateCode,
        },
      })

      let supplierId: string | null = null
      let providerId: string | null = null
      let websiteSlug: string | null = null
      let qrCode: string | null = null
      let subscriptionStatus: string | null = null

      if (isSupplier) {
        const supplier = await tx.supplier.create({
          data: {
            userId: user.id,
            companyName,
            taxId: taxId || null,
            phone: phone || null,
            address: address || null,
            city,
            category: category || null,
            verified: false,
          },
        })
        supplierId = supplier.id

        for (const branch of branches) {
          await tx.supplierBranch.create({
            data: {
              supplierId: supplier.id,
              name: branch.name,
              city: branch.city,
              sector: branch.sector,
              address: branch.address,
              phone: branch.phone,
              whatsapp: branch.whatsapp,
              isMain: branch.isMain,
              isActive: true,
            },
          })
        }

        const maxPhrases = Math.min(40, plan?.dimaPhrases ?? 5)
        for (const phrase of phrases.slice(0, maxPhrases)) {
          await tx.searchPhrase.create({
            data: {
              supplierId: supplier.id,
              phrase: phrase.toLowerCase(),
              category: category || null,
              isPremium: false,
              status: 'ACTIVE',
              monthlyPrice: 0,
              paidUntil: null,
            },
          })
        }

        const slugBase = slugify(companyName) || 'proveedor'
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const candidate = `${slugBase}-${randomBytes(3).toString('hex')}`
          const duplicate = await tx.provider.findUnique({ where: { websiteSlug: candidate } })
          if (!duplicate) {
            websiteSlug = candidate
            break
          }
        }
        if (!websiteSlug) {
          throw new RegistrationError('No se pudo generar la URL del sitio; intenta nuevamente', 503)
        }

        const affiliateRate = plan
          ? requestedAffiliateRate ?? Math.min(2, plan.maxAffiliateRate)
          : requestedAffiliateRate ?? 0
        const provider = await tx.provider.create({
          data: {
            userId: user.id,
            companyName,
            taxId: taxId || null,
            phone: phone || null,
            mobile: mobile || null,
            address: address || null,
            city,
            category: category || null,
            description: description || null,
            logoUrl: logoUrl || null,
            websiteSlug,
            affiliateRate,
            status: 'ACTIVE',
            verified: false,
          },
        })
        providerId = provider.id

        await tx.directoryEntry.create({
          data: {
            providerId: provider.id,
            category: category || 'Sin categoría',
            tags: categories.length > 0 ? JSON.stringify(categories) : null,
            shortDesc: description || null,
            status: 'PENDING',
          },
        })

        await tx.websiteExpress.create({
          data: {
            providerId: provider.id,
            slug: websiteSlug,
            template: ['classic', 'modern', 'minimal', 'vibrant'].includes(text(body.template, 30))
              ? text(body.template, 30)
              : 'modern',
            primaryColor: /^#[0-9a-f]{6}$/i.test(text(body.primaryColor, 7))
              ? text(body.primaryColor, 7)
              : '#0d9488',
            accentColor: /^#[0-9a-f]{6}$/i.test(text(body.accentColor, 7))
              ? text(body.accentColor, 7)
              : '#d97706',
            heroTitle: text(body.heroTitle, 200) || `${companyName} — ${category || 'Bienvenidos'}`,
            heroSubtitle: text(body.heroSubtitle, 500) || description || '',
            heroImageUrl: text(body.heroImageUrl, 1000) || null,
            heroVideoUrl: text(body.heroVideoUrl, 1000) || null,
            aboutText: text(body.aboutText, 5000) || description || null,
            contactEmail: text(body.contactEmail, 255) || email,
            contactPhone: text(body.contactPhone, 40) || phone || null,
            contactWhatsapp: text(body.contactWhatsapp, 40) || mobile || null,
            contactAddress: text(body.contactAddress, 255) || address || null,
            businessHours: JSON.stringify({
              mon: '9-18', tue: '9-18', wed: '9-18', thu: '9-18',
              fri: '9-18', sat: '9-14', sun: 'closed',
            }),
            socialLinks: null,
            metaTitle: `${companyName} — ${category || 'Proveedor'}`,
            metaDescription: description || `${companyName} en ${city}`,
            // La publicación queda a cargo del proveedor/admin desde el CMS.
            published: false,
          },
        })

        const createQrCode = async () => {
          const prefix = companyName.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() || 'DIMA'
          for (let attempt = 0; attempt < 8; attempt += 1) {
            const code = `${prefix}${randomBytes(4).toString('hex').toUpperCase()}`
            const duplicate = await tx.qRCode.findUnique({ where: { code } })
            if (!duplicate) {
              return tx.qRCode.create({
                data: {
                  providerId: provider.id,
                  code,
                  targetUrl: `/w/${websiteSlug}`,
                  type: 'WEBSITE',
                },
              })
            }
          }
          throw new RegistrationError('No se pudo generar el código QR; intenta nuevamente', 503)
        }

        const mainQr = await createQrCode()
        qrCode = mainQr.code

        if (selectedSpaceIds.length > 0 && plan) {
          for (const spaceId of selectedSpaceIds) {
            const spaceQr = await createQrCode()
            const reserved = await tx.adSpace.updateMany({
              where: { id: spaceId, status: 'AVAILABLE' },
              data: {
                providerId: provider.id,
                buyerId: user.id,
                buyerName: name,
                status: 'RESERVED',
                reservedAt: new Date(),
                qrCodeId: spaceQr.id,
              },
            })
            if (reserved.count !== 1) {
              throw new RegistrationError(`El espacio ${spaceId} ya no está disponible`, 409)
            }
          }
        }

        if (plan) {
          subscriptionStatus = plan.price > 0 ? 'PENDING' : 'ACTIVE'
          await tx.subscription.create({
            data: {
              providerId: provider.id,
              planId: plan.id,
              status: subscriptionStatus,
              amount: plan.price,
              paymentMethod: null,
              nextBillingDate: null,
            },
          })
        }
      }

      if (isCourier) {
        await tx.courier.create({
          data: {
            userId: user.id,
            vehicleType: text(body.vehicleType, 40) || 'MOTORCYCLE',
            zone: text(body.zone, 100) || null,
            available: true,
          },
        })
      }

      if (isPartner) {
        const requestedAmount = Number(body.contributionAmount)
        const amount = Number.isFinite(requestedAmount) && requestedAmount > 0 ? requestedAmount : 300
        const monthly = +(amount * 0.03).toFixed(2)
        await tx.partner.create({
          data: {
            userId: user.id,
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

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        affiliateCode: user.affiliateCode,
        supplierId,
        providerId,
        websiteSlug,
        qrCode,
        websiteUrl: websiteSlug ? `/w/${websiteSlug}` : null,
        subscriptionStatus,
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (prismaCode(error) === 'P2002') {
      return NextResponse.json(
        { error: 'El email o uno de los códigos generados ya está en uso. Intenta nuevamente.' },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: 'No se pudo completar el registro' }, { status: 500 })
  }
}
