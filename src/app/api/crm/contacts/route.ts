import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const contacts = await db.crmContact.findMany({
    include: { activities: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const contact = await db.crmContact.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      company: body.company || null,
      stage: body.stage || 'LEAD',
      value: body.value || 0,
      source: body.source || 'WEB',
      notes: body.notes || null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    },
  })
  return NextResponse.json(contact, { status: 201 })
}
