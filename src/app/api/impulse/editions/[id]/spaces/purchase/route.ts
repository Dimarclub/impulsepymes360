import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Proveedor compra espacios de una edición (fuera del onboarding)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const { id } = await params
  const body = await req.json()
  const { spaceIds, imageUrls } = body as { spaceIds: string[]; imageUrls?: Record<string, string> }

  // Buscar el provider del usuario
  const provider = await db.provider.findFirst({ where: { userId } })
  if (!provider) return NextResponse.json({ error: 'No tienes perfil de proveedor' }, { status: 403 })

  const edition = await db.adEdition.findUnique({ where: { id } })
  if (!edition) return NextResponse.json({ error: 'Edición no encontrada' }, { status: 404 })
  if (edition.status !== 'OPEN') return NextResponse.json({ error: 'Edición cerrada' }, { status: 400 })

  // Verificar que los espacios estén disponibles
  const spaces = await db.adSpace.findMany({ where: { id: { in: spaceIds }, editionId: id, status: 'AVAILABLE' } })
  if (spaces.length !== spaceIds.length) {
    return NextResponse.json({ error: 'Algunos espacios ya no están disponibles' }, { status: 400 })
  }

  // Verificar límite del plan
  const subscription = await db.subscription.findFirst({ where: { providerId: provider.id, status: 'ACTIVE' }, include: { plan: true } })
  const alreadyOwned = await db.adSpace.count({ where: { providerId: provider.id, editionId: id, status: 'SOLD' } })
  const maxAllowed = subscription?.plan.maxAdSpaces || 1
  if (alreadyOwned + spaces.length > maxAllowed) {
    return NextResponse.json({ error: `Tu plan ${subscription?.plan.displayName} permite máximo ${maxAllowed} espacios por edición` }, { status: 400 })
  }

  // Buscar o crear QR del provider
  let qr = await db.qRCode.findFirst({ where: { providerId: provider.id, type: 'WEBSITE' } })
  if (!qr) {
    qr = await db.qRCode.create({
      data: {
        providerId: provider.id,
        code: (provider.companyName.slice(0, 4).toUpperCase()) + String(Math.floor(Math.random() * 9000) + 1000),
        targetUrl: `/w/${provider.websiteSlug}`,
        type: 'WEBSITE',
      },
    })
  }

  // Asignar espacios
  let total = 0
  for (const space of spaces) {
    const isQrSpace = space.type === 'QR'
    await db.adSpace.update({
      where: { id: space.id },
      data: {
        providerId: provider.id,
        status: 'SOLD',
        soldAt: new Date(),
        qrCodeId: isQrSpace ? qr.id : null,
        imageUrl: !isQrSpace ? (imageUrls?.[space.id] || provider.logoUrl) : null,
      },
    })
    total += space.price
  }

  return NextResponse.json({ purchased: spaces.length, total, qrCode: qr.code }, { status: 201 })
}
