'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'
import { Component, ReactNode } from 'react'

/**
 * Wrapper de cliente para el SessionProvider de next-auth/react.
 * Provee la sesión de NextAuth a toda la app (client-side).
 * Incluye un ErrorBoundary para evitar que un error de NextAuth
 * tire toda la aplicación (client-side exception).
 */
class SessionErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    console.warn('SessionProvider error (no bloquea la app):', error.message)
  }
  render() {
    if (this.state.hasError) {
      // Renderizar children sin SessionProvider; la app funciona en modo "sin sesión"
      return this.props.children
    }
    return this.props.children
  }
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  return (
    <SessionErrorBoundary>
      <SessionProvider>{children}</SessionProvider>
    </SessionErrorBoundary>
  )
}
