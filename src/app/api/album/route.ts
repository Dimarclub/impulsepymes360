import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'
import { ALBUM_PRIZE_AMOUNT } from '@/lib/album-config'

/**
 * /api/album
 *
 * GET (auth): devuelve el progreso del álbum de cromos del usuario.
 *  - Crea el AlbumPrize si no existe (con totalStickers = total de cromos).
 *  - Lista todos los cromos con flag `collected: true/false` para este usuario.
 *  - Stats: total, collected, missing, progress%, completed, prizeAmount,
 *    prizeClaimed y canClaim (true si completed && !prizeClaimed).
 */
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  try {
    const totalStickers = await db.sticker.count()

    // Upsert AlbumPrize con el total actualizado
    const prize = await db.albumPrize.upsert({
      where: { userId },
      create: {
        userId,
        totalStickers,
        collectedStickers: 0,
        completed: false,
        prizeAmount: ALBUM_PRIZE_AMOUNT,
        prizeClaimed: false,
      },
      update: {
        totalStickers,
      },
    })

    // Si el total cambió y ya está completo pero collectedStickers no coincide,
    // recalcular collectedStickers en base a los AlbumProgress reales.
    const collectedCount = await db.albumProgress.count({ where: { userId } })

    let updatedPrize = prize
    if (prize.collectedStickers !== collectedCount) {
      const wasComplete = prize.completed
      const nowComplete =
        totalStickers > 0 && collectedCount >= totalStickers
      updatedPrize = await db.albumPrize.update({
        where: { userId },
        data: {
          collectedStickers: collectedCount,
          completed: nowComplete,
          completedAt:
            nowComplete && !wasComplete ? new Date() : prize.completedAt,
        },
      })
    }

    // Todos los cromos con info de proveedor + collected
    const allStickers = await db.sticker.findMany({
      include: {
        directoryEntry: {
          include: {
            provider: {
              select: {
                id: true,
                companyName: true,
                category: true,
                logoUrl: true,
                websiteSlug: true,
                city: true,
                phone: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: [{ planLevel: 'asc' }, { name: 'asc' }],
    })

    const collectedIds = new Set(
      (
        await db.albumProgress.findMany({
          where: { userId },
          select: { stickerId: true },
        })
      ).map((p) => p.stickerId),
    )

    const stickers = allStickers.map((s) => {
      const provider = s.directoryEntry?.provider
      return {
        id: s.id,
        name: s.name,
        imageUrl: s.imageUrl,
        code: s.code,
        rarity: s.rarity,
        planLevel: s.planLevel,
        stickerSize: s.stickerSize,
        hasQR: s.hasQR,
        hasLogo: s.hasLogo,
        hasBanner: s.hasBanner,
        bannerType: s.bannerType,
        hasMarketplaceAd: s.hasMarketplaceAd,
        qrCode: s.qrCode,
        qrTargetUrl: s.qrTargetUrl,
        provider: provider
          ? {
              id: provider.id,
              companyName: provider.companyName,
              category: provider.category,
              logoUrl: provider.logoUrl,
              websiteSlug: provider.websiteSlug,
              city: provider.city,
              phone: provider.phone,
              address: provider.address,
            }
          : null,
        collected: collectedIds.has(s.id),
      }
    })

    const collected = updatedPrize.collectedStickers
    const missing = Math.max(0, totalStickers - collected)
    const progressPct =
      totalStickers > 0 ? Math.round((collected / totalStickers) * 100) : 0

    return NextResponse.json({
      ok: true,
      prize: {
        id: updatedPrize.id,
        totalStickers: updatedPrize.totalStickers,
        collectedStickers: collected,
        completed: updatedPrize.completed,
        completedAt: updatedPrize.completedAt,
        prizeAmount: updatedPrize.prizeAmount,
        prizeClaimed: updatedPrize.prizeClaimed,
        prizeClaimedAt: updatedPrize.prizeClaimedAt,
        canClaim: updatedPrize.completed && !updatedPrize.prizeClaimed,
      },
      stats: {
        total: totalStickers,
        collected,
        missing,
        progress: progressPct,
        completed: updatedPrize.completed,
        prizeAmount: updatedPrize.prizeAmount,
        prizeClaimed: updatedPrize.prizeClaimed,
      },
      stickers,
    })
  } catch (err) {
    console.error('[api/album] GET error:', err)
    return NextResponse.json(
      { error: 'No se pudo cargar el álbum' },
      { status: 500 },
    )
  }
}
