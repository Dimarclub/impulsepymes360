import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, type SessionUser } from '@/lib/security/auth'

/**
 * /api/promo-codes
 *
 * Sistema de códigos promocionales — descuentos al escanear QR.
 *
 * GET  (público con ?code=...): valida un código promocional.
 *       Devuelve { valid: true, discountPct, discountAmount, description }
 *       o { valid: false, reason: '...' }.
 *
 * GET  (ADMIN, sin ?code=): lista todos los códigos promocionales con sus
 *       relaciones (adSpace / provider) + conteo de usos actuales.
 *
 * POST (ADMIN | SUPPLIER): crea un código promocional.
 *       Body: { code, adSpaceId?, providerId?, discountPct?, discountAmount?,
 *               description?, expiresAt?, maxUses? }
 *       - Valida que `code` sea único y no vacío.
 *       - Valida que al menos uno de (discountPct | discountAmount) esté seteado.
 *       - Valida que expiresAt (si viene) sea fecha futura.
 *       - Si es SUPPLIER, vincula automáticamente el providerId del proveedor
 *         del usuario autenticado (si no se envió providerId en el body).
 */

// ---------- GET ----------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const codeParam = searchParams.get('code')

  // ---- Caso 1: validación pública de un código ----
  if (codeParam) {
    const code = codeParam.trim().toUpperCase()
    if (!code) {
      return NextResponse.json(
        { valid: false, reason: 'Código vacío.' },
        { status: 200 },
      )
    }

    try {
      const promo = await db.promoCode.findUnique({
        where: { code },
      })
      if (!promo) {
        return NextResponse.json(
          { valid: false, reason: 'El código no existe.' },
          { status: 200 },
        )
      }

      // Validaciones de estado
      if (promo.status !== 'ACTIVE') {
        const reason =
          promo.status === 'PAUSED'
            ? 'Este código promocional está pausado.'
            : 'Este código promocional ya no está disponible.'
        return NextResponse.json({ valid: false, reason }, { status: 200 })
      }

      // Validación de expiración
      if (promo.expiresAt && promo.expiresAt <= new Date()) {
        return NextResponse.json(
          { valid: false, reason: 'Este código promocional ha expirado.' },
          { status: 200 },
        )
      }

      // Validación de usos máximos
      if (promo.maxUses != null && promo.currentUses >= promo.maxUses) {
        return NextResponse.json(
          {
            valid: false,
            reason: 'Este código promocional alcanzó su número máximo de usos.',
          },
          { status: 200 },
        )
      }

      return NextResponse.json(
        {
          valid: true,
          discountPct: promo.discountPct,
          discountAmount: promo.discountAmount,
          description: promo.description,
        },
        { status: 200 },
      )
    } catch (err) {
      console.error('[api/promo-codes GET validate] error:', err)
      return NextResponse.json(
        { valid: false, reason: 'Error del servidor.' },
        { status: 500 },
      )
    }
  }

  // ---- Caso 2: listado admin ----
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  try {
    const promos = await db.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        adSpace: {
          select: {
            id: true,
            position: true,
            edition: { select: { id: true, name: true } },
          },
        },
        provider: {
          select: { id: true, companyName: true, logoUrl: true, websiteSlug: true },
        },
      },
    })

    const result = promos.map((p) => ({
      id: p.id,
      code: p.code,
      adSpaceId: p.adSpaceId,
      providerId: p.providerId,
      discountPct: p.discountPct,
      discountAmount: p.discountAmount,
      description: p.description,
      expiresAt: p.expiresAt,
      maxUses: p.maxUses,
      currentUses: p.currentUses,
      status: p.status,
      createdAt: p.createdAt,
      adSpace: p.adSpace
        ? {
            id: p.adSpace.id,
            position: p.adSpace.position,
            editionName: p.adSpace.edition?.name ?? null,
          }
        : null,
      provider: p.provider
        ? {
            id: p.provider.id,
            companyName: p.provider.companyName,
            logoUrl: p.provider.logoUrl,
            websiteSlug: p.provider.websiteSlug,
          }
        : null,
    }))

    return NextResponse.json({ ok: true, promoCodes: result })
  } catch (err) {
    console.error('[api/promo-codes GET list] error:', err)
    return NextResponse.json(
      { error: 'No se pudo listar los códigos promocionales' },
      { status: 500 },
    )
  }
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth
  const user = auth as SessionUser

  let body: {
    code?: string
    adSpaceId?: string | null
    providerId?: string | null
    discountPct?: number | string | null
    discountAmount?: number | string | null
    description?: string | null
    expiresAt?: string | null
    maxUses?: number | string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const code = (body.code || '').trim().toUpperCase()
  if (!code) {
    return NextResponse.json(
      { error: 'El código es obligatorio' },
      { status: 400 },
    )
  }

  // Validar unicidad
  const existing = await db.promoCode.findUnique({ where: { code } })
  if (existing) {
    return NextResponse.json(
      { error: `Ya existe un código promocional con el código "${code}".` },
      { status: 409 },
    )
  }

  // Parseo numérico (acepta string o número)
  const discountPct =
    body.discountPct != null && body.discountPct !== ''
      ? Math.round(Number(body.discountPct))
      : null
  const discountAmount =
    body.discountAmount != null && body.discountAmount !== ''
      ? Number(body.discountAmount)
      : null
  const maxUses =
    body.maxUses != null && body.maxUses !== ''
      ? Math.round(Number(body.maxUses))
      : null

  if (discountPct == null && discountAmount == null) {
    return NextResponse.json(
      {
        error:
          'Debes especificar al menos un descuento (discountPct o discountAmount).',
      },
      { status: 400 },
    )
  }
  if (discountPct != null && (discountPct < 1 || discountPct > 100)) {
    return NextResponse.json(
      { error: 'discountPct debe estar entre 1 y 100.' },
      { status: 400 },
    )
  }
  if (discountAmount != null && discountAmount <= 0) {
    return NextResponse.json(
      { error: 'discountAmount debe ser mayor a 0.' },
      { status: 400 },
    )
  }
  if (maxUses != null && maxUses < 1) {
    return NextResponse.json(
      { error: 'maxUses debe ser mayor o igual a 1.' },
      { status: 400 },
    )
  }

  // expiresAt (ISO string) → debe ser futura
  let expiresAt: Date | null = null
  if (body.expiresAt && body.expiresAt.trim() !== '') {
    const parsed = new Date(body.expiresAt)
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: 'expiresAt inválida.' },
        { status: 400 },
      )
    }
    if (parsed <= new Date()) {
      return NextResponse.json(
        { error: 'expiresAt debe ser una fecha futura.' },
        { status: 400 },
      )
    }
    expiresAt = parsed
  }

  // Resolver providerId según el rol
  let providerId: string | null = body.providerId?.trim() || null
  if (user.role === 'SUPPLIER') {
    // El proveedor del usuario autenticado
    const provider = await db.provider.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!provider) {
      return NextResponse.json(
        { error: 'No tienes un perfil de proveedor. Contacta al administrador.' },
        { status: 403 },
      )
    }
    // Si envió providerId distinto al propio, lo rechazamos (solo admin puede
    // asignar a terceros).
    if (providerId && providerId !== provider.id) {
      return NextResponse.json(
        {
          error: 'Solo un administrador puede crear códigos para otros proveedores.',
        },
        { status: 403 },
      )
    }
    providerId = provider.id
  } else if (providerId) {
    // ADMIN: validar que el provider exista
    const provider = await db.provider.findUnique({
      where: { id: providerId },
      select: { id: true },
    })
    if (!provider) {
      return NextResponse.json(
        { error: 'El proveedor indicado no existe.' },
        { status: 404 },
      )
    }
  }

  // Validar adSpaceId si viene
  const adSpaceId = body.adSpaceId?.trim() || null
  if (adSpaceId) {
    const adSpace = await db.adSpace.findUnique({
      where: { id: adSpaceId },
      select: { id: true },
    })
    if (!adSpace) {
      return NextResponse.json(
        { error: 'El espacio publicitario indicado no existe.' },
        { status: 404 },
      )
    }
  }

  const description = body.description?.trim() || null

  try {
    const promo = await db.promoCode.create({
      data: {
        code,
        adSpaceId,
        providerId,
        discountPct,
        discountAmount,
        description,
        expiresAt,
        maxUses,
        currentUses: 0,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ ok: true, promoCode: promo }, { status: 201 })
  } catch (err) {
    console.error('[api/promo-codes POST] error:', err)
    return NextResponse.json(
      { error: 'No se pudo crear el código promocional.' },
      { status: 500 },
    )
  }
}
