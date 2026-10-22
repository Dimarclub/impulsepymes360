import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (key) {
    const setting = await db.siteSettings.findUnique({ where: { key } })
    return NextResponse.json({ value: setting?.value || '' })
  }
  const settings = await db.siteSettings.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return NextResponse.json(map)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const { key, value } = body as { key: string; value: string }
  if (!key) return NextResponse.json({ error: 'key requerido' }, { status: 400 })
  const setting = await db.siteSettings.upsert({ where: { key }, update: { value }, create: { key, value } })
  return NextResponse.json(setting)
}
