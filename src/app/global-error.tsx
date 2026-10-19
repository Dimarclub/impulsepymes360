'use client'

/**
 * Captura errores globales no capturados por error.tsx (errores en root layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafaf9' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', margin: '0 auto 16px',
              borderRadius: '16px', background: 'linear-gradient(135deg, #0d9488, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '24px', fontWeight: 'bold',
            }}>
              D
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>
              Dimarclub
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Ocurrió un error. Recargando la página debería solucionarlo.
            </p>
            {error?.message && (
              <p style={{ fontSize: '11px', color: '#9ca3af', background: '#f3f4f6', padding: '8px', borderRadius: '6px', fontFamily: 'monospace', marginBottom: '16px', wordBreak: 'break-all' }}>
                {error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#0d9488', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '8px', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer', width: '100%',
              }}
            >
              Recargar aplicación
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
