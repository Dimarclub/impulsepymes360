'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingCart, ChevronDown } from 'lucide-react'
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
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { DemoUser, UserRole } from '@/lib/types'

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
  const currentUser = useAppStore((s) => s.currentUser)
  const setUser = useAppStore((s) => s.setUser)
  const cart = useAppStore((s) => s.cart)
  const [users, setUsers] = useState<DemoUser[]>([])

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((u: DemoUser[]) => {
        setUsers(u)
        // Sincronizar el currentUser demo con un usuario real de la DB
        if (u.length > 0) {
          const exists = u.some((x) => x.id === currentUser?.id)
          if (!exists) {
            const byEmail = currentUser ? u.find((x) => x.email === currentUser.email) : null
            setUser(byEmail || u.find((x) => x.role === 'ADMIN') || u[0])
          }
        }
      })
      .catch(() => {})
  }, [])

  const itemCount = cart.reduce((s, l) => s + l.quantity, 0)

  const grouped = users.reduce<Record<string, DemoUser[]>>((acc, u) => {
    const key = u.role
    if (!acc[key]) acc[key] = []
    acc[key].push(u)
    return acc
  }, {})

  const openCart = () =>
    window.dispatchEvent(new CustomEvent('dimar-open-cart'))

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

      {/* User switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted/60 transition outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cambiar usuario"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {currentUser ? initials(currentUser.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex items-center gap-2">
              <div className="text-left">
                <p className="text-sm font-medium leading-tight max-w-32 truncate">
                  {currentUser?.name || 'Invitado'}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {currentUser ? ROLE_LABELS[currentUser.role] : ''}
                </p>
              </div>
              {currentUser && (
                <span
                  className={cn(
                    'hidden lg:inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium',
                    ROLE_BADGE_STYLES[currentUser.role]
                  )}
                >
                  {ROLE_LABELS[currentUser.role]}
                </span>
              )}
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 max-h-96 overflow-y-auto scroll-thin"
        >
          <DropdownMenuLabel>Iniciar sesión como</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.keys(grouped).length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground">Cargando usuarios…</div>
          )}
          {Object.entries(grouped).map(([role, list]) => (
            <DropdownMenuGroup key={role}>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {ROLE_LABELS[role as UserRole] || role}
              </DropdownMenuLabel>
              {list.map((u) => {
                const isCurrent = currentUser?.id === u.id
                return (
                  <DropdownMenuItem
                    key={u.id}
                    onClick={() => setUser(u)}
                    className="gap-2"
                  >
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    {isCurrent && <span className="size-2 rounded-full bg-primary shrink-0" />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
