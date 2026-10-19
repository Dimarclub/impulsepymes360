'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Link2,
  Plus,
  Trash2,
  Save,
  Copy,
  Check,
  Eye,
  MousePointerClick,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  Globe,
  ShoppingBag,
  Gift,
  Users,
  Store,
  HandCoins,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Pencil,
  LayoutTemplate,
} from 'lucide-react'
import type { BioPage } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '@/components/dimar/image-upload'

// ---------- Tipos locales ----------

interface BioLink {
  id: string
  label: string
  url: string
  type: 'internal' | 'external'
  icon: string
}

// ---------- Mapas de temas ----------

type ThemeKey = 'emerald' | 'amber' | 'dark' | 'minimal' | 'sunset'

interface ThemeConfig {
  key: ThemeKey
  label: string
  swatch: string // clase para el swatch circular en el selector
  bg: string // fondo del teléfono
  text: string // color de texto principal
  pillBg: string // fondo de los botones-link
  pillText: string // texto de los botones-link
  pillBorder?: string
  accent: string // color del nombre/avatar ring
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  emerald: {
    key: 'emerald',
    label: 'Esmeralda',
    swatch: 'bg-gradient-to-br from-primary to-accent',
    bg: 'bg-gradient-to-b from-primary via-primary to-accent/80',
    text: 'text-white',
    pillBg: 'bg-white/15 backdrop-blur hover:bg-white/25',
    pillText: 'text-white',
    pillBorder: 'border border-white/20',
    accent: 'ring-white/40',
  },
  amber: {
    key: 'amber',
    label: 'Ámbar',
    swatch: 'bg-gradient-to-br from-amber-500 to-orange-500',
    bg: 'bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600',
    text: 'text-white',
    pillBg: 'bg-white/15 backdrop-blur hover:bg-white/25',
    pillText: 'text-white',
    pillBorder: 'border border-white/20',
    accent: 'ring-white/40',
  },
  dark: {
    key: 'dark',
    label: 'Oscuro',
    swatch: 'bg-gray-900',
    bg: 'bg-gray-900',
    text: 'text-white',
    pillBg: 'bg-white/10 hover:bg-white/15',
    pillText: 'text-white',
    pillBorder: 'border border-white/10',
    accent: 'ring-white/30',
  },
  minimal: {
    key: 'minimal',
    label: 'Minimal',
    swatch: 'bg-white border border-gray-300',
    bg: 'bg-white',
    text: 'text-gray-900',
    pillBg: 'bg-gray-100 hover:bg-gray-200',
    pillText: 'text-gray-900',
    pillBorder: 'border border-gray-200',
    accent: 'ring-gray-300',
  },
  sunset: {
    key: 'sunset',
    label: 'Atardecer',
    swatch: 'bg-gradient-to-br from-orange-400 to-pink-500',
    bg: 'bg-gradient-to-b from-orange-400 via-pink-500 to-purple-500',
    text: 'text-white',
    pillBg: 'bg-white/15 backdrop-blur hover:bg-white/25',
    pillText: 'text-white',
    pillBorder: 'border border-white/20',
    accent: 'ring-white/40',
  },
}

const THEME_LIST = Object.values(THEMES)

// ---------- Mapa de iconos de links ----------

const LINK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Gift,
  Users,
  Store,
  HandCoins,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
}

const LINK_ICON_OPTIONS = Object.keys(LINK_ICONS)

// ---------- Helpers ----------

function safeParseLinks(raw: string | null | undefined): BioLink[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as BioLink[]
    return []
  } catch {
    return []
  }
}

function makeId() {
  return 'lnk_' + Math.random().toString(36).slice(2, 9)
}

