import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import {
  getPlanConfig,
  generateStickerCode,
  generateShortQrCode,
} from '@/lib/album-config'

/**
 * /api/album/stickers/[id]
 *
 * POST  (ADMIN): crea un cromo para una entrada del directorio (proveedor).
 * PATCH (ADMIN): actualiza un cromo existente.
 * DELETE (ADMIN): elimina un cromo.
 *
 * POST body:
 *  - directoryEntryId: string (requerido)
 *  - planLevel: 1-6 (requerido) — auto-configura size/hasQR/etc
 *  - name?: string (default: nombre del proveedor)
 *  - override?: { stickerSize?, hasQR?, hasLogo?, hasBanner?, bannerType?, hasMarketplaceAd? }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  // El `id` en la ruta se ignora para POST (es un placeholder para mantener
  // el patrón REST; usamos directoryEntryId del body). Consumimos el Promise
  // de params para evitar advertencias de "floating promise".
  void params

  let body: {
    directoryEntryId?: string
    planLevel?: number
    name?: string
    override?: {
      stickerSize?: string
      hasQR?: boolean
      hasLogo?: boolean
      hasBanner?: boolean
      bannerType?: string
      hasMarketplaceAd?: boolean
    }
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { directoryEntryId, planLevel } = body
  if (!directoryEntryId) {
    return NextResponse.json(
      { error: 'Debes seleccionar un proveedor' },
      { status: 400 },
    )
  }
  const level = Number(planLevel)
  if (!level || level < 1 || level > 6) {
    return NextResponse.json(
      { error: 'planLevel debe estar entre 1 y 6' },
      { status: 400 },
    )
  }

  try {
    const dirEntry = await db.directoryEntry.findUnique({
      where: { id: directoryEntryId },
      include: {
        provider: {
          select: { id: true, companyName: true, websiteSlug: true, logoUrl: true },
        },
      },
    })
    if (!dirEntry) {
      return NextResponse.json(
        { error: 'Entrada de directorio no encontrada' },
        { status: 404 },
      )
    }

    // Verificar que no exista ya un sticker para este directorio
    const existing = await db.sticker.findFirst({
      where: { directoryEntryId },
    })
    if (existing) {
      return NextResponse.json(
        {
          error: 'Este proveedor ya tiene un cromo. Edita el existente o elimínalo primero.',
        },
        { status: 409 },
      )
    }

    const cfg = getPlanConfig(level)
    const override = body.override || {}
    const provider = dirEntry.provider
    const name = (body.name || provider?.companyName || 'Cromo').trim()
    const stickerSize = override.stickerSize || cfg.size
    const hasQR = override.hasQR ?? cfg.hasQR
    const hasLogo = override.hasLogo ?? cfg.hasLogo
    const hasBanner = override.hasBanner ?? cfg.hasBanner
    const bannerType = override.bannerType ?? cfg.bannerType ?? null
    const hasMarketplaceAd = override.hasMarketplaceAd ?? cfg.hasMarketplaceAd

    // Generar código único
    const prefix = provider?.companyName?.slice(0, 4) || 'CROM'
    let code = generateStickerCode(prefix)
    let attempts = 0
    while (await db.sticker.findUnique({ where: { code } })) {
      code = generateStickerCode(prefix)
      attempts += 1
      if (attempts > 10) break
    }

    // Código QR corto (único, no validado estrictamente)
    const qrCode = generateShortQrCode()
    const qrTargetUrl = provider?.websiteSlug
      ? `/w/${provider.websiteSlug}`
      : `/directorio`

    const imageUrl = provider?.logoUrl || `https://picsum.photos/seed/${provider?.websiteSlug || code}/300/300`

    const sticker = await db.sticker.create({
      data: {
        directoryEntryId,
        name,
        imageUrl,
        code,
        rarity: level >= 5 ? 'GOLDEN' : level >= 3 ? 'RARE' : 'COMMON',
        planLevel: level,
        stickerSize,
        hasQR,
        hasLogo,
        hasBanner,
        bannerType,
        hasMarketplaceAd,
        qrCode,
        qrTargetUrl,
      },
      include: {
        directoryEntry: {
          include: {
            provider: {
              select: { id: true, companyName: true, category: true, logoUrl: true, websiteSlug: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ ok: true, sticker }, { status: 201 })
  } catch (err) {
    console.error('[api/album/stickers/[id]] POST error:', err)
    return NextResponse.json(
      { error: 'No se pudo crear el cromo' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  let body: {
    planLevel?: number
    name?: string
    stickerSize?: string
    hasQR?: boolean
    hasLogo?: boolean
    hasBanner?: boolean
    bannerType?: string | null
    hasMarketplaceAd?: boolean
    imageUrl?: string
    qrTargetUrl?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const existing = await db.sticker.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cromo no encontrado' }, { status: 404 })
    }

    // Si cambia planLevel, re-aplicar la config del plan (salvo override explícito)
    const data: Record<string, unknown> = {}
    if (body.planLevel != null && body.planLevel !== existing.planLevel) {
      const cfg = getPlanConfig(body.planLevel)
      data.planLevel = body.planLevel
      data.stickerSize = body.stickerSize ?? cfg.size
      data.hasQR = body.hasQR ?? cfg.hasQR
      data.hasLogo = body.hasLogo ?? cfg.hasLogo
      data.hasBanner = body.hasBanner ?? cfg.hasBanner
      data.bannerType = body.bannerType !== undefined ? body.bannerType : cfg.bannerType ?? null
      data.hasMarketplaceAd = body.hasMarketplaceAd ?? cfg.hasMarketplaceAd
      data.rarity =
        body.planLevel >= 5 ? 'GOLDEN' : body.planLevel >= 3 ? 'RARE' : 'COMMON'
    } else {
      if (body.name != null) data.name = body.name
      if (body.stickerSize != null) data.stickerSize = body.stickerSize
      if (body.hasQR != null) data.hasQR = body.hasQR
      if (body.hasLogo != null) data.hasLogo = body.hasLogo
      if (body.hasBanner != null) data.hasBanner = body.hasBanner
      if (body.bannerType !== undefined) data.bannerType = body.bannerType
      if (body.hasMarketplaceAd != null) data.hasMarketplaceAd = body.hasMarketplaceAd
    }
    if (body.imageUrl != null) data.imageUrl = body.imageUrl
    if (body.qrTargetUrl != null) data.qrTargetUrl = body.qrTargetUrl

    const updated = await db.sticker.update({
      where: { id },
      data,
      include: {
        directoryEntry: {
          include: {
            provider: {
              select: { id: true, companyName: true, category: true, logoUrl: true, websiteSlug: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ ok: true, sticker: updated })
  } catch (err) {
    console.error('[api/album/stickers/[id]] PATCH error:', err)
    return NextResponse.json(
      { error: 'No se pudo actualizar el cromo' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  try {
    const existing = await db.sticker.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Cromo no encontrado' }, { status: 404 })
    }

    await db.sticker.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/album/stickers/[id]] DELETE error:', err)
    return NextResponse.json(
      { error: 'No se pudo eliminar el cromo' },
      { status: 500 },
    )
  }
}
