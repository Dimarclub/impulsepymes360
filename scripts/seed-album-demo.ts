// Seed: crea proveedores demo + directory entries + stickers a distintos
// niveles de plan para que el álbum tenga contenido.
//
// Run: bun /home/z/my-project/scripts/seed-album-demo.ts
import { db } from '../src/lib/db'
import {
  getPlanConfig,
  generateStickerCode,
  generateShortQrCode,
} from '../src/lib/album-config'

interface DemoProvider {
  userId: string
  companyName: string
  category: string
  city: string
  address: string
  phone: string
  logoUrl: string
  websiteSlug: string
  shortDesc: string
  planLevel: number
}

const DEMOS: DemoProvider[] = [
  {
    userId: 'cmvdz74xa002bq1z2kqjdtkm9', // Hogar Total (SUPPLIER)
    companyName: 'Hogar Total',
    category: 'Hogar y Muebles',
    city: 'Guayaquil',
    address: 'Av. Quito 1234 y Vélez',
    phone: '042345678',
    logoUrl: 'https://picsum.photos/seed/hogartotal-logo/300/300',
    websiteSlug: 'hogar-total',
    shortDesc: 'Electrodomésticos, muebles y todo para tu hogar.',
    planLevel: 2,
  },
  {
    userId: 'cmvdz74xb002cq1z2hbs8ayik', // Moda Fashion (SUPPLIER)
    companyName: 'Moda Fashion',
    category: 'Moda y Accesorios',
    city: 'Quito',
    address: 'Av. Amazonas N34-451',
    phone: '022456789',
    logoUrl: 'https://picsum.photos/seed/modafashion-logo/300/300',
    websiteSlug: 'moda-fashion',
    shortDesc: 'Ropa, calzado y accesorios de temporada para toda la familia.',
    planLevel: 3,
  },
  {
    userId: 'cmvdz74xb002dq1z2db388foj', // Fresca y Sano (SUPPLIER)
    companyName: 'Fresca y Sano',
    category: 'Alimentos y Bebidas',
    city: 'Cuenca',
    address: 'Calle Larga 8-32',
    phone: '072845612',
    logoUrl: 'https://picsum.photos/seed/frescaysano-logo/300/300',
    websiteSlug: 'fresca-y-sano',
    shortDesc: 'Alimentos orgánicos y productos frescos de temporada.',
    planLevel: 2,
  },
  {
    userId: 'cmvdz74xc002eq1z2i3yykkbi', // Autopartes DIM (SUPPLIER)
    companyName: 'Autopartes DIM',
    category: 'Automotor',
    city: 'Guayaquil',
    address: 'Av. de las Américas y Luque',
    phone: '042345999',
    logoUrl: 'https://picsum.photos/seed/autopartesdim-logo/300/300',
    websiteSlug: 'autopartes-dim',
    shortDesc: 'Repuestos y accesorios para vehículos de todas las marcas.',
    planLevel: 4,
  },
  {
    userId: 'cmvjmn1p10000qn8isz7txs02', // Reciclarte (SUPPLIER)
    companyName: 'Reciclarte',
    category: 'Arte y Manualidades',
    city: 'Quito',
    address: 'Av. Eloy Alfaro y Gaspar de Villarroel',
    phone: '022567890',
    logoUrl: 'https://picsum.photos/seed/reciclarte-logo/300/300',
    websiteSlug: 'reciclarte',
    shortDesc: 'Arte y diseño con material reciclado. Bisutería y decoración única.',
    planLevel: 5,
  },
  {
    userId: 'cmvjmn1qb001mqn8izy9xzuvd', // Auki Chocolate (SUPPLIER)
    companyName: 'Auki Chocolate',
    category: 'Alimentos y Bebidas',
    city: 'Guayaquil',
    address: 'Cdla. Alborada Mz. 12 V. 4',
    phone: '042345111',
    logoUrl: 'https://picsum.photos/seed/aukichocolate-logo/300/300',
    websiteSlug: 'auki-chocolate',
    shortDesc: 'Chocolate artesanal ecuatoriano, 100% cacao nacional.',
    planLevel: 6,
  },
  {
    userId: 'cmvjmn1q30019qn8i5raguzu6', // Comprovit (SUPPLIER)
    companyName: 'Comprovit',
    category: 'Salud y Bienestar',
    city: 'Cuenca',
    address: 'Av. Remigio Crespo y Borrero',
    phone: '072845333',
    logoUrl: 'https://picsum.photos/seed/comprovit-logo/300/300',
    websiteSlug: 'comprovit',
    shortDesc: 'Suplementos vitamínicos y productos naturales para tu bienestar.',
    planLevel: 3,
  },
  {
    userId: 'cmvjmn1pw0010qn8iqujnfkhu', // Dimar Tour (SUPPLIER)
    companyName: 'Dimar Tour',
    category: 'Turismo',
    city: 'Quito',
    address: 'Av. Amazonas y Eloy Alfaro',
    phone: '022567555',
    logoUrl: 'https://picsum.photos/seed/dimartour-logo/300/300',
    websiteSlug: 'dimar-tour',
    shortDesc: 'Tours y experiencias únicas por los 4 mundos del Ecuador.',
    planLevel: 4,
  },
]

