import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id
  const [progress, allStickers] = await Promise.all([
    db.albumProgress.findMany({ where: { userId }, include: { sticker: { include: { directoryEntry: { include: { provider: { select: { companyName: true, logoUrl: true, category: true } } } } } } }, orderBy: { collectedAt: 'desc' } }),
    db.sticker.count(),
  ])
  const byCategory: Record<string, any[]> = {}
  for (const p of progress) { const cat = p.sticker.directoryEntry?.provider?.category || 'Otros'; if (!byCategory[cat]) byCategory[cat] = []; byCategory[cat].push(p) }
  const golden = progress.filter((p) => p.sticker.rarity === 'GOLDEN').length
  const rare = progress.filter((p) => p.sticker.rarity === 'RARE').length
  const common = progress.filter((p) => p.sticker.rarity === 'COMMON').length
  return NextResponse.json({ collected: progress.length, total: allStickers, progress: allStickers > 0 ? Math.round((progress.length / allStickers) * 100) : 0, byCategory: Object.entries(byCategory).map(([cat, items]) => ({ category: cat, count: items.length, stickers: items })), rarity: { golden, rare, common }, stickers: progress })
}
