import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const contactId = searchParams.get('contactId')
  const where: Record<string, unknown> = {}
  if (contactId) where.contactId = contactId
  const activities = await db.crmActivity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(activities)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const activity = await db.crmActivity.create({
    data: {
      contactId: body.contactId,
      type: body.type || 'NOTE',
      subject: body.subject,
      description: body.description || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      done: body.done ?? false,
    },
  })
  return NextResponse.json(activity, { status: 201 })
}
