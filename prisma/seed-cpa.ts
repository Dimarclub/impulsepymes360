/**
 * Seed: 3 demo CPA tasks
 *
 *   1. VIDEO task:   "Zapatos 2x1 - TecnoExpress"        — $0.25
 *   2. PHOTO task:   "Foto con bolso PubliBags"          — $0.50
 *   3. SHARE task:   "Comparte la promoción de Auki Chocolate" — $0.15
 *
 * Uso: bun run prisma/seed-cpa.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Buscar un admin
  const admin = await db.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true, name: true } })
  if (!admin) {
    console.error('No hay usuario ADMIN en la DB. Corre el seed principal primero.')
    process.exit(1)
  }
  console.log(`Usando admin: ${admin.name} (${admin.id})`)

  const now = new Date()
  const inSevenDays = new Date(now.getTime() + 7 * 86400000)
  const inFourteenDays = new Date(now.getTime() + 14 * 86400000)
  const inThirtyDays = new Date(now.getTime() + 30 * 86400000)

  // Limpiar tareas CPA existentes
  await db.cpaTask.deleteMany({})
  console.log('Tareas CPA existentes eliminadas.')

  const tasks = [
    {
      title: 'Zapatos 2x1 - TecnoExpress',
      description: 'Mira el video de la promoción 2x1 en zapatos de TecnoExpress. Al terminar, reclama tu comisión y aprovecha la oferta en el marketplace.',
      type: 'VIDEO',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      imageUrl: 'https://picsum.photos/seed/zapatos-tecnoexpress/640/360',
      offerTitle: '2x1 en todos los zapatos de temporada',
      offerUrl: '/?module=marketplace',
      commission: 0.25,
      maxParticipants: 100,
      endDate: inSevenDays,
    },
    {
      title: 'Foto con bolso PubliBags',
      description: 'Tómate una foto recibiendo el bolso PubliBags en la calle. La foto debe mostrar el bolso claramente. El equipo la revisará y acreditará $0.50 al aprobarla.',
      type: 'PHOTO_BOLSO',
      imageUrl: 'https://picsum.photos/seed/bolso-publibags/640/360',
      offerTitle: 'Bolso PubliBags edición especial',
      offerUrl: '/?module=publibags',
      commission: 0.50,
      maxParticipants: 50,
      endDate: inThirtyDays,
    },
    {
      title: 'Comparte la promoción de Auki Chocolate',
      description: 'Comparte el enlace de afiliado de Auki Chocolate en tus redes sociales. Al reclamar la comisión, adjunta captura de tu publicación.',
      type: 'SHARE',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      imageUrl: 'https://picsum.photos/seed/auki-chocolate/640/360',
      offerTitle: 'Auki Chocolate — 15% OFF con tu código',
      offerUrl: '/?module=marketplace',
      commission: 0.15,
      maxParticipants: null,
      endDate: inFourteenDays,
    },
  ]

  for (const t of tasks) {
    const created = await db.cpaTask.create({
      data: {
        title: t.title,
        description: t.description,
        type: t.type,
        videoUrl: t.videoUrl,
        imageUrl: t.imageUrl,
        offerTitle: t.offerTitle,
        offerUrl: t.offerUrl,
        commission: t.commission,
        maxParticipants: t.maxParticipants,
        currentParticipants: 0,
        startDate: now,
        endDate: t.endDate,
        status: 'ACTIVE',
        createdBy: admin.id,
      },
    })
    console.log(`✅ Tarea creada: ${created.title} [${created.type}] — ${created.id}`)
  }

  console.log('Seed CPA completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
