import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

const VALID_SOURCES = ['INTERNAL', 'GOOGLE', 'FACEBOOK'] as const
type Source = (typeof VALID_SOURCES)[number]

function clampRating(n: unknown): number | null {
  const v = Number(n)
  if (!Number.isFinite(v)) return null
  const int = Math.trunc(v)
  if (int < 1 || int > 5) return null
  return int
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function GET() {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const reviews = await db.review.findMany({
    where: { userId: auth.id },
    orderBy: { createdAt: 'desc' },
  })

  // Stats agregadas
  const total = reviews.length
  const ratings = reviews.map((r) => r.rating).filter((r) => r >= 1 && r <= 5)
  const average =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of ratings) distribution[r] = (distribution[r] || 0) + 1
  const responded = reviews.filter((r) => !!r.response && r.response.trim() !== '').length
  const pending = reviews.filter((r) => r.status === 'PENDING').length

  return NextResponse.json({
    ok: true,
    reviews,
    stats: {
      total,
      average: Number(average.toFixed(2)),
      distribution,
      responded,
      pending,
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({}))
  const customerName = String(body.customerName ?? '').trim()
  if (!customerName) {
    return NextResponse.json({ error: 'El nombre del cliente es obligatorio' }, { status: 400 })
  }
  const rating = clampRating(body.rating)
  if (rating === null) {
    return NextResponse.json({ error: 'El rating debe estar entre 1 y 5' }, { status: 400 })
  }
  const customerEmail =
    typeof body.customerEmail === 'string' && isEmail(body.customerEmail)
      ? body.customerEmail.trim()
      : null
  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : null
  const comment =
    typeof body.comment === 'string' && body.comment.trim()
      ? body.comment.trim().slice(0, 2000)
      : null
  const sourceRaw = String(body.source ?? 'INTERNAL').toUpperCase()
  const source: Source = (VALID_SOURCES as readonly string[]).includes(sourceRaw)
    ? (sourceRaw as Source)
    : 'INTERNAL'

  const review = await db.review.create({
    data: {
      userId: auth.id,
      customerName,
      customerEmail,
      rating,
      title,
      comment,
      source,
      status: 'PUBLISHED',
    },
  })
  return NextResponse.json({ ok: true, review }, { status: 201 })
}
