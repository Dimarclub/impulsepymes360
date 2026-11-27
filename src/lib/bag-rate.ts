import { db } from '@/lib/db'

/** Clave en SiteSettings con la tasa mensual publicada por la cooperativa (fracción, ej. 0.02 = 2%). */
export const BAG_RATE_KEY = 'bag_investment_period_rate'
/** Tope de seguridad: ninguna tasa publicada puede superar este valor. */
export const BAG_RATE_MAX = 0.05

/**
 * Tasa del periodo basada en el resultado real de la cooperativa (reciclaje y ventas).
 * Sin publicación del administrador la tasa es 0: no se promete ni se paga rendimiento.
 */
export async function getPublishedBagRate(): Promise<number> {
  const row = await db.siteSettings.findUnique({ where: { key: BAG_RATE_KEY } })
  const rate = row ? Number.parseFloat(row.value) : 0
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return Math.min(rate, BAG_RATE_MAX)
}
