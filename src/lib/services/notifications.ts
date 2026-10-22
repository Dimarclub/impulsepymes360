import { db } from '@/lib/db'

export interface NotificationInput { userId: string; type: string; title: string; message: string; link?: string; metadata?: Record<string, unknown> }

export async function notify(input: NotificationInput) {
  if (!db.notification) return null
  return db.notification.create({ data: { userId: input.userId, type: input.type, title: input.title, message: input.message, link: input.link || null, metadata: input.metadata ? JSON.stringify(input.metadata) : null } })
}

export async function notifyOrderReceived(userId: string, orderNumber: string, total: number, customerName: string) {
  return notify({ userId, type: 'ORDER_RECEIVED', title: `¡Nuevo pedido ${orderNumber}!`, message: `${customerName} compró por $${total.toFixed(2)}.`, link: '/?module=supplier-backoffice' })
}

export async function notifyCommissionEarned(userId: string, amount: number, level: number, sourceName: string) {
  return notify({ userId, type: 'COMMISSION_EARNED', title: `Comisión: $${amount.toFixed(2)}`, message: `Nivel ${level} — venta de ${sourceName}.`, link: '/?module=affiliate-backoffice' })
}
