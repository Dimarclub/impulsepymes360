'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  Search, ShoppingCart, ChevronDown, User, LogIn, UserPlus, LogOut, Menu, X,
  Home, Users, Store, Building2, Phone, Sparkles, Loader2, Settings,
  LayoutDashboard, Truck, Mail, Megaphone, ClipboardList, Rocket, Zap, Globe, MapPin, Grid3x3, PiggyBank,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { UserRole, ModuleId } from '@/lib/types'
import { canAccessModule } from '@/lib/permissions'
import { LoginDialog } from './auth/login-dialog'
import { NotificationBell } from './notification-bell'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador', AFFILIATE: 'Afiliado', CLIENT: 'Cliente',
  SUPPLIER: 'Proveedor', COURIER: 'Mensajero', PARTNER: 'Socio',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

interface Category { id: string; name: string; slug: string; children?: { id: string; name: string; slug: string }[] }

export function TopNav() {
  const { data: session, status } = useSession()
  const currentUser = useAppStore((s) => s.currentUser)
  const setUser = useAppStore((s) => s.setUser)
  const setModule = useAppStore((s) => s.setModule)
  const activeModule = useAppStore((s) => s.activeModule)
  const cart = useAppStore((s) => s.cart)
  const toast = useAppStore((s) => s.toast)

  const [loginOpen, setLoginOpen] = useState(false)
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login')
  const [registerRole, setRegisterRole] = useState<UserRole>('CLIENT')
  const [marqueeText, setMarqueeText] = useState('')
  const [contactPhone, setContactPhone] = useState('+593992689844')
  const [siteLogo, setSiteLogo] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [catOpen, setCatOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/settings?key=marquee_text').then((r) => r.json()).then((d) => setMarqueeText(d.value || '')).catch(() => {})
    fetch('/api/settings?key=contact_phone').then((r) => r.json()).then((d) => setContactPhone(d.value || '+593992689844')).catch(() => {})
    fetch('/api/settings?key=site_logo_url').then((r) => r.json()).then((d) => setSiteLogo(d.value || '')).catch(() => {})
    fetch('/api/categories').then((r) => r.json()).then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (!session?.user) return
    fetch('/api/auth/me').then((r) => r.ok ? r.json() : null).then((me) => { if (me) setUser(me) }).catch(() => {})
  }, [session, status, setUser])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayUser = currentUser || (session?.user ? {
    id: session.user.id, name: session.user.name, email: session.user.email,
    role: session.user.role as UserRole,
  } : null)
  const isAuthenticated = status === 'authenticated' && !!displayUser
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0)

  const openLogin = (tab: 'login' | 'register', role?: UserRole) => {
    setLoginTab(tab)
    if (role) setRegisterRole(role)
    setLoginOpen(true)
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    setUser(null)
    toast('Sesión cerrada', 'info')
  }

  const selectCategory = (catId: string) => {
    setModule('marketplace')
    setCatOpen(false)
    window.dispatchEvent(new CustomEvent('dimar-filter-category', { detail: catId }))
  }

  const navItem = (label: string, module: ModuleId, icon?: React.ElementType) => {
    const hasAccess = canAccessModule(displayUser?.role, module)
    if (!hasAccess && displayUser) return null
    return (
      <button
        onClick={() => { setModule(module); setMobileMenuOpen(false) }}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors',
          activeModule === module ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/60'
        )}
      >
        {icon && React.createElement(icon, { className: 'size-4' })}
        {label}
      </button>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-primary/5 border-b-2 border-primary/20 shadow-sm">
        {/* Fila 1 */}
        <div className="border-b bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <div className="max-w-[1320px] mx-auto px-4 flex items-center gap-4 h-9">
            <button onClick={() => setModule('marketplace')} className="flex items-center gap-2 shrink-0" aria-label="Inicio">
              {siteLogo ? (
                <img src={siteLogo} alt="ImpulsePymes360" className="h-7 w-auto object-contain" style={{ maxHeight: '28px' }} />
              ) : (
                <>
                  <div className="size-7 rounded-lg bg-white/20 flex items-center justify-center"><span className="font-bold text-sm">I</span></div>
                  <span className="font-bold text-sm hidden sm:inline">ImpulsePymes360</span>
                </>
              )}
            </button>
            <a href={`tel:${contactPhone}`} className="hidden md:flex items-center gap-1 text-xs shrink-0 hover:underline">
              <Phone className="size-3" />{contactPhone}
            </a>
            <div className="flex-1 overflow-hidden">
              <div className="marquee-track text-xs italic opacity-90">
                {marqueeText || 'Bienvenido a ImpulsePymes360 — El sistema que impulsa tu negocio'}
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2 */}
        <div className="border-b border-primary/15 bg-primary/8">
          <div className="max-w-[1320px] mx-auto px-4 flex items-center gap-3 h-14">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menú">
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Buscar productos, marcas, servicios..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/40 border-0 focus-visible:ring-1"
                onKeyDown={(e) => { if (e.key === 'Enter') { setModule('marketplace'); window.dispatchEvent(new CustomEvent('dimar-search', { detail: search })) } }}
              />
            </div>
            <div className="flex-1 sm:hidden" />
            {status === 'loading' ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : !isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5"><User className="size-5" /><ChevronDown className="size-3" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Ingreso / Registro</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openLogin('login')}><LogIn className="size-4 mr-2" /> Iniciar sesión</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openLogin('register')}><UserPlus className="size-4 mr-2" /> Crear una cuenta</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Registrarse como:</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openLogin('register', 'CLIENT')}><Users className="size-4 mr-2" /> Cliente</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openLogin('register', 'AFFILIATE')}><Sparkles className="size-4 mr-2" /> Afiliado</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openLogin('register', 'PARTNER')}><Store className="size-4 mr-2" /> Socio</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted/60 transition outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Menú de usuario">
                    <Avatar className="size-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{displayUser ? initials(displayUser.name) : '?'}</AvatarFallback></Avatar>
                    <div className="hidden md:flex items-center gap-1"><span className="text-sm font-medium max-w-24 truncate">{displayUser?.name}</span><ChevronDown className="size-3 text-muted-foreground" /></div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel><div><p className="text-sm font-medium">{displayUser?.name}</p><p className="text-xs text-muted-foreground">{ROLE_LABELS[displayUser!.role]}</p></div></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}><LogOut className="size-4 mr-2" /> Cerrar sesión</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isAuthenticated && <NotificationBell />}
            <Button variant="ghost" size="icon" className="relative" onClick={() => window.dispatchEvent(new CustomEvent('dimar-open-cart'))} aria-label={`Carrito (${itemCount})`}>
              <ShoppingCart className="size-5" />
              {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{itemCount > 9 ? '9+' : itemCount}</span>}
            </Button>
          </div>
        </div>

        {/* Fila 3 */}
        <div className="hidden lg:block bg-primary/5 border-t border-primary/10">
          <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center gap-1 h-11">
            <div className="relative" ref={catRef}>
              <button onClick={() => setCatOpen(!catOpen)} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors', catOpen ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/60')}>
                <Menu className="size-4" />Categorías<ChevronDown className={cn('size-3 transition-transform', catOpen && 'rotate-180')} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto scroll-thin">
                  <div className="p-2">
                    <button onClick={() => selectCategory('all')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted rounded-md font-medium">Todas las categorías</button>
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <button onClick={() => selectCategory(cat.id)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted rounded-md font-medium">{cat.name}</button>
                        {cat.children && cat.children.length > 0 && (
                          <div className="pl-4">{cat.children.map((sub) => <button key={sub.id} onClick={() => selectCategory(sub.id)} className="w-full text-left px-3 py-1 text-xs text-muted-foreground hover:bg-muted rounded-md">{sub.name}</button>)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {navItem('Inicio', 'marketplace', Home)}
            {canAccessModule(displayUser?.role, 'affiliates') && (
              <button onClick={() => setModule('affiliates')} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors', activeModule === 'affiliates' ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/60')}><Users className="size-4" />Comunidad</button>
            )}
            <a href="https://dimarclub.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:text-primary hover:bg-muted/60 transition-colors"><Sparkles className="size-4" />Dimarclub</a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:text-primary hover:bg-muted/60 transition-colors"><Store className="size-4" />Proveedor<ChevronDown className="size-3" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Zona de proveedores</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openLogin('login')}><LogIn className="size-4 mr-2" /> Iniciar sesión</DropdownMenuItem>
                <DropdownMenuItem onClick={() => openLogin('register', 'SUPPLIER')}><UserPlus className="size-4 mr-2" /> No tienes cuenta, crear una</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setModule('suppliers')}><Store className="size-4 mr-2" /> Proveedores</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => toast('Próximamente: Alquiler de departamentos', 'info')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:text-primary hover:bg-muted/60 transition-colors"><Building2 className="size-4" />Alquiler</button>
            <button onClick={() => setModule('grid')} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors', activeModule === 'grid' ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/60')}><Grid3x3 className="size-4" />Grid 360</button>
            {displayUser?.role === 'SUPPLIER' && (
              <button onClick={() => setModule('supplier-backoffice')} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-md transition-colors', activeModule === 'supplier-backoffice' ? 'text-primary bg-primary/10' : 'text-primary hover:bg-primary/5')}><Store className="size-4" />Mi Backoffice</button>
            )}
            {(displayUser?.role === 'CLIENT' || displayUser?.role === 'AFFILIATE' || displayUser?.role === 'ADMIN') && (
              <button onClick={() => setModule('cooperativa')} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors', activeModule === 'cooperativa' ? 'text-primary bg-primary/10' : 'text-foreground hover:text-primary hover:bg-muted/60')}><PiggyBank className="size-4" />Cooperativa</button>
            )}
            {displayUser?.role === 'ADMIN' && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"><Settings className="size-4" />Admin<ChevronDown className="size-3" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-primary font-bold">Panel de administración</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setModule('dashboard')}><LayoutDashboard className="size-4 mr-2" /> Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('suppliers')}><Store className="size-4 mr-2" /> Proveedores</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('logistics')}><Truck className="size-4 mr-2" /> Logística</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('zones')}><MapPin className="size-4 mr-2" /> Zonas de cobertura</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('crm')}><Users className="size-4 mr-2" /> CRM</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('email')}><Mail className="size-4 mr-2" /> Email Marketing</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('ads')}><Megaphone className="size-4 mr-2" /> Publicidad</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('applications')}><ClipboardList className="size-4 mr-2" /> Solicitudes</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">ImpulsePymes360</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setModule('impulse')}><Rocket className="size-4 mr-2" /> Panel Impulse360</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('impulse-wizard')}><Zap className="size-4 mr-2" /> Onboarding</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('web-express')}><Globe className="size-4 mr-2" /> Web Express</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setModule('site-admin')}><Settings className="size-4 mr-2" /> Config del sitio</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto scroll-thin">
              <button onClick={() => setCatOpen(!catOpen)} className="w-full text-left px-3 py-2 text-sm font-medium rounded-md hover:bg-muted flex items-center justify-between"><span className="flex items-center gap-1.5"><Menu className="size-4" /> Categorías</span><ChevronDown className={cn('size-3', catOpen && 'rotate-180')} /></button>
              {catOpen && (
                <div className="pl-4 space-y-0.5">
                  <button onClick={() => selectCategory('all')} className="w-full text-left px-3 py-1 text-sm hover:bg-muted rounded-md">Todas</button>
                  {categories.map((cat) => <button key={cat.id} onClick={() => selectCategory(cat.id)} className="w-full text-left px-3 py-1 text-sm hover:bg-muted rounded-md">{cat.name}</button>)}
                </div>
              )}
              {navItem('Inicio', 'marketplace', Home)}
              {canAccessModule(displayUser?.role, 'affiliates') && navItem('Comunidad', 'affiliates', Users)}
              {navItem('Grid 360', 'grid', Grid3x3)}
              <a href="https://dimarclub.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted"><Sparkles className="size-4" /> Dimarclub</a>
              {navItem('Proveedor', 'suppliers', Store)}
              <button onClick={() => toast('Próximamente', 'info')} className="w-full flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-left"><Building2 className="size-4" /> Alquiler</button>
            </div>
          </div>
        )}
      </header>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} defaultTab={loginTab} defaultRole={registerRole as 'CLIENT' | 'AFFILIATE'} />

      <style jsx global>{`
        .marquee-track { white-space: nowrap; animation: marquee 40s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </>
  )
}
