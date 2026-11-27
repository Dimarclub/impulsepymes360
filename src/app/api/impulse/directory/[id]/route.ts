import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'
import { requireRole } from '@/lib/security/auth'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = await db.directoryEntry.findUnique({
    where: { id },
    include: { provider: { select: { id: true, companyName: true, logoUrl: true, coverUrl: true, city: true, websiteSlug: true, description: true, category: true, address: true, phone: true, mobile: true, affiliateRate: true } }, stickers: true },
  })
  if (!entry) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  await db.directoryEntry.update({ where: { id }, data: { viewCount: { increment: 1 } } })
  return NextResponse.json(entry)
}

// PATCH /api/impulse/directory/[id] — solo ADMIN. Body: { status: 'ACTIVE' | 'PENDING' | 'REJECTED' }
// Al aprobar (ACTIVE): publica el Web Express del proveedor y crea su cromo del álbum si no existe.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const status = body?.status
  if (!['ACTIVE', 'PENDING', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }
  // Acepta el id de la ficha o el id del proveedor (providerId es único en la ficha)
  const entry = await db.directoryEntry.findFirst({ where: { OR: [{ id }, { providerId: id }] }, include: { provider: true } })
  if (!entry) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.directoryEntry.update({ where: { id: entry.id }, data: { status } })
    await tx.websiteExpress.updateMany({ where: { providerId: entry.providerId }, data: { published: status === 'ACTIVE' } })
    let stickerCode: string | null = null
    if (status === 'ACTIVE') {
      const existing = await tx.sticker.findFirst({ where: { directoryEntryId: entry.id } })
      if (existing) stickerCode = existing.code
      else {
        const qr = await tx.qRCode.findFirst({ where: { providerId: entry.providerId }, orderBy: { createdAt: 'asc' } })
        stickerCode = `STK-${randomBytes(4).toString('hex').toUpperCase()}`
        await tx.sticker.create({
          data: {
            directoryEntryId: entry.id,
            name: entry.provider.companyName,
            imageUrl: entry.provider.logoUrl || '/logo.png',
            code: stickerCode,
            hasQR: !!qr,
            hasLogo: !!entry.provider.logoUrl,
            qrCode: qr?.code ?? null,
            qrTargetUrl: qr?.targetUrl ?? null,
          },
        })
      }
    }
    return { entry: updated, stickerCode }
  })
  return NextResponse.json({ ok: true, ...result })
}
