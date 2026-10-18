'use client'

import {
  ShoppingBag,
  LayoutDashboard,
  Network,
  Store,
  HandCoins,
  Truck,
  Users,
  Mail,
  Megaphone,
  ClipboardList,
  Gift,
  type LucideIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { ModuleId } from '@/lib/types'

interface NavItem {
  id: ModuleId
  label: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Tienda',
    items: [{ id: 'marketplace', label: 'Marketplace', icon: ShoppingBag }],
  },
  {
    title: 'Administración',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'suppliers', label: 'Proveedores', icon: Store },
      { id: 'logistics', label: 'Logística', icon: Truck },
      { id: 'crm', label: 'CRM', icon: Users },
      { id: 'email', label: 'Email Marketing', icon: Mail },
      { id: 'ads', label: 'Publicidad', icon: Megaphone },
      { id: 'applications', label: 'Solicitudes', icon: ClipboardList },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      { id: 'affiliates', label: 'Afiliados', icon: Network },
      { id: 'partners', label: 'Socios', icon: HandCoins },
      { id: 'benefits', label: 'Beneficios', icon: Gift },
    ],
  },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-5 border-b">
      <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm shrink-0">
        <span className="text-primary-foreground font-bold text-lg leading-none">D</span>
      </div>
      <div className="min-w-0">
        <p className="font-bold text-base leading-tight truncate">Dimarclub</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Marketplace & Afiliados
        </p>
      </div>
    </div>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const activeModule = useAppStore((s) => s.activeModule)
  const setModule = useAppStore((s) => s.setModule)

  return (
    <nav className="flex-1 overflow-y-auto scroll-thin px-2 py-3">
      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-4">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              const active = activeModule === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setModule(item.id)
                    onNavigate?.()
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left',
                    active
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border-l-2 border-transparent'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  return (
    <div className="border-t p-4 text-xs">
      <p className="font-medium text-foreground">¿Necesitas ayuda?</p>
      <p className="mt-0.5 text-muted-foreground">soporte@dimarclub.com</p>
      <p className="mt-2 text-[10px] text-muted-foreground">v1.0 · Ecuador</p>
    </div>
  )
}

export function Sidebar({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-[260px] shrink-0 flex-col border-r bg-sidebar/40">
        <Brand />
        <NavList />
        <SidebarFooter />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-[260px] sm:max-w-[260px] p-0 gap-0 flex flex-col"
        >
          <SheetTitle className="sr-only">Navegación principal</SheetTitle>
          <SheetDescription className="sr-only">
            Selecciona un módulo para navegar dentro de Dimarclub
          </SheetDescription>
          <Brand />
          <NavList onNavigate={() => onOpenChange(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>
    </>
  )
}
