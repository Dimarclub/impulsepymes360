// Permisos por rol — qué módulos puede ver cada tipo de usuario
import type { ModuleId, UserRole } from './types'

export const ROLE_MODULES: Record<UserRole, ModuleId[] | '*'> = {
  ADMIN: '*',

  CLIENT: ['impulsepymes360', 'marketplace', 'affiliates', 'benefits', 'grid', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'dimarclub', 'cooperativa', 'affiliate-backoffice', 'alertas', 'directorio'],
  AFFILIATE: ['impulsepymes360', 'marketplace', 'affiliates', 'benefits', 'social-bio', 'grid', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'dimarclub', 'cooperativa', 'affiliate-backoffice', 'alertas', 'directorio'],
  SUPPLIER: ['impulsepymes360', 'marketplace', 'suppliers', 'logistics', 'web-express', 'publibags', 'bag-plan', 'planes', 'fuerza-delta', 'directorio', 'social', 'social-studio', 'social-bio', 'social-automation', 'impulse', 'impulse-wizard', 'grid', 'supplier-backoffice', 'alertas'],
  COURIER: ['marketplace', 'courier-app', 'fuerza'],
  PARTNER: ['impulsepymes360', 'marketplace', 'partners', 'benefits', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'dimarclub', 'cooperativa', 'partner-backoffice', 'directorio'],
}

export const PUBLIC_MODULES: ModuleId[] = ['impulsepymes360', 'marketplace', 'bag-plan', 'publibags', 'planes', 'fuerza-delta', 'dimarclub']

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
    case 'CLIENT': return 'affiliate-backoffice'
    default: return 'marketplace'
  }
}
