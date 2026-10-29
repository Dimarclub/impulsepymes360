'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Loader2, Tag, Trash2, Pause, Play, CheckCircle2, XCircle,
  DollarSign, Eye, Users, Clock, Image as ImageIcon, AlertTriangle,
  Camera, Video, PencilLine, Send,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

const TYPE_LABELS: Record<string, string> = {
  VIDEO: '🎬 Video',
  SHARE: '📤 Compartir',
  VISIT: '🔗 Visitar enlace',
  SUBSCRIBE: '🔔 Suscribirse',
  PHOTO_BOLSO: '📸 Foto con bolso',
  PHOTO_STORE: '📸 Foto en tienda',
  PHOTO_STICKER: '📸 Foto con sticker',
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  VIDEO: 'El usuario debe ver el video completo sin saltárselo.',
  SHARE: 'El usuario comparte el contenido en sus redes.',
  VISIT: 'El usuario visita el enlace de la oferta.',
  SUBSCRIBE: 'El usuario se suscribe al canal o newsletter.',
  PHOTO_BOLSO: 'El usuario sube una foto con el bolso PubliBags.',
  PHOTO_STORE: 'El usuario sube una foto en la tienda del proveedor.',
  PHOTO_STICKER: 'El usuario sube una foto con el sticker PubliBags.',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  COMPLETED: 'Completada',
  EXPIRED: 'Expirada',
}

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  PAUSED: 'bg-amber-100 text-amber-700 border-amber-300',
  COMPLETED: 'bg-sky-100 text-sky-700 border-sky-300',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
}

interface AdminTask {
  id: string
  title: string
  description?: string | null
  type: string
  videoUrl?: string | null
  imageUrl?: string | null
  offerTitle?: string | null
  offerUrl?: string | null
  productId?: string | null
  commission: number
  maxParticipants?: number | null
  currentParticipants: number
  startDate: string
  endDate: string
  status: string
  createdAt: string
  createdBy: string
  creator?: { name: string; email: string; role: string } | null
  stats: {
    total: number
    completed: number
    pendingReview: number
    rejected: number
    totalPaid: number
  }
  pendingCompletions: Array<{
    id: string
    photoUrl?: string | null
    completedAt: string
    user: { id: string; name: string; email: string }
  }>
}

function toDateInputValue(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

export function CpaAdminModule() {
  const [tab, setTab] = useState<'tasks' | 'photos'>('tasks')

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Administrar Tareas CPA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crea y gestiona tareas Cost-Per-Action · Revisa fotos enviadas por usuarios
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'tasks' | 'photos')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tasks"><Tag className="size-4 mr-1.5" /> Tareas</TabsTrigger>
          <TabsTrigger value="photos">
            <Camera className="size-4 mr-1.5" /> Fotos pendientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4"><TasksManager /></TabsContent>
        <TabsContent value="photos" className="mt-4"><PhotosReviewer /></TabsContent>
      </Tabs>
    </div>
  )
}

