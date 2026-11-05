import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * /api/promo-codes/[id]
 *
 * PATCH  (ADMIN): actualiza un código promocional (pausar/activar/cambiar
 *                  descuento/caducidad/usos máximos/etc).
 *                  Body: cualquiera de { code?, discountPct?, discountAmount?,
 *                  description?, expiresAt?, maxUses?, status?, providerId?,
 *                  adSpaceId? }
 *                  - `status` acepta: ACTIVE | PAUSED | EXPIRED
 *                  - Si se actualiza `code`, valida unicidad (excluyendo el propio).
 *
 * DELETE (ADMIN): elimina un código promocional.
 */

// ---------- PATCH ----------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  let body: {
    code?: string
    adSpaceId?: string | null
    providerId?: string | null
    discountPct?: number | string | null
    discountAmount?: number | string | null
    description?: string | null
    expiresAt?: string | null
    maxUses?: number | string | null
    status?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  try {
    const existing = await db.promoCode.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Código promocional no encontrado.' },
        { status: 404 },
      )
    }

    const data: Record<string, unknown> = {}

    // code
    if (body.code != null) {
      const code = body.code.trim().toUpperCase()
      if (!code) {
        return NextResponse.json(
          { error: 'El código no puede estar vacío.' },
          { status: 400 },
        )
      }
      if (code !== existing.code) {
        const dup = await db.promoCode.findUnique({ where: { code } })
        if (dup && dup.id !== id) {
          return NextResponse.json(
            { error: `Ya existe un código promocional con el código "${code}".` },
            { status: 409 },
          )
        }
      }
      data.code = code
    }

    // discountPct
    if (body.discountPct !== undefined) {
      if (body.discountPct === null || body.discountPct === '') {
        data.discountPct = null
      } else {
        const v = Math.round(Number(body.discountPct))
        if (Number.isNaN(v) || v < 1 || v > 100) {
          return NextResponse.json(
            { error: 'discountPct debe estar entre 1 y 100.' },
            { status: 400 },
          )
        }
        data.discountPct = v
      }
    }

    // discountAmount
    if (body.discountAmount !== undefined) {
      if (body.discountAmount === null || body.discountAmount === '') {
        data.discountAmount = null
      } else {
        const v = Number(body.discountAmount)
        if (Number.isNaN(v) || v <= 0) {
          return NextResponse.json(
            { error: 'discountAmount debe ser mayor a 0.' },
            { status: 400 },
          )
        }
        data.discountAmount = v
      }
    }

    // Validación: al menos un descuento debe quedar definido
    const finalPct =
      data.discountPct !== undefined ? (data.discountPct as number | null) : existing.discountPct
    const finalAmt =
      data.discountAmount !== undefined
        ? (data.discountAmount as number | null)
        : existing.discountAmount
    if (finalPct == null && finalAmt == null) {
      return NextResponse.json(
        {
          error:
            'El código debe tener al menos un descuento (discountPct o discountAmount).',
        },
        { status: 400 },
      )
    }

    // description
    if (body.description !== undefined) {
      data.description = body.description?.trim() || null
    }

    // expiresAt
    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt.trim() === '') {
        data.expiresAt = null
      } else {
        const parsed = new Date(body.expiresAt)
        if (isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: 'expiresAt inválida.' },
            { status: 400 },
          )
        }
        data.expiresAt = parsed
      }
    }

    // maxUses
    if (body.maxUses !== undefined) {
      if (body.maxUses === null || body.maxUses === '') {
        data.maxUses = null
      } else {
        const v = Math.round(Number(body.maxUses))
        if (Number.isNaN(v) || v < 1) {
          return NextResponse.json(
            { error: 'maxUses debe ser mayor o igual a 1.' },
            { status: 400 },
          )
        }
        data.maxUses = v
      }
    }

    // status
    if (body.status != null) {
      const status = body.status.trim().toUpperCase()
      if (!['ACTIVE', 'PAUSED', 'EXPIRED'].includes(status)) {
        return NextResponse.json(
          { error: 'status debe ser ACTIVE, PAUSED o EXPIRED.' },
          { status: 400 },
        )
      }
      data.status = status
    }

    // providerId
    if (body.providerId !== undefined) {
      const providerId = body.providerId?.trim() || null
      if (providerId) {
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
      data.providerId = providerId
    }

    // adSpaceId
    if (body.adSpaceId !== undefined) {
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
      data.adSpaceId = adSpaceId
    }

    const updated = await db.promoCode.update({
      where: { id },
      data,
    })

    return NextResponse.json({ ok: true, promoCode: updated })
  } catch (err) {
    console.error('[api/promo-codes/[id] PATCH] error:', err)
    return NextResponse.json(
      { error: 'No se pudo actualizar el código promocional.' },
      { status: 500 },
    )
  }
}

// ---------- DELETE ----------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  try {
    const existing = await db.promoCode.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Código promocional no encontrado.' },
        { status: 404 },
      )
    }

    await db.promoCode.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/promo-codes/[id] DELETE] error:', err)
    return NextResponse.json(
      { error: 'No se pudo eliminar el código promocional.' },
      { status: 500 },
    )
  }
}