function buildInternalUrl(url: string, affiliateCode?: string | null): string {
  if (!affiliateCode) return url
  // si ya tiene ref, no duplicar
  if (url.includes('ref=')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}ref=${encodeURIComponent(affiliateCode)}`
}

function resolveDisplayUrl(link: BioLink, affiliateCode?: string | null): string {
  if (link.type === 'internal' && affiliateCode) {
    return buildInternalUrl(link.url, affiliateCode)
  }
  return link.url
}

// ---------- Componente principal ----------

export function SocialBioModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const affiliateCode = currentUser?.affiliateCode

  const [pages, setPages] = useState<BioPage[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slugCopied, setSlugCopied] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [theme, setTheme] = useState<ThemeKey>('emerald')
  const [links, setLinks] = useState<BioLink[]>([])
  const [published, setPublished] = useState(true)
  const [slug, setSlug] = useState('')

  const current = useMemo(
    () => pages.find((p) => p.id === currentId) ?? null,
    [pages, currentId],
  )

  // Cargar páginas
  const fetchPages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/social/bio')
      if (!res.ok) throw new Error('Error al cargar')
      const data = (await res.json()) as BioPage[]
      setPages(data)
      if (data.length > 0 && !currentId) {
        setCurrentId(data[0].id)
      } else if (data.length === 0) {
        setCurrentId(null)
      }
    } catch {
      toast('Error al cargar tus páginas', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast, currentId])

  useEffect(() => {
    void fetchPages()
  }, [fetchPages])

  // Sincronizar form cuando cambia la página actual
  useEffect(() => {
    if (current) {
      setTitle(current.title || '')
      setSubtitle(current.subtitle || '')
      setAvatarUrl(current.avatarUrl || '')
      setTheme((current.theme as ThemeKey) || 'emerald')
      setLinks(safeParseLinks(current.links))
      setPublished(current.published)
      setSlug(current.slug)
    } else {
      // Defaults para nueva página
      const defaultName = currentUser?.name
        ? `${currentUser.name} · Dimarclub`
        : 'Mi página · Dimarclub'
      setTitle(defaultName)
      setSubtitle('')
      setAvatarUrl('')
      setTheme('emerald')
      setLinks([
        {
          id: makeId(),
          label: 'Comprar en Dimarclub',
          url: '/',
          type: 'internal',
          icon: 'ShoppingBag',
        },
      ])
      setPublished(true)
      setSlug(affiliateCode?.toLowerCase() || '')
    }
  }, [currentId, pages, currentUser, affiliateCode])

  // ---------- Handlers de links ----------

  const addLink = () => {
    setLinks((prev) => [
      ...prev,
      {
        id: makeId(),
        label: '',
        url: '',
        type: 'internal',
        icon: 'Globe',
      },
    ])
  }

  const updateLink = (id: string, patch: Partial<BioLink>) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  const moveLink = (idx: number, dir: -1 | 1) => {
    setLinks((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // ---------- Guardar ----------

  const handleSave = async () => {
    if (!title.trim()) {
      toast('El título es obligatorio', 'error')
      return
    }
    // Validar links: etiqueta y url requeridas si se quiere publicar
    const validLinks = links.filter((l) => l.label.trim() && l.url.trim())
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        avatarUrl: avatarUrl || null,
        theme,
        affiliateCode: affiliateCode || null,
        links: validLinks,
        published,
      }
      if (current) {
        const res = await fetch(`/api/social/bio/${current.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Error al guardar')
        const updated = (await res.json()) as BioPage
        setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast('¡Página guardada!')
      } else {
        const res = await fetch('/api/social/bio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Error al crear')
        const created = (await res.json()) as BioPage
        setPages((prev) => [created, ...prev])
        setCurrentId(created.id)
        toast('¡Página creada!')
      }
    } catch {
      toast('Error al guardar la página', 'error')
    } finally {
      setSaving(false)
    }
  }

  const togglePublished = async (next: boolean) => {
    setPublished(next)
    if (current) {
      try {
        const res = await fetch(`/api/social/bio/${current.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: next }),
        })
        if (!res.ok) throw new Error('Error')
        const updated = (await res.json()) as BioPage
        setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        toast(next ? 'Página publicada' : 'Página despublicada', 'info')
      } catch {
        setPublished(!next)
        toast('Error al cambiar estado', 'error')
      }
    }
  }

  const copySlug = async () => {
    if (!slug) return
    try {
      await navigator.clipboard.writeText(`/bio/${slug}`)
      setSlugCopied(true)
      toast('URL copiada al portapapeles')
      setTimeout(() => setSlugCopied(false), 2000)
    } catch {
      toast('No se pudo copiar', 'error')
    }
  }

  const handleDelete = async () => {
    if (!current) return
    try {
      const res = await fetch(`/api/social/bio/${current.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error')
      const remaining = pages.filter((p) => p.id !== current.id)
      setPages(remaining)
      setCurrentId(remaining[0]?.id ?? null)
      toast('Página eliminada', 'info')
    } catch {
      toast('Error al eliminar', 'error')
    } finally {
      setDeleteOpen(false)
    }
  }

  const createNewPage = () => {
    setCurrentId(null)
    // El effect de sync se encarga de los defaults
  }

  const themeConfig = THEMES[theme]

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <Link2 className="size-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Link in Bio
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Tu página personal con tu código de afiliado integrado. Como Linktree, pero para Dimarclub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {current && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          )}
          <Button size="sm" onClick={createNewPage} variant="secondary">
            <Plus className="size-4" />
            Nueva página
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {pages.length === 0 && !current ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center text-center gap-5">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
              <Link2 className="size-8 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-lg font-semibold">Aún no tienes una página Link in Bio</h3>
              <p className="text-sm text-muted-foreground">
                Crea tu página personal con todos tus enlaces, tu avatar y tu código de afiliado. Compártela en tus redes sociales.
              </p>
            </div>
            <Button onClick={() => setCurrentId(null)} size="lg">
              <Sparkles className="size-4" />
              Crear mi página Link in Bio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selector de páginas (si hay varias) */}
          {pages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto scroll-thin pb-2">
              {pages.map((p) => {
                const isActive = p.id === currentId
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentId(p.id)}
                    className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors min-w-[180px] ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            {(p.title || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[120px]">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            /bio/{p.slug}
                          </span>
                          {p.published ? (
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
              <button
                onClick={createNewPage}
                className="shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 px-3 py-2 min-w-[120px] flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
                Nueva
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            {/* ---------- LEFT: Editor ---------- */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="size-4 text-primary" />
                  {current ? 'Editar página' : 'Nueva página'}
                </CardTitle>
                <CardDescription>
                  Personaliza tu página. Los cambios se guardan con el botón "Guardar página".
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="space-y-1.5">
                  <Label>Avatar</Label>
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    label=""
                  />
                </div>

                {/* Título */}
                <div className="space-y-1.5">
                  <Label htmlFor="bio-title">Título *</Label>
                  <Input
                    id="bio-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tu nombre · Dimarclub"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/60 caracteres
                  </p>
                </div>

                {/* Subtítulo */}
                <div className="space-y-1.5">
                  <Label htmlFor="bio-subtitle">Subtítulo</Label>
                  <Input
                    id="bio-subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ej: Afiliada Dimarclub · Guayaquil 🇪🇨"
                    maxLength={120}
                  />
                </div>

                {/* Tema */}
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {THEME_LIST.map((t) => {
                      const selected = theme === t.key
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setTheme(t.key)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all ${
                            selected
                              ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          title={t.label}
                        >
                          <span
                            className={`size-7 rounded-full ${t.swatch} ring-1 ring-black/10`}
                          />
                          <span className="text-[10px] font-medium leading-none">
                            {t.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Links manager */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Enlaces</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {links.length} enlace{links.length === 1 ? '' : 's'} ·
                        ordena con ↑↓
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addLink}
                    >
                      <Plus className="size-4" />
                      Agregar
                    </Button>
                  </div>

                  {links.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <LinkIcon className="size-5 mx-auto mb-2 opacity-50" />
                      No hay enlaces. Agrega tu primer enlace.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {links.map((link, idx) => {
                        const IconComp =
                          LINK_ICONS[link.icon] ?? Globe
                        return (
                          <div
                            key={link.id}
                            className="rounded-lg border bg-card p-3 space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => moveLink(idx, -1)}
                                  disabled={idx === 0}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Subir"
                                >
                                  <ChevronUp className="size-3.5" />
                                </button>
                                <GripVertical className="size-3 text-muted-foreground/40" />
                                <button
                                  type="button"
                                  onClick={() => moveLink(idx, 1)}
                                  disabled={idx === links.length - 1}
                                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                  aria-label="Bajar"
                                >
                                  <ChevronDown className="size-3.5" />
                                </button>
                              </div>
                              <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <IconComp className="size-4" />
                              </div>
                              <Input
                                value={link.label}
                                onChange={(e) =>
                                  updateLink(link.id, { label: e.target.value })
                                }
                                placeholder="Etiqueta (ej: Ver catálogo)"
                                className="flex-1 h-9"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeLink(link.id)}
                                aria-label="Eliminar enlace"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-12 gap-2 pl-9">
                              <Input
                                value={link.url}
                                onChange={(e) =>
                                  updateLink(link.id, { url: e.target.value })
                                }
                                placeholder={
                                  link.type === 'internal'
                                    ? '/marketplace o /benefits'
                                    : 'https://...'
                                }
                                className="col-span-7 h-9 text-xs"
                              />
                              <Select
                                value={link.type}
                                onValueChange={(v) =>
                                  updateLink(link.id, {
                                    type: v as 'internal' | 'external',
                                  })
                                }
                              >
                                <SelectTrigger className="col-span-5 h-9 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="internal">Interna</SelectItem>
                                  <SelectItem value="external">Externa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="pl-9">
                              <Select
                                value={link.icon}
                                onValueChange={(v) =>
                                  updateLink(link.id, { icon: v })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {LINK_ICON_OPTIONS.map((ic) => {
                                    const C = LINK_ICONS[ic] ?? Globe
                                    return (
                                      <SelectItem key={ic} value={ic}>
                                        <span className="flex items-center gap-2">
                                          <C className="size-3.5" />
                                          {ic}
                                        </span>
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            {link.type === 'internal' && affiliateCode && link.url && (
                              <p className="pl-9 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="size-3" />
                                Se añadirá <code className="font-mono">?ref={affiliateCode}</code>
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Slug / URL pública */}
                <div className="space-y-1.5">
                  <Label>URL pública</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center rounded-md border bg-muted/40 px-3 h-9">
                      <span className="text-sm text-muted-foreground font-mono truncate">
                        /bio/{slug || '...'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copySlug}
                      disabled={!slug}
                      className="size-9 shrink-0"
                      aria-label="Copiar URL"
                    >
                      {slugCopied ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El slug se genera automáticamente desde tu código de afiliado.
                  </p>
                </div>

                {/* Published toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Publicada</Label>
                    <p className="text-xs text-muted-foreground">
                      Solo las páginas publicadas son accesibles públicamente.
                    </p>
                  </div>
                  <Switch checked={published} onCheckedChange={togglePublished} />
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 border-t">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    {current?.views ?? 0} vistas
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="size-3.5" />
                    {current?.clicks ?? 0} clicks
                  </span>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Guardar página
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* ---------- RIGHT: Phone preview ---------- */}
            <div className="lg:sticky lg:top-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LayoutTemplate className="size-4 text-primary" />
                    Vista previa en vivo
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {themeConfig.label}
                  </Badge>
                </div>
                <PhonePreview
                  themeConfig={themeConfig}
                  title={title}
                  subtitle={subtitle}
                  avatarUrl={avatarUrl}
                  links={links}
                  affiliateCode={affiliateCode}
                  views={current?.views ?? 0}
                  clicks={current?.clicks ?? 0}
                  published={published}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Así verán tus visitantes tu página en el móvil.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta página?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la página <strong>{current?.title}</strong> y
              la URL <code>/bio/{current?.slug}</code> dejará de funcionar. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar página
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------- Phone preview sub-component ----------

interface PhonePreviewProps {
  themeConfig: ThemeConfig
  title: string
  subtitle: string
  avatarUrl: string
  links: BioLink[]
  affiliateCode?: string | null
  views: number
  clicks: number
  published: boolean
}

function PhonePreview({
  themeConfig,
  title,
  subtitle,
  avatarUrl,
  links,
  affiliateCode,
  views,
  clicks,
  published,
}: PhonePreviewProps) {
  const validLinks = links.filter((l) => l.label.trim() && l.url.trim())

  return (
    <div className="mx-auto max-w-[320px]">
      <div className="relative aspect-[9/16] rounded-[2.5rem] border-4 border-gray-900 bg-gray-900 overflow-hidden shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-20" />

        {/* Screen content */}
        <div
          className={`absolute inset-0 overflow-y-auto scroll-thin ${themeConfig.bg} ${themeConfig.text}`}
        >
          <div className="pt-9 pb-6 px-5 min-h-full flex flex-col">
            {/* Avatar */}
            <div className="flex justify-center mt-2 mb-3">
              <div className={`size-20 rounded-full overflow-hidden ring-4 ${themeConfig.accent} bg-white/10 flex items-center justify-center`}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold opacity-80">
                    {(title || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Title + subtitle */}
            <h2 className="text-center font-bold text-lg leading-tight px-2">
              {title || 'Tu título'}
            </h2>
            {subtitle && (
              <p className="text-center text-xs opacity-80 mt-1 px-2">
                {subtitle}
              </p>
            )}

            {/* Links */}
            <div className="mt-5 space-y-2.5 flex-1">
              {validLinks.length === 0 ? (
                <div className={`text-center text-xs opacity-60 mt-8 ${themeConfig.text}`}>
                  Agrega enlaces para verlos aquí
                </div>
              ) : (
                validLinks.map((link) => {
                  const IconComp = LINK_ICONS[link.icon] ?? Globe
                  return (
                    <div
                      key={link.id}
                      className={`flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-sm font-medium transition-colors ${themeConfig.pillBg} ${themeConfig.pillText} ${themeConfig.pillBorder ?? ''}`}
                    >
                      <IconComp className="size-4 shrink-0" />
                      <span className="truncate max-w-[200px]">{link.label}</span>
                      {link.type === 'external' && (
                        <ExternalLink className="size-3 opacity-60 shrink-0" />
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer counters */}
            <div className="mt-6 pt-4 border-t border-current/15 flex items-center justify-center gap-4 text-[10px] opacity-70">
              <span className="flex items-center gap-1">
                <Eye className="size-3" />
                {views} vistas
              </span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="size-3" />
                {clicks} clicks
              </span>
              {!published && (
                <span className="px-1.5 py-0.5 rounded bg-current/15 font-medium">
                  Borrador
                </span>
              )}
            </div>

            {/* Dimarclub watermark */}
            <div className="mt-3 text-center text-[9px] opacity-50">
              Hecho con Dimarclub
              {affiliateCode && ` · ${affiliateCode}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SocialBioModule
