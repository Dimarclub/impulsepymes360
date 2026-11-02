/**
 * seed-locations.cjs — Seed countries + cities (multi-país) into the DB.
 *
 * Idempotent: safe to run multiple times. Creates (or updates) the configured
 * countries with their respective cities. Existing cities are kept; missing
 * cities are created.
 *
 * Run with:  node scripts/seed-locations.cjs
 */
const { PrismaClient } = require('/home/z/my-project/node_modules/@prisma/client')

const db = new PrismaClient()

// ---------- Data: países + ciudades ----------
const LOCATIONS = [
  {
    name: 'Ecuador',
    code: 'EC',
    flag: '🇪🇨',
    cities: ['Guayaquil', 'Quito', 'Cuenca', 'Manta', 'Portoviejo', 'Santo Domingo', 'Loja', 'Ambato'],
  },
  {
    name: 'Colombia',
    code: 'CO',
    flag: '🇨🇴',
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'],
  },
  {
    name: 'Perú',
    code: 'PE',
    flag: '🇵🇪',
    cities: ['Lima', 'Arequipa', 'Trujillo'],
  },
  {
    name: 'Chile',
    code: 'CL',
    flag: '🇨🇱',
    cities: ['Santiago', 'Valparaíso'],
  },
  {
    name: 'Argentina',
    code: 'AR',
    flag: '🇦🇷',
    cities: ['Buenos Aires', 'Córdoba'],
  },
  {
    name: 'México',
    code: 'MX',
    flag: '🇲🇽',
    cities: ['CDMX', 'Guadalajara', 'Monterrey'],
  },
  {
    name: 'España',
    code: 'ES',
    flag: '🇪🇸',
    cities: ['Madrid', 'Barcelona'],
  },
  {
    name: 'USA',
    code: 'US',
    flag: '🇺🇸',
    cities: ['Miami', 'New York', 'Los Angeles'],
  },
]

async function main() {
  console.log('🌍 Seed países + ciudades (ImpulsePymes360)...')

  let countriesCreated = 0
  let countriesUpdated = 0
  let citiesCreated = 0
  let citiesExisting = 0

  for (const c of LOCATIONS) {
    // Detectar si el país ya existe antes del upsert
    const prevCountry = await db.country.findUnique({ where: { code: c.code } })
    const country = await db.country.upsert({
      where: { code: c.code },
      create: { name: c.name, code: c.code, flag: c.flag },
      update: { name: c.name, flag: c.flag },
    })
    if (prevCountry) {
      countriesUpdated += 1
    } else {
      countriesCreated += 1
    }
    console.log(`  • ${c.flag}  ${c.name} (${c.code}) — id ${country.id}`)

    for (const cityName of c.cities) {
      // Detectar si la ciudad ya existe antes del upsert
      const prevCity = await db.city.findUnique({
        where: { name_countryId: { name: cityName, countryId: country.id } },
      })
      await db.city.upsert({
        where: { name_countryId: { name: cityName, countryId: country.id } },
        create: { name: cityName, countryId: country.id },
        update: { name: cityName },
      })
      if (prevCity) {
        citiesExisting += 1
      } else {
        citiesCreated += 1
        console.log(`      ✓ ${cityName}`)
      }
    }
  }

  // Recuento final
  const totalCountries = await db.country.count()
  const totalCities = await db.city.count()

  console.log('')
  console.log(`✅ Seed completado.`)
  console.log(`   Países en DB:   ${totalCountries}  (${countriesCreated} nuevos, ${countriesUpdated} ya existían)`)
  console.log(`   Ciudades en DB: ${totalCities}  (${citiesCreated} nuevas, ${citiesExisting} ya existían)`)
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
