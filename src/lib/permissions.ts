// Permisos por rol — qué módulos puede ver cada tipo de usuario
import type { ModuleId, UserRole } from './types'

export const ROLE_MODULES: Record<UserRole, ModuleId[] | '*'> = {
  ADMIN: '*',
  CLIENT: ['marketplace', 'affiliates', 'benefits', 'grid'],
  AFFILIATE: ['marketplace', 'affiliates', 'benefits', 'social-bio', 'grid'],
  SUPPLIER: ['marketplace', 'suppliers', 'logistics', 'web-express', 'publibags', 'directorio', 'social', 'social-studio', 'social-bio', 'social-automation', 'impulse', 'impulse-wizard', 'grid'],
  COURIER: ['marketplace', 'courier-app', 'fuerza'],
  PARTNER: ['marketplace', 'partners', 'benefits'],
}

export const PUBLIC_MODULES: ModuleId[] = ['marketplace']

export function canAccessModule(role: UserRole | undefined, moduleId: ModuleId): boolean {
  if (!role) return PUBLIC_MODULES.includes(moduleId)
  const allowed = ROLE_MODULES[role]
  if (allowed === '*') return true
  return allowed.includes(moduleId)
}

export function defaultModuleForRole(role: UserRole): ModuleId {
  switch (role) {
    case 'ADMIN': return 'dashboard'
    case 'SUPPLIER': return 'impulse'
    case 'COURIER': return 'courier-app'
    case 'PARTNER': return 'partners'
    case 'AFFILIATE': return 'affiliates'
    case 'CLIENT': return 'marketplace'
    default: return 'marketplace'
  }
}
