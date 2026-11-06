'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BrainCircuit,
  MessageSquare,
  Mic,
  Bot,
  Workflow,
  Sparkles,
  Zap,
  FileText,
  Mail,
  Filter,
  Star,
  BookOpen,
  Send,
  Copy,
  Check,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  ListChecks,
  Lightbulb,
  Wand2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// ---------- Types ----------

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ContentResult {
  content: string
  variations: string[]
}

interface EmailResult {
  subject: string
  body: string
  previewText: string
}

interface ReviewResult {
  responses: string[]
}

interface FunnelStage {
  name: string
  description: string
  color: string
}

interface FunnelResult {
  stages: FunnelStage[]
  suggestedActions: string[]
}

interface VoiceResult {
  script: string
  duration: string
}

interface KnowledgeArticle {
  id: string
  userId: string
  title: string
  content: string
  category?: string | null
  tags?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// ---------- Product metadata ----------

type AIProductKey =
  | 'chat'
  | 'conversational'
  | 'voice'
  | 'agents'
  | 'agent-studio'
  | 'ai-studio'
  | 'automations'
  | 'content'
  | 'email'
  | 'funnel'
  | 'reviews'
  | 'knowledge'

interface AIProduct {
  key: AIProductKey
  name: string
  description: string
  icon: typeof BrainCircuit
  color: string
  functional: boolean
}

const AI_PRODUCTS: AIProduct[] = [
  { key: 'chat', name: 'Pregúntale a la IA', description: 'Asistente conversacional con contexto de tu negocio', icon: BrainCircuit, color: 'emerald', functional: true },
  { key: 'conversational', name: 'IA Conversacional', description: 'Chatbots inteligentes para tu web y WhatsApp', icon: MessageSquare, color: 'amber', functional: false },
  { key: 'voice', name: 'IA de Voz', description: 'Guiones para llamadas de bienvenida, seguimiento y citas', icon: Mic, color: 'rose', functional: true },
  { key: 'agents', name: 'Agentes Autónomos', description: 'Agentes que trabajan en tareas por ti 24/7', icon: Bot, color: 'purple', functional: false },
  { key: 'agent-studio', name: 'Estudio de Agentes', description: 'Crea y configura tus propios agentes a medida', icon: Workflow, color: 'cyan', functional: false },
  { key: 'ai-studio', name: 'Estudio de IA', description: 'Plantillas y prompts avanzados para casos de uso', icon: Sparkles, color: 'sky', functional: false },
  { key: 'automations', name: 'Automatizaciones IA', description: 'Flujos automáticos con gatillos y acciones de IA', icon: Zap, color: 'amber', functional: false },
  { key: 'content', name: 'IA Contenido', description: 'Posts, captions, anuncios, blogs y descripciones', icon: FileText, color: 'emerald', functional: true },
  { key: 'email', name: 'IA Correos', description: 'Campañas de email con asunto, preview y cuerpo', icon: Mail, color: 'rose', functional: true },
  { key: 'funnel', name: 'IA Embudos', description: 'Estructura de embudos de venta sugerida por IA', icon: Filter, color: 'amber', functional: true },
  { key: 'reviews', name: 'IA Reseñas', description: 'Respuestas profesionales a reseñas de clientes', icon: Star, color: 'purple', functional: true },
  { key: 'knowledge', name: 'IA Base de Conocimiento', description: 'Tu base de conocimiento privada que la IA puede consultar', icon: BookOpen, color: 'emerald', functional: true },
]

const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string; chip: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200', chip: 'bg-emerald-100 text-emerald-700' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200', chip: 'bg-amber-100 text-amber-700' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200', chip: 'bg-rose-100 text-rose-700' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200', chip: 'bg-purple-100 text-purple-700' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-200', chip: 'bg-cyan-100 text-cyan-700' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-700', ring: 'ring-sky-200', chip: 'bg-sky-100 text-sky-700' },
}

const shortDate = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// =================================================================
// Main Module
// =================================================================

