'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

/**
 * Wrapper de cliente para el SessionProvider de next-auth/react.
 * Provee la sesión de NextAuth a toda la app (client-side).
 */
export function AppSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
