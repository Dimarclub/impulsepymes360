'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  MessageSquare,
  MessageCircle,
  Send,
  RefreshCw,
  Search,
  Inbox,
  Copy,
  Code2,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Radio,
  ExternalLink,
  Bot,
  User,
  Headphones,
  ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ------------------------------------------------------------------ */
/* Tipos locales                                                       */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string
  sessionId: string
  sender: string // VISITOR | AGENT | BOT
  body: string
  createdAt: string
}

interface ChatSession {
  id: string
  userId: string
  visitorName: string
  visitorEmail?: string | null
  visitorIp?: string | null
  status: string // ACTIVE | CLOSED | WAITING
  messages?: ChatMessage[]
  _count?: { messages: number }
  createdAt: string
  updatedAt: string
}

interface ChatStats {
  active: number
  closed: number
  today: number
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  WAITING: 'En espera',
  CLOSED: 'Cerrada',
}

function statusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    case 'WAITING':
      return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
    case 'CLOSED':
      return 'bg-muted text-muted-foreground ring-1 ring-border'
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-border'
  }
}

function statusDot(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500'
    case 'WAITING':
      return 'bg-amber-500 animate-pulse'
    case 'CLOSED':
      return 'bg-muted-foreground/40'
    default:
      return 'bg-muted-foreground/40'
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const shortDate = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const relativeTime = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'ahora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const days = Math.floor(hr / 24)
  if (days < 7) return `hace ${days} d`
  return shortDate(s)
}

