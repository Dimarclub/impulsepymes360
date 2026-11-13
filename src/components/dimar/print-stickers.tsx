'use client'

import { Printer, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  STICKER_DIMENSIONS,
  type PlanStickerConfig,
} from '@/lib/album-config'

interface PrintSticker {
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
  imageUrl: string | null
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

interface PrintGroup {
  cfg: PlanStickerConfig
  stickers: PrintSticker[]
}

function qrImageUrl(targetUrl: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    targetUrl,
  )}`
}

export function PrintStickersView({ groups }: { groups: PrintGroup[] }) {
  const total = groups.reduce((sum, g) => sum + g.stickers.length, 0)

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Toolbar (oculta al imprimir) */}
      <div className="no-print sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Cromos ImpulsePymes360 · Hoja de impresión
            </h1>
            <p className="text-xs text-slate-500">
              {total} cromos · {groups.length} niveles · Tamaño físico real (cm)
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/api/album/print" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <FileDown className="size-4 mr-1.5" />
                Descargar PDF
              </Button>
            </a>
            <Button onClick={() => window.print()} size="sm">
              <Printer className="size-4 mr-1.5" />
              Imprimir / Guardar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Hoja A4 con contenido imprimible */}
      <div
        className="bg-white shadow-lg mx-auto my-6 print:shadow-none print:my-0"
        style={{ maxWidth: '210mm', padding: '12mm' }}
      >
        {/* Encabezado del documento */}
        <div className="border-b-2 border-slate-800 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Cromos ImpulsePymes360 — Hoja de impresión
              </h1>
              <p className="text-xs text-slate-600">
                {total} cromos en {groups.length} niveles · Escala 1:1 (tamaño
                físico real para impresión)
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              <p>
                <strong>Fecha:</strong> {new Date().toLocaleString('es-EC')}
              </p>
              <p>
                <strong>Cromos:</strong> {total}
              </p>
            </div>
          </div>
        </div>

        {/* Grupos por plan level */}
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">
              No hay cromos para imprimir. Crea cromos desde el módulo de
              administración de álbum.
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const dim = STICKER_DIMENSIONS[group.cfg.size] || { w: 8, h: 4 }
            return (
              <div key={group.cfg.level} className="mb-8 print-break-before-page">
                {/* Header del grupo */}
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-base font-bold text-slate-800">
                    Plan {group.cfg.plan} · Nivel {group.cfg.level}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Tamaño {group.cfg.size} cm · {group.stickers.length} cromos
                  </p>
                </div>
                <div className="h-px bg-slate-300 mb-3" />

                {/* Grid de cromos — cada uno con tamaño físico en cm */}
                <div
                  className="flex flex-wrap gap-1.5"
                  style={{ rowGap: '6px', columnGap: '6px' }}
                >
                  {group.stickers.map((s) => {
                    const phone = s.provider?.phone || s.provider?.mobile || '—'
                    const address =
                      [s.provider?.address, s.provider?.city]
                        .filter(Boolean)
                        .join(', ') || '—'
                    const target =
                      s.qrTargetUrl ||
                      `/w/${s.provider?.websiteSlug || 'directorio'}`
                    const qrUrl = qrImageUrl(target, 240)
                    const wide = dim.w >= dim.h * 1.6

                    return (
                      <div
                        key={s.id}
                        className="border border-slate-800 box-border overflow-hidden relative"
                        style={{
                          width: `${dim.w}cm`,
                          height: `${dim.h}cm`,
                          padding: '2mm',
                          backgroundColor: 'white',
                        }}
                      >
                        <div
                          className={
                            wide
                              ? 'flex items-center gap-1.5 h-full'
                              : 'flex flex-col items-center h-full'
                          }
                        >
                          {/* QR */}
                          <div
                            className={
                              wide ? 'shrink-0' : 'shrink-0 w-full flex justify-center'
                            }
                            style={{
                              width: wide ? `${Math.min(dim.h - 0.4, 2.4)}cm` : 'auto',
                            }}
                          >
                            <img
                              src={qrUrl}
                              alt={`QR ${s.code}`}
                              className="block"
                              style={{
                                width: '100%',
                                maxWidth: wide
                                  ? `${Math.min(dim.h - 0.4, 2.4)}cm`
                                  : `${Math.min(dim.w - 0.6, 2.4)}cm`,
                                height: 'auto',
                              }}
                            />
                          </div>

                          {/* Texto */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                            <div className="min-w-0">
                              <p
                                className="font-bold text-slate-900 leading-tight truncate"
                                style={{ fontSize: '9px' }}
                              >
                                {s.name || s.provider?.companyName || 'Cromo'}
                              </p>
                              <p
                                className="text-slate-600 leading-tight truncate"
                                style={{ fontSize: '7px' }}
                              >
                                Tel: {phone}
                              </p>
                              <p
                                className="text-slate-600 leading-tight"
                                style={{
                                  fontSize: '7px',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                Dir: {address}
                              </p>
                            </div>
                            <div className="flex items-end justify-between mt-0.5">
                              <span
                                className="text-slate-500 font-mono"
                                style={{ fontSize: '6px' }}
                              >
                                {s.code}
                              </span>
                              <span
                                className="font-bold text-emerald-700"
                                style={{ fontSize: '7px' }}
                              >
                                {group.cfg.plan} · {group.cfg.size}cm
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}

        {/* Footer */}
        <div className="mt-6 pt-2 border-t text-center text-[9px] text-slate-400">
          <p>ImpulsePymes360 · Cromos para álbum · Documento generado el {new Date().toLocaleString('es-EC')}</p>
        </div>
      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          .print-break-before-page {
            break-before: page;
          }
          .print-break-before-page:first-child {
            break-before: auto;
          }
        }
      `}</style>
    </div>
  )
}
