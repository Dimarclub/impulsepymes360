'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Trash2, Minus, Plus, Loader2 } from 'lucide-react'
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

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
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

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast('El carrito está vacío', 'error')
      return
    }
    setCheckingOut(true)
    try {
      let userId = currentUser?.id
      let city = currentUser?.city || 'Guayaquil'
      // Si no hay sesión, obtener un usuario cliente por defecto
      if (!userId) {
        const uRes = await fetch('/api/users')
        const users = await uRes.json()
        const fallback = users.find((u: { role: string }) => u.role === 'CLIENT') || users[0]
        if (!fallback) throw new Error('Sin usuario disponible')
        userId = fallback.id
        city = fallback.city || 'Guayaquil'
      }
      const items = cart.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        price: l.price,
      }))
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items,
          shippingAddress: city,
          city,
          paymentMethod: 'TARJETA',
        }),
      })
      if (!res.ok) throw new Error('Error al crear el pedido')
      const order = await res.json()
      clearCart()
      setOpen(false)
      toast(`¡Pedido creado! Nº ${order.orderNumber}`, 'success')
    } catch {
      toast('Error al procesar el pedido', 'error')
    } finally {
      setCheckingOut(false)
    }
  }

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

      <Sheet open={open} onOpenChange={setOpen}>
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
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full"
                size="lg"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Procesando…
                  </>
                ) : (
                  <>Finalizar compra · ${subtotal.toFixed(2)}</>
                )}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                Pago seguro · Comisiones N0-N3 distribuidas automáticamente
              </p>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
