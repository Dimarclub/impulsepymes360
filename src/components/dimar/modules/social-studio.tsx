'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sparkles, Loader2, Send, CalendarClock, FileText, X, Hash,
  Image as ImageIcon, MoreVertical, Pencil, Trash2, Eye, Heart,
  MousePointerClick, Package, Search, Check, ChevronDown,
  Instagram, Facebook, Music2, Twitter, MessageCircle, Linkedin,
  Youtube, Send as SendIcon, AtSign, Wand2, Library, Plus, AlertCircle, Copy,
  type LucideIcon,
} from 'lucide-react'
import {
  SOCIAL_PLATFORM_ICONS, SOCIAL_PLATFORM_LABELS,
  POST_STATUS_LABELS, POST_STATUS_COLORS,
  type SocialAccount, type SocialPost, type MediaAsset,
  type Product, type GeneratedContent,
} from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '@/components/dimar/image-upload'
import { cn } from '@/lib/utils'

// ---------- helpers ----------
const usd = (n: number) => `$${(n || 0).toFixed(2)}`
const fmtNum = (n: number) => (n || 0).toLocaleString('es-EC')
const fmtDateTime = (iso: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('es-EC', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const PRIMARY = 'oklch(0.6 0.13 162)'
const ACCENT = 'oklch(0.75 0.15 75)'

// Mapa de iconos de Lucide por nombre (SOCIAL_PLATFORM_ICONS)
const ICON_MAP: Record<string, LucideIcon> = {
  Instagram, Facebook, Music2, Twitter, MessageCircle, Linkedin,
  Youtube, Send: SendIcon, Image: ImageIcon, AtSign,
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const name = SOCIAL_PLATFORM_ICONS[platform] || 'MessageCircle'
  const Icon = ICON_MAP[name] || MessageCircle
  return <Icon className={className} />
}

const TONES = [
  { value: 'entusiasta', label: 'Entusiasta' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'informativo', label: 'Informativo' },
]

const TAB_VALUES = ['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED'] as const
type TabValue = (typeof TAB_VALUES)[number]

// ---------- ProductPicker ----------
function ProductPicker({
  products,
  value,
  onChange,
  loading,
}: {
  products: Product[]
  value: string
  onChange: (id: string) => void
  loading: boolean
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const selected = products.find((p) => p.id === value)

  const filtered = useMemo(() => {
    if (!search) return products.slice(0, 50)
    const s = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(s)).slice(0, 50)
  }, [products, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 h-9 text-sm shadow-xs hover:bg-muted/30 transition-colors"
          aria-label="Seleccionar producto"
        >
          <span className={cn('flex items-center gap-2 truncate', !selected && 'text-muted-foreground')}>
            <Package className="size-4 shrink-0 text-muted-foreground" />
            {loading ? 'Cargando productos…'
              : selected ? selected.name
              : 'Selecciona un producto (opcional)'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className="flex h-10 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto scroll-thin p-1">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className={cn(
              'w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-muted/60',
              !value && 'bg-primary/10 text-primary',
            )}
          >
            <X className="size-4 text-muted-foreground" />
            Sin producto (texto libre)
          </button>
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-xs text-muted-foreground text-center">Sin resultados</p>
          )}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); setOpen(false) }}
              className={cn(
                'w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-muted/60',
                value === p.id && 'bg-primary/10 text-primary',
              )}
            >
              {p.imageUrl ? (
                 
                <img src={p.imageUrl} alt="" className="size-7 rounded object-cover shrink-0" />
              ) : (
                <div className="size-7 rounded bg-muted grid place-items-center shrink-0">
                  <Package className="size-3.5 text-muted-foreground" />
                </div>
              )}
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{usd(p.price)}</span>
              {value === p.id && <Check className="size-4 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ---------- PlatformChips ----------
function PlatformChips({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (p: string) => void
}) {
  const platforms = Object.keys(SOCIAL_PLATFORM_LABELS)
  return (
    <div className="flex flex-wrap gap-1.5">
      {platforms.map((p) => {
        const active = selected.includes(p)
        return (
          <button
            key={p}
            type="button"
            onClick={() => onToggle(p)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            <PlatformIcon platform={p} className="size-3.5" />
            {SOCIAL_PLATFORM_LABELS[p]}
            {active && <Check className="size-3" />}
          </button>
        )
      })}
    </div>
  )
}

// ---------- MediaLibraryPicker ----------
function MediaLibraryPicker({
  assets,
  onPick,
}: {
  assets: MediaAsset[]
  onPick: (url: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full">
          <Library className="size-4" />
          Seleccionar de la biblioteca
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
          {assets.length} recursos en tu biblioteca
        </p>
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No hay recursos. Sube una imagen primero.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 max-h-60 overflow-y-auto scroll-thin">
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onPick(a.url); setOpen(false) }}
                className="aspect-square rounded-md overflow-hidden border hover:border-primary hover:ring-2 hover:ring-primary/30 transition"
              >
                { }
                <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ---------- MediaGallery ----------
function MediaGallery({
  urls,
  onRemove,
}: {
  urls: string[]
  onRemove: (idx: number) => void
}) {
  if (urls.length === 0) return null
  return (
    <div className="flex gap-2 flex-wrap">
      {urls.map((u, i) => (
        <div key={i} className="relative size-20 rounded-md overflow-hidden border bg-muted group">
          { }
          <img src={u} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute top-1 right-1 size-5 grid place-items-center rounded-full bg-background/90 border shadow-sm text-destructive hover:bg-destructive hover:text-white transition opacity-0 group-hover:opacity-100"
            aria-label="Eliminar imagen"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ---------- PostCard ----------
interface PostCardProps {
  post: SocialPost
  onPublish: (post: SocialPost) => void
  onEdit: (post: SocialPost) => void
  onDelete: (post: SocialPost) => void
  publishing: boolean
}

function PostCard({ post, onPublish, onEdit, onDelete, publishing }: PostCardProps) {
  const toast = useAppStore((s) => s.toast)
  const mediaUrls: string[] = useMemo(() => {
    if (!post.mediaUrls) return []
    try {
      return JSON.parse(post.mediaUrls) as string[]
    } catch {
      return []
    }
  }, [post.mediaUrls])
  const platforms = post.accounts?.map((a) => a.account.platform).filter(Boolean) || []
  const canPublish = post.status === 'DRAFT' || post.status === 'SCHEDULED'

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="size-20 shrink-0 rounded-md overflow-hidden bg-muted">
          {mediaUrls[0] ? (
             
            <img src={mediaUrls[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="grid place-items-center w-full h-full text-muted-foreground/40">
              <ImageIcon className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0',
                POST_STATUS_COLORS[post.status] || 'bg-muted text-muted-foreground',
              )}
            >
              {POST_STATUS_LABELS[post.status] || post.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 -mr-1 -mt-1" aria-label="Acciones">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canPublish && (
                  <DropdownMenuItem onClick={() => onPublish(post)} disabled={publishing}>
                    <Send className="size-4" /> Publicar ahora
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => {
                  const text = `${post.caption}\n\n${(post.accounts || []).map((a: any) => a.account?.handle).filter(Boolean).join(' ')}`
                  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
                  window.open(waUrl, '_blank')
                  toast('Abriendo WhatsApp para compartir…', 'info')
                }}>
                  <MessageCircle className="size-4" /> Compartir por WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const text = `${post.caption}\n\n${(post.accounts || []).map((a: any) => a.account?.handle).filter(Boolean).join(' ')}`
                  navigator.clipboard.writeText(text)
                  toast('Contenido copiado al portapapeles', 'success')
                }}>
                  <Copy className="size-4" /> Copiar contenido
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Pencil className="size-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(post)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-foreground line-clamp-2 mt-1">{post.caption}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {platforms.slice(0, 4).map((p, i) => (
              <span
                key={i}
                className="grid place-items-center size-5 rounded-full bg-primary/10 text-primary"
                title={SOCIAL_PLATFORM_LABELS[p] || p}
              >
                <PlatformIcon platform={p} className="size-3" />
              </span>
            ))}
            {platforms.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{platforms.length - 4}</span>
            )}
            {post.product && (
              <span className="text-[10px] text-muted-foreground truncate max-w-32">
                · {post.product.name}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-muted-foreground">
            <span>
              {post.publishedAt
                ? `Publicado ${fmtDateTime(post.publishedAt)}`
                : post.scheduledAt
                  ? `Programado ${fmtDateTime(post.scheduledAt)}`
                  : `Creado ${fmtDateTime(post.createdAt)}`}
            </span>
            {post.status === 'PUBLISHED' && (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5">
                  <Eye className="size-3" /> {fmtNum(post.reach)}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Heart className="size-3" /> {fmtNum(post.likes)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------- Composer ----------
interface ComposerState {
  editingId: string | null
  productId: string
  customPrompt: string
  platforms: string[]
  tone: string
  caption: string
  hashtags: string[]
  variations: string[]
  mediaUrls: string[]
  scheduledAt: string
  accountIds: string[]
}

function emptyComposer(): ComposerState {
  return {
    editingId: null,
    productId: '',
    customPrompt: '',
    platforms: ['INSTAGRAM', 'FACEBOOK'],
    tone: 'entusiasta',
    caption: '',
    hashtags: [],
    variations: [],
    mediaUrls: [],
    scheduledAt: '',
    accountIds: [],
  }
}

// ---------- módulo principal ----------
export function SocialStudioModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)

  // catálogos
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])

  // composer
  const [composer, setComposer] = useState<ComposerState>(emptyComposer)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState<false | 'draft' | 'schedule' | 'publish'>(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  void mediaPickerOpen

  // posts list
  const [tab, setTab] = useState<TabValue>('ALL')
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SocialPost | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ---- fetch catálogos ----
  useEffect(() => {
    let mounted = true
    Promise.all([
      fetch('/api/products?limit=100').then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/social/accounts').then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/social/media').then((r) => r.ok ? r.json() : []).catch(() => []),
    ])
      .then(([p, acc, m]) => {
        if (!mounted) return
        setProducts(Array.isArray(p) ? p : [])
        setAccounts(Array.isArray(acc) ? acc : [])
        setMediaAssets(Array.isArray(m) ? m : [])
        setProductsLoading(false)
      })
      .catch(() => {
        if (mounted) setProductsLoading(false)
      })
    return () => { mounted = false }
  }, [])

  // ---- fetch posts por tab ----
  const fetchPosts = useCallback(async () => {
    setPostsLoading(true)
    try {
      const url = tab === 'ALL'
        ? '/api/social/posts'
        : `/api/social/posts?status=${tab}`
      const res = await fetch(url)
      if (!res.ok) { setPosts([]); return }
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch {
      toast('Error al cargar posts', 'error')
    } finally {
      setPostsLoading(false)
    }
  }, [tab, toast])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // ---- helpers de composer ----
  const updateComposer = (patch: Partial<ComposerState>) =>
    setComposer((c) => ({ ...c, ...patch }))

  const togglePlatform = (p: string) => {
    setComposer((c) => ({
      ...c,
      platforms: c.platforms.includes(p)
        ? c.platforms.filter((x) => x !== p)
        : [...c.platforms, p],
    }))
  }

  // Mapear plataformas seleccionadas → accountIds del usuario
  const selectedAccountIds = useMemo(() => {
    return accounts
      .filter((a) => composer.platforms.includes(a.platform))
      .map((a) => a.id)
  }, [accounts, composer.platforms])

  // ---- Generar con IA ----
  const handleGenerate = async () => {
    if (!composer.productId && !composer.customPrompt.trim()) {
      toast('Selecciona un producto o escribe un tema', 'warning')
      return
    }
    if (composer.platforms.length === 0) {
      toast('Selecciona al menos una plataforma', 'warning')
      return
    }
    setGenerating(true)
    try {
      const body: Record<string, unknown> = {
        platform: composer.platforms[0],
        tone: composer.tone,
      }
      if (composer.productId) {
        body.productId = composer.productId
      } else {
        body.prompt = composer.customPrompt.trim()
      }
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'No se pudo generar')
      }
      const data = (await res.json()) as GeneratedContent
      updateComposer({
        caption: data.caption || '',
        hashtags: data.hashtags || [],
        variations: data.variations || [],
      })
      toast('¡Contenido generado con IA!')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error en generación', 'error')
    } finally {
      setGenerating(false)
    }
  }

  // ---- Guardar/Programar/Publicar ----
  const buildPayload = (status: 'DRAFT' | 'SCHEDULED') => {
    const payload: Record<string, unknown> = {
      caption: composer.caption,
      mediaUrls: composer.mediaUrls,
      mediaType: composer.mediaUrls.length > 0 ? 'IMAGE' : 'TEXT',
      productId: composer.productId || null,
      affiliateCode: currentUser?.affiliateCode || null,
      accountIds: selectedAccountIds,
      status,
    }
    if (status === 'SCHEDULED' && composer.scheduledAt) {
      payload.scheduledAt = new Date(composer.scheduledAt).toISOString()
    }
    return payload
  }

  const handleSave = async (mode: 'draft' | 'schedule' | 'publish') => {
    if (!composer.caption.trim()) {
      toast('Escribe o genera el caption primero', 'warning')
      return
    }
    if (mode === 'schedule' && !composer.scheduledAt) {
      toast('Selecciona fecha y hora para programar', 'warning')
      return
    }
    setSaving(mode)
    try {
      // Si es edición → PATCH; si no → POST
      const isEdit = !!composer.editingId
      const status = mode === 'draft' ? 'DRAFT' : 'SCHEDULED'
      const payload = buildPayload(status)

      let createdPost: SocialPost | null = null
      if (isEdit && composer.editingId) {
        const res = await fetch(`/api/social/posts/${composer.editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('No se pudo actualizar')
        createdPost = await res.json()
      } else {
        const res = await fetch('/api/social/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'No se pudo guardar')
        }
        createdPost = await res.json()
      }

      // Publicar ahora: tras crear/actualizar como SCHEDULED, simular publicación
      if (mode === 'publish' && createdPost) {
        const res = await fetch(`/api/social/posts/publish/${createdPost.id}`, {
          method: 'POST',
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'No se pudo publicar')
        }
      }

      // Resetear composer
      setComposer(emptyComposer())

      // Mensajes
      if (mode === 'draft') toast('Borrador guardado')
      else if (mode === 'schedule') toast('¡Post programado!')
      else toast('¡Post publicado!')

      // Refrescar lista
      fetchPosts()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ---- Acciones de la lista ----
  const handlePublish = async (post: SocialPost) => {
    setPublishingId(post.id)
    try {
      const res = await fetch(`/api/social/posts/publish/${post.id}`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'No se pudo publicar')
      }
      toast('¡Post publicado!')
      fetchPosts()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al publicar', 'error')
    } finally {
      setPublishingId(null)
    }
  }

  const handleEdit = (post: SocialPost) => {
    const mediaUrls: string[] = post.mediaUrls
      ? (() => {
          try { return JSON.parse(post.mediaUrls) as string[] } catch { return [] }
        })()
      : []
    const platforms = post.accounts?.map((a) => a.account.platform) || []
    setComposer({
      editingId: post.id,
      productId: post.productId || '',
      customPrompt: '',
      platforms: platforms.length > 0 ? platforms : ['INSTAGRAM', 'FACEBOOK'],
      tone: 'entusiasta',
      caption: post.caption,
      hashtags: [],
      variations: [],
      mediaUrls,
      scheduledAt: post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
        : '',
      accountIds: post.accounts?.map((a) => a.id) || [],
    })
    // Scroll al inicio del composer
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    toast('Editando post — guarda los cambios', 'info')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/social/posts/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar')
      toast('Post eliminado')
      setDeleteTarget(null)
      fetchPosts()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al eliminar', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ---- media handlers ----
  const addMedia = (url: string) => {
    setComposer((c) =>
      c.mediaUrls.includes(url) ? c : { ...c, mediaUrls: [...c.mediaUrls, url] },
    )
  }
  const removeMedia = (idx: number) => {
    setComposer((c) => ({ ...c, mediaUrls: c.mediaUrls.filter((_, i) => i !== idx) }))
  }
  const removeHashtag = (h: string) => {
    setComposer((c) => ({ ...c, hashtags: c.hashtags.filter((x) => x !== h) }))
  }

  // ---- atajos visuales ----
  const isEditing = !!composer.editingId

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Content Studio IA</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
            <Sparkles className="size-3" /> IA
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Crea, genera con IA, programa y publica contenido en tus redes sociales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ============ COMPOSER (izquierda) ============ */}
        <div className="space-y-4">
          <Card className="p-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="size-4 text-primary" />
                {isEditing ? 'Editar post' : 'Nuevo post'}
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-xs"
                    onClick={() => setComposer(emptyComposer())}
                  >
                    Cancelar edición
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Configura el contenido y genera con IA o escribe manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Producto o prompt libre */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Producto</label>
                <ProductPicker
                  products={products}
                  value={composer.productId}
                  onChange={(id) => updateComposer({ productId: id })}
                  loading={productsLoading}
                />
              </div>

              {!composer.productId && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tema o prompt libre</label>
                  <Textarea
                    value={composer.customPrompt}
                    onChange={(e) => updateComposer({ customPrompt: e.target.value })}
                    placeholder="Ej: Promo de fin de semana en toda la tienda, 20% de descuento en tecnología…"
                    className="resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Plataformas */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Plataformas ({composer.platforms.length})
                </label>
                <PlatformChips selected={composer.platforms} onToggle={togglePlatform} />
                {accounts.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Se publicará en {selectedAccountIds.length} de {accounts.length} cuentas conectadas.
                  </p>
                )}
                {accounts.length === 0 && (
                  <p className="text-xs text-amber-700 flex items-center gap-1.5">
                    <AlertCircle className="size-3" />
                    No tienes cuentas conectadas. Conéctalas desde el panel Social.
                  </p>
                )}
              </div>

              {/* Tono */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tono de voz</label>
                <Select
                  value={composer.tone}
                  onValueChange={(v) => updateComposer({ tone: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generar con IA */}
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full gap-2"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generando contenido…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Contenido generado */}
          <Card className="p-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Contenido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Caption</label>
                <Textarea
                  value={composer.caption}
                  onChange={(e) => updateComposer({ caption: e.target.value })}
                  placeholder="Escribe o genera el caption para tu post…"
                  rows={5}
                  className="resize-y"
                />
                <p className="text-[11px] text-muted-foreground text-right">
                  {composer.caption.length} caracteres
                </p>
              </div>

              {composer.hashtags.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Hash className="size-3.5" /> Hashtags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {composer.hashtags.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5"
                      >
                        #{h}
                        <button
                          type="button"
                          onClick={() => removeHashtag(h)}
                          className="hover:text-primary/70"
                          aria-label={`Eliminar #${h}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {composer.variations.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Variaciones</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scroll-thin">
                    {composer.variations.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => updateComposer({ caption: v })}
                        className={cn(
                          'w-full text-left rounded-md border px-3 py-2 text-xs hover:border-primary/50 hover:bg-muted/30 transition',
                          composer.caption === v && 'border-primary bg-primary/5',
                        )}
                      >
                        <span className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">
                            V{i + 1}
                          </span>
                          <span className="line-clamp-2 flex-1">{v}</span>
                          {composer.caption === v && (
                            <Check className="size-3 text-primary shrink-0 mt-0.5" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="p-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="size-4 text-primary" />
                Multimedia
              </CardTitle>
              <CardDescription>
                Sube una imagen nueva o elige de tu biblioteca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediaGallery urls={composer.mediaUrls} onRemove={removeMedia} />

              <ImageUpload
                value=""
                onChange={(url) => {
                  if (url) addMedia(url)
                }}
                label="Subir imagen nueva"
              />

              <MediaLibraryPicker assets={mediaAssets} onPick={addMedia} />
            </CardContent>
          </Card>

          {/* Programación */}
          <Card className="p-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                Programación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha y hora (opcional)</label>
                <Input
                  type="datetime-local"
                  value={composer.scheduledAt}
                  onChange={(e) => updateComposer({ scheduledAt: e.target.value })}
                  className="w-full"
                />
                <p className="text-[11px] text-muted-foreground">
                  Solo requerido para «Programar publicación».
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={saving !== false}
                  className="gap-1.5"
                >
                  {saving === 'draft' ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                  Guardar borrador
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave('schedule')}
                  disabled={saving !== false}
                  className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  {saving === 'schedule' ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}
                  Programar
                </Button>
                <Button
                  onClick={() => handleSave('publish')}
                  disabled={saving !== false}
                  className="gap-1.5"
                >
                  {saving === 'publish' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Publicar ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============ POSTS LIST (derecha) ============ */}
        <div className="space-y-4">
          <Card className="p-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="size-4 text-primary" />
                Mis posts
              </CardTitle>
              <CardDescription>Gestiona tus publicaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                <TabsList className="grid grid-cols-4 w-full mb-3">
                  <TabsTrigger value="ALL" className="text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="DRAFT" className="text-xs">Borradores</TabsTrigger>
                  <TabsTrigger value="SCHEDULED" className="text-xs">Programados</TabsTrigger>
                  <TabsTrigger value="PUBLISHED" className="text-xs">Publicados</TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-0">
                  {postsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-3 border rounded-lg">
                          <Skeleton className="size-20 rounded-md" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="grid place-items-center size-12 rounded-full bg-muted">
                          <FileText className="size-6 text-muted-foreground/50" />
                        </div>
                        <p>No hay posts en esta vista.</p>
                        <p className="text-xs">Crea tu primer post con el composer de la izquierda.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[800px] overflow-y-auto scroll-thin pr-1">
                      {posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onPublish={handlePublish}
                          onEdit={handleEdit}
                          onDelete={(p) => setDeleteTarget(p)}
                          publishing={publishingId === post.id}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Resumen rápido */}
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Tip: usa la IA para variar el tono por plataforma
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Genera contenido con tono <strong>Juvenil</strong> para TikTok y <strong>Profesional</strong> para LinkedIn,
                  luego programa cada post en su mejor horario.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Diálogo de confirmación de borrado */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              Eliminar post
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar este post? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="line-clamp-2 text-foreground">{deleteTarget.caption}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {POST_STATUS_LABELS[deleteTarget.status] || deleteTarget.status} ·{' '}
                {fmtDateTime(deleteTarget.createdAt)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-1.5"
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SocialStudioModule
