// Permisos por rol — qué módulos puede ver cada tipo de usuario
import type { ModuleId, UserRole } from './types'

export const ROLE_MODULES: Record<UserRole, ModuleId[] | '*'> = {
  ADMIN: '*',

  CLIENT: ['marketplace', 'affiliates', 'benefits', 'grid', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'cooperativa', 'alertas', 'directorio'],
  AFFILIATE: ['marketplace', 'affiliates', 'benefits', 'social-bio', 'grid', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'cooperativa', 'affiliate-backoffice', 'alertas', 'directorio'],
  SUPPLIER: ['marketplace', 'suppliers', 'logistics', 'web-express', 'publibags', 'bag-plan', 'planes', 'fuerza-delta', 'directorio', 'social', 'social-studio', 'social-bio', 'social-automation', 'impulse', 'impulse-wizard', 'grid', 'supplier-backoffice', 'cooperativa', 'alertas'],
  COURIER: ['marketplace', 'courier-app', 'fuerza'],
  PARTNER: ['marketplace', 'partners', 'benefits', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'cooperativa', 'partner-backoffice', 'directorio'],
}

export const PUBLIC_MODULES: ModuleId[] = ['marketplace', 'bag-plan', 'publibags', 'planes', 'fuerza-delta']

export function canAccessModule(role: UserRole | undefined, moduleId: ModuleId): boolean {
  if (!role) return PUBLIC_MODULES.includes(moduleId)
  const allowed = ROLE_MODULES[role]
  if (allowed === '*') return true
  return allowed.includes(moduleId)
}

export function defaultModuleForRole(role: UserRole): ModuleId {
  switch (role) {
    case 'ADMIN': return 'dashboard'
    case 'SUPPLIER': return 'supplier-backoffice'
    case 'COURIER': return 'courier-app'
    case 'PARTNER': return 'partner-backoffice'
    case 'AFFILIATE': return 'affiliate-backoffice'
    case 'CLIENT': return 'marketplace'
    default: return 'marketplace'
  }
}
