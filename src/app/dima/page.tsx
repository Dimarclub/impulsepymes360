import type { Metadata, Viewport } from 'next'
import { AppSessionProvider } from '@/components/dimar/auth/auth-provider'
import DimaApp from './dima-app'

export const metadata: Metadata = {
  title: 'Dima — Robot buscador con voz | DimarClub',
  description:
    'Escanea y habla con Dima. Buscador con IA que te conecta con proveedores cerca de ti en Ecuador.',
  manifest: '/dima-manifest.json',
  icons: {
    icon: '/dima-icon.svg',
    apple: '/dima-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Dima',
  },
  openGraph: {
    title: 'Dima — Robot buscador con voz',
    description: 'Escanea y habla con Dima.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#00D4AA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function DimaPage() {
  return (
    <AppSessionProvider>
      <DimaApp />
    </AppSessionProvider>
  )
}
