import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Registrar una compra externa (CPA)
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string; name: string }

  const body = await req.json()
  const { productName, amount, storeName, storeUrl, receiptUrl, category } = body

  if (!productName || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Nombre del producto y monto son obligatorios' }, { status: 400 })
  }

  const purchase = await db.externalPurchase.create({
    data: {
      userId: user.id,
      productName,
      amount,
      storeName: storeName || null,
      storeUrl: storeUrl || null,
      receiptUrl: receiptUrl || null,
      category: category || null,
      status: 'PENDING_REVIEW',
      rewardAmount: 0, // No se paga comisión por registrar — el usuario ya cobra 3% N0 en el plan de compensación
    },
  })

  try {
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'CPA_PURCHASE_REGISTERED',
        title: 'Compra registrada',
        message: `Tu compra de "${productName}" ($${amount.toFixed(2)}) fue registrada. Suma a tu consumo mensual de $250. Pendiente de aprobación del admin.`,
        link: '/?module=affiliate-backoffice',
      },
    })

    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: 'CPA_PURCHASE_REVIEW',
          title: 'Compra externa pendiente de revisión',
          message: `${user.name} registró: ${productName} ($${amount.toFixed(2)}) en ${storeName || 'tienda externa'}.`,
          link: '/?module=cpa-admin',
        })),
      })
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ ok: true, purchase }, { status: 201 })
}

// Listar compras externas del usuario
export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const user = auth as { id: string }

  const purchases = await db.externalPurchase.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ purchases })
}