async function main() {
  let createdCount = 0
  let skipped = 0

  for (const d of DEMOS) {
    // Verificar si ya existe el provider por websiteSlug
    const existing = await db.provider.findUnique({
      where: { websiteSlug: d.websiteSlug },
    })
    if (existing) {
      console.log(`[skip] ${d.companyName} ya existe`)
      skipped += 1
      continue
    }

    // Crear el provider (asociado al userId del SUPPLIER)
    const provider = await db.provider.create({
      data: {
        userId: d.userId,
        companyName: d.companyName,
        category: d.category,
        city: d.city,
        address: d.address,
        phone: d.phone,
        logoUrl: d.logoUrl,
        websiteSlug: d.websiteSlug,
        description: d.shortDesc,
        status: 'ACTIVE',
        verified: true,
      },
    })

    // Crear la directory entry
    const dirEntry = await db.directoryEntry.create({
      data: {
        providerId: provider.id,
        category: d.category,
        shortDesc: d.shortDesc,
        featured: d.planLevel >= 4,
        status: 'ACTIVE',
      },
    })

    // Crear el sticker según el plan level
    const cfg = getPlanConfig(d.planLevel)
    const prefix = d.companyName.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '')
    let code = generateStickerCode(prefix || 'CROM')
    let attempts = 0
    while (await db.sticker.findUnique({ where: { code } })) {
      code = generateStickerCode(prefix || 'CROM')
      attempts += 1
      if (attempts > 10) break
    }
    const qrCode = generateShortQrCode()
    const qrTargetUrl = `/w/${d.websiteSlug}`
    const rarity = d.planLevel >= 5 ? 'GOLDEN' : d.planLevel >= 3 ? 'RARE' : 'COMMON'

    const sticker = await db.sticker.create({
      data: {
        directoryEntryId: dirEntry.id,
        name: d.companyName,
        imageUrl: d.logoUrl,
        code,
        rarity,
        planLevel: d.planLevel,
        stickerSize: cfg.size,
        hasQR: cfg.hasQR,
        hasLogo: cfg.hasLogo,
        hasBanner: cfg.hasBanner,
        bannerType: cfg.bannerType ?? null,
        hasMarketplaceAd: cfg.hasMarketplaceAd,
        qrCode,
        qrTargetUrl,
      },
    })

    console.log(
      `[ok] ${d.companyName} (plan ${cfg.plan}, ${cfg.size}cm) → sticker ${sticker.code}`,
    )
    createdCount += 1
  }

  console.log(`\nResumen: ${createdCount} creados, ${skipped} omitidos.`)
  const total = await db.sticker.count()
  console.log(`Total de stickers en DB: ${total}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
