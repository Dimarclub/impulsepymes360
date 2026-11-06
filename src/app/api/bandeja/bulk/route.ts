import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * POST /api/bandeja/bulk
 * Acciones bulk sobre múltiples mensajes del usuario.
 * Body: { ids: string[], action: 'markRead' | 'markUnread' | 'archive' }
 */
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
  const action = String(body?.action || '').toLowerCase()

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No se enviaron ids' }, { status: 400 })
  }

  const validActions = ['markread', 'markunread', 'archive']
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  // Filtramos solo mensajes del usuario (ownership estricto)
  const owned = await db.unifiedMessage.findMany({
    where: { id: { in: ids }, userId: auth.id },
    select: { id: true },
  })
  const ownedIds = owned.map((m) => m.id)
  if (ownedIds.length === 0) {
    return NextResponse.json({ ok: true, count: 0 })
  }

  const statusMap: Record<string, string> = {
    markread: 'READ',
    markunread: 'UNREAD',
    archive: 'ARCHIVED',
  }

  const result = await db.unifiedMessage.updateMany({
    where: { id: { in: ownedIds } },
    data: { status: statusMap[action] },
  })

  return NextResponse.json({ ok: true, count: result.count })
}
