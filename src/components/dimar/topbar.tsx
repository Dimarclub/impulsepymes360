'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, Search, ShoppingCart, ChevronDown, LogOut, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { LoginDialog } from './auth/login-dialog'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  AFFILIATE: 'Afiliado',
  CLIENT: 'Cliente',
  SUPPLIER: 'Proveedor',
  COURIER: 'Mensajero',
  PARTNER: 'Socio',
}

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  ADMIN: 'bg-primary/15 text-primary border-primary/20',
  AFFILIATE: 'bg-accent/25 text-accent-foreground border-accent/30',
  CLIENT: 'bg-muted text-muted-foreground border-border',
  SUPPLIER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  COURIER: 'bg-orange-100 text-orange-700 border-orange-200',
  PARTNER: 'bg-amber-100 text-amber-700 border-amber-200',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session, status } = useSession()
  const currentUser = useAppStore((s) => s.currentUser)
  const setUser = useAppStore((s) => s.setUser)
  const cart = useAppStore((s) => s.cart)
  const toast = useAppStore((s) => s.toast)
  const [loginOpen, setLoginOpen] = useState(false)

  // Sincronizar el usuario del store con la sesión real de NextAuth.
  // Usamos el session.user del JWT como fallback de UI mientras se carga
  // el perfil extendido desde /api/auth/me (con city, phone, affiliateCode…)
  useEffect(() => {
    if (status !== 'authenticated') return
    if (!session?.user) return
    let cancelled = false
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (cancelled) return
        if (me) setUser(me)
        else setUser(null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
    return () => {
      cancelled = true
    }
  }, [session, status, setUser])

  // Cuando la sesión se cierra (logout), limpiar el store
  useEffect(() => {
    if (status === 'unauthenticated') {
      setUser(null)
    }
  }, [status, setUser])

  // Escuchar el evento `dimar-open-login` (dispatchado desde el cart-drawer
  // cuando un usuario sin sesión intenta finalizar la compra)
  useEffect(() => {
    const handler = () => setLoginOpen(true)
    window.addEventListener('dimar-open-login', handler)
    return () => window.removeEventListener('dimar-open-login', handler)
  }, [])

  const itemCount = cart.reduce((s, l) => s + l.quantity, 0)

  const openCart = () =>
    window.dispatchEvent(new CustomEvent('dimar-open-cart'))

  const handleLogout = async () => {
    await signOut({ redirect: false })
    setUser(null)
    toast('Sesión cerrada', 'info')
  }

  // displayUser: usa el perfil completo si está, sino session.user del JWT
  const displayUser = currentUser || (session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as UserRole,
      }
    : null)
  const isAuthenticated = status === 'authenticated' && !!displayUser
  const isInitialLoading = status === 'loading'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 backdrop-blur px-4 md:px-6">
      {/* Hamburger (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="size-5" />
      </Button>

      {/* Search (decorative on desktop) */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar productos, proveedores..."
          className="pl-9 bg-muted/40 border-0 focus-visible:ring-1"
          aria-label="Buscar"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Cart */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={openCart}
        aria-label={`Abrir carrito (${itemCount} artículos)`}
      >
        <ShoppingCart className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </Button>

      {/* Zona de autenticación */}
      {isInitialLoading ? (
        <Button variant="ghost" size="sm" disabled className="gap-2" aria-label="Cargando sesión">
          <Loader2 className="size-4 animate-spin" />
          <span className="hidden md:inline text-sm">Cargando…</span>
        </Button>
      ) : !isAuthenticated ? (
        <Button onClick={() => setLoginOpen(true)} size="sm" className="gap-1.5">
          <LogIn className="size-4" />
          <span className="hidden sm:inline">Iniciar sesión</span>
          <span className="sm:hidden">Entrar</span>
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted/60 transition outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de usuario"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {displayUser ? initials(displayUser.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex items-center gap-2">
                <div className="text-left">
                  <p className="text-sm font-medium leading-tight max-w-32 truncate">
                    {displayUser?.name || 'Invitado'}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {displayUser ? ROLE_LABELS[displayUser.role] : ''}
                  </p>
                </div>
                {displayUser && (
                  <span
                    className={cn(
                      'hidden lg:inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium',
                      ROLE_BADGE_STYLES[displayUser.role]
                    )}
                  >
                    {ROLE_LABELS[displayUser.role]}
                  </span>
                )}
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {displayUser ? initials(displayUser.name) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm truncate">{displayUser?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {displayUser?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {displayUser?.affiliateCode && (
              <div className="px-2 py-1.5 text-xs">
                <p className="text-muted-foreground">Tu código de afiliado</p>
                <p className="font-mono font-bold text-primary">
                  {displayUser.affiliateCode}
                </p>
              </div>
            )}
            {displayUser?.city && (
              <div className="px-2 py-1 text-[11px] text-muted-foreground">
                📍 {displayUser.city}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </header>
  )
}