const messageTime = (s?: string | null) => {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColor(name: string): string {
  const palette = [
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
    'bg-lime-100 text-lime-700',
    'bg-orange-100 text-orange-700',
    'bg-cyan-100 text-cyan-700',
    'bg-fuchsia-100 text-fuchsia-700',
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

/* ------------------------------------------------------------------ */
/* Módulo principal                                                   */
/* ------------------------------------------------------------------ */

export function ChatModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar chats')
      const data = await res.json()
      setSessions(data.sessions || [])
      setStats(data.stats || null)
    } catch (err) {
      // Silencioso en refresh automático para no spamear toasts
      if (loading) toast((err as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }, [toast, loading])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Auto-refresh cada 5 segundos para simular real-time
  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions()
      if (activeSession) {
        refreshMessages(activeSession.id, true)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [activeSession?.id, loadSessions])

  const loadMessages = useCallback(
    async (sessionId: string, silent = false) => {
      if (!silent) setLoadingMessages(true)
      try {
        const res = await fetch(`/api/chat/${sessionId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Error al cargar mensajes')
        const data = await res.json()
        const newMessages: ChatMessage[] = data.session?.messages || []
        const lastId = newMessages[newMessages.length - 1]?.id
        const wasNew = lastId && lastId !== lastMessageIdRef.current
        setMessages(newMessages)
        lastMessageIdRef.current = lastId || null
        if (wasNew) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 50)
        }
      } catch (err) {
        if (!silent) toast((err as Error).message, 'error')
      } finally {
        setLoadingMessages(false)
      }
    },
    [toast]
  )

  const refreshMessages = useCallback(
    (sessionId: string, silent = true) => {
      loadMessages(sessionId, silent)
    },
    [loadMessages]
  )

  const selectSession = (session: ChatSession) => {
    setActiveSession(session)
    setMessages([])
    lastMessageIdRef.current = null
    loadMessages(session.id)
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const hay = `${s.visitorName} ${s.visitorEmail || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [sessions, filterStatus, search])

  // Conteo de mensajes nuevos (del visitante) para badge por sesión
  const newCountBySession = useMemo(() => {
    const map: Record<string, number> = {}
    if (!activeSession || messages.length === 0) return map
    // Cuenta mensajes VISITOR posteriores al último AGENT
    let lastAgentIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'AGENT') {
        lastAgentIdx = i
        break
      }
    }
    const newFromVisitor = messages
      .slice(lastAgentIdx + 1)
      .filter((m) => m.sender === 'VISITOR').length
    if (newFromVisitor > 0) map[activeSession.id] = newFromVisitor
    return map
  }, [activeSession, messages])

  const handleSend = async () => {
    if (!activeSession) return
    const text = draft.trim()
    if (!text) return
    setSending(true)
    // Optimistic
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeSession.id,
      sender: 'AGENT',
      body: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    setDraft('')
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    try {
      const res = await fetch(`/api/chat/${activeSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'No se pudo enviar')
      }
      // Recargar mensajes para obtener el real con id correcto
      await loadMessages(activeSession.id, true)
      await loadSessions()
    } catch (err) {
      // Rollback del mensaje optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      toast((err as Error).message, 'error')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!activeSession) return
    try {
      const res = await fetch(`/api/chat/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar')
      toast(`Chat marcado como "${STATUS_LABELS[status] || status}"`)
      setActiveSession((prev) => (prev ? { ...prev, status } : prev))
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, status } : s))
      )
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gradient">
            Chat en Vivo
          </h2>
          <p className="text-sm text-muted-foreground">
            Atiende a tus clientes en tiempo real desde tu sitio web.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <Radio className="size-3.5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Activas:</span>
              <span className="text-sm font-semibold tabular-nums">
                {stats?.active ?? 0}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-amber-600" />
              <span className="text-xs text-muted-foreground">Hoy:</span>
              <span className="text-sm font-semibold tabular-nums">
                {stats?.today ?? 0}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Layout principal */}
      <div className="grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Columna izquierda: lista de sesiones */}
        <Card className="p-0 overflow-hidden">
          <CardHeader className="px-4 py-3 border-b space-y-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="size-4" />
              Conversaciones
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar…"
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ACTIVE">Activas</SelectItem>
                  <SelectItem value="WAITING">En espera</SelectItem>
                  <SelectItem value="CLOSED">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto scroll-thin">
              {loading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-sm text-muted-foreground">
                  <Inbox className="size-8 mb-2 opacity-50" />
                  <p className="font-medium">Sin conversaciones</p>
                  <p className="text-xs mt-1">
                    {sessions.length === 0
                      ? 'Comparte tu widget de chat en tu sitio web.'
                      : 'Ajusta los filtros para ver más.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSessions.map((s) => {
                    const lastMsg = (s.messages as ChatMessage[] | undefined)?.[0]
                    const isActive = activeSession?.id === s.id
                    const newCount = newCountBySession[s.id] || 0
                    return (
                      <button
                        key={s.id}
                        onClick={() => selectSession(s)}
                        className={`w-full text-left p-3 hover:bg-muted/40 transition-colors flex items-start gap-2.5 ${
                          isActive ? 'bg-emerald-50/50 border-l-2 border-emerald-500' : ''
                        }`}
                      >
                        <div
                          className={`size-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(
                            s.visitorName
                          )}`}
                        >
                          {initials(s.visitorName)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">
                              {s.visitorName}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                              {relativeTime(s.updatedAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {lastMsg
                              ? lastMsg.body
                              : s.visitorEmail || 'Sin mensajes aún'}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className={`size-1.5 rounded-full ${statusDot(s.status)}`}
                            />
                            <Badge
                              variant="outline"
                              className={`text-[9px] py-0 px-1.5 h-4 ${statusBadge(s.status)}`}
                            >
                              {STATUS_LABELS[s.status] || s.status}
                            </Badge>
                            {newCount > 0 && (
                              <Badge className="ml-auto text-[9px] py-0 px-1.5 h-4 bg-emerald-600 text-white">
                                {newCount} nuevo{newCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                            {s._count && s._count.messages > 0 && newCount === 0 && (
                              <span className="ml-auto text-[10px] text-muted-foreground">
                                {s._count.messages} msj
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Columna derecha: conversación + widget */}
        <div className="space-y-4">
          {activeSession ? (
            <Card className="p-0 overflow-hidden flex flex-col" style={{ minHeight: '60vh' }}>
              {/* Header conversación */}
              <div className="px-4 py-3 border-b flex items-center gap-3 bg-muted/30">
                <div
                  className={`size-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarColor(
                    activeSession.visitorName
                  )}`}
                >
                  {initials(activeSession.visitorName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">
                      {activeSession.visitorName}
                    </span>
                    <span
                      className={`size-1.5 rounded-full ${statusDot(activeSession.status)}`}
                    />
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusBadge(activeSession.status)}`}
                    >
                      {STATUS_LABELS[activeSession.status] || activeSession.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activeSession.visitorEmail || 'Sin email'} ·{' '}
                    {activeSession.visitorIp || 'IP desconocida'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {activeSession.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('CLOSED')}
                      className="h-8 text-xs"
                    >
                      <XCircle className="size-3.5" />
                      Cerrar chat
                    </Button>
                  )}
                  {activeSession.status === 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('ACTIVE')}
                      className="h-8 text-xs"
                    >
                      <CheckCircle2 className="size-3.5" />
                      Reabrir
                    </Button>
                  )}
                  {activeSession.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusChange('WAITING')}
                      className="h-8 text-xs"
                    >
                      <Clock className="size-3.5" />
                      En espera
                    </Button>
                  )}
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-3 bg-background">
                {loadingMessages ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={i}
                        className={`h-12 w-2/3 rounded-lg ${
                          i % 2 === 0 ? '' : 'ml-auto'
                        }`}
                      />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-sm text-muted-foreground">
                    <MessageSquare className="size-8 mb-2 opacity-50" />
                    <p>No hay mensajes aún. Inicia la conversación.</p>
                  </div>
                ) : (
                  messages.map((m) => <MessageBubble key={m.id} message={m} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t bg-muted/30">
                {activeSession.status === 'CLOSED' ? (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    Esta sesión está cerrada. Reábrela para continuar la conversación.
                  </p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSend()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Escribe tu mensaje…"
                      disabled={sending}
                      maxLength={4000}
                    />
                    <Button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    >
                      {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                      Enviar
                    </Button>
                  </form>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
              <div className="size-16 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center mb-3">
                <Headphones className="size-8 text-emerald-700" />
              </div>
              <CardTitle className="text-lg mb-1">Selecciona una conversación</CardTitle>
              <CardDescription className="text-sm max-w-sm">
                No hay chats activos. Comparte tu widget de chat en tu sitio web para
                empezar a recibir mensajes de tus clientes.
              </CardDescription>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setWidgetDialogOpen(true)}
              >
                <Code2 className="size-4" />
                Ver widget para tu sitio
              </Button>
            </Card>
          )}

          {/* Widget code card */}
          <WidgetCodeCard
            userId={currentUser?.id || ''}
            onPreview={() => setWidgetDialogOpen(true)}
          />
        </div>
      </div>

      {/* Dialog vista previa del widget */}
      <WidgetPreviewDialog
        open={widgetDialogOpen}
        onOpenChange={setWidgetDialogOpen}
        userId={currentUser?.id || ''}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Message bubble                                                     */
/* ------------------------------------------------------------------ */

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.sender === 'BOT') {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] rounded-lg bg-amber-100/60 ring-1 ring-amber-200 px-3 py-1.5 text-xs text-amber-800 flex items-center gap-1.5">
          <Bot className="size-3 shrink-0" />
          <span>{message.body}</span>
          <span className="text-[10px] text-amber-700/70 ml-1">
            {messageTime(message.createdAt)}
          </span>
        </div>
      </div>
    )
  }
  const isAgent = message.sender === 'AGENT'
  return (
    <div className={`flex items-end gap-2 ${isAgent ? 'flex-row-reverse' : ''}`}>
      <div
        className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
          isAgent
            ? 'bg-emerald-600 text-white'
            : avatarColor('visitor-' + message.sender)
        }`}
      >
        {isAgent ? <Headphones className="size-3.5" /> : <User className="size-3.5" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isAgent
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={`text-[10px] mt-1 ${
            isAgent ? 'text-emerald-100/80' : 'text-muted-foreground'
          }`}
        >
          {messageTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Widget code card                                                   */
/* ------------------------------------------------------------------ */

function WidgetCodeCard({
  userId,
  onPreview,
}: {
  userId: string
  onPreview: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''

  const code = userId
    ? `<script src="${origin}/chat-widget.js?userId=${userId}"></script>`
    : '<!-- Inicia sesión para generar tu widget -->'

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast('Código copiado al portapapeles')
    } catch {
      toast('No se pudo copiar', 'error')
    }
  }

  return (
    <Card className="p-5 gap-3">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-lg bg-amber-50 ring-1 ring-amber-200 flex items-center justify-center shrink-0">
          <Code2 className="size-4 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm">Widget para tu sitio</CardTitle>
          <CardDescription className="text-xs">
            Pega este código antes de <code className="font-mono">&lt;/body&gt;</code> en
            tu web para activar el chat en vivo.
          </CardDescription>
        </div>
      </div>
      <div className="rounded-lg border bg-muted/40 p-3 font-mono text-[11px] text-foreground/80 break-all">
        {code}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copyCode} disabled={!userId}>
          <Copy className="size-3.5" />
          Copiar código
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPreview}
          disabled={!userId}
          className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
        >
          <Eye className="size-3.5" />
          Vista previa del widget
        </Button>
        {userId && (
          <Button size="sm" variant="ghost" asChild className="ml-auto text-xs">
            <a href="/chat/widget" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              Abrir página
            </a>
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Widget preview dialog                                              */
/* ------------------------------------------------------------------ */

function WidgetPreviewDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  userId: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-base">Vista previa del widget</DialogTitle>
          <DialogDescription className="text-xs">
            Así verá el visitante el chat al hacer clic en el widget embebido en tu sitio.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-4">
          <WidgetSimulator userId={userId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Widget simulator (mini versión del lado del visitante)             */
/* ------------------------------------------------------------------ */

function WidgetSimulator({ userId }: { userId: string }) {
  const [started, setStarted] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useAppStore((s) => s.toast)

  const start = async () => {
    if (!visitorName.trim() || !userId) return
    setLoading(true)
    try {
      const res = await fetch('/api/chat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorName: visitorName.trim(), userId }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'No se pudo iniciar el chat')
      }
      const data = await res.json()
      setSessionId(data.sessionId)
      setStarted(true)
      setMessages([
        {
          id: 'welcome',
          sessionId: data.sessionId,
          sender: 'BOT',
          body: `¡Hola ${visitorName}! Gracias por contactarte con nosotros. En breve te atenderemos.`,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    if (!sessionId || !draft.trim()) return
    const text = draft.trim()
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      sender: 'VISITOR',
      body: text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])
    setDraft('')
    try {
      const res = await fetch(`/api/chat/public/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) throw new Error('No se pudo enviar')
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      toast((err as Error).message, 'error')
    }
  }

  const reset = () => {
    setStarted(false)
    setSessionId(null)
    setMessages([])
    setVisitorName('')
  }

  return (
    <div className="rounded-xl border bg-background overflow-hidden flex flex-col" style={{ minHeight: '360px' }}>
      {/* Header */}
      <div className="bg-emerald-600 text-white px-3 py-2.5 flex items-center gap-2">
        <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
          <Headphones className="size-3.5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium leading-tight">Soporte en vivo</p>
          <p className="text-[10px] text-emerald-100 flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
            En línea
          </p>
        </div>
      </div>

      {/* Body */}
      {!started ? (
        <div className="flex-1 p-4 space-y-3 flex flex-col justify-center">
          <div className="text-center space-y-1">
            <MessageCircle className="size-8 mx-auto text-emerald-600" />
            <p className="text-sm font-medium">Inicia el chat</p>
            <p className="text-xs text-muted-foreground">
              Cuéntanos tu nombre para empezar a chatear con el equipo.
            </p>
          </div>
          <Input
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="Tu nombre"
            onKeyDown={(e) => {
              if (e.key === 'Enter') start()
            }}
          />
          <Button
            onClick={start}
            disabled={!visitorName.trim() || loading || !userId}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="sm"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Comenzar
          </Button>
          {!userId && (
            <p className="text-[10px] text-amber-700 text-center">
              Inicia sesión como proveedor para probar el widget.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-2 bg-muted/30">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
          <div className="p-2 border-t bg-background flex gap-1.5">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') send()
              }}
            />
            <Button
              onClick={send}
              size="sm"
              disabled={!draft.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 h-8 px-2.5"
            >
              <Send className="size-3.5" />
            </Button>
          </div>
          <div className="px-2 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-6 text-[10px] text-muted-foreground w-full"
            >
              Cerrar vista previa
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatModule
