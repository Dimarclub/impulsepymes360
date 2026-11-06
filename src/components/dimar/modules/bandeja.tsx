'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageCircle,
  Instagram,
  Facebook,
  Mail,
  Smartphone,
  Phone,
  Send,
  Search,
  Inbox,
  RefreshCw,
  Trash2,
  Archive,
  Link2,
  Sparkles,
  CheckCheck,
  MoreVertical,
  Paperclip,
  ArrowLeft,
  Users,
  CornerUpLeft,
  CheckCircle2,
  UserCircle2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import type { CrmContact } from '@/lib/types'

// ---------- Tipos ----------

type Channel = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'EMAIL' | 'SMS' | 'PHONE'
type MsgStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'

interface UnifiedMessage {
  id: string
  userId: string
  channel: Channel
  fromName: string
  fromHandle?: string | null
  toName?: string | null
  subject?: string | null
  body: string
  attachments?: string | null
  status: MsgStatus
  contactId?: string | null
  isOutgoing: boolean
  parentMessageId?: string | null
  createdAt: string
  contact?: CrmContact | null
}

interface BandejaStats {
  total: number
  unread: number
  byChannel: Record<string, number>
}

// ---------- Config de canales ----------

interface ChannelCfg {
  id: Channel | 'ALL'
  label: string
  icon: typeof MessageCircle
  // Clases Tailwind (sin azul/índigo). Facebook usa sky-500 en lugar de #1877F2.
  badgeBg: string
  badgeText: string
  dot: string
}

