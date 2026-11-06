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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  FileText,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Copy,
  Link as LinkIcon,
  ListChecks,
  Inbox,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  X,
  Download,
  Loader2,
  CheckCircle2,
  Type,
  Mail,
  Phone,
  Calendar,
  Hash,
  List,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ----------------------------- Tipos ----------------------------- */

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

interface FormTemplate {
  id: string
  userId: string
  name: string
  description?: string | null
  fields: string
  submitLabel: string
  successMessage?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { responses: number }
}

interface FormResponse {
  id: string
  contactId?: string | null
  data: Record<string, unknown>
  createdAt: string
}

/* ----------------------------- Constantes ----------------------------- */

const FIELD_TYPES: { value: string; label: string; icon: typeof Type }[] = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'tel', label: 'Teléfono', icon: Phone },
  { value: 'textarea', label: 'Párrafo', icon: FileText },
  { value: 'select', label: 'Lista desplegable', icon: List },
  { value: 'radio', label: 'Opción única', icon: List },
  { value: 'checkbox', label: 'Casillas', icon: CheckCircle2 },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'date', label: 'Fecha', icon: Calendar },
]

const TYPE_NEEDS_OPTIONS = (t: string) =>
  t === 'select' || t === 'radio' || t === 'checkbox'

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

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)

const DEFAULT_FIELD: Omit<FormField, 'name'> = {
  label: '',
  type: 'text',
  required: false,
  placeholder: '',
  options: [],
}

/* ----------------------------- Módulo ----------------------------- */

