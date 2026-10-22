'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell, Package, DollarSign, Truck, CheckCircle2, AlertCircle,
  CheckCheck, ShoppingCart, TrendingUp,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

const ICON_MAP: Record<string, { icon: typeof Package; color: string }> = {
  ORDER_RECEIVED: { icon: Package, color: 'text-emerald-600 bg-emerald-100' },
  ORDER_STATUS: { icon: Truck, color: 'text-sky-600 bg-sky-100' },
  SHIPMENT_ASSIGNED: { icon: Truck, color: 'text-sky-600 bg-sky-100' },
  COMMISSION_EARNED: { icon: DollarSign, color: 'text-amber-600 bg-amber-100' },
}

export function AlertasCenterModule() {
  const toast = useAppStore((s) => s.toast)
  const setModule = useAppStore((s) => s.setModule)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) { setNotifications([]); return }
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch { setNotifications([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setNotifications((p) => p.map((n) => ({ ...n, read: true })))
    toast('Todas marcadas como leídas', 'success')
  }

  if (loading) return <Skeleton className="h-96" />

  const unread = notifications.filter((n) => !n.read).length
  const orders = notifications.filter((n) => n.type === 'ORDER_RECEIVED' || n.type === 'ORDER_STATUS')
  const commissions = notifications.filter((n) => n.type === 'COMMISSION_EARNED')
  const shipments = notifications.filter((n) => n.type === 'SHIPMENT_ASSIGNED')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="size-7 text-primary" /> Centro de Alertas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{unread} sin leer de {notifications.length} total</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="size-4 mr-1" /> Marcar todas leídas
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><Package className="size-5 mx-auto text-emerald-600 mb-1" /><p className="text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">Pedidos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><DollarSign className="size-5 mx-auto text-amber-600 mb-1" /><p className="text-2xl font-bold">{commissions.length}</p><p className="text-xs text-muted-foreground">Comisiones</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Truck className="size-5 mx-auto text-sky-600 mb-1" /><p className="text-2xl font-bold">{shipments.length}</p><p className="text-xs text-muted-foreground">Envíos</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Bell className="size-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold text-red-500">{unread}</p><p className="text-xs text-muted-foreground">Sin leer</p></CardContent></Card>
      </div>

      {/* Lista de alertas */}
      <Card>
        <CardHeader><CardTitle className="text-base">Todas las alertas</CardTitle></CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="size-12 mx-auto text-muted-foreground mb-3 opacity-30" />
              <p className="font-medium">No tienes alertas</p>
              <p className="text-sm text-muted-foreground mt-1">Las alertas de pedidos, comisiones y envíos aparecerán aquí</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {notifications.map((n) => {
                  const ic = ICON_MAP[n.type] || { icon: Bell, color: 'text-muted-foreground bg-muted' }
                  const Icon = ic.icon
                  return (
                    <div key={n.id} className={cn('w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors', !n.read && 'bg-primary/5')}>
                      <button onClick={() => { if (!n.read) markAsRead(n.id); if (n.link) setModule(n.link.replace('/?module=', '').replace('&', '') as any) }}
                        className="flex items-start gap-3 flex-1 text-left min-w-0">
                        <div className={cn('size-9 rounded-full flex items-center justify-center shrink-0', ic.color)}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{n.title}</p>
                            {!n.read && <span className="size-2 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">{fmtRelative(n.createdAt)}</p>
                        </div>
                      </button>
                      {(n.type === 'ORDER_RECEIVED' || n.type === 'ORDER_STATUS') && (
                        <Button size="sm" variant="outline" className="shrink-0" onClick={() => { if (!n.read) markAsRead(n.id); setModule('logistics') }}>
                          <Truck className="size-3.5 mr-1" /> Gestionar
                        </Button>
                      )}
                      {n.type === 'COMMISSION_EARNED' && (
                        <Button size="sm" variant="outline" className="shrink-0" onClick={() => { if (!n.read) markAsRead(n.id); setModule('finanzas') }}>
                          <DollarSign className="size-3.5 mr-1" /> Ver
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
