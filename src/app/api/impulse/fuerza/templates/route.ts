import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

// Listar plantillas WhatsApp
export async function GET() {
  const templates = await db.whatsAppTemplate.findMany({ orderBy: { trigger: 'asc' } })
  return NextResponse.json(templates)
}

// Crear plantilla (admin)
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const template = await db.whatsAppTemplate.create({
    data: { name: body.name, trigger: body.trigger.toLowerCase(), content: body.content, description: body.description || null, active: body.active ?? true },
  })
  return NextResponse.json(template, { status: 201 })
}