export function FormulariosModule() {
  const toast = useAppStore((s) => s.toast)
  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editing, setEditing] = useState<FormTemplate | null>(null)
  const [responsesOpen, setResponsesOpen] = useState<FormTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FormTemplate | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/formularios', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar formularios')
      const data = await res.json()
      setForms(data.forms ?? [])
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
    const total = forms.length
    const totalResponses = forms.reduce(
      (s, f) => s + (f._count?.responses ?? 0),
      0
    )
    const activeForms = forms.filter((f) => f.isActive).length
    const conversion = totalFormsViews // placeholder estático
    return { total, totalResponses, activeForms, conversion }
  }, [forms])

  const handleSaved = useCallback(() => {
    setBuilderOpen(false)
    setEditing(null)
    load()
  }, [load])

  const handleEdit = (f: FormTemplate) => {
    setEditing(f)
    setBuilderOpen(true)
  }

  const handleNew = () => {
    setEditing(null)
    setBuilderOpen(true)
  }

  const handleCopyLink = async (f: FormTemplate) => {
    try {
      const url = `${window.location.origin}/forms/${f.id}`
      await navigator.clipboard.writeText(url)
      toast('Enlace público copiado al portapapeles')
    } catch {
      toast('No se pudo copiar el enlace', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/formularios/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('No se pudo eliminar')
      toast('Formulario eliminado')
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
          icon={FileText}
          label="Total formularios"
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
          icon={CheckCircle2}
          label="Formularios activos"
          value={String(stats.activeForms)}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Tasa conversión"
          value={`${stats.conversion.toFixed(1)}%`}
          tone="amber"
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0 space-y-3">
            <div className="mx-auto size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200">
              <FileText className="size-6" />
            </div>
            <CardTitle className="text-lg">Sin formularios aún</CardTitle>
            <CardDescription className="text-sm">
              Crea tu primer formulario para capturar leads desde tu sitio web.
            </CardDescription>
            <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus />
              Nuevo formulario
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((f) => (
            <FormCard
              key={f.id}
              form={f}
              onViewResponses={() => setResponsesOpen(f)}
              onEdit={() => handleEdit(f)}
              onCopyLink={() => handleCopyLink(f)}
              onDelete={() => setDeleteTarget(f)}
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
        form={responsesOpen}
        onOpenChange={(o) => !o && setResponsesOpen(null)}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar formulario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el formulario <strong>{deleteTarget?.name}</strong> y
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

const totalFormsViews = 0 // placeholder — sin tracking de vistas por ahora

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
          Formularios
        </h2>
        <p className="text-sm text-muted-foreground">
          Crea formularios públicos para capturar leads y sincronizarlos con tu CRM.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
        <Button size="sm" onClick={onNew} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus />
          Nuevo formulario
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
  icon: typeof FileText
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

/* ----------------------------- FormCard ----------------------------- */

function FormCard({
  form,
  onViewResponses,
  onEdit,
  onCopyLink,
  onDelete,
}: {
  form: FormTemplate
  onViewResponses: () => void
  onEdit: () => void
  onCopyLink: () => void
  onDelete: () => void
}) {
  const fields = useMemo<FormField[]>(() => {
    try {
      const parsed = JSON.parse(form.fields)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [form.fields])

  const responseCount = form._count?.responses ?? 0

  return (
    <Card className="p-0 overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight line-clamp-2">
            {form.name}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              form.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-muted text-muted-foreground'
            }
          >
            {form.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        {form.description ? (
          <CardDescription className="text-xs line-clamp-2">
            {form.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3 flex-1">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="gap-1">
            <ListChecks className="size-3" />
            {fields.length} campos
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Inbox className="size-3" />
            {responseCount} respuestas
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Creado {shortDate(form.createdAt)}
        </p>
      </CardContent>
      <div className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onViewResponses}
          className="gap-1.5"
        >
          <Eye className="size-3.5" />
          Respuestas
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
          <Pencil className="size-3.5" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCopyLink}
          className="gap-1.5 col-span-2"
        >
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
  editing: FormTemplate | null
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitLabel, setSubmitLabel] = useState('Enviar')
  const [successMessage, setSuccessMessage] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [fields, setFields] = useState<FormField[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name)
      setDescription(editing.description ?? '')
      setSubmitLabel(editing.submitLabel || 'Enviar')
      setSuccessMessage(editing.successMessage ?? '')
      setIsActive(editing.isActive)
      try {
        const parsed = JSON.parse(editing.fields)
        setFields(Array.isArray(parsed) ? parsed : [])
      } catch {
        setFields([])
      }
    } else {
      setName('')
      setDescription('')
      setSubmitLabel('Enviar')
      setSuccessMessage('')
      setIsActive(true)
      setFields([
        {
          ...DEFAULT_FIELD,
          name: 'nombre',
          label: 'Nombre completo',
          type: 'text',
          required: true,
          placeholder: 'Ej. María Pérez',
        },
      ])
    }
  }, [open, editing])

  const addField = () => {
    const idx = fields.length + 1
    setFields((prev) => [
      ...prev,
      { ...DEFAULT_FIELD, name: `campo_${idx}_${Date.now().toString(36)}`, label: `Campo ${idx}` },
    ])
  }

  const updateField = (i: number, patch: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f, idx) =>
        idx === i
          ? {
              ...f,
              ...patch,
              name:
                patch.label && (f.name.startsWith('campo_') || !f.name)
                  ? slugify(patch.label) || f.name
                  : f.name,
            }
          : f
      )
    )
  }

  const removeField = (i: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== i))
  }

  const moveField = (i: number, dir: -1 | 1) => {
    setFields((prev) => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast('El nombre es obligatorio', 'error')
      return
    }
    if (fields.length === 0) {
      toast('Agrega al menos un campo', 'error')
      return
    }
    // Validar labels y opciones
    for (const f of fields) {
      if (!f.label.trim()) {
        toast('Todos los campos deben tener etiqueta', 'error')
        return
      }
      if (TYPE_NEEDS_OPTIONS(f.type) && (!f.options || f.options.length === 0)) {
        toast(`El campo "${f.label}" necesita opciones`, 'error')
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        submitLabel: submitLabel.trim() || 'Enviar',
        successMessage: successMessage.trim() || null,
        isActive,
        fields: fields.map((f) => ({
          name: f.name || slugify(f.label),
          label: f.label.trim(),
          type: f.type,
          required: !!f.required,
          placeholder: f.placeholder?.trim() || undefined,
          options: TYPE_NEEDS_OPTIONS(f.type)
            ? (f.options ?? []).map((o) => o.trim()).filter(Boolean)
            : undefined,
        })),
      }
      const url = editing
        ? `/api/formularios/${editing.id}`
        : '/api/formularios'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'No se pudo guardar el formulario')
      }
      toast(editing ? 'Formulario actualizado' : 'Formulario creado')
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
            {editing ? 'Editar formulario' : 'Nuevo formulario'}
          </DialogTitle>
          <DialogDescription>
            Diseña tu formulario con campos personalizados. Disponible en una URL pública.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="design" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="design">Diseño</TabsTrigger>
            <TabsTrigger value="options">Opciones</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
          </TabsList>

          {/* Tab Diseño */}
          <TabsContent
            value="design"
            className="flex-1 overflow-y-auto scroll-thin mt-3 pr-1 space-y-3"
          >
            {fields.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aún no has agregado campos.
              </div>
            ) : (
              fields.map((f, i) => (
                <FieldEditor
                  key={i}
                  field={f}
                  index={i}
                  total={fields.length}
                  onChange={(patch) => updateField(i, patch)}
                  onRemove={() => removeField(i)}
                  onMove={(dir) => moveField(i, dir)}
                />
              ))
            )}
            <Button variant="outline" onClick={addField} className="w-full gap-2">
              <Plus />
              Añadir campo
            </Button>
          </TabsContent>

          {/* Tab Opciones */}
          <TabsContent value="options" className="flex-1 overflow-y-auto scroll-thin mt-3 pr-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Nombre del formulario *</Label>
              <Input
                id="form-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Contacto comercial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc">Descripción</Label>
              <Textarea
                id="form-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve texto que verán los usuarios arriba del formulario"
                rows={2}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-submit">Texto del botón</Label>
                <Input
                  id="form-submit"
                  value={submitLabel}
                  onChange={(e) => setSubmitLabel(e.target.value)}
                  placeholder="Enviar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-active">Estado del formulario</Label>
                <div className="flex items-center gap-3 h-9">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm text-muted-foreground">
                    {isActive ? 'Activo (visible al público)' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-success">Mensaje de éxito</Label>
              <Textarea
                id="form-success"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                placeholder="¡Gracias! Te contactaremos pronto."
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Se muestra tras enviar el formulario.
              </p>
            </div>
          </TabsContent>

          {/* Tab Vista previa */}
          <TabsContent value="preview" className="flex-1 overflow-y-auto scroll-thin mt-3 pr-1">
            <div className="mx-auto max-w-md">
              <Card className="p-6">
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-semibold">{name || 'Sin nombre'}</h3>
                  {description ? (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  ) : null}
                </div>
                <Separator className="mb-4" />
                <div className="space-y-4">
                  {fields.map((f, i) => (
                    <FieldPreview key={i} field={f} />
                  ))}
                  {fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Agrega campos en la pestaña Diseño.
                    </p>
                  ) : null}
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled>
                    {submitLabel || 'Enviar'}
                  </Button>
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
            {editing ? 'Guardar cambios' : 'Crear formulario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ----------------------------- FieldEditor ----------------------------- */

function FieldEditor({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  field: FormField
  index: number
  total: number
  onChange: (patch: Partial<FormField>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const needsOptions = TYPE_NEEDS_OPTIONS(field.type)
  const [newOption, setNewOption] = useState('')

  const addOption = () => {
    const v = newOption.trim()
    if (!v) return
    onChange({ options: [...(field.options ?? []), v] })
    setNewOption('')
  }
  const removeOption = (i: number) => {
    onChange({ options: (field.options ?? []).filter((_, idx) => idx !== i) })
  }

  return (
    <Card className="p-4 gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            #{index + 1}
          </span>
        </div>
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
            title="Eliminar campo"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Etiqueta</Label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Ej. Correo electrónico"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de campo</Label>
          <Select value={field.type} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
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
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nombre (clave)</Label>
          <Input
            value={field.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="auto_generado"
            className="font-mono text-xs"
          />
        </div>
        {!needsOptions ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={field.placeholder ?? ''}
              onChange={(e) => onChange({ placeholder: e.target.value })}
              placeholder="Ej. Ejemplo@correo.com"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`req-${index}`}
          checked={!!field.required}
          onCheckedChange={(c) => onChange({ required: c === true })}
        />
        <Label htmlFor={`req-${index}`} className="text-sm cursor-pointer">
          Campo obligatorio
        </Label>
      </div>

      {needsOptions ? (
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
          {field.options && field.options.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {field.options.map((opt, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="gap-1 py-1 pl-2 pr-1"
                >
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
            <p className="text-xs text-muted-foreground">
              Sin opciones todavía.
            </p>
          )}
        </div>
      ) : null}
    </Card>
  )
}

/* ----------------------------- FieldPreview ----------------------------- */

function FieldPreview({ field }: { field: FormField }) {
  const id = `prev-${field.name}`
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm flex items-center gap-1">
        {field.label}
        {field.required ? <span className="text-red-500">*</span> : null}
      </Label>
      {field.type === 'textarea' ? (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          disabled
          rows={3}
        />
      ) : field.type === 'select' ? (
        <Select disabled>
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder || 'Selecciona...'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o, i) => (
              <SelectItem key={i} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === 'radio' ? (
        <RadioGroup disabled>
          {(field.options ?? []).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem value={o} id={`${id}-${i}`} />
              <Label htmlFor={`${id}-${i}`} className="text-sm font-normal">
                {o}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : field.type === 'checkbox' ? (
        <div className="space-y-2">
          {(field.options ?? []).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <Checkbox id={`${id}-${i}`} disabled />
              <Label htmlFor={`${id}-${i}`} className="text-sm font-normal">
                {o}
              </Label>
            </div>
          ))}
        </div>
      ) : (
        <Input
          id={id}
          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
          placeholder={field.placeholder}
          disabled
        />
      )}
    </div>
  )
}

/* ----------------------------- Responses Dialog ----------------------------- */

function ResponsesDialog({
  form,
  onOpenChange,
}: {
  form: FormTemplate | null
  onOpenChange: (o: boolean) => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [loadedFormId, setLoadedFormId] = useState<string | null>(null)
  const loading = !form || form.id !== loadedFormId
  const fields = useMemo<FormField[]>(() => {
    if (!form) return []
    try {
      const parsed = JSON.parse(form.fields)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [form])

  useEffect(() => {
    if (!form) return
    let cancelled = false
    fetch(`/api/formularios/${form.id}/responses`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error'))))
      .then((data) => {
        if (cancelled) return
        setResponses(data.responses ?? [])
        setLoadedFormId(form.id)
      })
      .catch(() => {
        if (!cancelled) {
          toast('Error al cargar respuestas', 'error')
          setLoadedFormId(form.id)
        }
      })
    return () => {
      cancelled = true
    }
  }, [form, toast])

  const exportCsv = () => {
    if (!form) return
    const header = ['Fecha', ...fields.map((f) => f.label)]
    const rows = responses.map((r) => {
      const date = new Date(r.createdAt).toLocaleString('es-EC')
      const cells = fields.map((f) => {
        const v = r.data[f.name]
        const s = asString(v).replace(/"/g, '""')
        return `"${s}"`
      })
      return [date, ...cells].join(',')
    })
    const csv = [header.map((h) => `"${h}"`).join(','), ...rows].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `respuestas-${slugify(form.name)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('CSV exportado')
  }

  return (
    <Dialog open={!!form} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Respuestas — {form?.name}</DialogTitle>
          <DialogDescription>
            {responses.length} respuesta(s) registrada(s). Descarga CSV para análisis externo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {loading ? 'Cargando...' : `${responses.length} fila(s)`}
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

        <div className="flex-1 overflow-auto scroll-thin border rounded-lg">
          {loading ? (
            <div className="p-4 space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : responses.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Inbox className="mx-auto size-8 mb-2 opacity-50" />
              Aún no hay respuestas. Comparte el enlace público del formulario.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-background z-10">Fecha</TableHead>
                  {fields.map((f) => (
                    <TableHead key={f.name} className="sticky top-0 bg-background z-10">
                      {f.label}
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
                    {fields.map((f) => (
                      <TableCell key={f.name} className="text-sm align-top max-w-xs">
                        <span className="line-clamp-3">{asString(r.data[f.name]) || '—'}</span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FormulariosModule
