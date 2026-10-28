// Configuración del Sistema de Álbum + Cromos
// Cada plan de proveedor genera automáticamente un cromo (sticker) con
// tamaño + calidad según el nivel contratado.

export interface PlanStickerConfig {
  level: number
  plan: string
  size: '8x2' | '8x4' | '4x4' | '14x4' | '24x4'
  hasQR: boolean
  hasLogo: boolean
  hasBanner: boolean
  bannerType?: 'horizontal' | 'vertical'
  hasMarketplaceAd: boolean
  description: string
}

export const PLAN_STICKER_CONFIG: PlanStickerConfig[] = [
  {
    level: 1,
    plan: '$67',
    size: '8x2',
    hasQR: false,
    hasLogo: false,
    hasBanner: false,
    hasMarketplaceAd: false,
    description: 'Nombre + datos básicos. Sin QR ni logo.',
  },
  {
    level: 2,
    plan: '$122',
    size: '8x4',
    hasQR: true,
    hasLogo: false,
    hasBanner: false,
    hasMarketplaceAd: false,
    description: 'QR + nombre + datos + dirección.',
  },
  {
    level: 3,
    plan: '$253',
    size: '4x4',
    hasQR: true,
    hasLogo: true,
    hasBanner: false,
    hasMarketplaceAd: false,
    description: 'QR + nombre + datos + logo de la marca.',
  },
  {
    level: 4,
    plan: '$363',
    size: '14x4',
    hasQR: true,
    hasLogo: true,
    hasBanner: true,
    bannerType: 'horizontal',
    hasMarketplaceAd: false,
    description: 'QR + datos + banner horizontal 14×4cm.',
  },
  {
    level: 5,
    plan: '$478',
    size: '24x4',
    hasQR: true,
    hasLogo: true,
    hasBanner: true,
    bannerType: 'vertical',
    hasMarketplaceAd: false,
    description: 'QR + datos + banner vertical 24×4cm (lateral del álbum).',
  },
  {
    level: 6,
    plan: '$592+',
    size: '24x4',
    hasQR: true,
    hasLogo: true,
    hasBanner: true,
    bannerType: 'vertical',
    hasMarketplaceAd: true,
    description: 'Todo lo anterior + espacio publicitario en marketplace.',
  },
]

export function getPlanConfig(level: number): PlanStickerConfig {
  return (
    PLAN_STICKER_CONFIG.find((c) => c.level === level) ?? PLAN_STICKER_CONFIG[0]
  )
}

// Tamaño físico en cm para render del cromo imprimible
export const STICKER_DIMENSIONS: Record<PlanStickerConfig['size'], { w: number; h: number }> = {
  '8x2': { w: 8, h: 2 },
  '8x4': { w: 8, h: 4 },
  '4x4': { w: 4, h: 4 },
  '14x4': { w: 14, h: 4 },
  '24x4': { w: 24, h: 4 },
}

// Monto del premio por llenar el álbum
export const ALBUM_PRIZE_AMOUNT = 200

// Genera un código único legible para el cromo (mayúsculas, 6-8 chars)
export function generateStickerCode(prefix: string): string {
  const clean = prefix
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(4, 'X')
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${clean}-${num}`
}

// Genera un código corto para el QR (8 chars alfanuméricos)
export function generateShortQrCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

// URL pública del QR (api.qrserver.com)
export function buildQrImageUrl(targetUrl: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    targetUrl,
  )}`
}
