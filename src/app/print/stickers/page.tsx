import { db } from '@/lib/db'
import {
  PLAN_STICKER_CONFIG,
  STICKER_DIMENSIONS,
  type PlanStickerConfig,
} from '@/lib/album-config'
import { PrintStickersView } from '@/components/dimar/print-stickers'
import { requireRole } from '@/lib/security/auth'
import { NextResponse } from 'next/server'

// Página de impresión de cromos para el álbum.
// Renderiza todos los cromos a tamaño físico (cm), agrupados por plan level.
// Optimizada para imprimir/guardar como PDF (Ctrl+P).
export const dynamic = 'force-dynamic'

interface PrintSticker {
  id: string
  name: string
  code: string
  planLevel: number
  stickerSize: string
  hasQR: boolean
  hasLogo: boolean
  hasBanner: boolean
  bannerType: string | null
  hasMarketplaceAd: boolean
  qrCode: string | null
  qrTargetUrl: string | null
  imageUrl: string | null
  provider: {
    companyName: string | null
    phone: string | null
    mobile: string | null
    address: string | null
    city: string | null
    logoUrl: string | null
    websiteSlug: string | null
  } | null
}

export default async function PrintStickersPage() {
  // Proteger el acceso: solo ADMIN
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800">Acceso restringido</h1>
          <p className="text-sm text-slate-500 mt-2">
            Solo los administradores pueden acceder a esta página. Inicia sesión
            con una cuenta de admin.
          </p>
        </div>
      </div>
    )
  }

  const rows = await db.sticker.findMany({
    include: {
      directoryEntry: {
        include: {
          provider: {
            select: {
              id: true,
              companyName: true,
              phone: true,
              mobile: true,
              address: true,
              city: true,
              logoUrl: true,
              websiteSlug: true,
            },
          },
        },
      },
    },
    orderBy: [{ planLevel: 'asc' }, { name: 'asc' }],
  })

  const stickers: PrintSticker[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    planLevel: s.planLevel,
    stickerSize: s.stickerSize,
    hasQR: s.hasQR,
    hasLogo: s.hasLogo,
    hasBanner: s.hasBanner,
    bannerType: s.bannerType,
    hasMarketplaceAd: s.hasMarketplaceAd,
    qrCode: s.qrCode,
    qrTargetUrl: s.qrTargetUrl,
    imageUrl: s.imageUrl,
    provider: s.directoryEntry?.provider
      ? {
          companyName: s.directoryEntry.provider.companyName,
          phone: s.directoryEntry.provider.phone,
          mobile: s.directoryEntry.provider.mobile,
          address: s.directoryEntry.provider.address,
          city: s.directoryEntry.provider.city,
          logoUrl: s.directoryEntry.provider.logoUrl,
          websiteSlug: s.directoryEntry.provider.websiteSlug,
        }
      : null,
  }))

  // Agrupar por planLevel
  const groups: { cfg: PlanStickerConfig; stickers: PrintSticker[] }[] = []
  const byLevel: Record<number, PrintSticker[]> = {}
  for (const s of stickers) {
    if (!byLevel[s.planLevel]) byLevel[s.planLevel] = []
    byLevel[s.planLevel].push(s)
  }
  const sortedLevels = Object.keys(byLevel)
    .map(Number)
    .sort((a, b) => a - b)
  for (const lvl of sortedLevels) {
    const cfg = PLAN_STICKER_CONFIG.find((c) => c.level === lvl) ?? {
      level: lvl,
      plan: `Nivel ${lvl}`,
      size: '8x4' as const,
      hasQR: true,
      hasLogo: false,
      hasBanner: false,
      hasMarketplaceAd: false,
      description: '',
    }
    groups.push({ cfg, stickers: byLevel[lvl] })
  }

  // Serializar (Date → string) para el cliente
  const serializable = groups.map((g) => ({
    cfg: g.cfg,
    stickers: g.stickers,
  }))

  return <PrintStickersView groups={JSON.parse(JSON.stringify(serializable))} />
}
