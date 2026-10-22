'use client'

import React, { useEffect, useState, useCallback, useTransition } from 'react'
import { Bell, CheckCheck, Package, Truck, DollarSign, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface AppNotification { id: string; type: string; title: string; message: string; link?: string | null; read: boolean; createdAt: string }

const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime(); const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'; if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60); if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

const ICON_MAP: Record<string, { icon: typeof Package; color: string }> = {
  ORDER_RECEIVED: { icon: Package, color: 'text-emerald-600 bg-emerald-100' },
  ORDER_STATUS: { icon: Package, color: 'text-sky-600 bg-sky-100' },
  SHIPMENT_ASSIGNED: { icon: Truck, color: 'text-sky-600 bg-sky-100' },
  COMMISSION_EARNED: { icon: DollarSign, color: 'text-amber-600 bg-amber-100' },
  NEW_STICKER: { icon: Sparkles, color: 'text-purple-600 bg-purple-100' },
  LOW_STOCK: { icon: AlertCircle, color: 'text-red-600 bg-red-100' },
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      startTransition(() => { setNotifications(data.notifications || []); setUnread(data.unreadCount || 0) })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchNotifications(); const i = setInterval(fetchNotifications, 30000); return () => clearInterval(i) }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n)); setUnread((u) => Math.max(0, u - 1))
  }
  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' })
    setNotifications((p) => p.map((n) => ({ ...n, read: true }))); setUnread(0)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notificaciones (${unread} sin leer)`}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2"><Bell className="size-4 text-primary" /><span className="font-medium text-sm">Notificaciones</span>{unread > 0 && <Badge variant="secondary" className="text-[10px]">{unread} nuevas</Badge>}</div>
          {unread > 0 && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}><CheckCheck className="size-3.5 mr-1" /> Marcar todas</Button>}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground"><Bell className="size-8 mx-auto mb-2 opacity-30" /><p>No tienes notificaciones</p></div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const ic = ICON_MAP[n.type] || { icon: Bell, color: 'text-muted-foreground bg-muted' }; const Icon = ic.icon
                return (
                  <button key={n.id} onClick={() => { if (!n.read) markAsRead(n.id); if (n.link) { setOpen(false); window.location.href = n.link } }} className={cn('w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors', !n.read && 'bg-primary/5')}>
                    <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0', ic.color)}><Icon className="size-4" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium leading-tight">{n.title}</p><p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p><p className="text-[10px] text-muted-foreground mt-1">{fmtRelative(n.createdAt)}</p></div>
                    {!n.read && <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
