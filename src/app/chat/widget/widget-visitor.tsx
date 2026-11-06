'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Send,
  RefreshCw,
  Headphones,
  User,
  Bot,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface ChatMessage {
  id: string
  sessionId: string
  sender: string // VISITOR | AGENT | BOT
  body: string
  createdAt: string
}

const messageTime = (s?: string | null) => {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.sender === 'BOT') {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] rounded-lg bg-amber-100 ring-1 ring-amber-200 px-3 py-1.5 text-xs text-amber-800 flex items-center gap-1.5">
          <Bot className="size-3 shrink-0" />
          <span>{message.body}</span>
          <span className="text-[10px] text-amber-700/70 ml-1">
            {messageTime(message.createdAt)}
          </span>
        </div>
      </div>
    )
  }
  const isVisitor = message.sender === 'VISITOR'
  return (
    <div className={`flex items-end gap-2 ${isVisitor ? 'flex-row-reverse' : ''}`}>
      <div
        className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
          isVisitor
            ? 'bg-emerald-600 text-white'
            : 'bg-muted text-foreground ring-1 ring-border'
        }`}
      >
        {isVisitor ? <User className="size-3.5" /> : <Headphones className="size-3.5" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isVisitor
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={`text-[10px] mt-1 ${
            isVisitor ? 'text-emerald-100/80' : 'text-muted-foreground'
          }`}
        >
          {messageTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

/**
 * Cliente del chat widget: el visitante ingresa su nombre → inicia sesión →
 * chatea con el negocio. Usa los endpoints públicos /api/chat/start y
 * /api/chat/public/[id].
 */
export function WidgetVisitor({
  userId,
  presetName,
}: {
  userId: string | null
  presetName: string | null
}) {
  const [visitorName, setVisitorName] = useState(presetName || '')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [starting, setStarting] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('WAITING')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Polling cada 4s para refrescar mensajes
  useEffect(() => {
    if (!sessionId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/public/${sessionId}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const next: ChatMessage[] = data.messages || []
        const last = messages[messages.length - 1]
        const lastNext = next[next.length - 1]
        setMessages(next)
        setStatus(data.session?.status || 'WAITING')
        // Si llegó un mensaje nuevo (del agente), scrollear
        if (lastNext && last?.id !== lastNext.id) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 50)
        }
      } catch {
        // Silencioso en polling
      }
    }
    poll()
    const interval = setInterval(poll, 4000)
    return () => clearInterval(interval)
  }, [sessionId])

  const start = async () => {
    if (!userId) {
      setError('Enlace inválido: falta el identificador del negocio.')
      return
    }
    if (!visitorName.trim()) {
      setError('Por favor ingresa tu nombre.')
      return
    }
    setStarting(true)
    setError(null)
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
      setMessages([
        {
          id: 'welcome',
          sessionId: data.sessionId,
          sender: 'BOT',
          body: `¡Hola ${visitorName.trim()}! Gracias por contactarte con nosotros. Un agente te atenderá en breve.`,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setStarting(false)
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
    setSending(true)
    try {
      const res = await fetch(`/api/chat/public/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'No se pudo enviar')
      }
      // Refrescar inmediatamente
      setTimeout(async () => {
        const r = await fetch(`/api/chat/public/${sessionId}`, { cache: 'no-store' })
        if (r.ok) {
          const d = await r.json()
          setMessages(d.messages || [])
        }
      }, 200)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  // Pantalla de error fatal (sin userId)
  if (!userId) {
    return (
      <Card className="w-full max-w-md mx-auto p-8 text-center">
        <CardContent className="p-0 space-y-2">
          <AlertCircle className="mx-auto size-8 text-amber-600" />
          <CardTitle className="text-lg">Enlace inválido</CardTitle>
          <CardDescription className="text-sm">
            Este enlace de chat no contiene el identificador del negocio.
            Solicita al negocio un enlace válido.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto p-0 overflow-hidden flex flex-col" style={{ minHeight: '70vh' }}>
      {/* Header */}
      <div className="bg-emerald-600 text-white px-4 py-3 flex items-center gap-3">
        <div className="size-9 rounded-full bg-white/20 flex items-center justify-center">
          <Headphones className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">Soporte en vivo</p>
          <p className="text-[11px] text-emerald-100 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-300 animate-pulse" />
            En línea
          </p>
        </div>
        {sessionId && (
          <span className="text-[10px] bg-white/15 rounded-full px-2 py-0.5">
            {status === 'ACTIVE' ? 'Conectado' : status === 'WAITING' ? 'En espera…' : 'Cerrado'}
          </span>
        )}
      </div>

      {/* Body */}
      {!sessionId ? (
        <div className="flex-1 p-6 space-y-4 flex flex-col justify-center">
          <div className="text-center space-y-1.5">
            <MessageCircle className="size-10 mx-auto text-emerald-600" />
            <CardTitle className="text-base">Inicia el chat</CardTitle>
            <CardDescription className="text-xs">
              Cuéntanos tu nombre para empezar a chatear con el equipo.
            </CardDescription>
          </div>
          {error && (
            <div className="rounded-md bg-rose-50 ring-1 ring-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          <Input
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="Tu nombre"
            onKeyDown={(e) => {
              if (e.key === 'Enter') start()
            }}
            disabled={starting}
            autoFocus
          />
          <Button
            onClick={start}
            disabled={starting || !visitorName.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {starting ? <RefreshCw className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Comenzar chat
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/30">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === 'WAITING' && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-2">
                <RefreshCw className="size-3 animate-spin" />
                Esperando que un agente se conecte…
              </div>
            )}
            {status === 'CLOSED' && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-2">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Esta conversación fue cerrada por el negocio.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 border-t bg-background">
            {status === 'CLOSED' ? (
              <p className="text-xs text-center text-muted-foreground py-2">
                Conversación cerrada. Ya no puedes enviar mensajes.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  send()
                }}
                className="flex gap-1.5"
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
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </form>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

export default WidgetVisitor
