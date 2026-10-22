import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

// Aporte de materiales reciclados
export async function POST(req: NextRequest) {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const body = await req.json()
  const { materialType, quantity } = body as { materialType: string; quantity: number }

  if (!materialType || !quantity || quantity <= 0) {
    return NextResponse.json({ error: 'Material y cantidad requeridos' }, { status: 400 })
  }

  const price = await db.materialPrice.findUnique({ where: { materialType } })
  if (!price) return NextResponse.json({ error: 'Material no válido' }, { status: 400 })

  const totalAmount = price.unitPrice * quantity

  let account = await db.cooperativeAccount.findUnique({ where: { userId } })
  if (!account) account = await db.cooperativeAccount.create({ data: { userId } })

  const [updatedAccount, tx] = await db.$transaction([
    db.cooperativeAccount.update({
      where: { userId },
      data: { balance: { increment: totalAmount }, totalContributed: { increment: totalAmount } },
    }),
    db.cooperativeTransaction.create({
      data: {
        accountId: account.id,
        type: 'MATERIAL',
        amount: totalAmount,
        description: `${quantity} ${price.unit}(s) de ${price.name} a $${price.unitPrice}/${price.unit}`,
        materialType,
        materialQuantity: quantity,
        materialUnitPrice: price.unitPrice,
        status: 'COMPLETED',
      },
    }),
    // Actualizar inventario
    db.materialInventory.updateMany({
      where: { materialType },
      data: { quantity: { increment: quantity } },
    }),
  ])

  return NextResponse.json({ account: updatedAccount, transaction: tx, materialValue: totalAmount }, { status: 201 })
}

// Listar precios de materiales (público)
export async function GET() {
  const prices = await db.materialPrice.findMany({ where: { active: true }, orderBy: { name: 'asc' } })
  return NextResponse.json(prices)
}
