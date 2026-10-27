'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Tag, CheckCircle2, XCircle, Loader2, Store, Calendar, RefreshCw,
  QrCode, Image as ImageIcon, Trash2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface AdminOffer {
  id: string
  title: string
  description?: string | null
  originalPrice?: number | null
  offerPrice?: number | null
  discountPct?: number | null
  imageUrl?: string | null
  startDate: string
  endDate: string
  status: string
  qrCode?: string | null
  qrTargetUrl?: string | null
  adminNotes?: string | null
  createdAt: string
  supplier: {
    id: string
    companyName: string
    websiteSlug: string
    logoUrl?: string | null
  }
}

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

const OFFER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
}

const OFFER_STATUS_BADGES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 border-red-300',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
}

function qrCodeUrl(targetPath: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://impulsepymes360.com'
  const fullUrl = `${origin}${targetPath}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(fullUrl)}`
}

export function OfertasAdminModule() {
  const toast = useAppStore((s) => s.toast)
  const [offers, setOffers] = useState<AdminOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminOffer | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/offers/admin')
      const d = await res.json()
      if (res.ok) setOffers(d.offers || [])
      else setOffers([])
    } catch {
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const approve = async (id: string) => {
    setActionId(id)
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al aprobar', 'error')
        return
      }
      toast('Oferta aprobada. QR generado y visible públicamente.', 'success')
      fetchAll()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setActionId(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    const id = rejectTarget.id
    setActionId(id)
    try {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', adminNotes: rejectNotes.trim() || undefined }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al rechazar', 'error')
        return
      }
      toast('Oferta rechazada. El proveedor fue notificado.', 'info')
      setRejectTarget(null)
      setRejectNotes('')
      fetchAll()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setActionId(null)
    }
  }

  const removeOffer = async (id: string) => {
    if (!confirm('¿Eliminar esta oferta permanentemente?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (!res.ok) {
        toast(d?.error || 'Error al eliminar', 'error')
        return
      }
      toast('Oferta eliminada', 'info')
      fetchAll()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const pending = offers.filter((o) => o.status === 'PENDING')
  const approved = offers.filter((o) => o.status === 'APPROVED')
  const rejected = offers.filter((o) => o.status === 'REJECTED')
  const expired = offers.filter((o) => o.status === 'EXPIRED')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="size-7 text-primary" /> Administrar Ofertas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Revisa, aprueba o rechaza las ofertas enviadas por los proveedores
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="size-9 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-1">
              <Tag className="size-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="size-9 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-1">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold">{approved.length}</p>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="size-9 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-1">
              <XCircle className="size-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold">{rejected.length}</p>
            <p className="text-xs text-muted-foreground">Rechazadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="size-9 mx-auto rounded-full bg-muted flex items-center justify-center mb-1">
              <Calendar className="size-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{expired.length}</p>
            <p className="text-xs text-muted-foreground">Expiradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de ofertas */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Tag className="size-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">No hay ofertas para revisar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando un proveedor envíe una oferta, aparecerá aquí para su aprobación.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {offers.map((o) => {
            const st = o.status
            const stLabel = OFFER_STATUS_LABELS[st] || st
            const stBadge = OFFER_STATUS_BADGES[st] || 'bg-muted text-muted-foreground border-border'
            const qrUrl = st === 'APPROVED' && o.qrTargetUrl ? qrCodeUrl(o.qrTargetUrl) : null
            return (
              <Card key={o.id} className={cn(
                'overflow-hidden',
                st === 'PENDING' && 'ring-1 ring-amber-300',
              )}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Imagen / preview */}
                    <div className="size-24 rounded-lg overflow-hidden bg-muted/30 shrink-0">
                      {o.imageUrl ? (
                        <img
                          src={o.imageUrl}
                          alt={o.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/o/200/200'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="size-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm leading-tight line-clamp-2">{o.title}</h3>
                        <Badge variant="outline" className={cn('shrink-0', stBadge)}>{stLabel}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Store className="size-3" />
                        <span className="truncate">{o.supplier.companyName}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        {o.originalPrice != null && (
                          <span className="text-muted-foreground line-through">{fmtUsd(o.originalPrice)}</span>
                        )}
                        {o.offerPrice != null && (
                          <span className="font-bold text-emerald-700">{fmtUsd(o.offerPrice)}</span>
                        )}
                        {o.discountPct != null && o.discountPct > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">-{o.discountPct}%</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        <span>
                          {new Date(o.startDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                          {' → '}
                          {new Date(o.endDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  {o.description && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{o.description}</p>
                  )}

                  {/* Notas admin (si rechazada) */}
                  {o.adminNotes && st === 'REJECTED' && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700 mt-3">
                      <strong>Nota:</strong> {o.adminNotes}
                    </div>
                  )}

                  {/* QR si aprobada */}
                  {qrUrl && (
                    <div className="flex items-center gap-3 rounded-md bg-emerald-50 border border-emerald-200 p-2 mt-3">
                      <img
                        src={qrUrl}
                        alt="QR generado"
                        className="size-16 rounded bg-white p-1 border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-700 font-semibold">QR activo</p>
                        <p className="text-[11px] text-emerald-600 font-mono">{o.qrCode}</p>
                        <p className="text-[11px] text-emerald-600 truncate">→ {o.qrTargetUrl}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => window.open(o.qrTargetUrl, '_blank')}
                      >
                        <QrCode className="size-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    {st === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                          disabled={actionId === o.id}
                          onClick={() => approve(o.id)}
                        >
                          {actionId === o.id ? (
                            <Loader2 className="size-3.5 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3.5 mr-1" />
                          )}
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1"
                          disabled={actionId === o.id}
                          onClick={() => { setRejectTarget(o); setRejectNotes('') }}
                        >
                          <XCircle className="size-3.5 mr-1" /> Rechazar
                        </Button>
                      </>
                    )}
                    {st !== 'PENDING' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto h-7"
                        disabled={deletingId === o.id}
                        onClick={() => removeOffer(o.id)}
                      >
                        {deletingId === o.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <><Trash2 className="size-3.5 mr-1" /> Eliminar</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog rechazar */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectNotes('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-600" /> Rechazar oferta
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de rechazar la oferta "{rejectTarget?.title}" del proveedor{' '}
              <strong>{rejectTarget?.supplier.companyName}</strong>?
              El proveedor recibirá una notificación con tu decisión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Notas para el proveedor (opcional)</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Ej: La imagen no cumple con los requisitos. Por favor usar una imagen más nítida."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes('') }}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={actionId === rejectTarget?.id}
              onClick={confirmReject}
            >
              {actionId === rejectTarget?.id ? (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="size-4 mr-1.5" />
              )}
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
