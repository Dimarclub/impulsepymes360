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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Link as LinkIcon,
  Inbox,
  Star,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  Loader2,
  CheckCircle2,
  Type,
  MessageSquare,
  ListChecks,
  BarChart3,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ----------------------------- Tipos ----------------------------- */

interface SurveyQuestion {
  text: string
  type: 'text' | 'rating' | 'choice' | 'scale'
  required?: boolean
  options?: string[]
}

interface Survey {
  id: string
  userId: string
  title: string
  description?: string | null
  questions: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { responses: number }
  averageRating?: number
}

interface SurveyResponse {
  id: string
  respondentName?: string | null
  respondentEmail?: string | null
  rating?: number | null
  answers: Record<string, unknown>
  createdAt: string
}

interface QuestionStat {
  index: number
  text: string
  type: string
  count: number
  average?: number
  distribution?: Record<string, number>
  options?: string[]
  answers?: string[]
}

interface SurveyStats {
  total: number
  averageRating: number
  ratingDistribution: Record<number, number>
  questionStats: QuestionStat[]
}

/* ----------------------------- Constantes ----------------------------- */

const QUESTION_TYPES: { value: SurveyQuestion['type']; label: string; icon: typeof Type }[] = [
  { value: 'text', label: 'Texto libre', icon: Type },
  { value: 'rating', label: 'Estrellas (1-5)', icon: Star },
  { value: 'choice', label: 'Opción única', icon: ListChecks },
  { value: 'scale', label: 'Escala (1-10)', icon: BarChart3 },
]

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

const asString = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.map((x) => String(x)).join(', ')
  return String(v)
}

/* ----------------------------- Módulo ----------------------------- */

