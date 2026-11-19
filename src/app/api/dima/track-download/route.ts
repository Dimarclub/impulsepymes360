import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { REFERRAL_SIGNUP } from '../_lib'

// POST /api/dima/track-download — público: registra descarga de app desde QR de material POP
// Body: { qrCode, newUserId }
// Si el nuevo usuario es Plus (con subscription + paga) → el dueño del QR gana $2/mes recurrente (AppReferral N1)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { qrCode, newUserId } = body as { qrCode: string; newUserId: string }

  if (!qrCode || !newUserId) {
    return NextResponse.json({ error: 'qrCode y newUserId requeridos' }, { status: 400 })
  }

  const pop = await db.popPurchase.findFirst({
    where: { qrCode },
    select: { id: true, userId: true, downloadCount: true },
  })

  if (!pop) {
    return NextResponse.json({ ok: true, found: false })
  }

  // Incrementar downloadCount
  await db.popPurchase.update({
    where: { id: pop.id },
    data: { downloadCount: { increment: 1 } },
  })

  // Verificar si el nuevo usuario ya tiene AppReferral desde el dueño del QR.
  // Si no, crear uno (N1) — el dueño del QR gana $2/mes recurrente cuando el nuevo usuario pague Dima Plus.
  const existing = await db.appReferral.findUnique({
    where: { referredId: newUserId },
  })

  if (!existing) {
    // Verificar que el nuevo usuario se haya suscrito a Plus y pagado
    const sub = await db.dimaSubscription.findUnique({
      where: { userId: newUserId },
      select: { id: true, plan: true, status: true, investedAmount: true },
    })

    if (sub && sub.plan === 'PLUS' && sub.status === 'ACTIVE' && sub.investedAmount > 0) {
      const signupAmount = REFERRAL_SIGNUP[1] // $5 si es primera descarga
      const monthlyAmount = 2 // $2/mes recurrente

      await db.appReferral.create({
        data: {
          referrerId: pop.userId,
          referredId: newUserId,
          level: 1,
          signupCommission: signupAmount,
          monthlyCommission: monthlyAmount,
          totalEarned: signupAmount,
          lastPaidAt: new Date(),
          status: 'ACTIVE',
        },
      })

      // Acreditar signup commission al dueño del QR
      let account = await db.cooperativeAccount.findUnique({ where: { userId: pop.userId } })
      if (!account) {
        account = await db.cooperativeAccount.create({
          data: { userId: pop.userId, balance: 0, totalContributed: 0, totalEarned: 0, totalWithdrawn: 0 },
        })
      }
      await db.cooperativeTransaction.create({
        data: {
          accountId: account.id,
          type: 'COMMISSION_MARKETPLACE',
          amount: signupAmount,
          description: 'Comisión Dima N1 (descarga de app vía QR)',
          referenceId: pop.id,
          status: 'COMPLETED',
        },
      })
      await db.cooperativeAccount.update({
        where: { userId: pop.userId },
        data: { balance: { increment: signupAmount }, totalEarned: { increment: signupAmount } },
      })

      return NextResponse.json({
        ok: true,
        commissionCreated: true,
        signupCommission: signupAmount,
        monthlyCommission: monthlyAmount,
      })
    }
  }

  return NextResponse.json({ ok: true, commissionCreated: false })
}
