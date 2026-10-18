'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ModuleId, DemoUser, CartLine } from './types'

interface AppState {
  // Usuario demo activo (para simular login sin auth real)
  currentUser: DemoUser | null
  setUser: (u: DemoUser | null) => void

  // Módulo activo
  activeModule: ModuleId
  setModule: (m: ModuleId) => void

  // Carrito de compras
  cart: CartLine[]
  addToCart: (line: CartLine) => void
  removeFromCart: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void

  // Toasts/mensajes
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

// Usuarios demo precargados (simulan sesión sin NextAuth)
const DEMO_USERS: DemoUser[] = [
  { id: 'admin', name: 'Carlos Dimar', email: 'admin@dimarclub.com', role: 'ADMIN', city: 'Guayaquil', phone: '099111111', affiliateCode: 'DIMAR-001' },
  { id: 'affiliate', name: 'Ana Mendoza', email: 'ana@dimarclub.com', role: 'AFFILIATE', city: 'Quito', phone: '099222222', affiliateCode: 'ANA-002' },
  { id: 'client', name: 'Pedro López', email: 'pedro@dimarclub.com', role: 'CLIENT', city: 'Manta', phone: '099555555', affiliateCode: 'PEDR-005' },
  { id: 'supplier', name: 'TecnoExpress', email: 'ventas@tecnoexpress.com', role: 'SUPPLIER', city: 'Guayaquil', phone: '042222333' },
  { id: 'partner', name: 'Roberto Aguilar', email: 'socio1@dimarclub.com', role: 'PARTNER', city: 'Guayaquil', phone: '098111222' },
]

export const demoUsers = DEMO_USERS

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null, // se sincroniza con la DB al cargar el topbar
      setUser: (u) => set({ currentUser: u }),

      activeModule: 'marketplace',
      setModule: (m) => set({ activeModule: m }),

      cart: [],
      addToCart: (line) =>
        set((s) => {
          const existing = s.cart.find((c) => c.productId === line.productId)
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === line.productId ? { ...c, quantity: c.quantity + line.quantity } : c
              ),
            }
          }
          return { cart: [...s.cart, line] }
        }),
      removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      updateQty: (productId, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((c) => c.productId !== productId)
              : s.cart.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
        })),
      clearCart: () => set({ cart: [] }),

      toast: (msg, type = 'success') => {
        // delegar al hook de sonner si está disponible
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dimar-toast', { detail: { msg, type } }))
        }
      },
    }),
    {
      name: 'dimarclub-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeModule: s.activeModule, cart: s.cart }),
    }
  )
)
