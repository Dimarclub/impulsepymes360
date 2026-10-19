'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

/**
 * ErrorBoundary global: captura cualquier error de runtime en el cliente
 * y muestra un fallback elegante en lugar del "Application error" de Next.js.
 */
interface State {
  hasError: boolean
  error?: Error
}

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('Error capturado por GlobalErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="size-14 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">D</span>
            </div>
            <h1 className="text-xl font-bold">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground">
              Ocurrió un error al cargar la aplicación. Puedes intentar recargar la página.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                {this.state.error.message}
              </p>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
              className="w-full"
            >
              Recargar aplicación
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
