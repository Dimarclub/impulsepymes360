import { db } from '@/lib/db'
import { PrintBagView } from '@/components/dimar/print-bag'

// Página de impresión del mockup de la bolsa PubliBags
// Optimizada para imprimir/guardar como PDF (Ctrl+P)
export const dynamic = 'force-dynamic'

export default async function PrintBagPage({ params }: { params: Promise<{ editionId: string }> }) {
  const { editionId } = await params
  const edition = await db.adEdition.findUnique({
    where: { id: editionId },
    include: {
      adSpaces: {
        orderBy: { position: 'asc' },
        include: {
          provider: { select: { companyName: true, logoUrl: true } },
          qrCode: { select: { code: true, targetUrl: true } },
        },
      },
    },
  })
  if (!edition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Edición no encontrada</p>
      </div>
    )
  }
  return <PrintBagView edition={JSON.parse(JSON.stringify(edition))} />
}
