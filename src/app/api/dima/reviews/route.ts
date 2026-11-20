import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/security/auth'

// GET /api/dima/reviews?supplierId=X
// Público. Lista las reviews PUBLISHED del supplier + stats agregadas
// (average, total, distribution por estrellas).
//
// El modelo Review se relaciona con User (el supplier recibiendo la reseña),
// NO directamente con Supplier. Para listar las reseñas de un proveedor
// hacemos supplierId → supplier.userId → reviews.where({ userId, status: 'PUBLISHED' }).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const supplierId = searchParams.get('supplierId')
    if (!supplierId) {
      return NextResponse.json(
        { ok: false, error: 'Falta supplierId', reviews: [], stats: null },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, userId: true, companyName: true },
    })
    if (!supplier) {
      return NextResponse.json(
        { ok: false, error: 'Proveedor no encontrado', reviews: [], stats: null },
        { status: 404 }
      )
    }

    const reviews = await db.review.findMany({
      where: {
        userId: supplier.userId,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const ratings = reviews.map((r) => r.rating).filter((r) => r >= 1 && r <= 5)
    const total = ratings.length
    const average =
      total > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / total).toFixed(2)) : 0
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const r of ratings) {
      distribution[r] = (distribution[r] || 0) + 1
    }

    return NextResponse.json({
      ok: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        response: r.response,
        respondedAt: r.respondedAt,
        source: r.source,
        createdAt: r.createdAt,
        user: r.user
          ? { id: r.user.id, name: r.user.name, avatarUrl: r.user.avatarUrl }
          : null,
      })),
      stats: {
        average,
        total,
        distribution,
      },
    })
  } catch (e: any) {
    console.error('[dima/reviews GET] error:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: 'Error cargando reseñas', reviews: [], stats: null },
      { status: 500 }
    )
  }
}

// POST /api/dima/reviews
// Crea una reseña sobre un supplier. Auth opcional:
//  - Si hay sesión: customerName/Email se toman de la sesión, status='PUBLISHED'
//    (los usuarios logueados son confiables).
//  - Si NO hay sesión: customerName/Email del body, status='PENDING' (moderación).
// El Review.userId se setea con el userId del supplier (es la cuenta que recibe
// la reseña y la verá en su panel).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      supplierId,
      rating,
      title,
      comment,
      customerName,
      customerEmail,
    } = body as {
      supplierId?: string
      rating?: number
      title?: string
      comment?: string
      customerName?: string
      customerEmail?: string
    }

    if (!supplierId || typeof supplierId !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Falta supplierId' },
        { status: 400 }
      )
    }

    // Validar rating 1-5
    const r = Number(rating)
    if (!Number.isFinite(r)) {
      return NextResponse.json(
        { ok: false, error: 'El rating es obligatorio' },
        { status: 400 }
      )
    }
    const ratingInt = Math.trunc(r)
    if (ratingInt < 1 || ratingInt > 5) {
      return NextResponse.json(
        { ok: false, error: 'El rating debe estar entre 1 y 5' },
        { status: 400 }
      )
    }

    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, userId: true, companyName: true },
    })
    if (!supplier) {
      return NextResponse.json(
        { ok: false, error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Sesión opcional
    const auth = await getSessionUser()
    const isLoggedIn = !!auth

    // Resolver customerName/Email
    let finalName = ''
    let finalEmail: string | null = null
    let status: 'PUBLISHED' | 'PENDING'

    if (isLoggedIn && auth) {
      finalName = auth.name?.trim() || ''
      finalEmail = auth.email?.trim() || null
      status = 'PUBLISHED'
    } else {
      finalName = String(customerName ?? '').trim()
      finalEmail =
        typeof customerEmail === 'string' && customerEmail.trim()
          ? customerEmail.trim().slice(0, 200)
          : null
      status = 'PENDING'
    }

    if (!finalName) {
      return NextResponse.json(
        {
          ok: false,
          error: isLoggedIn
            ? 'Tu cuenta no tiene nombre configurado'
            : 'Tu nombre es obligatorio',
        },
        { status: 400 }
      )
    }

    const titleTrim =
      typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : null
    const commentTrim =
      typeof comment === 'string' && comment.trim()
        ? comment.trim().slice(0, 2000)
        : null

    const review = await db.review.create({
      data: {
        userId: supplier.userId, // el supplier recibe la reseña
        customerName: finalName,
        customerEmail: finalEmail,
        rating: ratingInt,
        title: titleTrim,
        comment: commentTrim,
        source: 'INTERNAL',
        status,
      },
    })

    // Actualizar rating promedio del supplier si la reseña quedó PUBLISHED
    if (status === 'PUBLISHED') {
      try {
        const agg = await db.review.aggregate({
          where: { userId: supplier.userId, status: 'PUBLISHED' },
          _avg: { rating: true },
          _count: { rating: true },
        })
        const avg = agg._avg.rating ?? 0
        await db.supplier.update({
          where: { id: supplier.id },
          data: { rating: Number(avg.toFixed(2)) },
        })
      } catch {
        // no bloquear el response si falla la agregación
      }
    }

    return NextResponse.json(
      {
        ok: true,
        review,
        status,
        message:
          status === 'PUBLISHED'
            ? '¡Reseña publicada! Gracias por compartir tu experiencia.'
            : 'Reseña enviada. El proveedor la revisará antes de publicarla.',
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error('[dima/reviews POST] error:', e?.message || e)
    return NextResponse.json(
      { ok: false, error: 'Error al crear la reseña' },
      { status: 500 }
    )
  }
}
