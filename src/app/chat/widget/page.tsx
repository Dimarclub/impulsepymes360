import { Suspense } from 'react'
import { WidgetVisitor } from './widget-visitor'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Chat de soporte · DimarClub',
  description: 'Chatea en vivo con el equipo del negocio.',
}

/**
 * Página pública standalone que simula el chat widget del lado del visitante.
 * Lee `userId` y `name` (opcional) desde la query string.
 * Es un Server Component: solo renderiza el shell y delega la interacción
 * al cliente `WidgetVisitor`.
 */
export default async function ChatWidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; name?: string }>
}) {
  const params = await searchParams
  const userId = (params.userId || '').trim() || null
  const presetName = (params.name || '').trim() || null

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col">
      <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-8">
        <Suspense fallback={null}>
          <WidgetVisitor userId={userId} presetName={presetName} />
        </Suspense>
      </main>
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by{' '}
        <span className="font-semibold text-emerald-700">DimarClub</span>
      </footer>
    </div>
  )
}