const CHANNELS: ChannelCfg[] = [
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle, badgeBg: 'bg-emerald-100 dark:bg-emerald-950', badgeText: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram, badgeBg: 'bg-rose-100 dark:bg-rose-950', badgeText: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { id: 'FACEBOOK', label: 'Facebook', icon: Facebook, badgeBg: 'bg-sky-100 dark:bg-sky-950', badgeText: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
  { id: 'TIKTOK', label: 'TikTok', icon: Smartphone, badgeBg: 'bg-gray-200 dark:bg-gray-800', badgeText: 'text-gray-700 dark:text-gray-200', dot: 'bg-gray-900 dark:bg-gray-100' },
  { id: 'EMAIL', label: 'Email', icon: Mail, badgeBg: 'bg-rose-100 dark:bg-rose-950', badgeText: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { id: 'SMS', label: 'SMS', icon: Smartphone, badgeBg: 'bg-emerald-100 dark:bg-emerald-950', badgeText: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { id: 'PHONE', label: 'Teléfono', icon: Phone, badgeBg: 'bg-amber-100 dark:bg-amber-950', badgeText: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
]

const STATUS_LABELS: Record<MsgStatus, string> = {
  UNREAD: 'No leído',
  READ: 'Leído',
  REPLIED: 'Respondido',
  ARCHIVED: 'Archivado',
}

// ---------- Helpers ----------

function initials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const days = Math.floor(h / 24)
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} d`
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function channelCfg(id: string): ChannelCfg {
  return CHANNELS.find((c) => c.id === id) || CHANNELS[0]
}

// ---------- Componente principal ----------

export function BandejaModule() {
  const toast = useAppStore((s) => s.toast)
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [stats, setStats] = useState<BandejaStats>({ total: 0, unread: 0, byChannel: {} })
  const [loading, setLoading] = useState(true)
  const [activeChannel, setActiveChannel] = useState<Channel | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [simulating, setSimulating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeChannel !== 'ALL') params.set('channel', activeChannel)
      const res = await fetch(`/api/bandeja?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar la bandeja')
      const data = await res.json()
      setMessages(data.messages || [])
      setStats(data.stats || { total: 0, unread: 0, byChannel: {} })
    } catch (err) {
      toast((err as Error).message || 'Error al cargar bandeja', 'error')
    } finally {
      setLoading(false)
    }
  }, [activeChannel, toast])

  useEffect(() => {
    load()
  }, [load])

  // Mensaje seleccionado (puede no estar en la lista si fue filtrado)
  const selectedMessage = useMemo(() => {
    if (!selectedId) return null
    return messages.find((m) => m.id === selectedId) || null
  }, [selectedId, messages])

  // Filtrado local por búsqueda (además del filtro de canal del server)
  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages
    const q = search.toLowerCase()
    return messages.filter(
      (m) =>
        m.fromName.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.fromHandle || '').toLowerCase().includes(q)
    )
  }, [messages, search])

  const handleSelect = useCallback(
    async (msg: UnifiedMessage) => {
      setSelectedId(msg.id)
      // Auto-marcar como leído si era UNREAD
      if (msg.status === 'UNREAD') {
        try {
          await fetch(`/api/bandeja/${msg.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'READ' }),
          })
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, status: 'READ' } : m))
          )
          setStats((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
        } catch {
          /* ignore */
        }
      }
    },
    []
  )

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const res = await fetch('/api/bandeja/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error('No se pudieron simular mensajes')
      const data = await res.json()
      toast(`${data.count} mensajes simulados creados`)
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSimulating(false)
    }
  }

  const handleBulk = async (action: 'markRead' | 'markUnread' | 'archive') => {
    if (selectedIds.size === 0) return
    try {
      const res = await fetch('/api/bandeja/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      if (!res.ok) throw new Error('No se pudo aplicar la acción')
      const data = await res.json()
      toast(`${data.count} mensaje(s) actualizado(s)`)
      setSelectedIds(new Set())
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bandeja/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      toast('Mensaje eliminado')
      if (selectedId === id) setSelectedId(null)
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/bandeja/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      })
      if (!res.ok) throw new Error('No se pudo archivar')
      toast('Mensaje archivado')
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleMarkRead = async (id: string, markRead: boolean) => {
    try {
      const res = await fetch(`/api/bandeja/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: markRead ? 'READ' : 'UNREAD' }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar')
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleReply = async (id: string, body: string) => {
    const res = await fetch(`/api/bandeja/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) throw new Error('No se pudo enviar la respuesta')
    return res.json()
  }

  const handleLinkContact = async (id: string, contactId: string | null) => {
    try {
      const res = await fetch(`/api/bandeja/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      if (!res.ok) throw new Error('No se pudo vincular el contacto')
      toast(contactId ? 'Contacto vinculado' : 'Contacto desvinculado')
      await load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        loading={loading}
        simulating={simulating}
        onReload={load}
        onSimulate={handleSimulate}
        stats={stats}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[250px_360px_1fr] gap-4 min-h-[70vh]">
        {/* Columna izquierda: canales */}
        <ChannelsSidebar
          activeChannel={activeChannel}
          onSelect={(c) => {
            setActiveChannel(c)
            setSelectedId(null)
          }}
          stats={stats}
          loading={loading}
          onSimulate={handleSimulate}
          simulating={simulating}
        />

        {/* Columna central: lista de mensajes */}
        <MessagesList
          messages={filteredMessages}
          loading={loading}
          search={search}
          onSearch={setSearch}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onToggleSelect={(id) =>
            setSelectedIds((prev) => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }
          onBulk={handleBulk}
          activeChannel={activeChannel}
        />

        {/* Columna derecha: conversación */}
        <ConversationView
          message={selectedMessage}
          allMessages={messages}
          loading={loading}
          onReply={handleReply}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onMarkRead={handleMarkRead}
          onLinkContact={handleLinkContact}
          onReload={load}
          toast={toast}
        />
      </div>
    </div>
  )
}

// ---------- Header ----------

function ModuleHeader({
  loading,
  simulating,
  onReload,
  onSimulate,
  stats,
}: {
  loading: boolean
  simulating: boolean
  onReload: () => void
  onSimulate: () => void
  stats: BandejaStats
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-semibold tracking-tight">Bandeja Unificada</h2>
          {stats.unread > 0 && (
            <Badge className="bg-emerald-600 text-white">{stats.unread} sin leer</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Todos tus canales en un solo lugar · {stats.total} mensajes totales
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
        <Button
          size="sm"
          onClick={onSimulate}
          disabled={simulating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Sparkles className={`h-4 w-4 ${simulating ? 'animate-pulse' : ''}`} />
          {simulating ? 'Simulando…' : 'Simular mensajes'}
        </Button>
      </div>
    </div>
  )
}

// ---------- Sidebar de canales ----------

function ChannelsSidebar({
  activeChannel,
  onSelect,
  stats,
  loading,
  onSimulate,
  simulating,
}: {
  activeChannel: Channel | 'ALL'
  onSelect: (c: Channel | 'ALL') => void
  stats: BandejaStats
  loading: boolean
  onSimulate: () => void
  simulating: boolean
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          Canales
        </CardTitle>
        <CardDescription className="text-xs">
          Filtra por canal de origen
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 pt-0 space-y-1">
        {/* Todos */}
        <button
          onClick={() => onSelect('ALL')}
          className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
            activeChannel === 'ALL'
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium'
              : 'hover:bg-muted'
          }`}
        >
          <span className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Todos
          </span>
          <Badge variant="secondary" className="text-xs">
            {stats.total}
          </Badge>
        </button>

        <Separator className="my-1" />

        {CHANNELS.map((c) => {
          const count = stats.byChannel[c.id] || 0
          const Icon = c.icon
          const active = activeChannel === c.id
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id as Channel)}
              className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? `${c.badgeBg} ${c.badgeText} font-medium`
                  : 'hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{c.label}</span>
              </span>
              {count > 0 && (
                <Badge variant="secondary" className="text-xs ml-2">
                  {count}
                </Badge>
              )}
            </button>
          )
        })}

        <Separator className="my-2" />

        {/* Stats al final */}
        <div className="px-3 py-2 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Total mensajes</span>
            <span className="font-medium text-foreground">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>No leídos</span>
            <span className="font-medium text-emerald-600">{stats.unread}</span>
          </div>
        </div>

        {/* Botón móvil para simular */}
        <Button
          variant="outline"
          size="sm"
          className="w-full lg:hidden mt-2"
          onClick={onSimulate}
          disabled={simulating || loading}
        >
          <Sparkles className={`h-4 w-4 ${simulating ? 'animate-pulse' : ''}`} />
          {simulating ? 'Simulando…' : 'Simular mensajes'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------- Lista de mensajes ----------

function MessagesList({
  messages,
  loading,
  search,
  onSearch,
  selectedId,
  selectedIds,
  onSelect,
  onToggleSelect,
  onBulk,
  activeChannel,
}: {
  messages: UnifiedMessage[]
  loading: boolean
  search: string
  onSearch: (v: string) => void
  selectedId: string | null
  selectedIds: Set<string>
  onSelect: (m: UnifiedMessage) => void
  onToggleSelect: (id: string) => void
  onBulk: (a: 'markRead' | 'markUnread' | 'archive') => void
  activeChannel: Channel | 'ALL'
}) {
  const allChecked = messages.length > 0 && messages.every((m) => selectedIds.has(m.id))
  const someChecked = selectedIds.size > 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">
            {activeChannel === 'ALL' ? 'Todos los mensajes' : channelCfg(activeChannel).label}
          </CardTitle>
          <Badge variant="secondary" className="text-xs ml-auto">
            {messages.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nombre, asunto, contenido…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {someChecked && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 animate-in fade-in">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              {selectedIds.size} seleccionado(s)
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onBulk('markRead')}>
                <CheckCheck className="h-3.5 w-3.5" /> Leer
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onBulk('archive')}>
                <Archive className="h-3.5 w-3.5" /> Archivar
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="max-h-[70vh] overflow-y-auto scroll-thin">
          {loading ? (
            <MessagesListSkeleton />
          ) : messages.length === 0 ? (
            <EmptyMessages />
          ) : (
            <div className="px-1 pb-2">
              {/* Select all row */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) => {
                    if (v) {
                      // add all
                      messages.forEach((m) => {
                        if (!selectedIds.has(m.id)) onToggleSelect(m.id)
                      })
                    } else {
                      messages.forEach((m) => {
                        if (selectedIds.has(m.id)) onToggleSelect(m.id)
                      })
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {allChecked ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </span>
              </div>
              {messages.map((m) => {
                const cfg = channelCfg(m.channel)
                const Icon = cfg.icon
                const selected = m.id === selectedId
                const checked = selectedIds.has(m.id)
                return (
                  <div
                    key={m.id}
                    className={`relative flex items-start gap-2 px-2 py-2.5 cursor-pointer transition-colors border-l-4 ${
                      selected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600'
                        : m.status === 'UNREAD'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-transparent hover:bg-muted'
                        : 'border-transparent hover:bg-muted'
                    }`}
                    onClick={() => onSelect(m)}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleSelect(m.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1"
                    />
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className={`${cfg.badgeBg} ${cfg.badgeText} text-xs font-medium`}>
                        {initials(m.fromName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm truncate ${
                            m.status === 'UNREAD' ? 'font-semibold' : 'font-medium'
                          }`}
                        >
                          {m.fromName}
                        </span>
                        {m.status === 'UNREAD' && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                          {timeAgo(m.createdAt)}
                        </span>
                      </div>
                      {m.subject && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {m.subject}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon className={`h-3 w-3 ${cfg.badgeText}`} />
                        <span className={`text-[10px] ${cfg.badgeText} font-medium`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {m.body}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MessagesListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">No hay mensajes</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Usa el botón &quot;Simular mensajes&quot; para crear datos de demostración
      </p>
    </div>
  )
}

// ---------- Vista de conversación ----------

function ConversationView({
  message,
  allMessages,
  loading,
  onReply,
  onDelete,
  onArchive,
  onMarkRead,
  onLinkContact,
  onReload,
  toast,
}: {
  message: UnifiedMessage | null
  allMessages: UnifiedMessage[]
  loading: boolean
  onReply: (id: string, body: string) => Promise<any>
  onDelete: (id: string) => void
  onArchive: (id: string) => void
  onMarkRead: (id: string, markRead: boolean) => void
  onLinkContact: (id: string, contactId: string | null) => void
  onReload: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)

  // Construye el thread: mensaje original + respuestas outgoing con parentMessageId
  const thread = useMemo(() => {
    if (!message) return []
    const replies = allMessages.filter((m) => m.parentMessageId === message.id)
    // Orden cronológico: original primero, luego respuestas
    return [message, ...replies].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [message, allMessages])

  const handleSend = async () => {
    if (!message || !replyText.trim()) return
    setSending(true)
    try {
      await onReply(message.id, replyText.trim())
      setReplyText('')
      toast('Respuesta enviada')
      await onReload()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSending(false)
    }
  }

  if (loading && !message) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!message) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Inbox className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium">Selecciona un mensaje</p>
          <p className="text-xs mt-1">
            Elige una conversación de la lista para ver el detalle y responder
          </p>
        </CardContent>
      </Card>
    )
  }

  const cfg = channelCfg(message.channel)
  const Icon = cfg.icon

  return (
    <Card className="h-full flex flex-col">
      {/* Header del thread */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={`${cfg.badgeBg} ${cfg.badgeText} text-sm font-medium`}>
              {initials(message.fromName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base truncate">{message.fromName}</CardTitle>
              <Badge variant="outline" className={`${cfg.badgeBg} ${cfg.badgeText} border-0 text-[10px]`}>
                <Icon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
              {message.status === 'UNREAD' && (
                <Badge className="bg-emerald-600 text-white text-[10px]">No leído</Badge>
              )}
              {message.status === 'REPLIED' && (
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                  <CheckCheck className="h-3 w-3 mr-1" /> Respondido
                </Badge>
              )}
              {message.status === 'ARCHIVED' && (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">
                  <Archive className="h-3 w-3 mr-1" /> Archivado
                </Badge>
              )}
            </div>
            {message.fromHandle && (
              <CardDescription className="text-xs mt-0.5 truncate">
                {message.fromHandle}
              </CardDescription>
            )}
          </div>
          {/* Acciones */}
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setLinkOpen(true)}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vincular contacto CRM</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMarkRead(message.id, message.status !== 'READ')}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  {message.status === 'READ' ? 'Marcar como no leído' : 'Marcar como leído'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(message.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archivar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(message.id)}
                  className="text-rose-600 focus:text-rose-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Contacto vinculado */}
      {message.contact && (
        <div className="mx-4 mt-3 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 mb-1.5">
            <UserCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">Contacto CRM vinculado</span>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                {initials(message.contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{message.contact.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {message.contact.email}
                {message.contact.phone ? ` · ${message.contact.phone}` : ''}
                {message.contact.company ? ` · ${message.contact.company}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thread / mensajes */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="max-h-[45vh] overflow-y-auto scroll-thin p-4 space-y-3">
          {thread.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.isOutgoing ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  m.isOutgoing
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {m.subject && !m.isOutgoing && (
                  <div className="text-xs font-medium mb-1 opacity-70">{m.subject}</div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <div
                  className={`text-[10px] mt-1 ${
                    m.isOutgoing ? 'text-emerald-100' : 'text-muted-foreground'
                  }`}
                >
                  {timeAgo(m.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Input de respuesta */}
      <div className="border-t p-3 space-y-2">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" disabled>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            placeholder={`Responder a ${message.fromName}…`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 min-h-[40px] max-h-32 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            size="icon"
            className="h-9 w-9 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
            disabled={!replyText.trim() || sending}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CornerUpLeft className="h-3 w-3" />
            Enter para enviar · Shift+Enter para nueva línea
          </span>
          <span>Respondido como {cfg.label}</span>
        </div>
      </div>

      {/* Dialog vincular contacto */}
      <LinkContactDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        currentContactId={message.contactId || null}
        onLink={(cid) => {
          onLinkContact(message.id, cid)
          setLinkOpen(false)
        }}
      />
    </Card>
  )
}

// ---------- Dialog: Vincular contacto CRM ----------

function LinkContactDialog({
  open,
  onOpenChange,
  currentContactId,
  onLink,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentContactId: string | null
  onLink: (contactId: string | null) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* El body solo se monta cuando open=true: useState se reinicia solo */}
        {open && (
          <LinkContactDialogBody
            currentContactId={currentContactId}
            onCancel={() => onOpenChange(false)}
            onLink={(cid) => {
              onLink(cid)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function LinkContactDialogBody({
  currentContactId,
  onCancel,
  onLink,
}: {
  currentContactId: string | null
  onCancel: () => void
  onLink: (contactId: string | null) => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [contacts, setContacts] = useState<CrmContact[]>([])
  // Inicializamos loading=true (primer render) — solo se settea a false en
  // callback async (cumple react-hooks/set-state-in-effect).
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string>(currentContactId || '')

  useEffect(() => {
    let cancelled = false
    fetch('/api/crm/contacts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return
        setContacts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) toast('Error al cargar contactos', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [toast])

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-emerald-600" />
          Vincular contacto CRM
        </DialogTitle>
        <DialogDescription>
          Asocia este mensaje a un contacto de tu CRM para llevar seguimiento.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contacto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="max-h-72 overflow-y-auto scroll-thin space-y-1 border rounded-md p-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No se encontraron contactos
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                  selected === c.id
                    ? 'bg-emerald-50 dark:bg-emerald-950 ring-1 ring-emerald-300'
                    : 'hover:bg-muted'
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs">
                    {initials(c.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {c.email}
                    {c.company ? ` · ${c.company}` : ''}
                  </div>
                </div>
                {selected === c.id && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                )}
              </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {currentContactId && (
            <Button
              variant="outline"
              onClick={() => onLink(null)}
              className="text-rose-600 hover:text-rose-700"
            >
              Desvincular
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={!selected || selected === currentContactId}
            onClick={() => onLink(selected)}
          >
            Vincular
          </Button>
        </DialogFooter>
      </>
  )
}

// Pequeño componente re-exportado por si el módulo necesita mobile back-button
export function BandejaBackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="lg:hidden">
      <ArrowLeft className="h-4 w-4" />
      Volver
    </Button>
  )
}
