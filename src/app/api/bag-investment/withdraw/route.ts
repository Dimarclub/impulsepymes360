import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * POST /api/bag-investment/withdraw
 * Body: { investmentId }
 *
 * - Verifica ownership (investment.userId === auth.id)
 * - Solo si status=ACTIVE
 * - Transfiere `currentBalance` a la billetera cooperativa del usuario
 *   (crea o usa su CooperativeAccount + crea CooperativeTransaction type=INVESTMENT_WITHDRAWAL)
 * - Marca investment.status = WITHDRAWN
 *
 * Respuesta: { ok, amount, newWalletBalance }
 */
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  let body: { investmentId?: string } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const { investmentId } = body
  if (!investmentId) {
    return NextResponse.json({ error: 'Falta investmentId' }, { status: 400 })
  }

  const inv = await db.bagInvestment.findUnique({ where: { id: investmentId } })
  if (!inv) {
    return NextResponse.json({ error: 'Inversión no encontrada' }, { status: 404 })
  }
  if (inv.userId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (inv.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'La inversión ya no está activa' },
      { status: 400 }
    )
  }

  const amount = +inv.currentBalance.toFixed(4)
  if (amount <= 0) {
    return NextResponse.json(
      { error: 'El balance actual es cero, no hay nada que retirar' },
      { status: 400 }
    )
  }

  // Obtener o crear cuenta cooperativa del usuario
  let account = await db.cooperativeAccount.findUnique({ where: { userId } })
  if (!account) {
    account = await db.cooperativeAccount.create({ data: { userId } })
  }

  const [, , updatedAccount] = await db.$transaction([
    db.bagInvestment.update({
      where: { id: inv.id },
      data: { status: 'WITHDRAWN', updatedAt: new Date() },
    }),
    db.cooperativeTransaction.create({
      data: {
        accountId: account.id,
        type: 'INVESTMENT_WITHDRAWAL',
        amount,
        description: `Retiro de inversión en bolsos PubliBags (${inv.comboQuantity} combo(s))`,
        referenceId: inv.id,
        status: 'COMPLETED',
      },
    }),
    db.cooperativeAccount.update({
      where: { userId },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
      },
    }),
  ])

  // Notificar al usuario
  try {
    await db.notification.create({
      data: {
        userId,
        type: 'INVESTMENT_WITHDRAWAL',
        title: 'Retiro de inversión procesado',
        message: `Retiraste $${amount.toFixed(2)} de tu inversión en bolsos PubliBags. Saldo transferido a tu billetera cooperativa.`,
        link: '/?module=cooperativa',
      },
    })
  } catch (e) {
    console.error('[bag-investment/withdraw] notif error:', e)
  }

  return NextResponse.json({
    ok: true,
    amount,
    newWalletBalance: +updatedAccount.balance.toFixed(4),
  })
}
