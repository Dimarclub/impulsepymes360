import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import {
  PLAN_STICKER_CONFIG,
  STICKER_DIMENSIONS,
  type PlanStickerConfig,
} from '@/lib/album-config'

// pdfkit is a Node-only library; mark this route as Node runtime (default).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- Constants ----------
const CM = 28.3464567 // points per cm (1 inch = 2.54 cm = 72 pt)
const PAGE_W = 595.28 // A4 width in pt (21 cm)
const PAGE_H = 841.89 // A4 height in pt (29.7 cm)
const MARGIN = 42.5 // ~1.5 cm
const GAP = 6 // gap between stickers in pt

interface StickerRow {
  id: string
  name: string
  code: string
  planLevel: number
  stickerSize: string
  hasQR: boolean
  hasLogo: boolean
  hasBanner: boolean
  bannerType: string | null
  hasMarketplaceAd: boolean
  qrCode: string | null
  qrTargetUrl: string | null
  provider: {
    companyName: string | null
    phone: string | null
    mobile: string | null
    address: string | null
    city: string | null
    logoUrl: string | null
    websiteSlug: string | null
  } | null
}

/**
 * /api/album/print
 *
 * GET (ADMIN): genera un PDF con todos los cromos (stickers) agrupados por
 * nivel de plan, listos para imprimir a escala 1:1 (tamaño físico real en cm).
 *
 * Cada cromo muestra:
 *  - QR (imagen PNG obtenida desde api.qrserver.com, embebida en el PDF)
 *  - Nombre (del cromo / proveedor)
 *  - Teléfono
 *  - Dirección
 *  - Nivel de plan + tamaño (etiqueta)
 *
 * Retorna el PDF como archivo descargable (Content-Type: application/pdf).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth

  // ----- 1. Traer todos los cromos -----
  let stickers: StickerRow[]
  try {
    const rows = await db.sticker.findMany({
      include: {
        directoryEntry: {
          include: {
            provider: {
              select: {
                id: true,
                companyName: true,
                phone: true,
                mobile: true,
                address: true,
                city: true,
                logoUrl: true,
                websiteSlug: true,
              },
            },
          },
        },
      },
      orderBy: [{ planLevel: 'asc' }, { name: 'asc' }],
    })

    stickers = rows.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      planLevel: s.planLevel,
      stickerSize: s.stickerSize,
      hasQR: s.hasQR,
      hasLogo: s.hasLogo,
      hasBanner: s.hasBanner,
      bannerType: s.bannerType,
      hasMarketplaceAd: s.hasMarketplaceAd,
      qrCode: s.qrCode,
      qrTargetUrl: s.qrTargetUrl,
      provider: s.directoryEntry?.provider
        ? {
            companyName: s.directoryEntry.provider.companyName,
            phone: s.directoryEntry.provider.phone,
            mobile: s.directoryEntry.provider.mobile,
            address: s.directoryEntry.provider.address,
            city: s.directoryEntry.provider.city,
            logoUrl: s.directoryEntry.provider.logoUrl,
            websiteSlug: s.directoryEntry.provider.websiteSlug,
          }
        : null,
    }))
  } catch (err) {
    console.error('[api/album/print] DB error:', err)
    return NextResponse.json(
      { error: 'No se pudo obtener la lista de cromos.' },
      { status: 500 },
    )
  }

  if (stickers.length === 0) {
    return NextResponse.json(
      { error: 'No hay cromos para imprimir. Crea cromos desde el módulo de administración.' },
      { status: 404 },
    )
  }

  // ----- 2. Agrupar por planLevel -----
  const groups: Record<number, StickerRow[]> = {}
  for (const s of stickers) {
    if (!groups[s.planLevel]) groups[s.planLevel] = []
    groups[s.planLevel].push(s)
  }
  const levels = Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)

  // ----- 3. Resolver baseUrl (host del request) para los QR -----
  const fwdHost = req.headers.get('x-forwarded-host')
  const host = fwdHost || req.headers.get('host') || 'localhost:3000'
  const fwdProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto = fwdProto || (host.startsWith('localhost') ? 'http' : 'https')
  const baseUrl = `${proto}://${host}`

  // ----- 4. Pre-cargar las imágenes QR (en paralelo, con cache) -----
  const qrCache = new Map<string, Buffer | null>()
  async function fetchQr(targetUrl: string): Promise<Buffer | null> {
    if (qrCache.has(targetUrl)) return qrCache.get(targetUrl) ?? null
    const fullUrl = targetUrl.startsWith('http')
      ? targetUrl
      : `${baseUrl}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`
    try {
      const resp = await fetch(qrImgUrl, { cache: 'no-store' })
      if (!resp.ok) throw new Error(`status ${resp.status}`)
      const buf = Buffer.from(await resp.arrayBuffer())
      qrCache.set(targetUrl, buf)
      return buf
    } catch (err) {
      console.error('[api/album/print] QR fetch failed for', targetUrl, err)
      qrCache.set(targetUrl, null)
      return null
    }
  }

  // Pre-fetch todos los QR únicos
  const uniqueTargets = new Set<string>()
  for (const s of stickers) {
    const target = s.qrTargetUrl || `/w/${s.provider?.websiteSlug || 'directorio'}`
    uniqueTargets.add(target)
  }
  await Promise.all([...uniqueTargets].map(fetchQr))

  // ----- 5. Crear el PDF -----
  // Import dinámico para evitar problemas de bundling en el cliente.
  const { default: PDFDocument } = await import('pdfkit')
  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: 'Cromos ImpulsePymes360',
      Author: 'ImpulsePymes360',
      Subject: 'Hoja de impresión de cromos para álbum',
    },
  })

  // Helper: agregar página con header de grupo
  function drawGroupHeader(cfg: PlanStickerConfig, count: number) {
    doc.fillColor('#0B1120')
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(`Plan ${cfg.plan} · Nivel ${cfg.level}`, { align: 'left' })
    doc.fillColor('#475569')
      .font('Helvetica')
      .fontSize(9)
      .text(
        `Tamaño físico: ${cfg.size} cm  ·  ${count} cromos  ·  Escala 1:1 (tamaño real de impresión)`,
        { align: 'left' },
      )
    doc.moveDown(0.6)
    // Línea separadora
    const sepY = doc.y
    doc
      .moveTo(MARGIN, sepY)
      .lineTo(PAGE_W - MARGIN, sepY)
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .stroke()
    doc.moveDown(0.5)
  }

  // Helper: dibujar un cromo en (x, y) con tamaño w x h (en pt)
  function drawSticker(
    s: StickerRow,
    cfg: PlanStickerConfig,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    // Borde
    doc
      .rect(x, y, w, h)
      .strokeColor('#1f2937')
      .lineWidth(0.75)
      .stroke()

    const padding = 3
    const innerX = x + padding
    const innerY = y + padding
    const innerW = w - padding * 2
    const innerH = h - padding * 2

    // Tamaño del QR: ~45% del ancho o hasta 80% del alto (mínimo 28pt)
    const qrSize = Math.max(
      28,
      Math.min(innerW * 0.42, innerH * 0.82, 90),
    )

    // Si el cromo es muy plano (h <= ~2cm = 56.7pt), QR a la izquierda y
    // texto a la derecha en una sola fila.
    const wide = w >= h * 1.6
    const qrX = wide ? innerX : innerX + (innerW - qrSize) / 2
    const qrY = wide ? innerY + (innerH - qrSize) / 2 : innerY

    // QR imagen
    const target =
      s.qrTargetUrl || `/w/${s.provider?.websiteSlug || 'directorio'}`
    const qrBuf = qrCache.get(target) ?? null
    if (qrBuf) {
      try {
        doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize })
      } catch {
        // si la imagen falla, dibujar placeholder
        doc
          .rect(qrX, qrY, qrSize, qrSize)
          .fillColor('#e5e7eb')
          .fill()
        doc
          .fillColor('#94a3b8')
          .font('Helvetica')
          .fontSize(6)
          .text('QR', qrX, qrY + qrSize / 2 - 3, {
            width: qrSize,
            align: 'center',
          })
      }
    } else {
      doc
        .rect(qrX, qrY, qrSize, qrSize)
        .fillColor('#e5e7eb')
        .fill()
      doc
        .fillColor('#94a3b8')
        .font('Helvetica')
        .fontSize(6)
        .text('QR', qrX, qrY + qrSize / 2 - 3, {
          width: qrSize,
          align: 'center',
        })
    }

    // Texto: nombre + phone + address + plan/size label
    const textX = wide ? qrX + qrSize + 4 : innerX
    const textW = wide ? innerW - qrSize - 4 : innerW
    const textY = wide ? innerY : qrY + qrSize + 2

    const name = s.name || s.provider?.companyName || 'Cromo'
    const phone = s.provider?.phone || s.provider?.mobile || '—'
    const address = [s.provider?.address, s.provider?.city]
      .filter(Boolean)
      .join(', ') || '—'

    doc.fillColor('#0B1120')
      .font('Helvetica-Bold')
      .fontSize(wide ? 7.5 : 7)
      .text(name, textX, textY, {
        width: textW,
        align: 'left',
        lineBreak: true,
        ellipsis: true,
        height: wide ? innerH - 24 : 14,
      })

    const nameBottom = doc.y
    doc.fillColor('#475569')
      .font('Helvetica')
      .fontSize(6)
      .text(`Tel: ${phone}`, textX, nameBottom + 1, {
        width: textW,
        align: 'left',
      })

    const phoneBottom = doc.y
    doc.fillColor('#475569')
      .font('Helvetica')
      .fontSize(6)
      .text(`Dir: ${address}`, textX, phoneBottom + 1, {
        width: textW,
        align: 'left',
        lineBreak: true,
        ellipsis: true,
        height: wide ? 12 : 10,
      })

    // Etiqueta plan + tamaño (esquina inferior derecha)
    const label = `${cfg.plan} · ${cfg.size}cm`
    doc.fillColor('#0d9488')
      .font('Helvetica-Bold')
      .fontSize(5.5)
      .text(label, x + padding, y + h - 10, {
        width: w - padding * 2,
        align: 'right',
      })

    // Código del cromo (esquina superior derecha)
    if (s.code) {
      doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(5)
        .text(s.code, x + padding, y + 2, {
          width: w - padding * 2,
          align: 'right',
        })
    }
  }

  // Layout por grupo
  for (let gi = 0; gi < levels.length; gi += 1) {
    const level = levels[gi]
    const cfg = PLAN_STICKER_CONFIG.find((c) => c.level === level)
    const fallbackCfg: PlanStickerConfig = {
      level,
      plan: `Nivel ${level}`,
      size: '8x4',
      hasQR: true,
      hasLogo: false,
      hasBanner: false,
      hasMarketplaceAd: false,
      description: '',
    }
    const useCfg = cfg ?? fallbackCfg
    const dim = STICKER_DIMENSIONS[useCfg.size] || { w: 8, h: 4 }
    const groupStickers = groups[level]

    if (gi === 0) {
      // Portada / Título del documento en la primera página
      doc.fillColor('#0B1120')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('Cromos ImpulsePymes360', { align: 'center' })
      doc.fillColor('#475569')
        .font('Helvetica')
        .fontSize(10)
        .text(
          `Hoja de impresión · ${stickers.length} cromos en ${levels.length} niveles · Escala 1:1`,
          { align: 'center' },
        )
      doc.moveDown(0.6)
    } else {
      doc.addPage()
    }

    drawGroupHeader(useCfg, groupStickers.length)

    // Cursor de layout (flow grid)
    let cursorX = MARGIN
    let cursorY = doc.y
    let rowMaxH = 0

    for (const s of groupStickers) {
      const w = dim.w * CM
      const h = dim.h * CM

      // ¿Cabe en la fila actual?
      if (cursorX + w > PAGE_W - MARGIN + 0.01) {
        // wrap
        cursorX = MARGIN
        cursorY += rowMaxH + GAP
        rowMaxH = 0
      }

      // ¿Cabe en la página actual?
      if (cursorY + h > PAGE_H - MARGIN) {
        doc.addPage()
        drawGroupHeader(useCfg, groupStickers.length)
        cursorX = MARGIN
        cursorY = doc.y
        rowMaxH = 0
      }

      drawSticker(s, useCfg, cursorX, cursorY, w, h)

      cursorX += w + GAP
      if (h > rowMaxH) rowMaxH = h
    }
  }

  // Footer del documento (en cada página)
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i)
    doc.fillColor('#94a3b8')
      .font('Helvetica')
      .fontSize(7)
      .text(
        `ImpulsePymes360 · Cromos para álbum · Página ${i + 1} de ${range.count} · Generado ${new Date().toLocaleString('es-EC')}`,
        MARGIN,
        PAGE_H - MARGIN + 6,
        {
          width: PAGE_W - MARGIN * 2,
          align: 'center',
        },
      )
  }

  // ----- 6. Colectar el buffer del stream -----
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', resolve)
    doc.on('error', reject)
    doc.end()
  })
  const pdfBuffer = Buffer.concat(chunks)

  // ----- 7. Retornar como PDF descargable -----
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cromos-impulsepymes360.pdf"',
      'Content-Length': String(pdfBuffer.length),
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
