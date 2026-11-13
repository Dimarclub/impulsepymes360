import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// Página pública del sitio Web Express: /w/[slug]
// Redirige al home de Dimarclub con un query param que abre el sitio
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const site = await db.websiteExpress.findUnique({ where: { slug }, select: { published: true, providerId: true } })
  if (!site || !site.published) {
    return new Response('Sitio no encontrado', { status: 404 })
  }
  // Redirigir al home con query para abrir el visualizador
  return Response.redirect(new URL(`/?module=web-express&site=${slug}`, _req.url))
}
