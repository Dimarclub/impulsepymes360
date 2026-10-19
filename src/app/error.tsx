'use client'

import { Button } from '@/components/ui/button'

/**
 * Error boundary a nivel de ruta (App Router).
 * Captura errores de runtime que no captura GlobalErrorBoundary.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-2xl">D</span>
        </div>
        <h1 className="text-xl font-bold">Dimarclub</h1>
        <p className="text-sm text-muted-foreground">
          Ocurrió un error al cargar la página. Puedes intentar de nuevo.
        </p>
        {error?.message && (
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={reset} className="flex-1">
            Reintentar
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </Button>
        </div>
      </div>
    </div>
  )
}
