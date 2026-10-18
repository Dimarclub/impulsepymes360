import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET() {
  const categories = await db.category.findMany({
    where: { parentId: null },
    include: { children: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const cat = await db.category.create({
    data: {
      name: body.name,
      slug: body.slug || slugify(body.name),
      icon: body.icon || 'Tag',
      color: body.color || '#0d9488',
      parentId: body.parentId || null,
    },
  })
  return NextResponse.json(cat, { status: 201 })
}
