import { db } from '@/lib/db'

/**
 * Obtiene o crea la CooperativeAccount del usuario.
 */
export async function getOrCreateAccount(userId: string) {
  let account = await db.cooperativeAccount.findUnique({ where: { userId } })
  if (!account) {
    account = await db.cooperativeAccount.create({
      data: { userId, balance: 0, totalContributed: 0, totalEarned: 0, totalWithdrawn: 0 },
    })
  }
  return account
}

/**
 * Acredita un monto en la CooperativeAccount (crea CooperativeTransaction).
 */
export async function creditAccount(
  userId: string,
  amount: number,
  type: string,
  description?: string,
  referenceId?: string
) {
  const account = await getOrCreateAccount(userId)
  await db.cooperativeTransaction.create({
    data: {
      accountId: account.id,
      type,
      amount,
      description: description || null,
      referenceId: referenceId || null,
      status: 'COMPLETED',
    },
  })
  await db.cooperativeAccount.update({
    where: { userId },
    data: {
      balance: { increment: amount },
      totalEarned: amount > 0 ? { increment: amount } : undefined,
    },
  })
  return account
}

/**
 * Recorre la cadena de sponsors del usuario hasta 3 niveles (N1, N2, N3).
 * Retorna un array de { user, level } ordenado por nivel ascendente.
 */
export async function getSponsorChain(userId: string) {
  const chain: Array<{ id: string; level: number; sponsorId: string | null }> = []
  let currentId: string | null = userId
  for (let level = 1; level <= 3; level++) {
    if (!currentId) break
    const user = await db.user.findUnique({
      where: { id: currentId },
      select: { id: true, sponsorId: true },
    })
    if (!user || !user.sponsorId) break
    const sponsor = await db.user.findUnique({
      where: { id: user.sponsorId },
      select: { id: true, sponsorId: true },
    })
    if (!sponsor) break
    chain.push({ id: sponsor.id, level, sponsorId: sponsor.sponsorId })
    currentId = sponsor.sponsorId
  }
  return chain
}

// Comisiones de descarga de la app
export const REFERRAL_SIGNUP = { 1: 5, 2: 2, 3: 1 } as const
export const REFERRAL_MONTHLY = { 1: 2, 2: 1, 3: 0.5 } as const
