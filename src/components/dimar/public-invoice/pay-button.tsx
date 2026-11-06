'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react'

interface PublicPayButtonProps {
  amount: string
  number: string
}

type PayState = 'idle' | 'processing' | 'done'

/**
 * Botón de pago simulado para la vista pública de factura.
 * No procesa un pago real: abre un modal "Pago en proceso..." y luego simula
 * éxito tras 2 segundos.
 */
export function PublicPayButton({ amount, number }: PublicPayButtonProps) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<PayState>('idle')

  const handlePay = () => {
    setOpen(true)
    setState('processing')
    // Simulación de pasarela de pago
    window.setTimeout(() => {
      setState('done')
    }, 2000)
  }

  const handleClose = () => {
    setOpen(false)
    // reset luego de cerrar para la próxima apertura
    window.setTimeout(() => setState('idle'), 300)
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold h-12"
        onClick={handlePay}
      >
        <CreditCard className="size-5" />
        Pagar {amount}
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          {state === 'processing' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Procesando pago</DialogTitle>
                <DialogDescription className="text-center">
                  Estamos procesando tu pago de <span className="font-semibold text-foreground">{amount}</span> para la factura{' '}
                  <span className="font-mono">{number}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="size-10 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">No cierres esta ventana...</p>
              </div>
            </>
          )}
          {state === 'done' && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">¡Pago completado!</DialogTitle>
                <DialogDescription className="text-center">
                  Tu pago de <span className="font-semibold text-foreground">{amount}</span> se procesó correctamente.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="size-8 text-emerald-600" />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Esta es una simulación de pasarela de pago. En producción, aquí se
                  confirmaría la transacción con el banco.
                </p>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={handleClose}>
                  Entendido
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