export function EncuestasModule() {
  const toast = useAppStore((s) => s.toast)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<Survey | null>(null)
  const [responsesOpen, setResponsesOpen] = useState<Survey | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/encuestas', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar encuestas')
      const data = await res.json()
      setSurveys(data.surveys ?? [])
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const total = surveys.length
    const totalResponses = surveys.reduce(
      (s, su) => s + (su._count?.responses ?? 0),
      0
    )
    const activeSurveys = surveys.filter((s) => s.isActive).length
    const ratings = surveys
      .map((s) => s.averageRating ?? 0)
      .filter((r) => r > 0)
    const globalAvg =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0
    return { total, totalResponses, activeSurveys, globalAvg }
  }, [surveys])

  const handleSaved = useCallback(() => {
    setBuilderOpen(false)
    setEditing(null)
    load()
  }, [load])

  const handleEdit = (s: Survey) => {
    setEditing(s)
    setBuilderOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setBuilderOpen(true)
  }

  const handleCopyLink = async (s: Survey) => {
    try {
      const url = `${window.location.origin}/surveys/${s.id}`
      await navigator.clipboard.writeText(url)
      toast('Enlace público copiado al portapapeles')
    } catch {
      toast('No se pudo copiar el enlace', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/encuestas/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('No se pudo eliminar')
      toast('Encuesta eliminada')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Header loading={loading} onReload={load} onNew={handleNew} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={ClipboardList}
          label="Total encuestas"
          value={String(stats.total)}
          tone="emerald"
        />
        <StatCard
          icon={Inbox}
          label="Total respuestas"
          value={String(stats.totalResponses)}
          tone="amber"
        />
        <StatCard
          icon={Star}
          label="Rating promedio global"
          value={stats.globalAvg > 0 ? `${stats.globalAvg.toFixed(1)} / 5` : '—'}
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Encuestas activas"
          value={String(stats.activeSurveys)}
          tone="emerald"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0 space-y-3">
            <div className="mx-auto size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200">
              <ClipboardList className="size-6" />
            </div>
            <CardTitle className="text-lg">Sin encuestas aún</CardTitle>
            <CardDescription className="text-sm">
              Crea tu primera encuesta para medir satisfacción y feedback de tus clientes.
            </CardDescription>
            <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus />
              Nueva encuesta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((s) => (
            <SurveyCard
              key={s.id}
              survey={s}
              onViewResponses={() => setResponsesOpen(s)}
              onEdit={() => handleEdit(s)}
              onCopyLink={() => handleCopyLink(s)}
              onDelete={() => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      <BuilderDialog
        open={builderOpen}
        onOpenChange={(o) => {
          setBuilderOpen(o)
          if (!o) setEditing(null)
        }}
        editing={editing}
        onSaved={handleSaved}
      />

      <ResponsesDialog
        survey={responsesOpen}
        onOpenChange={(o) => !o && setResponsesOpen(null)}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar encuesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la encuesta <strong>{deleteTarget?.title}</strong> y
              todas sus respuestas. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ----------------------------- Header ----------------------------- */

function Header({
  loading,
  onReload,
  onNew,
}: {
  loading: boolean
  onReload: () => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gradient">
          Encuestas
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea encuestas de satisfacción y recopila feedback de tus clientes.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
        <Button size="sm" onClick={onNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus />
          Nueva encuesta
        </Button>
      </div>
    </div>
  )
}

/* ----------------------------- StatCard ----------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ClipboardList
  label: string
  value: string
  tone: 'emerald' | 'amber'
}) {
  const toneCls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/60'
      : 'bg-amber-50 text-amber-700 ring-amber-200/60'
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-lg flex items-center justify-center ring-1 ${toneCls}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold leading-tight truncate">{value}</p>
        </div>
      </div>
    </Card>
  )
}

/* ----------------------------- RatingStars ----------------------------- */

function RatingStars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(value)
              ? 'size-4 fill-amber-400 text-amber-400'
              : 'size-4 text-muted-foreground/30'
          }
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  )
}

/* ----------------------------- SurveyCard ----------------------------- */

function SurveyCard({
  survey,
  onViewResponses,
  onEdit,
  onCopyLink,
  onDelete,
}: {
  survey: Survey
  onViewResponses: () => void
  onEdit: () => void
  onCopyLink: () => void
  onDelete: () => void
}) {
  const questions = useMemo<SurveyQuestion[]>(() => {
    try {
      const parsed = JSON.parse(survey.questions)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [survey.questions])

  const responseCount = survey._count?.responses ?? 0
  const avg = survey.averageRating ?? 0

  return (
    <Card className="p-0 overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight line-clamp-2">
            {survey.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              survey.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-muted text-muted-foreground'
            }
          >
            {survey.isActive ? 'Activa' : 'Inactiva'}
          </Badge>
        </div>
        {survey.description ? (
          <CardDescription className="text-xs line-clamp-2">
            {survey.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 flex-1">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="gap-1">
            <ListChecks className="size-3" />
            {questions.length} preguntas
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Inbox className="size-3" />
            {responseCount} respuestas
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rating promedio</p>
          <RatingStars value={avg} />
        </div>
        <p className="text-xs text-muted-foreground">
          Creada {shortDate(survey.createdAt)}
        </p>
      </CardContent>
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={onViewResponses} className="gap-1.5">
          <Eye className="size-3.5" />
          Respuestas
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
          <Pencil className="size-3.5" />
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={onCopyLink} className="gap-1.5 col-span-2">
          <LinkIcon className="size-3.5" />
          Copiar enlace público
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="gap-1.5 col-span-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="size-3.5" />
          Eliminar
        </Button>
      </div>
    </Card>
  )
}

/* ----------------------------- Builder Dialog ----------------------------- */

function BuilderDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Survey | null
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setTitle(editing.title)
      setDescription(editing.description ?? '')
      setIsActive(editing.isActive)
      try {
        const parsed = JSON.parse(editing.questions)
        setQuestions(Array.isArray(parsed) ? parsed : [])
      } catch {
        setQuestions([])
      }
    } else {
      setTitle('')
      setDescription('')
      setIsActive(true)
      setQuestions([
        {
          text: '¿Qué tan satisfecho estás con nuestro servicio?',
          type: 'rating',
          required: true,
        },
      ])
    }
  }, [open, editing])

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: '', type: 'text', required: false },
    ])
  }

  const updateQuestion = (i: number, patch: Partial<SurveyQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q))
    )
  }

  const removeQuestion = (i: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i))
  }

  const moveQuestion = (i: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast('El título es obligatorio', 'error')
      return
    }
    if (questions.length === 0) {
      toast('Agrega al menos una pregunta', 'error')
      return
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        toast('Todas las preguntas deben tener texto', 'error')
        return
      }
      if (q.type === 'choice' && (!q.options || q.options.length === 0)) {
        toast('Las preguntas de opción necesitan opciones', 'error')
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        isActive,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          type: q.type,
          required: !!q.required,
          options:
            q.type === 'choice'
              ? (q.options ?? []).map((o) => o.trim()).filter(Boolean)
              : undefined,
        })),
      }
      const url = editing ? `/api/encuestas/${editing.id}` : '/api/encuestas'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo guardar la encuesta')
      }
      toast(editing ? 'Encuesta actualizada' : 'Encuesta creada')
      onSaved()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar encuesta' : 'Nueva encuesta'}
          </DialogTitle>
          <DialogDescription>
            Diseña tu encuesta con preguntas de texto, estrellas, opción múltiple o escala 1-10.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="design" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="design">Diseño</TabsTrigger>
            <TabsTrigger value="options">Opciones</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
          </TabsList>

          <TabsContent
            value="design"
            className="flex-1 overflow-y-auto scroll-thin mt-3 pr-1 space-y-3"
          >
            {questions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aún no has agregado preguntas.
              </div>
            ) : (
              questions.map((q, i) => (
                <QuestionEditor
                  key={i}
                  question={q}
                  index={i}
                  total={questions.length}
                  onChange={(patch) => updateQuestion(i, patch)}
                  onRemove={() => removeQuestion(i)}
                  onMove={(dir) => moveQuestion(i, dir)}
                />
              ))
            )}
            <Button variant="outline" onClick={addQuestion} className="w-full gap-2">
              <Plus />
              Añadir pregunta
            </Button>
          </TabsContent>

          <TabsContent value="options" className="flex-1 overflow-y-auto scroll-thin mt-3 pr-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="survey-title">Título de la encuesta *</Label>
              <Input
                id="survey-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Satisfacción del servicio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-desc">Descripción</Label>
              <Textarea
                id="survey-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Texto introductorio que verán los usuarios"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex items-center gap-3 h-9">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-muted-foreground">
                  {isActive ? 'Activa (visible al público)' : 'Inactiva'}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto scroll-thin mt-3 pr-1">
            <div className="mx-auto max-w-md">
              <Card className="p-6">
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-semibold">{title || 'Sin título'}</h3>
                  {description ? (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  ) : null}
                </div>
                <Separator className="mb-4" />
                <div className="space-y-5">
                  {questions.map((q, i) => (
                    <QuestionPreview key={i} question={q} index={i} />
                  ))}
                  {questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Agrega preguntas en la pestaña Diseño.
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="animate-spin" /> : null}
            {editing ? 'Guardar cambios' : 'Crear encuesta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ----------------------------- QuestionEditor ----------------------------- */

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  question: SurveyQuestion
  index: number
  total: number
  onChange: (patch: Partial<SurveyQuestion>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [newOption, setNewOption] = useState('')
  const addOption = () => {
    const v = newOption.trim()
    if (!v) return
    onChange({ options: [...(question.options ?? []), v] })
    setNewOption('')
  }
  const removeOption = (i: number) => {
    onChange({ options: (question.options ?? []).filter((_, idx) => idx !== i) })
  }

  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Pregunta #{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Subir"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Bajar"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onRemove}
            title="Eliminar pregunta"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Texto de la pregunta</Label>
        <Textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Ej. ¿Qué te pareció nuestro servicio?"
          rows={2}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de pregunta</Label>
          <Select
            value={question.type}
            onValueChange={(v) => onChange({ type: v as SurveyQuestion['type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <span className="flex items-center gap-2">
                    <t.icon className="size-3.5" />
                    {t.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`q-req-${index}`}
              checked={!!question.required}
              onCheckedChange={(c) => onChange({ required: c === true })}
            />
            <Label htmlFor={`q-req-${index}`} className="text-sm cursor-pointer">
              Obligatoria
            </Label>
          </div>
        </div>
      </div>

      {question.type === 'choice' ? (
        <div className="space-y-2">
          <Label className="text-xs">Opciones</Label>
          <div className="flex gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addOption()
                }
              }}
              placeholder="Añadir opción y Enter"
            />
            <Button type="button" size="sm" variant="outline" onClick={addOption}>
              <Plus className="size-3.5" />
            </Button>
          </div>
          {question.options && question.options.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {question.options.map((opt, i) => (
                <Badge key={i} variant="secondary" className="gap-1 py-1 pl-2 pr-1">
                  {opt}
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="hover:text-red-600"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sin opciones todavía.</p>
          )}
        </div>
      ) : null}
    </Card>
  )
}

/* ----------------------------- QuestionPreview ----------------------------- */

function QuestionPreview({ question, index }: { question: SurveyQuestion; index: number }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm flex items-center gap-1">
        <span className="text-muted-foreground">{index + 1}.</span>
        {question.text || 'Pregunta sin texto'}
        {question.required ? <span className="text-red-500">*</span> : null}
      </Label>
      {question.type === 'text' ? (
        <Textarea placeholder="Tu respuesta..." rows={2} disabled />
      ) : question.type === 'rating' ? (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-7 text-muted-foreground/30" />
          ))}
        </div>
      ) : question.type === 'choice' ? (
        <div className="space-y-1.5">
          {(question.options ?? []).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="size-4 rounded-full border" />
              <span className="text-sm">{o}</span>
            </div>
          ))}
          {(question.options ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin opciones.</p>
          ) : null}
        </div>
      ) : question.type === 'scale' ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">1</span>
          <div className="flex-1 h-2 bg-muted rounded-full" />
          <span className="text-xs text-muted-foreground">10</span>
        </div>
      ) : null}
    </div>
  )
}

