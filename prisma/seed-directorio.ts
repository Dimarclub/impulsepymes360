/* Directorio360 - Seed de fichas, stickers, sorteo */
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Iniciando seed Directorio360...')

  // Limpiar
  await db.raffleEntry.deleteMany()
  await db.raffle.deleteMany()
  await db.albumProgress.deleteMany()
  await db.sticker.deleteMany()
  await db.directoryEntry.deleteMany()

  // Obtener todos los proveedores con user
  const providers = await db.provider.findMany({ take: 5 })
  if (providers.length === 0) {
    console.log('No hay proveedores. Ejecuta prisma/seed-impulse.ts primero')
    return
  }

  // Crear fichas en el directorio + stickers para cada proveedor
  const categories = ['Electrónica', 'Hogar', 'Moda', 'Alimentos', 'Automotriz']
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]
    const cat = categories[i % categories.length]
    const entry = await db.directoryEntry.create({
      data: {
        providerId: p.id,
        category: cat,
        tags: JSON.stringify([cat, 'Ecuador', p.city || 'Guayaquil']),
        shortDesc: p.description || `${p.companyName} — ${cat}`,
        featured: i < 2,
        rating: 4 + Math.random(),
        reviewCount: Math.floor(Math.random() * 50) + 5,
        viewCount: Math.floor(Math.random() * 500) + 50,
        visitCount: Math.floor(Math.random() * 30) + 5,
      },
    })
    // Crear 1 sticker por proveedor
    const rarity = i === 0 ? 'GOLDEN' : i < 3 ? 'RARE' : 'COMMON'
    await db.sticker.create({
      data: {
        directoryEntryId: entry.id,
        name: `Sticker ${p.companyName}`,
        imageUrl: `https://picsum.photos/seed/sticker-${p.websiteSlug}/200/200`,
        code: (p.companyName.slice(0, 4).toUpperCase()) + '-STK',
        rarity,
      },
    })
  }
  console.log(`✓ ${providers.length} fichas + stickers creados`)

  // Dar algunos stickers a Ana (afiliada) para que tenga progreso
  const ana = await db.user.findFirst({ where: { email: 'ana@dimarclub.com' } })
  if (ana) {
    const stickers = await db.sticker.findMany({ take: 3 })
    for (const s of stickers) {
      await db.albumProgress.create({
        data: {
          userId: ana.id,
          stickerId: s.id,
          source: 'QR_SCAN',
        },
      }).catch(() => {}) // ignorar duplicados
    }
    console.log('✓ Ana tiene 3 stickers en su álbum')
  }

  // Crear 2 sorteos
  await db.raffle.create({
    data: {
      name: 'Sorteo Dimarclub Navidad 2025',
      description: 'Completa tu álbum de stickers y participa por una Smart TV 50" + $500 en productos del marketplace.',
      prize: 'Smart TV 50" + $500 en productos',
      prizeImageUrl: 'https://picsum.photos/seed/prize-tv/400/300',
      drawDate: new Date(Date.now() + 45 * 86400000),
      status: 'ACTIVE',
      minStickers: 10,
    },
  })
  await db.raffle.create({
    data: {
      name: 'Sorteo Mensual Octubre',
      description: 'Sorteo mensual para todos los que tengan al menos 5 stickers. Premio: canasta de productos + lavado de auto gratis.',
      prize: 'Canasta de productos + lavado gratis',
      prizeImageUrl: 'https://picsum.photos/seed/prize-basket/400/300',
      drawDate: new Date(Date.now() + 15 * 86400000),
      status: 'ACTIVE',
      minStickers: 5,
    },
  })
  console.log('✓ 2 sorteos creados')

  console.log('🎉 Seed Directorio360 completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
