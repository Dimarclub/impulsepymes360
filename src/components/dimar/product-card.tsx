'use client'

import { useState } from 'react'
import { Star, Plus, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types'

function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            'size-3',
            i <= Math.round(rating)
              ? 'fill-accent text-accent'
              : 'fill-muted text-muted-foreground/40'
          )}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {rating.toFixed(1)}
        {typeof count === 'number' && count > 0 && ` (${count})`}
      </span>
    </div>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useAppStore((s) => s.addToCart)
  const toast = useAppStore((s) => s.toast)
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)

  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100
      )
    : 0

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    e?.preventDefault()
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
      supplierId: product.supplierId,
    })
    toast(`${product.name} agregado al carrito`, 'success')
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1400)
  }

  const imgSrc =
    product.imageUrl || `https://picsum.photos/seed/${product.id}/400`

  return (
    <>
      <Card
        className="group relative gap-0 p-0 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        onClick={() => setOpen(true)}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="bg-destructive text-destructive-foreground shadow-sm">
                -{discountPct}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-accent text-accent-foreground shadow-sm">
                Destacado
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3 space-y-1.5">
          <p className="text-[11px] text-muted-foreground truncate">
            {product.supplier?.companyName || 'Proveedor'}
          </p>
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
            {product.name}
          </h3>
          <Stars rating={product.rating} count={product.reviewCount} />
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-primary font-bold">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full mt-1"
            onClick={handleAdd}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {added ? (
              <>
                <Check className="size-4" /> Agregado
              </>
            ) : (
              <>
                <Plus className="size-4" /> Agregar
              </>
            )}
          </Button>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{product.name}</DialogTitle>
            <DialogDescription className="sr-only">
              Detalle del producto
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-5">
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full rounded-lg aspect-square object-cover bg-muted"
            />
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {product.supplier?.companyName || 'Proveedor verificado'}
              </p>
              <Stars rating={product.rating} count={product.reviewCount} />
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.compareAtPrice!.toFixed(2)}
                  </span>
                )}
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    -{discountPct}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.longDescription ||
                  product.description ||
                  'Producto de calidad de proveedores verificados en Ecuador.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {product.stock > 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    En stock ({product.stock})
                  </Badge>
                ) : (
                  <Badge variant="secondary">Agotado</Badge>
                )}
                {product.sku && <span>SKU: {product.sku}</span>}
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  handleAdd()
                  setOpen(false)
                }}
              >
                <Plus className="size-4" /> Agregar al carrito
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
