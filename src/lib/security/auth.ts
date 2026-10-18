import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

/**
 * Obtiene la sesión del servidor. Retorna null si no hay sesión.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  }
}

/**
 * Requiere sesión. Retorna 401 si no hay.
 */
export async function requireSession(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 })
  }
  return user
}

/**
 * Requiere sesión Y un rol específico (o uno de varios).
 * Retorna 401 (sin sesión) o 403 (rol insuficiente).
 */
export async function requireRole(...roles: string[]): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado. Inicia sesión.' }, { status: 401 })
  }
  // ADMIN siempre tiene acceso
  if (user.role === 'ADMIN' || roles.includes(user.role)) {
    return user
  }
  return NextResponse.json({ error: 'Permisos insuficientes.' }, { status: 403 })
}

/**
 * Verifica si el usuario es dueño del recurso o es admin.
 */
export function isOwnerOrAdmin(user: SessionUser, ownerId: string): boolean {
  return user.role === 'ADMIN' || user.id === ownerId
}