export function AiHubModule() {
  const toast = useAppStore((s) => s.toast)
  const [todayGenerations, setTodayGenerations] = useState(0)
  const [activeDialog, setActiveDialog] = useState<AIProductKey | null>(null)
  const [knowledgeView, setKnowledgeView] = useState(false)

  // Conteo simple de generaciones del día (persistido en localStorage).
  // Usamos queueMicrotask para diferir el setState y evitar el warning de
  // "setState dentro de effect" del linter de React.
  useEffect(() => {
    const readCount = () => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const raw = localStorage.getItem('dimar-ai-gen-count')
        if (raw) {
          const parsed = JSON.parse(raw) as { date: string; count: number }
          if (parsed.date === today) return parsed.count
        }
        localStorage.setItem('dimar-ai-gen-count', JSON.stringify({ date: today, count: 0 }))
      } catch {
        // ignore
      }
      return 0
    }
    queueMicrotask(() => setTodayGenerations(readCount()))
  }, [])

  const bumpGenerations = useCallback(() => {
    setTodayGenerations((c) => {
      const next = c + 1
      try {
        const today = new Date().toISOString().slice(0, 10)
        localStorage.setItem('dimar-ai-gen-count', JSON.stringify({ date: today, count: next }))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const handleOpenProduct = (product: AIProduct) => {
    if (!product.functional) {
      toast(`${product.name} estará disponible próximamente`, 'info')
      return
    }
    if (product.key === 'knowledge') {
      setKnowledgeView(true)
      return
    }
    setActiveDialog(product.key)
  }

  if (knowledgeView) {
    return <KnowledgeBaseView onBack={() => setKnowledgeView(false)} />
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      {/* ---------- Hero ---------- */}
      <Card className="mb-6 sm:mb-8 overflow-hidden border-0">
        <div className="relative bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-50 dark:from-emerald-950/40 dark:via-amber-950/30 dark:to-emerald-950/40 p-6 sm:p-8">
          <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-amber-200/40 blur-3xl" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center shadow-lg">
                <BrainCircuit className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Centro de IA</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Tu equipo de IA, dentro de DimarClub. Asistentes, generación de contenido, embudos y más.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                  <Sparkles className="w-3 h-3 mr-1" /> 12 productos
                </Badge>
                <Badge className="bg-amber-100 text-amber-700 border-0">
                  <Zap className="w-3 h-3 mr-1" /> {todayGenerations} generaciones hoy
                </Badge>
                <Badge className="bg-white/70 text-emerald-700 border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 6 funcionales
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------- Grid de 12 productos ---------- */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">Productos de IA</h2>
        <p className="text-sm text-muted-foreground">Selecciona un producto para empezar a trabajar con la IA.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {AI_PRODUCTS.map((p) => (
          <ProductCard key={p.key} product={p} onOpen={() => handleOpenProduct(p)} />
        ))}
      </div>

      {/* ---------- Dialogs ---------- */}
      <ChatDialog open={activeDialog === 'chat'} onOpenChange={(o) => !o && setActiveDialog(null)} onGenerated={bumpGenerations} />
      <ContentDialog open={activeDialog === 'content'} onOpenChange={(o) => !o && setActiveDialog(null)} onGenerated={bumpGenerations} />
      <EmailDialog open={activeDialog === 'email'} onOpenChange={(o) => !o && setActiveDialog(null)} onGenerated={bumpGenerations} />
      <FunnelDialog open={activeDialog === 'funnel'} onOpenChange={(o) => !o && setActiveDialog(null)} onGenerated={bumpGenerations} />
      <ReviewsDialog open={activeDialog === 'reviews'} onOpenChange={(o) => !o && setActiveDialog(null)} onGenerated={bumpGenerations} />
      <VoiceDialog open={activeDialog === 'voice'} onOpenChange={(o) => !o && setActiveDialog(null)} onGenerated={bumpGenerations} />
    </div>
  )
}

// =================================================================
// Product Card
// =================================================================

function ProductCard({ product, onOpen }: { product: AIProduct; onOpen: () => void }) {
  const Icon = product.icon
  const colors = COLOR_CLASSES[product.color] || COLOR_CLASSES.emerald
  return (
    <Card
      className={`group relative transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${product.functional ? '' : 'opacity-80'}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      aria-label={`${product.name}${product.functional ? '' : ' (próximamente)'}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={`w-11 h-11 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center ring-1 ${colors.ring}`}>
            <Icon className="w-5 h-5" />
          </div>
          {!product.functional && (
            <Badge variant="outline" className="text-xs">Próximamente</Badge>
          )}
        </div>
        <CardTitle className="text-base mt-3">{product.name}</CardTitle>
        <CardDescription className="text-xs leading-snug">{product.description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-0">
        <Button
          size="sm"
          variant={product.functional ? 'default' : 'outline'}
          className="w-full"
          disabled={!product.functional}
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
        >
          {product.functional ? (
            <>
              <Wand2 className="w-3.5 h-3.5 mr-1" /> Abrir
            </>
          ) : (
            'Próximamente'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

// =================================================================
// Copy Button helper
// =================================================================

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const toast = useAppStore((s) => s.toast)
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      toast('Copiado al portapapeles')
      setTimeout(() => setCopied(false), 1500)
    } else {
      toast('No se pudo copiar', 'error')
    }
  }
  return (
    <Button size="sm" variant="outline" onClick={handleCopy} disabled={!text}>
      {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
      {copied ? 'Copiado' : label}
    </Button>
  )
}

// =================================================================
// 1. Chat Dialog (Pregúntale a la IA)
// =================================================================

const QUICK_PROMPTS = [
  '¿Cómo mejoro mis ventas?',
  'Resume mis contactos de ayer',
  'Escribe un post para Instagram',
  'Dame 3 ideas para fidelizar clientes',
]

function ChatDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Reset conversación al cerrar
  useEffect(() => {
    if (!open) {
      setMessages([])
      setInput('')
    }
  }, [open])

  const send = async (text?: string) => {
    const message = (text ?? input).trim()
    if (!message || loading) return
    setInput('')
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: message }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/ai-hub/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: messages.slice(-10),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      onGenerated()
    } catch (e) {
      toast('Error generando respuesta. Intenta de nuevo.', 'error')
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '⚠️ No pude responder en este momento. Intenta de nuevo en unos segundos.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
            Pregúntale a la IA
          </DialogTitle>
          <DialogDescription>Conversa con tu asistente de negocio. Tiene contexto de tu cuenta.</DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-4 sm:px-6 py-4 space-y-4 bg-muted/30">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center mb-4">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Pregúntame lo que quieras sobre tu negocio o elige una sugerencia:
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="px-3 py-1.5 text-xs rounded-full bg-background border hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <Avatar role="assistant" />
              <div className="bg-background border rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>IA generando…</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-3 sm:p-4 flex gap-2 bg-background">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Escribe tu pregunta…"
            disabled={loading}
            maxLength={2000}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  if (role === 'assistant') {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center flex-shrink-0">
        <BrainCircuit className="w-4 h-4 text-white" />
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-medium text-muted-foreground">Tú</span>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
      <Avatar role={message.role} />
      <div
        className={`max-w-[80%] px-3 py-2 text-sm whitespace-pre-wrap rounded-2xl ${
          isUser
            ? 'bg-emerald-600 text-white rounded-tr-sm'
            : 'bg-background border rounded-tl-sm'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

// =================================================================
// 2. Content Dialog (IA Contenido)
// =================================================================

const CONTENT_TYPES: { value: 'post' | 'caption' | 'ad' | 'blog' | 'description'; label: string }[] = [
  { value: 'post', label: 'Post para redes' },
  { value: 'caption', label: 'Caption corto' },
  { value: 'ad', label: 'Anuncio pagado' },
  { value: 'blog', label: 'Artículo de blog' },
  { value: 'description', label: 'Descripción de producto' },
]

const TONES = ['Profesional', 'Cercano', 'Entusiasta', 'Urgente', 'Inspirador', 'Educativo']
const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'X (Twitter)', 'LinkedIn', 'WhatsApp']
const LENGTHS = ['corto', 'medio', 'largo']

function ContentDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [type, setType] = useState<'post' | 'caption' | 'ad' | 'blog' | 'description'>('post')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('Profesional')
  const [platform, setPlatform] = useState('Instagram')
  const [length, setLength] = useState('medio')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ContentResult | null>(null)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setTopic('')
    }
  }, [open])

  const generate = async () => {
    if (!topic.trim()) {
      toast('Escribe un tema primero', 'warning')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai-hub/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, topic, tone, platform, length }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setResult({ content: data.content, variations: data.variations })
      onGenerated()
    } catch {
      toast('Error generando contenido. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            IA Contenido
          </DialogTitle>
          <DialogDescription>Genera 3 variaciones de contenido de marketing en segundos.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tipo de contenido</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tono</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Longitud</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs">Tema / descripción</Label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej: Promoción de envío gratis en compras superiores a $50 para el mes de la madre"
            rows={3}
            maxLength={500}
          />
        </div>

        <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full sm:w-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? 'Generando…' : 'Generar 3 variaciones'}
        </Button>

        {loading && (
          <div className="space-y-3 mt-2">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-3 w-full mb-1.5" />
                <Skeleton className="h-3 w-5/6 mb-1.5" />
                <Skeleton className="h-3 w-4/6" />
              </Card>
            ))}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3 mt-2">
            {result.content && (
              <Card className="p-4 border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">Versión principal</Badge>
                  <CopyButton text={result.content} />
                </div>
                <p className="text-sm whitespace-pre-wrap">{result.content}</p>
              </Card>
            )}
            {result.variations.filter(Boolean).map((v, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Variación {i + 1}</Badge>
                  <CopyButton text={v} />
                </div>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{v}</p>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// 3. Email Dialog (IA Correos)
// =================================================================

function EmailDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [subject, setSubject] = useState('')
  const [goal, setGoal] = useState('')
  const [audience, setAudience] = useState('')
  const [productName, setProductName] = useState('')
  const [benefits, setBenefits] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmailResult | null>(null)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setSubject('')
      setGoal('')
      setAudience('')
      setProductName('')
      setBenefits([''])
    }
  }, [open])

  const setBenefit = (i: number, v: string) => {
    setBenefits((arr) => arr.map((b, idx) => (idx === i ? v : b)))
  }
  const addBenefit = () => setBenefits((a) => [...a, ''])
  const removeBenefit = (i: number) => setBenefits((a) => a.filter((_, idx) => idx !== i))

  const generate = async () => {
    if (!goal.trim() || !audience.trim() || !productName.trim()) {
      toast('Completa objetivo, audiencia y producto', 'warning')
      return
    }
    const cleanBenefits = benefits.map((b) => b.trim()).filter(Boolean)
    if (cleanBenefits.length === 0) {
      toast('Agrega al menos un beneficio', 'warning')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai-hub/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject || undefined,
          goal, audience, productName,
          keyBenefits: cleanBenefits,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setResult({ subject: data.subject, body: data.body, previewText: data.previewText })
      onGenerated()
    } catch {
      toast('Error generando campaña. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fullContent = result ? `Asunto: ${result.subject}\nPreview: ${result.previewText}\n\n${result.body}` : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            IA Correos
          </DialogTitle>
          <DialogDescription>Genera una campaña de email completa: asunto, preview y cuerpo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Objetivo *</Label>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ej: Anunciar descuento del 20%" />
            </div>
            <div>
              <Label className="text-xs">Audiencia *</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ej: Clientes recientes" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Producto / Servicio *</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ej: Plan Premium DimarClub" />
          </div>
          <div>
            <Label className="text-xs">Asunto sugerido (opcional)</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="La IA puede mejorarlo" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">Beneficios clave</Label>
              <Button size="sm" variant="ghost" onClick={addBenefit} disabled={benefits.length >= 6}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={b}
                    onChange={(e) => setBenefit(i, e.target.value)}
                    placeholder={`Beneficio ${i + 1}`}
                  />
                  {benefits.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeBenefit(i)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? 'Generando…' : 'Generar campaña'}
          </Button>
          {result && (
            <>
              <CopyButton text={fullContent} label="Copiar todo" />
              <Button variant="outline" onClick={() => toast('Funcionalidad disponible en módulo Email', 'info')}>
                Usar en Email Marketing
              </Button>
            </>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3">
            <Card className="p-4 border-rose-200 bg-rose-50/50">
              <Label className="text-xs text-rose-700">Asunto</Label>
              <p className="text-sm font-medium">{result.subject}</p>
              <Label className="text-xs text-rose-700 mt-2 block">Preview</Label>
              <p className="text-sm text-muted-foreground">{result.previewText}</p>
            </Card>
            <Card className="p-4">
              <Label className="text-xs">Cuerpo del correo</Label>
              <p className="text-sm whitespace-pre-wrap mt-1">{result.body}</p>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// 4. Funnel Dialog (IA Embudos)
// =================================================================

function FunnelDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [businessType, setBusinessType] = useState('')
  const [productName, setProductName] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FunnelResult | null>(null)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setBusinessType('')
      setProductName('')
      setPriceRange('')
    }
  }, [open])

  const generate = async () => {
    if (!businessType.trim() || !productName.trim() || !priceRange.trim()) {
      toast('Completa todos los campos', 'warning')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai-hub/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType, productName, priceRange }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setResult({ stages: data.stages, suggestedActions: data.suggestedActions })
      onGenerated()
    } catch {
      toast('Error generando embudo. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            IA Embudos
          </DialogTitle>
          <DialogDescription>Sugiere la estructura completa de un embudo de venta para tu negocio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Tipo de negocio *</Label>
            <Input value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Ej: Tienda de ropa online" />
          </div>
          <div>
            <Label className="text-xs">Producto / Servicio principal *</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ej: Ropa deportiva para mujer" />
          </div>
          <div>
            <Label className="text-xs">Rango de precio *</Label>
            <Input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="Ej: $20 - $80" />
          </div>
        </div>

        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? 'Generando…' : 'Sugerir embudo'}
        </Button>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600" /> Etapas del embudo
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.stages.map((stage, i) => {
                  const colors = COLOR_CLASSES[stage.color] || COLOR_CLASSES.emerald
                  return (
                    <div key={i} className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.text} border ${colors.ring}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs opacity-60">#{i + 1}</span>
                        <span className="font-medium text-sm">{stage.name}</span>
                      </div>
                      <p className="text-xs mt-1 max-w-[200px]">{stage.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600" /> Acciones recomendadas
              </h4>
              <Card className="p-4">
                <ul className="space-y-2">
                  {result.suggestedActions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <Button variant="outline" className="w-full" onClick={() => toast('Ve al módulo Embudos para crearlo', 'info')}>
              Crear embudo con esta estructura
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// 5. Reviews Dialog (IA Reseñas)
// =================================================================

function ReviewsDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(5)
  const [customerName, setCustomerName] = useState('')
  const [tone, setTone] = useState('Profesional')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setReviewText('')
      setRating(5)
      setCustomerName('')
      setTone('Profesional')
    }
  }, [open])

  const generate = async () => {
    if (!reviewText.trim()) {
      toast('Pega el texto de la reseña', 'warning')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai-hub/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText, rating,
          customerName: customerName || undefined,
          tone,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setResult({ responses: data.responses })
      onGenerated()
    } catch {
      toast('Error generando respuestas. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            IA Reseñas
          </DialogTitle>
          <DialogDescription>Genera 3 respuestas profesionales para una reseña de cliente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Texto de la reseña *</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Pega aquí la reseña del cliente…"
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Rating</Label>
              <div className="flex items-center gap-1 h-9">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} estrellas`}
                  >
                    <Star className={`w-5 h-5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Cliente (opcional)</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="María Pérez" />
            </div>
            <div>
              <Label className="text-xs">Tono</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={generate} disabled={loading || !reviewText.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? 'Generando…' : 'Generar respuestas'}
        </Button>

        {loading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-3">
            {result.responses.map((r, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-purple-100 text-purple-700 border-0">Respuesta {i + 1}</Badge>
                  <CopyButton text={r} />
                </div>
                <p className="text-sm whitespace-pre-wrap">{r}</p>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// 6. Voice Dialog (IA de Voz)
// =================================================================

const VOICE_PURPOSES: { value: 'welcome' | 'followup' | 'appointment'; label: string; desc: string }[] = [
  { value: 'welcome', label: 'Bienvenida', desc: 'Nuevo cliente' },
  { value: 'followup', label: 'Seguimiento', desc: 'Post-compra' },
  { value: 'appointment', label: 'Cita', desc: 'Confirmación' },
]

function VoiceDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGenerated: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [purpose, setPurpose] = useState<'welcome' | 'followup' | 'appointment'>('welcome')
  const [businessName, setBusinessName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VoiceResult | null>(null)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setPurpose('welcome')
      setBusinessName('')
      setCustomerName('')
    }
  }, [open])

  const generate = async () => {
    if (!businessName.trim() || !customerName.trim()) {
      toast('Completa nombre del negocio y del cliente', 'warning')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai-hub/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, businessName, customerName }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setResult({ script: data.script, duration: data.duration })
      onGenerated()
    } catch {
      toast('Error generando guion. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            IA de Voz
          </DialogTitle>
          <DialogDescription>Genera un guion para llamada telefónica de bienvenida, seguimiento o cita.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Propósito de la llamada</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {VOICE_PURPOSES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPurpose(p.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    purpose === p.value
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nombre del negocio *</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="DimarClub" />
            </div>
            <div>
              <Label className="text-xs">Nombre del cliente *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ana Mendoza" />
            </div>
          </div>
        </div>

        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {loading ? 'Generando…' : 'Generar script'}
        </Button>

        {loading && <Skeleton className="h-48 w-full" />}

        {result && !loading && (
          <Card className="p-4 border-rose-200 bg-rose-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-rose-100 text-rose-700 border-0">Guion</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> ~{result.duration}
                </span>
              </div>
              <CopyButton text={result.script} />
            </div>
            <p className="text-sm whitespace-pre-wrap font-mono">{result.script}</p>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// 7. Knowledge Base View (sub-vista, no dialog)
// =================================================================

const KNOWLEDGE_CATEGORIES = ['Ventas', 'Marketing', 'Productos', 'Procesos', 'FAQ', 'Políticas', 'Otros']

function KnowledgeBaseView({ onBack }: { onBack: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeArticle | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai-hub/knowledge', { cache: 'no-store' })
      if (res.ok) setArticles(await res.json())
    } catch {
      toast('Error al cargar la base de conocimiento', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = async () => {
    if (!search.trim()) {
      load()
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/ai-hub/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search }),
      })
      const data = await res.json()
      if (res.ok && data.ok) setArticles(data.articles)
    } catch {
      toast('Error en la búsqueda', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/ai-hub/knowledge/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error')
      toast('Artículo eliminado')
      setDeleteTarget(null)
      load()
    } catch {
      toast('No se pudo eliminar', 'error')
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return articles
    const q = search.toLowerCase()
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.tags || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q)
    )
  }, [articles, search])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Centro de IA
      </Button>

      <Card className="mb-6 overflow-hidden border-0">
        <div className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-950/40 dark:to-amber-950/30 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold">Base de Conocimiento</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Documenta tu negocio. La IA puede usar estos artículos para responder más preciso.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo artículo
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar en tu base de conocimiento…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="w-4 h-4" />
        </Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearch(''); load() }}>
            Limpiar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-3 w-full mb-1.5" />
              <Skeleton className="h-3 w-5/6" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Lightbulb className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Sin resultados para tu búsqueda.' : 'Aún no tienes artículos. Crea el primero para que la IA te conozca mejor.'}
          </p>
          {!search && (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Crear primer artículo
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <KnowledgeArticleCard
              key={a.id}
              article={a}
              onEdit={() => setEditing(a)}
              onDelete={() => setDeleteTarget(a)}
            />
          ))}
        </div>
      )}

      <KnowledgeArticleDialog
        open={createOpen}
        onOpenChange={(o) => !o && setCreateOpen(false)}
        onSaved={() => { setCreateOpen(false); load() }}
      />
      <KnowledgeArticleDialog
        open={!!editing}
        article={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={() => { setEditing(null); load() }}
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente "{deleteTarget?.title}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KnowledgeArticleCard({
  article,
  onEdit,
  onDelete,
}: {
  article: KnowledgeArticle
  onEdit: () => void
  onDelete: () => void
}) {
  const colors = COLOR_CLASSES.emerald
  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {article.category && (
            <Badge className={`${colors.chip} border-0`}>{article.category}</Badge>
          )}
          {!article.isPublished && (
            <Badge variant="outline" className="text-xs">Borrador</Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar">
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Eliminar">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <h3 className="text-sm font-semibold mb-1">{article.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{article.content}</p>
      {article.tags && (
        <div className="flex flex-wrap gap-1 mt-2">
          {article.tags.split(',').map((t, i) => (
            <span key={i} className="text-xs text-muted-foreground">#{t.trim()}</span>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">Actualizado {shortDate(article.updatedAt)}</p>
    </Card>
  )
}

function KnowledgeArticleDialog({
  open,
  onOpenChange,
  article,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  article?: KnowledgeArticle | null
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [isPublished, setIsPublished] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(article?.title || '')
      setContent(article?.content || '')
      setCategory(article?.category || '')
      setTags(article?.tags || '')
      setIsPublished(article?.isPublished !== false)
    }
  }, [open, article])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast('Título y contenido son obligatorios', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
        tags: tags.trim() || undefined,
        isPublished,
      }
      const url = article
        ? `/api/ai-hub/knowledge/${article.id}`
        : '/api/ai-hub/knowledge'
      const method = article ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      toast(article ? 'Artículo actualizado' : 'Artículo creado')
      onSaved()
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>{article ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
          <DialogDescription>
            Documenta información que la IA puede usar: políticas, procesos, FAQs, detalles de productos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Política de devoluciones" maxLength={200} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tags (separados por coma)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="devoluciones, reembolso" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Contenido *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe aquí el detalle. Sé específico: la IA lo usará para responder mejor."
              rows={8}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} id="pub" />
            <Label htmlFor="pub" className="text-sm cursor-pointer">Publicado (disponible para la IA)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {article ? 'Guardar cambios' : 'Crear artículo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
