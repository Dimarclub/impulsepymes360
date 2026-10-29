import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { PLAN_STICKER_CONFIG } from '@/lib/album-config'

/**
 * /api/album/stickers
 *
 * GET (ADMIN): lista todos los cromos agrupados por planLevel para la vista
 * de impresión y gestión administrativa.
 */
export async function GET() {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  try {
    const stickers = await db.sticker.findMany({
      include: {
        directoryEntry: {
          include: {
            provider: {
              select: {
                id: true,
                companyName: true,
                category: true,
                logoUrl: true,
                websiteSlug: true,
                city: true,
                phone: true,
                address: true,
              },
            },
          },
        },
        _count: { select: { albumProgress: true } },
      },
      orderBy: [{ planLevel: 'asc' }, { name: 'asc' }],
    })

    // Agrupar por planLevel
    const byPlan: Record<
      number,
      {
        level: number
        plan: string
        size: string
        config: (typeof PLAN_STICKER_CONFIG)[number]
        stickers: typeof stickers
      }
    > = {}

    for (const cfg of PLAN_STICKER_CONFIG) {
      byPlan[cfg.level] = {
        level: cfg.level,
        plan: cfg.plan,
        size: cfg.size,
        config: cfg,
        stickers: [],
      }
    }

    for (const s of stickers) {
      const lvl = s.planLevel
      if (!byPlan[lvl]) {
        // planLevel fuera de rango: agrupar en "Otros"
        byPlan[lvl] = {
          level: lvl,
          plan: `Nivel ${lvl}`,
          size: s.stickerSize,
          config: PLAN_STICKER_CONFIG[0],
          stickers: [],
        }
      }
      byPlan[lvl].stickers.push(s)
    }

    return NextResponse.json({
      ok: true,
      total: stickers.length,
      groups: Object.values(byPlan).sort((a, b) => a.level - b.level),
      stickers, // flat list también, para conveniencia del cliente
    })
  } catch (err) {
    console.error('[api/album/stickers] GET error:', err)
    return NextResponse.json(
      { error: 'No se pudo listar los cromos' },
      { status: 500 },
    )
  }
}
