import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const body = await req.json()
  const app = await db.application.findUnique({ where: { id } })
  if (!app) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const updated = await db.application.update({ where: { id }, data: { status: body.status } })

  if (body.status === 'APPROVED') {
    const details = app.details ? JSON.parse(app.details) : {}
    const hashedPwd = await bcrypt.hash('dimar123', 10)
    if (app.type === 'SUPPLIER') {
      const user = await db.user.create({ data: { email: app.email, name: app.name, role: 'SUPPLIER', phone: app.phone, city: details.city, password: hashedPwd } })
      await db.supplier.create({ data: { userId: user.id, companyName: app.name, phone: app.phone, city: details.city, category: details.category, verified: true } })
    } else if (app.type === 'COURIER') {
      const user = await db.user.create({ data: { email: app.email, name: app.name, role: 'COURIER', phone: app.phone, city: details.zone, password: hashedPwd } })
      await db.courier.create({ data: { userId: user.id, vehicleType: details.vehicleType || 'MOTORCYCLE', zone: details.zone, available: true } })
    } else if (app.type === 'PARTNER') {
      const amount = details.amount || 300
      const user = await db.user.create({ data: { email: app.email, name: app.name, role: 'PARTNER', phone: app.phone, password: hashedPwd } })
      await db.partner.create({ data: { userId: user.id, totalContribution: amount, totalReturns: +(amount * 0.03).toFixed(2), status: 'ACTIVE', contributions: { create: { amount, returnRate: 3, monthlyReturn: +(amount * 0.03).toFixed(2), status: 'ACTIVE' } } } })
    }
  }

  return NextResponse.json(updated)
}
