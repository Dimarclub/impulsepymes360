'use client'

import { useEffect, useState } from 'react'
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Loader2,
  Lock,
  ShieldCheck,
  Info,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import type { CartLine } from '@/lib/types'

interface CartLineProps {
  line: CartLine
  onUpdateQty: (productId: string, qty: number) => void
  onRemove: (productId: string) => void
}

function CartLineRow({ line, onUpdateQty, onRemove }: CartLineProps) {
  return (
    <div className="flex gap-3 p-2 rounded-lg border bg-card">
      <img
        src={line.imageUrl || `https://picsum.photos/seed/${line.productId}/80`}
        alt={line.name}
        className="size-16 rounded-md object-cover bg-muted shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 leading-tight">{line.name}</p>
        <p className="text-sm text-primary font-bold mt-0.5">
          ${line.price.toFixed(2)}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Button
            size="icon"
            variant="outline"
            className="size-6"
            onClick={() => onUpdateQty(line.productId, line.quantity - 1)}
            aria-label="Disminuir cantidad"
          >
            <Minus className="size-3" />
          </Button>
          <span className="text-sm font-medium w-7 text-center tabular-nums">
            {line.quantity}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="size-6"
            onClick={() => onUpdateQty(line.productId, line.quantity + 1)}
            aria-label="Aumentar cantidad"
          >
            <Plus className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6 ml-auto text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(line.productId)}
            aria-label="Eliminar del carrito"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface PaymentIntentResponse {
  orderId: string
  orderNumber: string
  paymentIntentId: string
  clientSecret?: string
  amount: number
  provider: string
}

interface PaymentConfirmResponse {
  success: boolean
  orderId: string
  orderNumber: string
  transactionId?: string
  provider: string
  error?: string
}

type CheckoutStage = 'idle' | 'intent' | 'confirm'

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<CheckoutStage>('idle')
  // provider se setea tras el intent; por defecto 'test' para la nota informativa
  const [provider, setProvider] = useState<string>('test')
  const cart = useAppStore((s) => s.cart)
  const updateQty = useAppStore((s) => s.updateQty)
  const removeFromCart = useAppStore((s) => s.removeFromCart)
  const clearCart = useAppStore((s) => s.clearCart)
  const currentUser = useAppStore((s) => s.currentUser)
  const toast = useAppStore((s) => s.toast)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('dimar-open-cart', handler)
    return () => window.removeEventListener('dimar-open-cart', handler)
  }, [])

  const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0)
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0)
  const affiliateCommission = +(subtotal * 0.03).toFixed(2)
  const checkingOut = stage !== 'idle'

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast('El carrito está vacío', 'error')
      return
    }
    // 1. Verificar sesión
    if (!currentUser) {
      toast('Inicia sesión para comprar', 'info')
      setOpen(false)
      window.dispatchEvent(new CustomEvent('dimar-open-login'))
      return
    }

    const items = cart.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
    }))
    const shippingAddress = currentUser.city || 'Guayaquil'
    const city = currentUser.city || 'Guayaquil'

    setStage('intent')
    try {
      // 2. Crear intención de pago + orden PENDING
      const intentRes = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress, city }),
      })
      if (!intentRes.ok) {
        const e = await intentRes.json().catch(() => null)
        toast(e?.error || 'Error al iniciar el pago', 'error')
        setStage('idle')
        return
      }
      const intent: PaymentIntentResponse = await intentRes.json()
      setProvider(intent.provider)

      // 3. Confirmar el pago
      setStage('confirm')
      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: intent.orderId,
          paymentIntentId: intent.paymentIntentId,
        }),
      })
      const confirm: PaymentConfirmResponse = await confirmRes.json().catch(() => ({
        success: false,
        orderId: '',
        orderNumber: '',
        provider: intent.provider,
      }))
      if (!confirmRes.ok || !confirm.success) {
        toast('Pago rechazado, intenta de nuevo', 'error')
        setStage('idle')
        return
      }
      // 4. Éxito
      clearCart()
      setOpen(false)
      setStage('idle')
      toast(`¡Pago exitoso! Pedido ${confirm.orderNumber}`, 'success')
    } catch {
      toast('Error al procesar el pago', 'error')
      setStage('idle')
    }
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) setStage('idle')
  }

  const providerNote =
    provider === 'stripe' ? (
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="size-3" />
        Pago seguro procesado por Stripe
      </div>
    ) : (
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400">
        <Info className="size-3" />
        Modo demo: pago simulado
      </div>
    )

  const buttonLabel =
    stage === 'intent'
      ? 'Procesando pago…'
      : stage === 'confirm'
      ? 'Confirmando transacción…'
      : `Finalizar compra · $${subtotal.toFixed(2)}`

  return (
    <>
      {/* Floating action button — opens the cart */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center"
        aria-label="Abrir carrito de compras"
      >
        <ShoppingCart className="size-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center border-2 border-background">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 gap-0 flex flex-col"
        >
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-primary" />
              Tu carrito
              {itemCount > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  · {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Revisa los productos antes de finalizar la compra
            </SheetDescription>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <ShoppingCart className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Tu carrito está vacío</p>
                <p className="text-xs mt-1">
                  Agrega productos desde el catálogo para continuar
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2.5">
              {cart.map((line) => (
                <CartLineRow
                  key={line.productId}
                  line={line}
                  onUpdateQty={updateQty}
                  onRemove={removeFromCart}
                />
              ))}
              <button
                onClick={() => clearCart()}
                className="text-xs text-muted-foreground hover:text-destructive transition mt-2"
              >
                Vaciar carrito
              </button>
            </div>
          )}

          {cart.length > 0 && (
            <SheetFooter className="border-t p-4 gap-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold tabular-nums">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Comisión para afiliado (3%)</span>
                  <span className="tabular-nums">
                    ${affiliateCommission.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                  <span>Total estimado</span>
                  <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {checkingOut && (
                <div
                  className="rounded-lg border bg-primary/5 p-3 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                    <Loader2 className="size-4 animate-spin" />
                    Procesando pago…
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {stage === 'intent'
                      ? 'Creando orden y validando stock…'
                      : 'Confirmando transacción con el banco…'}
                  </p>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full"
                size="lg"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> {buttonLabel}
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> {buttonLabel}
                  </>
                )}
              </Button>
              {providerNote}
              <p className="text-[10px] text-center text-muted-foreground">
                Comisiones N0-N3 distribuidas automáticamente al confirmar
              </p>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
