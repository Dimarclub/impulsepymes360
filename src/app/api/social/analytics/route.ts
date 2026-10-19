import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/security/auth'

export async function GET() {
  const auth = await requireSession()
  if (auth instanceof NextResponse) return auth
  const userId = (auth as { id: string }).id

  const [accounts, posts, publishedPosts, bioPages, automations] = await Promise.all([
    db.socialAccount.count({ where: { userId } }),
    db.socialPost.count({ where: { userId } }),
    db.socialPost.findMany({ where: { userId, status: 'PUBLISHED' } }),
    db.bioPage.findMany({ where: { userId } }),
    db.automationRule.count({ where: { userId, status: 'ACTIVE' } }),
  ])

  const totalReach = publishedPosts.reduce((s, p) => s + p.reach, 0)
  const totalLikes = publishedPosts.reduce((s, p) => s + p.likes, 0)
  const totalComments = publishedPosts.reduce((s, p) => s + p.comments, 0)
  const totalClicks = publishedPosts.reduce((s, p) => s + p.clicks, 0)
  const totalAttributedOrders = publishedPosts.reduce((s, p) => s + p.attributedOrders, 0)
  const totalAttributedRevenue = publishedPosts.reduce((s, p) => s + p.attributedRevenue, 0)
  const bioViews = bioPages.reduce((s, p) => s + p.views, 0)
  const bioClicks = bioPages.reduce((s, p) => s + p.clicks, 0)

  // Posts por plataforma
  const postsByPlatform: Record<string, number> = {}
  const postsWithAccounts = await db.socialPost.findMany({
    where: { userId },
    include: { accounts: { include: { account: true } } },
  })
  for (const p of postsWithAccounts) {
    for (const pa of p.accounts) {
      const plat = pa.account.platform
      postsByPlatform[plat] = (postsByPlatform[plat] || 0) + 1
    }
  }

  // Engagement por día (últimos 14 días)
  const engagementByDay: { date: string; reach: number; likes: number; clicks: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayPosts = publishedPosts.filter((p) => p.publishedAt && p.publishedAt.toISOString().slice(0, 10) === key)
    engagementByDay.push({
      date: key,
      reach: dayPosts.reduce((s, p) => s + p.reach, 0),
      likes: dayPosts.reduce((s, p) => s + p.likes, 0),
      clicks: dayPosts.reduce((s, p) => s + p.clicks, 0),
    })
  }

  return NextResponse.json({
    stats: {
      accounts, totalPosts: posts, publishedPosts: publishedPosts.length,
      automations, bioPages: bioPages.length,
      totalReach, totalLikes, totalComments, totalClicks,
      totalAttributedOrders, totalAttributedRevenue: +totalAttributedRevenue.toFixed(2),
      bioViews, bioClicks,
      engagementRate: totalReach > 0 ? +((totalLikes + totalComments) / totalReach * 100).toFixed(2) : 0,
    },
    postsByPlatform: Object.entries(postsByPlatform).map(([platform, count]) => ({ platform, count })),
    engagementByDay,
    topPosts: publishedPosts.sort((a, b) => b.reach - a.reach).slice(0, 5).map((p) => ({
      id: p.id, caption: p.caption.slice(0, 80), reach: p.reach, likes: p.likes, attributedOrders: p.attributedOrders,
    })),
  })
}
