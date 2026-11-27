import type { Prisma } from '@prisma/client'

// Fuente única del cálculo de comisiones de red por venta del marketplace.
// Regla vigente: 1 % de la base comisionable a cada uno de los 3 niveles de patrocinadores
// (suma 3 %, que es la comisión que retiene la plataforma). Sin comisión por autoconsumo.
export const NETWORK_LEVELS = 3
export const NETWORK_RATE_PER_LEVEL = 1 // %

/**
 * Crea las comisiones de red de un pedido. Es idempotente: si el pedido ya tiene
 * comisiones de red (nivel 1-3), no crea nada, así que ningún flujo puede pagar dos veces.
 * Debe llamarse dentro de la misma transacción que crea o confirma el pedido.
 */
export async function createOrderCommissions(
  tx: Prisma.TransactionClient,
  params: { orderId: string; buyerId: string; base: number }
): Promise<{ created: { userId: string; level: number; amount: number }[]; skipped: boolean }> {
  const { orderId, buyerId, base } = params
  if (!(base > 0)) return { created: [], skipped: true }
  const existing = await tx.commission.count({ where: { orderId, level: { gte: 1 } } })
  if (existing > 0) return { created: [], skipped: true }
  const amount = +((base * NETWORK_RATE_PER_LEVEL) / 100).toFixed(2)
  const created: { userId: string; level: number; amount: number }[] = []
  let current = await tx.user.findUnique({ where: { id: buyerId }, select: { id: true, sponsorId: true } })
  const seen = new Set<string>([buyerId])
  for (let level = 1; level <= NETWORK_LEVELS; level += 1) {
    if (!current?.sponsorId || seen.has(current.sponsorId)) break
    const sponsor = await tx.user.findUnique({ where: { id: current.sponsorId }, select: { id: true, sponsorId: true } })
    if (!sponsor) break
    seen.add(sponsor.id)
    await tx.commission.create({
      data: { userId: sponsor.id, orderId, sourceUserId: buyerId, amount, level, rate: NETWORK_RATE_PER_LEVEL, status: 'PENDING' },
    })
    created.push({ userId: sponsor.id, level, amount })
    current = sponsor
  }
  return { created, skipped: false }
}
