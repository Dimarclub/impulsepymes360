import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

/**
 * GET /api/couriers/me
 * Devuelve el perfil del mensajero asociado al usuario autenticado.
 * Requiere sesión (rol COURIER). Si el usuario no tiene perfil de courier,
 * responde 404 para que el cliente pueda mostrar el empty-state apropiado.
 */
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const courier = await db.courier.findUnique({
    where: { userId },
    include: {
      user: {
        select: { name: true, email: true, phone: true, city: true },
      },
    },
  })

  if (!courier) {
    return NextResponse.json({ error: 'No eres mensajero' }, { status: 404 })
  }

  return NextResponse.json(courier)
}
