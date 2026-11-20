import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/security/auth'
import { db } from '@/lib/db'

// Retorna el usuario autenticado actual + datos extendidos
export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json(null, { status: 200 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, role: true, city: true, phone: true,
        affiliateCode: true, sponsorId: true, avatarUrl: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(null, { status: 200 })
    }

    return NextResponse.json(dbUser)
  } catch (error) {
    console.error('[api/auth/me] error:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
