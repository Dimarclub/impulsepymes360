import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/security/auth'

// Perfil del proveedor actual (para su panel maestro)
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json(null)
  const provider = await db.provider.findFirst({
    where: { userId: user.id },
    include: {
      subscription: { include: { plan: true } },
      website: true,
      qrCodes: true,
      adSpaces: { include: { edition: { select: { name: true, city: true } } } },
    },
  })
  return NextResponse.json(provider)
}
