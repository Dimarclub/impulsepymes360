import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * /api/album/claim-prize
 *
 * POST (auth): el usuario reclama el premio de $200 por completar el álbum.
 *  - Verifica que AlbumPrize.completed === true && prizeClaimed === false.
 *  - Acredita $200 al CooperativeAccount del usuario (tipo ALBUM_PRIZE).
 *  - Crea CooperativeTransaction.
 *  - Marca prizeClaimed=true, prizeClaimedAt=now.
 *  - Notifica al usuario + admins.
 *  - Retorna { ok, amount, newBalance }.
 */
export async function POST() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; name: string; email: string }

  try {
    const prize = await db.albumPrize.findUnique({
      where: { userId: user.id },
    })

    if (!prize) {
      return NextResponse.json(
        { error: 'Aún no tienes progreso en el álbum.' },
        { status: 404 },
      )
    }
    if (!prize.completed) {
      return NextResponse.json(
        {
          error: `Aún no completas el álbum. Te faltan ${prize.totalStickers - prize.collectedStickers} cromos.`,
        },
        { status: 400 },
      )
    }
    if (prize.prizeClaimed) {
      return NextResponse.json(
        { error: 'Ya reclamaste el premio de este álbum.' },
        { status: 409 },
      )
    }

    const amount = prize.prizeAmount || 200

    let newBalance = 0
    await db.$transaction(async (tx) => {
      // Marcar como reclamado
      await tx.albumPrize.update({
        where: { userId: user.id },
        data: {
          prizeClaimed: true,
          prizeClaimedAt: new Date(),
        },
      })

      // Asegurar que exista la cuenta cooperativa
      let account = await tx.cooperativeAccount.findUnique({
        where: { userId: user.id },
      })
      if (!account) {
        account = await tx.cooperativeAccount.create({
          data: { userId: user.id },
        })
      }

      const updated = await tx.cooperativeAccount.update({
        where: { userId: user.id },
        data: {
          balance: { increment: amount },
          totalEarned: { increment: amount },
        },
      })
      newBalance = updated.balance

      await tx.cooperativeTransaction.create({
        data: {
          accountId: account.id,
          type: 'ALBUM_PRIZE',
          amount,
          description: `Premio de $${amount.toFixed(2)} por completar el álbum de cromos.`,
          referenceId: prize.id,
          status: 'COMPLETED',
        },
      })
    })

    // Notificar al usuario + admins (best-effort)
    try {
      await db.notification.create({
        data: {
          userId: user.id,
          type: 'ALBUM_PRIZE_CLAIMED',
          title: '¡Premio reclamado!',
          message: `¡Felicidades! Has recibido $${amount.toFixed(2)} en tu billetera cooperativa por completar el álbum.`,
          link: '/?module=cooperativa',
        },
      })

      const admins = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      })
      if (admins.length) {
        await db.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: 'ALBUM_PRIZE_CLAIMED',
            title: 'Premio del álbum reclamado',
            message: `${user.name} (${user.email}) reclamó los $${amount.toFixed(2)} por completar su álbum de cromos.`,
            link: '/?module=finanzas',
          })),
        })
      }
    } catch (notifErr) {
      console.error('[api/album/claim-prize] notif error:', notifErr)
    }

    return NextResponse.json({
      ok: true,
      amount,
      newBalance,
      message: `¡Premio de $${amount.toFixed(2)} acreditado a tu billetera cooperativa!`,
    })
  } catch (err) {
    console.error('[api/album/claim-prize] error:', err)
    return NextResponse.json(
      { error: 'No se pudo reclamar el premio' },
      { status: 500 },
    )
  }
}