/* ----------------------------- Responses Dialog ----------------------------- */

function ResponsesDialog({
  survey,
  onOpenChange,
}: {
  survey: Survey | null
  onOpenChange: (o: boolean) => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [stats, setStats] = useState<SurveyStats | null>(null)
  const [loadedSurveyId, setLoadedSurveyId] = useState<string | null>(null)
  const loading = !survey || survey.id !== loadedSurveyId
  const questions = useMemo<SurveyQuestion[]>(() => {
    if (!survey) return []
    try {
      const parsed = JSON.parse(survey.questions)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [survey])

  useEffect(() => {
    if (!survey) return
    let cancelled = false
    fetch(`/api/encuestas/${survey.id}/responses`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error'))))
      .then((data) => {
        if (cancelled) return
        setResponses(data.responses ?? [])
        setStats(data.stats ?? null)
        setLoadedSurveyId(survey.id)
      })
      .catch(() => {
        if (!cancelled) {
          toast('Error al cargar respuestas', 'error')
          setLoadedSurveyId(survey.id)
        }
      })
    return () => {
      cancelled = true
    }
  }, [survey, toast])

  const exportCsv = () => {
    if (!survey) return
    const header = [
      'Fecha',
      'Nombre',
      'Email',
      'Rating',
      ...questions.map((q, i) => `P${i + 1}: ${q.text.slice(0, 40)}`),
    ]
    const rows = responses.map((r) => {
      const date = new Date(r.createdAt).toLocaleString('es-EC')
      const cells = [
        date,
        r.respondentName ?? '',
        r.respondentEmail ?? '',
        r.rating != null ? String(r.rating) : '',
        ...questions.map((_, i) => {
          const v = r.answers[String(i)]
          const s = asString(v).replace(/"/g, '""')
          return `"${s}"`
        }),
      ]
      return cells.join(',')
    })
    const csv = [header.map((h) => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `encuesta-${survey.id}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('CSV exportado')
  }

  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Respuestas — {survey?.title}</DialogTitle>
          <DialogDescription>
            {responses.length} respuesta(s) registrada(s). Visualiza la distribución y descarga CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {loading ? 'Cargando...' : `${responses.length} respuesta(s)`}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={exportCsv}
            disabled={responses.length === 0}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin space-y-4 pr-1">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !stats || responses.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Inbox className="mx-auto size-8 mb-2 opacity-50" />
              Aún no hay respuestas. Comparte el enlace público de la encuesta.
            </div>
          ) : (
            <>
              {/* Stats globales */}
              <Card className="p-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total respuestas</p>
                    <p className="text-2xl font-semibold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rating promedio</p>
                    <div className="flex items-center gap-2">
                      <RatingStars value={stats.averageRating} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Distribución rating</p>
                    <div className="space-y-1 mt-1">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const count = stats.ratingDistribution[n] ?? 0
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                        return (
                          <div key={n} className="flex items-center gap-2 text-xs">
                            <span className="w-3">{n}</span>
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            <Progress value={pct} className="flex-1 h-2" />
                            <span className="w-8 text-right text-muted-foreground">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Por pregunta */}
              {stats.questionStats.map((qs) => (
                <QuestionStatCard key={qs.index} stat={qs} />
              ))}

              {/* Tabla cruda */}
              <Card className="p-0 overflow-hidden">
                <CardHeader className="p-3 border-b">
                  <CardTitle className="text-sm">Respuestas individuales</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto scroll-thin">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky top-0 bg-background">Fecha</TableHead>
                        <TableHead className="sticky top-0 bg-background">Nombre</TableHead>
                        <TableHead className="sticky top-0 bg-background">Rating</TableHead>
                        {questions.map((q, i) => (
                          <TableHead key={i} className="sticky top-0 bg-background">
                            P{i + 1}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responses.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {new Date(r.createdAt).toLocaleString('es-EC')}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.respondentName ?? '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.rating != null ? `${r.rating}★` : '—'}
                          </TableCell>
                          {questions.map((_, i) => (
                            <TableCell key={i} className="text-xs align-top max-w-xs">
                              <span className="line-clamp-3">
                                {asString(r.answers[String(i)]) || '—'}
                              </span>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ----------------------------- QuestionStatCard ----------------------------- */

function QuestionStatCard({ stat }: { stat: QuestionStat }) {
  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Pregunta {stat.index + 1}</p>
          <p className="text-sm font-medium">{stat.text}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          {stat.count} respuesta(s)
        </Badge>
      </div>
      <Separator />
      {stat.type === 'rating' || stat.type === 'scale' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Promedio:</span>
            <span className="text-sm font-semibold">
              {stat.average?.toFixed(2) ?? '—'}
              {stat.type === 'rating' ? ' / 5' : ' / 10'}
            </span>
          </div>
          {stat.distribution ? (
            <div className="space-y-1">
              {Object.entries(stat.distribution)
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([k, count]) => {
                  const total = stat.count || 1
                  const pct = (count / total) * 100
                  return (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-right text-muted-foreground">{k}</span>
                      <Progress value={pct} className="flex-1 h-2" />
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  )
                })}
            </div>
          ) : null}
        </div>
      ) : stat.type === 'choice' ? (
        <div className="space-y-1.5">
          {(stat.options ?? []).map((opt) => {
            const count = stat.distribution?.[opt] ?? 0
            const total = stat.count || 1
            const pct = (count / total) * 100
            return (
              <div key={opt} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate">{opt}</span>
                  <span className="text-muted-foreground">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-1 max-h-32 overflow-y-auto scroll-thin">
          {(stat.answers ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin respuestas de texto.</p>
          ) : (
            (stat.answers ?? []).map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                {a}
              </p>
            ))
          )}
        </div>
      )}
    </Card>
  )
}

export default EncuestasModule
