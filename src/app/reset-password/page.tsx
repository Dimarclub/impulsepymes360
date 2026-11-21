'use client'

import { Suspense } from 'react'
import ResetPasswordForm from './form'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0B1120',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A9B6CB',
      }}>
        Cargando...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
