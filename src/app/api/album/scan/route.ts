import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * /api/album/scan
 *
 * POST (auth): el usuario escanea/escribe el código QR de un cromo físico.
 *  - Busca el Sticker por `code` (en mayúsculas).
 *  - 404 si no existe.
 *  - 409 si ya lo tiene.
 *  - Crea AlbumProgress (source: QR_SCAN).
 *  - Recalcula AlbumPrize.collectedStickers.
 *  - Si collectedStickers === totalStickers → completed=true, completedAt=now.
 *  - Notifica al usuario con el mensaje de progreso.
 *  - Body: { code: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; name: string }

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const rawCode = (body.code || '').trim().toUpperCase()
  if (!rawCode) {
    return NextResponse.json(
      { error: 'Debes ingresar el código del cromo' },
      { status: 400 },
    )
  }

  try {
    const sticker = await db.sticker.findUnique({
      where: { code: rawCode },
      include: {
        directoryEntry: {
          include: {
            provider: {
              select: { id: true, companyName: true, websiteSlug: true, category: true, city: true },
            },
          },
        },
      },
    })
    if (!sticker) {
      return NextResponse.json(
        { error: 'Cromo no encontrado. Verifica el código e intenta nuevamente.' },
        { status: 404 },
      )
    }

    // ¿Ya lo tiene?
    const existing = await db.albumProgress.findUnique({
      where: { userId_stickerId: { userId: user.id, stickerId: sticker.id } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya tienes este cromo en tu álbum.' },
        { status: 409 },
      )
    }

    // Crear el progreso + actualizar el prize en transacción
    const totalStickers = await db.sticker.count()

    const result = await db.$transaction(async (tx) => {
      await tx.albumProgress.create({
        data: {
          userId: user.id,
          stickerId: sticker.id,
          source: 'QR_SCAN',
        },
      })

      // Incrementar visitCount del directorio
      if (sticker.directoryEntryId) {
        try {
          await tx.directoryEntry.update({
            where: { id: sticker.directoryEntryId },
            data: { visitCount: { increment: 1 } },
          })
        } catch { /* best-effort */ }
      }

      // Recalcular prize
      const collectedCount = await tx.albumProgress.count({
        where: { userId: user.id },
      })
      const nowComplete =
        totalStickers > 0 && collectedCount >= totalStickers

      const prize = await tx.albumPrize.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          totalStickers,
          collectedStickers: collectedCount,
          completed: nowComplete,
          completedAt: nowComplete ? new Date() : null,
          prizeAmount: 200,
          prizeClaimed: false,
        },
        update: {
          totalStickers,
          collectedStickers: collectedCount,
          completed: nowComplete,
          completedAt: nowComplete ? new Date() : null,
        },
      })

      return { prize }
    })

    const collected = result.prize.collectedStickers
    const missing = Math.max(0, totalStickers - collected)
    const completed = result.prize.completed

    // Mensaje + notificación
    const message = completed
      ? `¡ÁLBUM COMPLETO! 🎉 Puedes reclamar tus $200.`
      : `¡Cromo recolectado! ${sticker.name}. Te faltan ${missing} cromos.`

    try {
      await db.notification.create({
        data: {
          userId: user.id,
          type: completed ? 'ALBUM_COMPLETED' : 'STICKER_COLLECTED',
          title: completed ? '¡Álbum completo!' : 'Cromo recolectado',
          message,
          link: '/?module=album',
        },
      })

      if (completed) {
        // Notificar a los admins también
        const admins = await db.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        })
        if (admins.length) {
          await db.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: 'ALBUM_COMPLETED',
              title: 'Álbum completado por usuario',
              message: `${user.name} completó su álbum de cromos y puede reclamar los $200.`,
              link: '/?module=album-admin',
            })),
          })
        }
      }
    } catch (notifErr) {
      console.error('[api/album/scan] notif error:', notifErr)
    }

    return NextResponse.json({
      ok: true,
      message,
      sticker: {
        id: sticker.id,
        name: sticker.name,
        imageUrl: sticker.imageUrl,
        rarity: sticker.rarity,
        planLevel: sticker.planLevel,
        stickerSize: sticker.stickerSize,
        provider: sticker.directoryEntry?.provider?.companyName || null,
      },
      collected,
      total: totalStickers,
      missing,
      completed,
    })
  } catch (err) {
    console.error('[api/album/scan] error:', err)
    return NextResponse.json(
      { error: 'No se pudo procesar el escaneo del cromo' },
      { status: 500 },
    )
  }
}