// ============ TASKS MANAGER ============
function TasksManager() {
  const toast = useAppStore((s) => s.toast)
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminTask | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cpa-tasks/admin')
      const d = await res.json()
      if (res.ok) setTasks(d.tasks || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const togglePause = async (task: AdminTask) => {
    setTogglingId(task.id)
    const next = task.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED'
    try {
      const res = await fetch(`/api/cpa-tasks/${task.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) { toast('Error al cambiar estado', 'error'); return }
      toast(next === 'PAUSED' ? 'Tarea pausada' : 'Tarea reactivada', 'success')
      fetchTasks()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const removeTask = async (task: AdminTask) => {
    setDeletingId(task.id)
    try {
      const res = await fetch(`/api/cpa-tasks/${task.id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Error al eliminar', 'error'); return }
      toast('Tarea eliminada', 'success')
      fetchTasks()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === 'ACTIVE').length,
    pendingPhotos: tasks.reduce((s, t) => s + t.stats.pendingReview, 0),
    totalPaid: tasks.reduce((s, t) => s + t.stats.totalPaid, 0),
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total tareas</div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Activas</div>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Fotos por revisar</div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingPhotos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total pagado</div>
          <p className="text-2xl font-bold text-emerald-700">{fmtUsd(stats.totalPaid)}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Todas las tareas</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" /> Nueva tarea
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : tasks.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Tag className="size-12 mx-auto text-muted-foreground opacity-30 mb-3" />
          <p className="font-medium">No hay tareas CPA creadas</p>
          <p className="text-sm text-muted-foreground mt-1">Crea la primera tarea para que los usuarios empiecen a ganar comisiones.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto scroll-thin pr-1">
          {tasks.map((task) => {
            const isPhoto = task.type.startsWith('PHOTO_')
            return (
              <Card key={task.id} className={cn(task.status === 'PAUSED' && 'opacity-70')}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    {/* Thumb */}
                    <div className="size-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {task.imageUrl ? (
                        <img src={task.imageUrl} alt="" className="size-full object-cover" />
                      ) : isPhoto ? (
                        <Camera className="size-6 text-muted-foreground" />
                      ) : task.videoUrl ? (
                        <Video className="size-6 text-muted-foreground" />
                      ) : (
                        <Tag className="size-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{task.title}</h3>
                          {task.offerTitle && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.offerTitle}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={cn('shrink-0', STATUS_BADGES[task.status] || '')}>
                          {STATUS_LABELS[task.status] || task.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{TYPE_LABELS[task.type] || task.type}</Badge>
                        <span className="flex items-center gap-1"><DollarSign className="size-3" />{fmtUsd(task.commission)}</span>
                        <span className="flex items-center gap-1"><Users className="size-3" />
                          {task.maxParticipants ? `${task.currentParticipants}/${task.maxParticipants}` : `${task.currentParticipants} (∞)`}
                        </span>
                        <span className="flex items-center gap-1"><Clock className="size-3" />vence {new Date(task.endDate).toLocaleDateString('es-EC')}</span>
                        {task.stats.pendingReview > 0 && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                            {task.stats.pendingReview} fotos por revisar
                          </Badge>
                        )}
                      </div>

                      {task.creator && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Creada por {task.creator.name} ({task.creator.role})
                        </p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                        <div className="rounded bg-muted/40 py-1.5">
                          <p className="text-sm font-bold">{task.stats.total}</p>
                          <p className="text-[10px] text-muted-foreground">Envíos</p>
                        </div>
                        <div className="rounded bg-emerald-50 py-1.5">
                          <p className="text-sm font-bold text-emerald-700">{task.stats.completed}</p>
                          <p className="text-[10px] text-muted-foreground">Aprobadas</p>
                        </div>
                        <div className="rounded bg-amber-50 py-1.5">
                          <p className="text-sm font-bold text-amber-700">{task.stats.pendingReview}</p>
                          <p className="text-[10px] text-muted-foreground">Pendientes</p>
                        </div>
                        <div className="rounded bg-muted/40 py-1.5">
                          <p className="text-sm font-bold">{fmtUsd(task.stats.totalPaid)}</p>
                          <p className="text-[10px] text-muted-foreground">Pagado</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {task.status === 'ACTIVE' || task.status === 'PAUSED' ? (
                          <Button
                            size="sm" variant="outline"
                            onClick={() => togglePause(task)}
                            disabled={togglingId === task.id}
                          >
                            {togglingId === task.id ? (
                              <Loader2 className="size-3.5 mr-1 animate-spin" />
                            ) : task.status === 'PAUSED' ? (
                              <><Play className="size-3.5 mr-1" /> Activar</>
                            ) : (
                              <><Pause className="size-3.5 mr-1" /> Pausar</>
                            )}
                          </Button>
                        ) : null}
                        <Button
                          size="sm" variant="outline"
                          onClick={() => setEditing(task)}
                        >
                          <PencilLine className="size-3.5 mr-1" /> Editar
                        </Button>
                        {task.stats.total === 0 && (
                          <Button
                            size="sm" variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeTask(task)}
                            disabled={deletingId === task.id}
                          >
                            {deletingId === task.id ? (
                              <Loader2 className="size-3.5 mr-1 animate-spin" />
                            ) : (
                              <><Trash2 className="size-3.5 mr-1" /> Eliminar</>
                            )}
                          </Button>
                        )}
                        {task.stats.pendingReview > 0 && (
                          <Button
                            size="sm" variant="outline"
                            className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                              const event = new CustomEvent('dimar-cpa-go-photos')
                              window.dispatchEvent(event)
                            }}
                          >
                            <Eye className="size-3.5 mr-1" /> Revisar {task.stats.pendingReview} fotos
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateEditDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        task={null}
        onSaved={() => { setCreateOpen(false); fetchTasks() }}
      />
      <CreateEditDialog
        open={!!editing}
        onOpenChange={(v) => { if (!v) setEditing(null) }}
        task={editing}
        onSaved={() => { setEditing(null); fetchTasks() }}
      />
    </div>
  )
}

// ============ CREATE / EDIT DIALOG ============
function CreateEditDialog({
  open, onOpenChange, task, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  task: AdminTask | null
  onSaved: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const isEdit = !!task
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'VIDEO',
    videoUrl: '',
    imageUrl: '',
    offerTitle: '',
    offerUrl: '',
    commission: '0.25',
    maxParticipants: '',
    endDate: toDateInputValue(new Date(Date.now() + 7 * 86400000)),
  })
  const [submitting, setSubmitting] = useState(false)

  // Reset form whenever dialog opens (creates a fresh form body via key prop)
  useEffect(() => {
    if (!open) return
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        type: task.type,
        videoUrl: task.videoUrl || '',
        imageUrl: task.imageUrl || '',
        offerTitle: task.offerTitle || '',
        offerUrl: task.offerUrl || '',
        commission: String(task.commission),
        maxParticipants: task.maxParticipants ? String(task.maxParticipants) : '',
        endDate: toDateInputValue(task.endDate),
      })
    } else {
      setForm({
        title: '', description: '', type: 'VIDEO', videoUrl: '', imageUrl: '',
        offerTitle: '', offerUrl: '', commission: '0.25', maxParticipants: '',
        endDate: toDateInputValue(new Date(Date.now() + 7 * 86400000)),
      })
    }
  }, [open, task])

  const isPhoto = form.type.startsWith('PHOTO_')

  const submit = async () => {
    if (!form.title.trim()) { toast('El título es obligatorio', 'error'); return }
    if (!form.endDate) { toast('La fecha de fin es obligatoria', 'error'); return }
    if (!isPhoto && !form.videoUrl.trim()) { toast('La URL del video es obligatoria para tareas de video', 'error'); return }
    const commission = Number(form.commission)
    if (isNaN(commission) || commission < 0) { toast('Comisión inválida', 'error'); return }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        type: form.type,
        videoUrl: form.videoUrl.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        offerTitle: form.offerTitle.trim() || undefined,
        offerUrl: form.offerUrl.trim() || undefined,
        commission,
        endDate: new Date(form.endDate).toISOString(),
      }
      if (form.maxParticipants) payload.maxParticipants = Number(form.maxParticipants)

      const url = isEdit ? `/api/cpa-tasks/${task!.id}` : '/api/cpa-tasks'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error al guardar', 'error'); return }
      toast(isEdit ? 'Tarea actualizada' : 'Tarea creada', 'success')
      onSaved()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tarea CPA' : 'Nueva tarea CPA'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modifica los campos y guarda los cambios.' : 'Crea una tarea para que los usuarios ganen comisiones.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label>Título *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Zapatos 2x1 - TecnoExpress" />
          </div>

          <div>
            <Label>Tipo de tarea *</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">🎬 Video (ver completo)</SelectItem>
                <SelectItem value="SHARE">📤 Compartir contenido</SelectItem>
                <SelectItem value="VISIT">🔗 Visitar enlace</SelectItem>
                <SelectItem value="SUBSCRIBE">🔔 Suscribirse</SelectItem>
                <SelectItem value="PHOTO_BOLSO">📸 Foto con bolso PubliBags</SelectItem>
                <SelectItem value="PHOTO_STORE">📸 Foto en la tienda</SelectItem>
                <SelectItem value="PHOTO_STICKER">📸 Foto con sticker</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{TYPE_DESCRIPTIONS[form.type]}</p>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Instrucciones para el usuario…" rows={2} />
          </div>

          {!isPhoto && (
            <div>
              <Label className="flex items-center gap-1.5">
                <Video className="size-3.5" /> URL del video *
              </Label>
              <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://...mp4" />
              <p className="text-xs text-muted-foreground mt-1">
                URL directa a un archivo .mp4 (no YouTube). Se reproduce dentro de la app, sin permitir adelantar.
              </p>
            </div>
          )}

          <div>
            <Label className="flex items-center gap-1.5">
              <ImageIcon className="size-3.5" /> URL de imagen promocional
            </Label>
            <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://… (opcional)" />
            </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Título de la oferta</Label>
              <Input value={form.offerTitle} onChange={(e) => setForm({ ...form, offerTitle: e.target.value })}
                placeholder="Ej: 2x1 en zapatos" />
            </div>
            <div>
              <Label>URL de la oferta (comprar)</Label>
              <Input value={form.offerUrl} onChange={(e) => setForm({ ...form, offerUrl: e.target.value })}
                placeholder="https://… o /w/proveedor" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Comisión (USD) *</Label>
              <Input type="number" step="0.01" min="0" value={form.commission}
                onChange={(e) => setForm({ ...form, commission: e.target.value })} />
            </div>
            <div>
              <Label>Participantes máx.</Label>
              <Input type="number" min="1" value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                placeholder="Vacío = ilimitado" />
            </div>
            <div>
              <Label>Fecha fin *</Label>
              <Input type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {submitting ? (
              <><Loader2 className="size-4 mr-1.5 animate-spin" /> Guardando…</>
            ) : (
              <><Send className="size-4 mr-1.5" /> {isEdit ? 'Guardar cambios' : 'Crear tarea'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ PHOTOS REVIEWER ============
function PhotosReviewer() {
  const toast = useAppStore((s) => s.toast)
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<Record<string, 'approve' | 'reject' | null>>({})
  const [rejectDialog, setRejectDialog] = useState<{ taskId: string; completionId: string; userName: string } | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cpa-tasks/admin')
      const d = await res.json()
      if (res.ok) setTasks(d.tasks || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Listen to "go to photos" event from tasks manager
  useEffect(() => {
    const handler = () => fetchTasks()
    window.addEventListener('dimar-cpa-go-photos', handler)
    return () => window.removeEventListener('dimar-cpa-go-photos', handler)
  }, [fetchTasks])

  const pendingTasks = tasks.filter((t) => t.stats.pendingReview > 0)
  const totalPending = pendingTasks.reduce((s, t) => s + t.stats.pendingReview, 0)

  const approve = async (taskId: string, completionId: string, userName: string) => {
    setReviewing((r) => ({ ...r, [completionId]: 'approve' }))
    try {
      const res = await fetch(`/api/cpa-tasks/admin/${taskId}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action: 'approve' }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error al aprobar', 'error'); return }
      toast(`Foto de ${userName} aprobada. Comisión acreditada.`, 'success')
      fetchTasks()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setReviewing((r) => ({ ...r, [completionId]: null }))
    }
  }

  const openReject = (taskId: string, completionId: string, userName: string) => {
    setRejectNotes('')
    setRejectDialog({ taskId, completionId, userName })
  }

  const confirmReject = async () => {
    if (!rejectDialog) return
    const { taskId, completionId, userName } = rejectDialog
    setReviewing((r) => ({ ...r, [completionId]: 'reject' }))
    try {
      const res = await fetch(`/api/cpa-tasks/admin/${taskId}/review`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionId, action: 'reject', adminNotes: rejectNotes.trim() || undefined }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error al rechazar', 'error'); return }
      toast(`Foto de ${userName} rechazada.`, 'info')
      setRejectDialog(null)
      fetchTasks()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setReviewing((r) => ({ ...r, [completionId]: null }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (totalPending === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <CheckCircle2 className="size-12 mx-auto text-emerald-500 mb-3" />
        <p className="font-medium">No hay fotos pendientes de revisión</p>
        <p className="text-sm text-muted-foreground mt-1">Cuando los usuarios suban fotos para tareas de foto, aparecerán aquí.</p>
      </CardContent></Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-3">
        <AlertTriangle className="size-5 text-amber-600 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-800">{totalPending} foto(s) pendiente(s) de revisión en {pendingTasks.length} tarea(s)</p>
          <p className="text-amber-700 text-xs mt-0.5">Aprueba para acreditar la comisión al usuario. Rechaza si no cumple los requisitos.</p>
        </div>
      </div>

      {pendingTasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="size-5 text-primary" />
              {task.title}
            </CardTitle>
            <CardDescription>
              {TYPE_LABELS[task.type]} · Comisión {fmtUsd(task.commission)} · {task.stats.pendingReview} foto(s) por revisar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {task.pendingCompletions.map((c) => (
                <div key={c.id} className="rounded-lg border overflow-hidden">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={`Foto de ${c.user.name}`} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <Camera className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-2.5 space-y-2">
                    <div>
                      <p className="text-sm font-medium truncate">{c.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.user.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Enviada: {new Date(c.completedAt).toLocaleDateString('es-EC')}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        onClick={() => approve(task.id, c.id, c.user.name)}
                        disabled={reviewing[c.id] !== undefined && reviewing[c.id] !== null}
                      >
                        {reviewing[c.id] === 'approve' ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <><CheckCircle2 className="size-3.5 mr-1" /> Aprobar</>
                        )}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                        onClick={() => openReject(task.id, c.id, c.user.name)}
                        disabled={reviewing[c.id] !== undefined && reviewing[c.id] !== null}
                      >
                        <XCircle className="size-3.5 mr-1" /> Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!rejectDialog} onOpenChange={(v) => { if (!v) setRejectDialog(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-600" /> Rechazar foto
            </DialogTitle>
            <DialogDescription>
              Vas a rechazar la foto de {rejectDialog?.userName}. La comisión NO se acreditará.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Notas para el usuario (opcional)</Label>
            <Textarea
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Ej: La foto no muestra el bolso PubliBags. Toma otra foto donde se vea claramente."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmReject}>Confirmar rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
