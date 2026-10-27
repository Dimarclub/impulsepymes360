'use client'

import { useEffect } from 'react'
import { Printer, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PrintSpace {
  id: string
  position: number
  type: string
  status: string
  price: number
  provider?: { companyName: string; logoUrl?: string | null } | null
  qrCode?: { code: string; targetUrl: string } | null
  imageUrl?: string | null
}

interface PrintEdition {
  id: string
  name: string
  city: string
  totalSpaces: number
  bagSize: string
  printQuantity: number
  adSpaces: PrintSpace[]
}

export function PrintBagView({ edition }: { edition: PrintEdition }) {
  const spaces = edition.adSpaces
  const cols = 8
  const sold = spaces.filter((s) => s.status === 'SOLD').length
  const available = spaces.filter((s) => s.status === 'AVAILABLE').length
  const revenue = spaces.filter((s) => s.status === 'SOLD').reduce((s, sp) => s + sp.price, 0)

  // Auto-print on load (opcional - descomentar si se quiere auto-imprimir)
  // useEffect(() => { window.print() }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:bg-white print:p-0">
      {/* Toolbar (hidden when printing) */}
      <div className="no-print mb-6 flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold">{edition.name}</h1>
          <p className="text-sm text-gray-500">
            {edition.city} · {edition.bagSize}cm · {edition.printQuantity} unidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="size-4 mr-1.5" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Hoja de impresión A4 */}
      <div className="bg-white shadow-lg mx-auto print:shadow-none" style={{ maxWidth: '210mm', padding: '15mm' }}>
        {/* Encabezado */}
        <div className="border-b-2 border-gray-800 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">PubliBags — {edition.name}</h1>
              <p className="text-sm text-gray-600">
                {edition.city} · Tamaño bolsa: {edition.bagSize}cm · Tiraje: {edition.printQuantity} unidades
              </p>
            </div>
            <div className="text-right text-xs">
              <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-EC')}</p>
              <p><strong>Espacios vendidos:</strong> {sold}/{edition.totalSpaces}</p>
              <p><strong>Ingresos:</strong> ${revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Mockup de la bolsa */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            DISEÑO DE LA BOLSA — Vista frontal (cada cuadro = 5×5cm)
          </p>
          <div
            className="grid gap-1 border-2 border-dashed border-gray-400 p-2"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {spaces.map((space) => {
              const isSold = space.status === 'SOLD'
              const isAvailable = space.status === 'AVAILABLE'
              return (
                <div
                  key={space.id}
                  className="aspect-square border flex flex-col items-center justify-center text-center p-0.5"
                  style={{
                    borderColor: isSold ? '#0d9488' : '#d1d5db',
                    backgroundColor: isSold ? '#f0fdf4' : '#ffffff',
                  }}
                >
                  <span className="text-[7px] font-bold text-gray-400">#{space.position}</span>
                  {isSold && space.provider && (
                    <>
                      {space.provider.logoUrl ? (
                        <img src={space.provider.logoUrl} alt="" className="size-6 object-contain" />
                      ) : (
                        <span className="text-[6px] font-medium text-gray-700 line-clamp-2 leading-tight">
                          {space.provider.companyName}
                        </span>
                      )}
                      {space.qrCode && (
                        <span className="text-[5px] text-gray-500">QR: {space.qrCode.code}</span>
                      )}
                    </>
                  )}
                  {isAvailable && (
                    <span className="text-[5px] text-gray-300">DISPONIBLE</span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[9px] text-gray-400 mt-1 text-center">
            Verde = vendido · Blanco = disponible · Total {edition.totalSpaces} espacios de 5×5cm
          </p>
        </div>

        {/* Lista de espacios vendidos */}
        <div className="mt-6">
          <h2 className="text-sm font-bold mb-2 border-b pb-1">DETALLE DE ESPACIOS VENDIDOS</h2>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1">#</th>
                <th>Proveedor</th>
                <th>Tipo</th>
                <th>Código QR</th>
                <th className="text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {spaces.filter((s) => s.status === 'SOLD').map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-1">#{s.position}</td>
                  <td>{s.provider?.companyName || '—'}</td>
                  <td>{s.type}</td>
                  <td>{s.qrCode?.code || '—'}</td>
                  <td className="text-right">${s.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2">
                <td colSpan={4} className="py-1 text-right">TOTAL:</td>
                <td className="text-right">${revenue.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Instrucciones para la imprenta */}
        <div className="mt-6 p-3 bg-gray-50 border rounded text-[10px]">
          <p className="font-bold mb-1">INSTRUCCIONES PARA LA IMPRENTA:</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-700">
            <li>Material: Tela no tejida (non-woven) reutilizable, color blanco</li>
            <li>Tamaño de la bolsa: {edition.bagSize}cm (48cm ancho × 48cm alto + asas)</li>
            <li>Cada espacio publicitario: 5×5cm con código QR impreso</li>
            <li>Tiraje: {edition.printQuantity} unidades</li>
            <li>Impresión: Full color, una cara (frente de la bolsa)</li>
            <li>Los códigos QR deben ser escaneables (mínimo 2×2cm impresos)</li>
            <li>Acabado: Bolsa con asas reforzadas, doblada individualmente</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t text-center text-[8px] text-gray-400">
          <p>ImpulsePymes360 · PubliBags · {edition.name}</p>
          <p>Documento generado el {new Date().toLocaleString('es-EC')}</p>
        </div>
      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  )
}
