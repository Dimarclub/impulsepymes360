import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/dima/create-banner?token=dimar-setup-2024
 * Query params: title, imageUrl (o gifUrl), linkUrl, placement, active, order
 *
 * Crea un banner publicitario (1320x330) sin necesidad de login.
 * Para uso de setup/admin con token.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const token = searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const title = searchParams.get('title') || 'Banner Publicitario'
    const imageUrl = searchParams.get('imageUrl') || null
    const gifUrl = searchParams.get('gifUrl') || null
    const videoUrl = searchParams.get('videoUrl') || null
    const linkUrl = searchParams.get('linkUrl') || null
    const placement = searchParams.get('placement') || 'HOME_MAIN'
    const order = parseInt(searchParams.get('order') || '0')
    const active = searchParams.get('active') !== 'false'

    if (!imageUrl && !gifUrl && !videoUrl) {
      return NextResponse.json(
        { error: 'Debes proporcionar imageUrl, gifUrl o videoUrl' },
        { status: 400 }
      )
    }

    const banner = await db.banner.create({
      data: {
        title,
        imageUrl,
        gifUrl,
        videoUrl,
        linkUrl,
        placement,
        width: 1320,
        height: 330,
        active,
        order,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Banner creado',
      banner: {
        id: banner.id,
        title: banner.title,
        imageUrl: banner.imageUrl,
        gifUrl: banner.gifUrl,
        linkUrl: banner.linkUrl,
        placement: banner.placement,
        active: banner.active,
        order: banner.order,
      },
    })
  } catch (error) {
    console.error('[create-banner] error:', error)
    return NextResponse.json(
      { error: 'Error al crear banner', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
