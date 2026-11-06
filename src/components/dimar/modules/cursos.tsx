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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  GraduationCap,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  Users,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Search,
  Loader2,
  PlusCircle,
  Video,
  FileText,
  Award,
  Sparkles,
  Library,
  Layers,
  UserCircle,
  Circle,
  CircleDot,
  Send,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ------------------------------- Tipos ------------------------------- */

interface CourseListItem {
  id: string
  title: string
  description?: string | null
  coverImage?: string | null
  category?: string | null
  isPublished: boolean
  createdAt: string
  instructor?: { id: string; name: string } | null
  _count: { lessons: number; enrollments: number }
  enrolled: boolean
  progress: number
  completedAt?: string | null
}

interface CourseOwned {
  id: string
  title: string
  description?: string | null
  coverImage?: string | null
  category?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  _count: { lessons: number; enrollments: number }
}

interface LessonDetail {
  id: string
  title: string
  content: string
  videoUrl?: string | null
  duration?: number | null
  order: number
  completed: boolean
}

interface CourseDetail {
  id: string
  title: string
  description?: string | null
  coverImage?: string | null
  category?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  userId: string
  instructor: { id: string; name: string; email: string }
  lessons: LessonDetail[]
  _count: { enrollments: number }
  enrolled: boolean
  progress: number
  completedAt?: string | null
  enrolledAt?: string | null
}

interface Student {
  id: string
  userId: string
  name: string
  email: string
  progress: number
  completedLessonsCount: number
  enrolledAt: string
  completedAt?: string | null
}

/* --------------------------- Utilidades --------------------------- */

const CATEGORIES = [
  'Marketing',
  'Ventas',
  'Negocios',
  'Finanzas',
  'Tecnología',
  'Productividad',
  'Liderazgo',
  'E-commerce',
  'Social Media',
  'Otros',
]

const fmtDate = (d: string | Date | null | undefined): string => {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(d))
  } catch {
    return '—'
  }
}

const fmtDateTime = (d: string | Date | null | undefined): string => {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(d))
  } catch {
    return '—'
  }
}

const formatDuration = (mins?: number | null): string => {
  if (!mins || mins <= 0) return '—'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

// Extrae ID y plataforma de URLs de YouTube/Vimeo para generar embed
interface EmbedInfo {
  platform: 'youtube' | 'vimeo' | 'other'
  embedUrl: string | null
}

function getEmbedInfo(url?: string | null): EmbedInfo {
  if (!url || !url.trim()) return { platform: 'other', embedUrl: null }
  const u = url.trim()
  // YouTube: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
  const yt1 = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/)
  if (yt1) {
    return {
      platform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${yt1[1]}`,
    }
  }
  // Vimeo: vimeo.com/ID, player.vimeo.com/video/ID
  const vm = u.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)([0-9]+)/)
  if (vm) {
    return {
      platform: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vm[1]}`,
    }
  }
  return { platform: 'other', embedUrl: null }
}

/* --------------------------- Cover Image --------------------------- */

function CoverImage({
  coverImage,
  title,
  className,
  big = false,
}: {
  coverImage?: string | null
  title: string
  className?: string
  big?: boolean
}) {
  if (coverImage && coverImage.trim()) {
    return (
      <div className={`relative overflow-hidden bg-muted ${className ?? ''}`}>
        <img
          src={coverImage}
          alt={title}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }
  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br from-emerald-500 via-emerald-400 to-amber-400 ${className ?? ''}`}
    >
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      <GraduationCap
        className={`relative text-white/90 drop-shadow ${big ? 'size-16' : 'size-10'}`}
      />
    </div>
  )
}

/* --------------------------- Tabs helpers --------------------------- */

type TabKey = 'catalogo' | 'mios' | 'creados'

/* ------------------------- Tarjeta Catálogo ------------------------- */

function CatalogCard({
  course,
  onOpen,
  onEnroll,
  enrolling,
}: {
  course: CourseListItem
  onOpen: () => void
  onEnroll: () => void
  enrolling: boolean
}) {
  return (
    <Card className="group flex flex-col overflow-hidden p-0 gap-0 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <button
        type="button"
        onClick={onOpen}
        className="block text-left"
        aria-label={`Ver curso ${course.title}`}
      >
        <CoverImage
          coverImage={course.coverImage}
          title={course.title}
          className="aspect-[16/9] w-full"
        />
      </button>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {course.category && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              {course.category}
            </Badge>
          )}
          {course.enrolled && (
            <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 size-3" />
              Inscrito
            </Badge>
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="text-left"
        >
          <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {course.title}
          </h3>
        </button>
        {course.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sin descripción</p>
        )}
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {course._count.lessons} lecciones
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {course._count.enrollments} estudiantes
          </span>
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          {course.enrolled ? (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onOpen}
            >
              <PlayCircle className="mr-1 size-4" />
              Continuar
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={onEnroll}
              disabled={enrolling}
            >
              {enrolling ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : (
                <Plus className="mr-1 size-4" />
              )}
              Inscribirme
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onOpen}
            aria-label="Ver detalle"
          >
            <Eye className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ------------------------- Tarjeta Mis Cursos ------------------------- */

function EnrolledCard({
  course,
  onOpen,
}: {
  course: CourseListItem
  onOpen: () => void
}) {
  return (
    <Card className="group flex gap-0 overflow-hidden p-0 sm:flex-row flex-col hover:shadow-lg transition-all">
      <button
        type="button"
        onClick={onOpen}
        className="block text-left sm:w-40 sm:flex-shrink-0"
        aria-label={`Continuar ${course.title}`}
      >
        <CoverImage
          coverImage={course.coverImage}
          title={course.title}
          className="aspect-[16/9] w-full sm:h-full sm:aspect-auto"
        />
      </button>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {course.category && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              {course.category}
            </Badge>
          )}
          {course.completedAt && (
            <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-700">
              <Award className="mr-1 size-3" />
              Completado
            </Badge>
          )}
        </div>
        <button type="button" onClick={onOpen} className="text-left">
          <h3 className="font-semibold leading-snug line-clamp-1 group-hover:text-emerald-700">
            {course.title}
          </h3>
        </button>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <BookOpen className="size-3.5" />
          {course._count.lessons} lecciones · {course._count.enrollments} estudiantes
        </p>
        <div className="mt-1">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-semibold text-emerald-700">{course.progress}%</span>
          </div>
          <Progress value={course.progress} className="h-2 bg-emerald-100 [&>div]:bg-emerald-600" />
        </div>
        <Button
          size="sm"
          className="mt-2 self-start bg-emerald-600 hover:bg-emerald-700"
          onClick={onOpen}
        >
          <PlayCircle className="mr-1 size-4" />
          Continuar aprendizaje
        </Button>
      </CardContent>
    </Card>
  )
}

/* ------------------------- Tarjeta Curso Creado ------------------------- */

function OwnedCard({
  course,
  onEdit,
  onStudents,
  onTogglePublish,
  onDelete,
  onView,
  busy,
}: {
  course: CourseOwned
  onEdit: () => void
  onStudents: () => void
  onTogglePublish: () => void
  onDelete: () => void
  onView: () => void
  busy: boolean
}) {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0 hover:shadow-lg transition-all">
      <div className="flex gap-0 sm:flex-row flex-col">
        <button
          type="button"
          onClick={onView}
          className="block text-left sm:w-36 sm:flex-shrink-0"
          aria-label={`Ver ${course.title}`}
        >
          <CoverImage
            coverImage={course.coverImage}
            title={course.title}
            className="aspect-[16/9] w-full sm:h-full sm:aspect-auto"
          />
        </button>
        <CardContent className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {course.isPublished ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                Publicado
              </Badge>
            ) : (
              <Badge variant="secondary">Borrador</Badge>
            )}
            {course.category && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                {course.category}
              </Badge>
            )}
          </div>
          <button type="button" onClick={onView} className="text-left">
            <h3 className="font-semibold leading-snug line-clamp-1 hover:text-emerald-700">
              {course.title}
            </h3>
          </button>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" />
              {course._count.lessons} lecciones
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {course._count.enrollments} estudiantes
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {fmtDate(course.updatedAt)}
            </span>
          </div>
        </CardContent>
      </div>
      <Separator />
      <div className="flex flex-wrap gap-2 p-3">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="mr-1 size-3.5" />
          Editar
        </Button>
        <Button size="sm" variant="outline" onClick={onStudents}>
          <Users className="mr-1 size-3.5" />
          Estudiantes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onTogglePublish}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : course.isPublished ? (
            <CircleDot className="mr-1 size-3.5" />
          ) : (
            <Circle className="mr-1 size-3.5" />
          )}
          {course.isPublished ? 'Despublicar' : 'Publicar'}
        </Button>
        <Button size="sm" variant="outline" onClick={onView}>
          <Eye className="mr-1 size-3.5" />
          Ver
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
          disabled={busy}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </Card>
  )
}

/* --------------------- Dialog: Vista Detalle Curso --------------------- */

function CourseDetailDialog({
  courseId,
  onClose,
  onEnrolled,
  onOpenLesson,
}: {
  courseId: string | null
  onClose: () => void
  onEnrolled: () => void
  onOpenLesson: (course: CourseDetail, lesson: LessonDetail) => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [togglingLesson, setTogglingLesson] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/cursos/${courseId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar el curso')
      const data = await res.json()
      setCourse(data.course)
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
      onClose()
    } finally {
      setLoading(false)
    }
  }, [courseId, toast, onClose])

  useEffect(() => {
    if (courseId) load()
  }, [courseId, load])

  const handleEnroll = async () => {
    if (!courseId) return
    setEnrolling(true)
    try {
      const res = await fetch(`/api/cursos/${courseId}/enroll`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo inscribir')
      }
      toast('¡Inscripción exitosa! Ya puedes empezar a aprender.')
      onEnrolled()
      load()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setEnrolling(false)
    }
  }

  const handleToggleLesson = async (lessonId: string, completed: boolean) => {
    if (!courseId) return
    setTogglingLesson(lessonId)
    try {
      const res = await fetch(`/api/cursos/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo actualizar progreso')
      }
      const data = await res.json()
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              progress: data.progress ?? prev.progress,
              completedAt: data.completedAt ?? null,
              lessons: prev.lessons.map((l) =>
                l.id === lessonId ? { ...l, completed } : l
              ),
            }
          : prev
      )
      toast(completed ? 'Lección marcada como completada' : 'Lección marcada como pendiente')
      onEnrolled()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setTogglingLesson(null)
    }
  }

  const isOpen = !!courseId

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0 gap-0 flex flex-col">
        {loading || !course ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <div className="relative">
              <CoverImage
                coverImage={course.coverImage}
                title={course.title}
                big
                className="aspect-[16/6] w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <DialogHeader className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {course.category && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-400/20 text-amber-100">
                      {course.category}
                    </Badge>
                  )}
                  {course.enrolled && (
                    <Badge variant="outline" className="border-emerald-300 bg-emerald-400/20 text-emerald-100">
                      <CheckCircle2 className="mr-1 size-3" />
                      Inscrito
                    </Badge>
                  )}
                  {course.completedAt && (
                    <Badge variant="outline" className="border-amber-300 bg-amber-400/20 text-amber-100">
                      <Award className="mr-1 size-3" />
                      Completado
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl font-bold text-white">{course.title}</DialogTitle>
                <DialogDescription className="text-white/85">
                  Por <span className="font-medium">{course.instructor.name}</span>
                  {' · '}
                  {course._count.enrollments} estudiantes
                  {' · '}
                  {course.lessons.length} lecciones
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="flex-1 max-h-[55vh]">
              <div className="space-y-4 p-5">
                {course.description && (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold text-muted-foreground">
                      Acerca del curso
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{course.description}</p>
                  </div>
                )}

                {course.enrolled && (
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">Tu progreso</span>
                      <span className="font-semibold text-emerald-700">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2 bg-emerald-100 [&>div]:bg-emerald-600" />
                  </div>
                )}

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Contenido del curso
                  </h4>
                  {course.lessons.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      <Library className="mx-auto mb-2 size-7 opacity-50" />
                      Este curso aún no tiene lecciones publicadas.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {course.lessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
                        >
                          <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{lesson.title}</p>
                            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                              {lesson.duration ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {formatDuration(lesson.duration)}
                                </span>
                              ) : null}
                              {lesson.videoUrl ? (
                                <span className="inline-flex items-center gap-1">
                                  <Video className="size-3" />
                                  Video
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1">
                                  <FileText className="size-3" />
                                  Lectura
                                </span>
                              )}
                              {lesson.completed && (
                                <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-700">
                                  <CheckCircle2 className="mr-1 size-3" />
                                  Completada
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {course.enrolled ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onOpenLesson(course, lesson)}
                                  aria-label="Abrir lección"
                                >
                                  <PlayCircle className="size-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleLesson(lesson.id, !lesson.completed)}
                                  disabled={togglingLesson === lesson.id}
                                  aria-label={lesson.completed ? 'Marcar pendiente' : 'Marcar completada'}
                                >
                                  {togglingLesson === lesson.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : lesson.completed ? (
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                  ) : (
                                    <Circle className="size-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Inscríbete</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t bg-muted/30 p-4">
              {!course.enrolled ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  ) : (
                    <Plus className="mr-1 size-4" />
                  )}
                  Inscribirme ahora
                </Button>
              ) : course.lessons.length > 0 ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    const firstPending = course.lessons.find((l) => !l.completed) ?? course.lessons[0]
                    onOpenLesson(course, firstPending)
                  }}
                >
                  <PlayCircle className="mr-1 size-4" />
                  {course.progress > 0 ? 'Continuar aprendizaje' : 'Empezar curso'}
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">Aún no hay lecciones</span>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* --------------------- Dialog: Vista Lección --------------------- */

function LessonViewDialog({
  course,
  lesson,
  onClose,
  onNavigate,
  onToggleComplete,
  toggling,
}: {
  course: CourseDetail | null
  lesson: LessonDetail | null
  onClose: () => void
  onNavigate: (lesson: LessonDetail) => void
  onToggleComplete: (lesson: LessonDetail) => void
  toggling: boolean
}) {
  const isOpen = !!course && !!lesson
  const embed = lesson ? getEmbedInfo(lesson.videoUrl) : null
  const idx = course && lesson ? course.lessons.findIndex((l) => l.id === lesson.id) : -1
  const prev = course && idx > 0 ? course.lessons[idx - 1] : null
  const next = course && idx >= 0 && idx < course.lessons.length - 1 ? course.lessons[idx + 1] : null

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0 gap-0 flex flex-col">
        {course && lesson ? (
          <>
            <DialogHeader className="border-b p-5 pb-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="size-3.5" />
                <span className="truncate">{course.title}</span>
                <span>·</span>
                <span>Lección {idx + 1} de {course.lessons.length}</span>
              </div>
              <DialogTitle className="text-xl">{lesson.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-3">
                {lesson.duration ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatDuration(lesson.duration)}
                  </span>
                ) : null}
                {lesson.completed && (
                  <Badge variant="outline" className="border-emerald-400 bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="mr-1 size-3" />
                    Completada
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Progreso global */}
            <div className="px-5 pt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progreso del curso</span>
                <span className="font-semibold text-emerald-700">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-600" />
            </div>

            <ScrollArea className="flex-1 max-h-[55vh]">
              <div className="space-y-4 p-5">
                {/* Video */}
                {embed?.embedUrl ? (
                  <div className="overflow-hidden rounded-lg border bg-black">
                    <div className="aspect-video w-full">
                      <iframe
                        src={embed.embedUrl}
                        title={lesson.title}
                        className="size-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : lesson.videoUrl ? (
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 hover:bg-amber-100"
                  >
                    <Video className="size-5 flex-shrink-0" />
                    <span className="truncate">Abrir video externo</span>
                    <Send className="ml-auto size-4 flex-shrink-0" />
                  </a>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                    <Video className="mb-2 size-10 opacity-40" />
                    <span className="text-sm">Esta lección no tiene video</span>
                  </div>
                )}

                {/* Contenido */}
                <div>
                  <h4 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <FileText className="size-4" />
                    Material de la lección
                  </h4>
                  {lesson.content && lesson.content.trim() ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-lg border bg-card p-4 text-sm leading-relaxed">
                      {lesson.content}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Esta lección no tiene contenido textual.
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="border-t bg-muted/30 p-3 flex-row items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => prev && onNavigate(prev)}
                disabled={!prev}
              >
                <ArrowLeft className="mr-1 size-4" />
                Anterior
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => onToggleComplete(lesson)}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="mr-1 size-4 animate-spin" />
                ) : lesson.completed ? (
                  <Circle className="mr-1 size-4" />
                ) : (
                  <CheckCircle2 className="mr-1 size-4" />
                )}
                {lesson.completed ? 'Marcar pendiente' : 'Marcar como completada'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => next && onNavigate(next)}
                disabled={!next}
              >
                Siguiente
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/* --------------------- Dialog: Crear/Editar Curso --------------------- */

interface CourseFormValues {
  title: string
  description: string
  category: string
  coverImage: string
  isPublished: boolean
}

function CourseFormBody({
  initial,
  onSubmit,
  onCancel,
  submitting,
  lessons,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: {
  initial: CourseFormValues | null
  onSubmit: (v: CourseFormValues) => void
  onCancel: () => void
  submitting: boolean
  lessons: LessonDetail[]
  onAddLesson: () => void
  onEditLesson: (l: LessonDetail) => void
  onDeleteLesson: (l: LessonDetail) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '')
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, description, category, coverImage, isPublished })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="course-title">Título *</Label>
        <Input
          id="course-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Marketing digital para principiantes"
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-desc">Descripción</Label>
        <Textarea
          id="course-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿Qué aprenderán los estudiantes en este curso?"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course-cat">Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="course-cat">
              <SelectValue placeholder="Sin categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="course-cover">URL de portada</Label>
          <Input
            id="course-cover"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Switch checked={isPublished} onCheckedChange={setIsPublished} id="course-pub" />
        <Label htmlFor="course-pub" className="cursor-pointer">
          <span className="font-medium">Publicado</span>
          <span className="block text-xs text-muted-foreground">
            Los cursos en borrador no aparecen en el catálogo público.
          </span>
        </Label>
      </div>

      {/* Lecciones (solo si edita curso existente) */}
      {initial ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              Lecciones del curso ({lessons.length})
            </Label>
            <Button type="button" size="sm" variant="outline" onClick={onAddLesson}>
              <PlusCircle className="mr-1 size-3.5" />
              Añadir lección
            </Button>
          </div>
          {lessons.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Aún no hay lecciones. Añade la primera.
            </div>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto scroll-thin rounded-lg border p-2">
              {lessons.map((l, idx) => (
                <div
                  key={l.id}
                  className="flex items-center gap-2 rounded-md p-2 hover:bg-accent/40"
                >
                  <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{l.title}</span>
                  {l.duration ? (
                    <span className="text-xs text-muted-foreground">{formatDuration(l.duration)}</span>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditLesson(l)}
                    aria-label="Editar lección"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => onDeleteLesson(l)}
                    aria-label="Eliminar lección"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1 size-4" />
          )}
          {initial ? 'Guardar cambios' : 'Crear curso'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/* --------------------- Dialog: Crear/Editar Lección --------------------- */

interface LessonFormValues {
  title: string
  content: string
  videoUrl: string
  duration: string
}

function LessonFormBody({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial: LessonFormValues | null
  onSubmit: (v: LessonFormValues) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '')
  const [duration, setDuration] = useState(initial?.duration ?? '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, content, videoUrl, duration })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lesson-title">Título de la lección *</Label>
        <Input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Introducción al marketing digital"
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lesson-content">Contenido</Label>
        <Textarea
          id="lesson-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe aquí el material de la lección..."
          rows={8}
        />
        <p className="text-xs text-muted-foreground">
          Se respetan los saltos de línea. Será mostrado tal cual al estudiante.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="lesson-video">URL del video (YouTube / Vimeo)</Label>
          <Input
            id="lesson-video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lesson-dur">Duración (min)</Label>
          <Input
            id="lesson-dur"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <PlusCircle className="mr-1 size-4" />
          )}
          {initial ? 'Guardar lección' : 'Añadir lección'}
        </Button>
      </DialogFooter>
    </form>
  )
}

/* --------------------- Dialog: Estudiantes --------------------- */

function StudentsDialog({
  course,
  onClose,
}: {
  course: CourseOwned | null
  onClose: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [students, setStudents] = useState<Student[]>([])
  const [loadedCourseId, setLoadedCourseId] = useState<string | null>(null)

  // Estado derivado: loading mientras el curso activo no coincide con el cargado
  const loading = !!course && loadedCourseId !== course.id

  useEffect(() => {
    if (!course) return
    let mounted = true
    fetch(`/api/cursos/${course.id}/students`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('No se pudo cargar estudiantes')
        const data = await r.json()
        if (mounted) {
          setStudents(data.students ?? [])
          setLoadedCourseId(course.id)
        }
      })
      .catch((err) => {
        if (mounted) toast((err as Error).message || 'Error', 'error')
      })
    return () => {
      mounted = false
    }
  }, [course, toast])

  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden p-0 gap-0 flex flex-col">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-emerald-600" />
            Estudiantes inscritos
          </DialogTitle>
          <DialogDescription>
            {course ? course.title : ''} · {students.length} estudiantes
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Aún no hay estudiantes inscritos en este curso.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Progreso</TableHead>
                  <TableHead className="text-center">Lecciones</TableHead>
                  <TableHead>Inscripción</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold text-emerald-700">{s.progress}%</span>
                        <Progress
                          value={s.progress}
                          className="h-1.5 w-20 bg-emerald-100 [&>div]:bg-emerald-600"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {s.completedLessonsCount}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmtDate(s.enrolledAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.completedAt ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle2 className="mr-1 size-3" />
                          Completó
                        </Badge>
                      ) : (
                        <Badge variant="secondary">En curso</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/* --------------------------- Módulo --------------------------- */

export function CursosModule() {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPPLIER'

  const [tab, setTab] = useState<TabKey>('catalogo')

  // Datos
  const [catalogo, setCatalogo] = useState<CourseListItem[]>([])
  const [mios, setMios] = useState<CourseListItem[]>([])
  const [creados, setCreados] = useState<CourseOwned[]>([])
  const [loadingCatalogo, setLoadingCatalogo] = useState(true)
  const [loadingMios, setLoadingMios] = useState(true)
  const [loadingCreados, setLoadingCreados] = useState(true)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('ALL')

  // Estados de dialogs / vistas
  const [detailId, setDetailId] = useState<string | null>(null)
  const [activeLessonCourse, setActiveLessonCourse] = useState<CourseDetail | null>(null)
  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null)
  const [lessonToggling, setLessonToggling] = useState(false)

  // Form curso
  const [courseFormOpen, setCourseFormOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<CourseOwned | null>(null)
  const [courseSubmitting, setCourseSubmitting] = useState(false)

  // Form lección
  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonDetail | null>(null)
  const [lessonSubmitting, setLessonSubmitting] = useState(false)

  // Estudiantes
  const [studentsTarget, setStudentsTarget] = useState<CourseOwned | null>(null)

  // Eliminar
  const [deleteCourseTarget, setDeleteCourseTarget] = useState<CourseOwned | null>(null)
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<LessonDetail | null>(null)
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null)

  // Lecciones locales (cuando se edita un curso existente, mantener sincronizadas)
  const [formLessons, setFormLessons] = useState<LessonDetail[]>([])

  /* ----------------------- Carga de datos ----------------------- */

  const loadCatalogo = useCallback(async () => {
    setLoadingCatalogo(true)
    try {
      const res = await fetch('/api/cursos', { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar el catálogo')
      const data = await res.json()
      setCatalogo(data.courses ?? [])
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLoadingCatalogo(false)
    }
  }, [toast])

  const loadMios = useCallback(async () => {
    setLoadingMios(true)
    try {
      const res = await fetch('/api/cursos', { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar tus cursos')
      const data = await res.json()
      const inscritos: CourseListItem[] = (data.courses ?? []).filter(
        (c: CourseListItem) => c.enrolled
      )
      setMios(inscritos)
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLoadingMios(false)
    }
  }, [toast])

  const loadCreados = useCallback(async () => {
    if (!canCreate) {
      setCreados([])
      return
    }
    setLoadingCreados(true)
    try {
      const res = await fetch('/api/cursos/mine', { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar tus cursos creados')
      const data = await res.json()
      setCreados(data.courses ?? [])
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLoadingCreados(false)
    }
  }, [canCreate, toast])

  useEffect(() => {
    loadCatalogo()
    loadMios()
    if (canCreate) loadCreados()
  }, [loadCatalogo, loadMios, loadCreados, canCreate])

  /* ----------------------- Filtrado catálogo ----------------------- */

  const filteredCatalogo = useMemo(() => {
    const q = search.trim().toLowerCase()
    return catalogo.filter((c) => {
      if (filterCat !== 'ALL') {
        const cat = c.category ?? 'Otros'
        if (cat !== filterCat) return false
      }
      if (!q) return true
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false) ||
        (c.category?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [catalogo, search, filterCat])

  const categoriesInUse = useMemo(() => {
    const set = new Set<string>()
    catalogo.forEach((c) => set.add(c.category ?? 'Otros'))
    return Array.from(set).sort()
  }, [catalogo])

  /* ----------------------- Acciones catálogo ----------------------- */

  const handleEnroll = async (course: CourseListItem) => {
    try {
      const res = await fetch(`/api/cursos/${course.id}/enroll`, { method: 'POST' })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo inscribir')
      }
      toast('¡Inscripción exitosa! Ya puedes empezar a aprender.')
      setDetailId(course.id)
      loadCatalogo()
      loadMios()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    }
  }

  /* ----------------------- Vista lección ----------------------- */

  const openLesson = (course: CourseDetail, lesson: LessonDetail) => {
    setActiveLessonCourse(course)
    setActiveLesson(lesson)
  }

  const closeLesson = () => {
    setActiveLessonCourse(null)
    setActiveLesson(null)
  }

  const toggleLessonComplete = async (lesson: LessonDetail) => {
    if (!activeLessonCourse) return
    setLessonToggling(true)
    const newCompleted = !lesson.completed
    try {
      const res = await fetch(`/api/cursos/${activeLessonCourse.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, completed: newCompleted }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo actualizar progreso')
      }
      const data = await res.json()
      // Actualizar lección activa
      setActiveLesson({ ...lesson, completed: newCompleted })
      // Actualizar curso activo (progress, completedAt, lección en lista)
      setActiveLessonCourse((prev) =>
        prev
          ? {
              ...prev,
              progress: data.progress ?? prev.progress,
              completedAt: data.completedAt ?? null,
              lessons: prev.lessons.map((l) =>
                l.id === lesson.id ? { ...l, completed: newCompleted } : l
              ),
            }
          : prev
      )
      toast(newCompleted ? 'Lección marcada como completada' : 'Lección marcada como pendiente')
      loadCatalogo()
      loadMios()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLessonToggling(false)
    }
  }

  /* ----------------------- Acciones cursos creados ----------------------- */

  const handleCreateCourse = () => {
    setEditingCourse(null)
    setFormLessons([])
    setCourseFormOpen(true)
  }

  const handleEditCourse = async (course: CourseOwned) => {
    setBusyCourseId(course.id)
    try {
      const res = await fetch(`/api/cursos/${course.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('No se pudo cargar el curso')
      const data = await res.json()
      const detail: CourseDetail = data.course
      setEditingCourse(course)
      setFormLessons(detail.lessons)
      setCourseFormOpen(true)
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setBusyCourseId(null)
    }
  }

  const submitCourseForm = async (v: CourseFormValues) => {
    setCourseSubmitting(true)
    try {
      const url = editingCourse
        ? `/api/cursos/${editingCourse.id}`
        : '/api/cursos'
      const method = editingCourse ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: v.title,
          description: v.description,
          category: v.category,
          coverImage: v.coverImage,
          isPublished: v.isPublished,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo guardar el curso')
      }
      toast(editingCourse ? 'Curso actualizado' : 'Curso creado en borrador')
      setCourseFormOpen(false)
      setEditingCourse(null)
      setFormLessons([])
      loadCreados()
      loadCatalogo()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setCourseSubmitting(false)
    }
  }

  const handleTogglePublish = async (course: CourseOwned) => {
    setBusyCourseId(course.id)
    try {
      const res = await fetch(`/api/cursos/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !course.isPublished }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo actualizar el curso')
      }
      toast(course.isPublished ? 'Curso despublicado' : 'Curso publicado en el catálogo')
      loadCreados()
      loadCatalogo()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setBusyCourseId(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (!deleteCourseTarget) return
    setBusyCourseId(deleteCourseTarget.id)
    try {
      const res = await fetch(`/api/cursos/${deleteCourseTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo eliminar')
      }
      toast('Curso eliminado')
      setDeleteCourseTarget(null)
      loadCreados()
      loadCatalogo()
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setBusyCourseId(null)
    }
  }

  /* ----------------------- Acciones lecciones ----------------------- */

  const handleAddLesson = () => {
    setEditingLesson(null)
    setLessonFormOpen(true)
  }

  const handleEditLesson = (lesson: LessonDetail) => {
    setEditingLesson(lesson)
    setLessonFormOpen(true)
  }

  const handleDeleteLesson = async () => {
    if (!deleteLessonTarget || !editingCourse) return
    setLessonSubmitting(true)
    try {
      const res = await fetch(
        `/api/cursos/${editingCourse.id}/lessons/${deleteLessonTarget.id}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo eliminar la lección')
      }
      toast('Lección eliminada')
      setFormLessons((prev) => prev.filter((l) => l.id !== deleteLessonTarget.id))
      setDeleteLessonTarget(null)
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLessonSubmitting(false)
    }
  }

  const submitLessonForm = async (v: LessonFormValues) => {
    if (!editingCourse) return
    setLessonSubmitting(true)
    try {
      const url = editingLesson
        ? `/api/cursos/${editingCourse.id}/lessons/${editingLesson.id}`
        : `/api/cursos/${editingCourse.id}/lessons`
      const method = editingLesson ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: v.title,
          content: v.content,
          videoUrl: v.videoUrl,
          duration: v.duration ? Number(v.duration) : null,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        throw new Error(e?.error || 'No se pudo guardar la lección')
      }
      const data = await res.json()
      const newLesson: LessonDetail = {
        id: data.lesson.id,
        title: data.lesson.title,
        content: data.lesson.content,
        videoUrl: data.lesson.videoUrl,
        duration: data.lesson.duration,
        order: data.lesson.order,
        completed: false,
      }
      setFormLessons((prev) => {
        if (editingLesson) {
          return prev.map((l) => (l.id === newLesson.id ? { ...newLesson, completed: l.completed } : l))
        }
        return [...prev, newLesson].sort((a, b) => a.order - b.order)
      })
      toast(editingLesson ? 'Lección actualizada' : 'Lección añadida')
      setLessonFormOpen(false)
      setEditingLesson(null)
    } catch (err) {
      toast((err as Error).message || 'Error', 'error')
    } finally {
      setLessonSubmitting(false)
    }
  }

  /* ----------------------- Render ----------------------- */

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-emerald-500 to-amber-500 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium ring-1 ring-white/25 mb-3">
            <GraduationCap className="size-3.5" />
            Cursos y Membresías
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Aprende, crece y multiplica
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">
            Catálogo de cursos para potenciar tu negocio. Inscríbete, avanza a tu ritmo
            y Certifica tu progreso.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 ring-1 ring-white/20 inline-flex items-center gap-1.5">
              <Library className="size-3.5" />
              {catalogo.length} cursos disponibles
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 ring-1 ring-white/20 inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {mios.length} inscritos
            </div>
            {canCreate && (
              <div className="rounded-lg bg-white/10 backdrop-blur px-3 py-1.5 ring-1 ring-white/20 inline-flex items-center gap-1.5">
                <Layers className="size-3.5" />
                {creados.length} creados
              </div>
            )}
          </div>
        </div>
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 max-w-md">
          <TabsTrigger value="catalogo" className="gap-1.5">
            <Library className="size-3.5" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="mios" className="gap-1.5">
            <BookOpen className="size-3.5" />
            Mis Cursos
          </TabsTrigger>
          {canCreate && (
            <TabsTrigger value="creados" className="gap-1.5">
              <Layers className="size-3.5" />
              Mis Cursos Creados
            </TabsTrigger>
          )}
        </TabsList>

        {/* -------------------- Tab: Catálogo -------------------- */}
        <TabsContent value="catalogo" className="mt-6 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por título, descripción o categoría..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="sm:w-52">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las categorías</SelectItem>
                  {categoriesInUse.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={loadCatalogo} aria-label="Actualizar">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </Card>

          {loadingCatalogo ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden p-0">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <CardContent className="space-y-2 p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCatalogo.length === 0 ? (
            <Card className="p-10 text-center">
              <Library className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <h3 className="font-semibold">No se encontraron cursos</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {catalogo.length === 0
                  ? 'Aún no hay cursos publicados en el catálogo.'
                  : 'Prueba ajustando tu búsqueda o filtro.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCatalogo.map((c) => (
                <CatalogCard
                  key={c.id}
                  course={c}
                  onOpen={() => setDetailId(c.id)}
                  onEnroll={() => handleEnroll(c)}
                  enrolling={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* -------------------- Tab: Mis Cursos -------------------- */}
        <TabsContent value="mios" className="mt-6 space-y-4">
          {loadingMios ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden p-0">
                  <div className="flex flex-col sm:flex-row">
                    <Skeleton className="aspect-[16/9] w-full sm:w-40 sm:aspect-auto" />
                    <CardContent className="flex-1 space-y-2 p-4">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-8 w-1/3" />
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : mios.length === 0 ? (
            <Card className="p-10 text-center">
              <BookOpen className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <h3 className="font-semibold">Aún no estás inscrito en ningún curso</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Explora el catálogo e inscríbete para empezar a aprender.
              </p>
              <Button
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setTab('catalogo')}
              >
                <Library className="mr-1 size-4" />
                Ir al catálogo
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {mios.map((c) => (
                <EnrolledCard
                  key={c.id}
                  course={c}
                  onOpen={() => setDetailId(c.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* -------------------- Tab: Cursos Creados -------------------- */}
        {canCreate && (
          <TabsContent value="creados" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Tus cursos creados</h2>
                <p className="text-sm text-muted-foreground">
                  Gestiona el contenido, las lecciones y los estudiantes.
                </p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateCourse}>
                <Plus className="mr-1 size-4" />
                Crear nuevo curso
              </Button>
            </div>

            {loadingCreados ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden p-0">
                    <div className="flex flex-col sm:flex-row">
                      <Skeleton className="aspect-[16/9] w-full sm:w-36 sm:aspect-auto" />
                      <CardContent className="flex-1 space-y-2 p-4">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            ) : creados.length === 0 ? (
              <Card className="p-10 text-center">
                <Layers className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                <h3 className="font-semibold">No has creado ningún curso</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crea tu primer curso y comparte tu conocimiento con la comunidad.
                </p>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCreateCourse}
                >
                  <Plus className="mr-1 size-4" />
                  Crear nuevo curso
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {creados.map((c) => (
                  <OwnedCard
                    key={c.id}
                    course={c}
                    onEdit={() => handleEditCourse(c)}
                    onStudents={() => setStudentsTarget(c)}
                    onTogglePublish={() => handleTogglePublish(c)}
                    onDelete={() => setDeleteCourseTarget(c)}
                    onView={() => setDetailId(c.id)}
                    busy={busyCourseId === c.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* -------------------- Dialog: Detalle de Curso -------------------- */}
      <CourseDetailDialog
        courseId={detailId}
        onClose={() => setDetailId(null)}
        onEnrolled={() => {
          loadCatalogo()
          loadMios()
        }}
        onOpenLesson={(course, lesson) => {
          setActiveLessonCourse(course)
          setActiveLesson(lesson)
        }}
      />

      {/* -------------------- Dialog: Vista Lección -------------------- */}
      <LessonViewDialog
        course={activeLessonCourse}
        lesson={activeLesson}
        onClose={closeLesson}
        onNavigate={(l) => setActiveLesson(l)}
        onToggleComplete={toggleLessonComplete}
        toggling={lessonToggling}
      />

      {/* -------------------- Dialog: Crear/Editar Curso -------------------- */}
      <Dialog open={courseFormOpen} onOpenChange={(o) => !o && setCourseFormOpen(false)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-emerald-600" />
              {editingCourse ? 'Editar curso' : 'Crear nuevo curso'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Actualiza la información o gestiona las lecciones.'
                : 'Crea un curso en borrador. Podrás añadirle lecciones después.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[68vh]">
            <div className="pr-1">
              {courseFormOpen && (
                <CourseFormBody
                  initial={
                    editingCourse
                      ? {
                          title: editingCourse.title,
                          description: editingCourse.description ?? '',
                          category: editingCourse.category ?? '',
                          coverImage: editingCourse.coverImage ?? '',
                          isPublished: editingCourse.isPublished,
                        }
                      : null
                  }
                  onSubmit={submitCourseForm}
                  onCancel={() => setCourseFormOpen(false)}
                  submitting={courseSubmitting}
                  lessons={formLessons}
                  onAddLesson={handleAddLesson}
                  onEditLesson={handleEditLesson}
                  onDeleteLesson={(l) => setDeleteLessonTarget(l)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* -------------------- Dialog: Crear/Editar Lección -------------------- */}
      <Dialog open={lessonFormOpen} onOpenChange={(o) => !o && setLessonFormOpen(false)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5 text-emerald-600" />
              {editingLesson ? 'Editar lección' : 'Añadir lección'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse ? `Para el curso "${editingCourse.title}"` : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[68vh]">
            <div className="pr-1">
              {lessonFormOpen && (
                <LessonFormBody
                  initial={
                    editingLesson
                      ? {
                          title: editingLesson.title,
                          content: editingLesson.content,
                          videoUrl: editingLesson.videoUrl ?? '',
                          duration: editingLesson.duration ? String(editingLesson.duration) : '',
                        }
                      : null
                  }
                  onSubmit={submitLessonForm}
                  onCancel={() => setLessonFormOpen(false)}
                  submitting={lessonSubmitting}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* -------------------- Dialog: Estudiantes -------------------- */}
      <StudentsDialog course={studentsTarget} onClose={() => setStudentsTarget(null)} />

      {/* -------------------- AlertDialog: Eliminar Curso -------------------- */}
      <AlertDialog
        open={!!deleteCourseTarget}
        onOpenChange={(o) => !o && setDeleteCourseTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este curso?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCourseTarget && (
                <>
                  Se eliminará <strong>{deleteCourseTarget.title}</strong> junto con
                  todas sus lecciones e inscripciones. Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyCourseId === deleteCourseTarget?.id}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={busyCourseId === deleteCourseTarget?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {busyCourseId === deleteCourseTarget?.id ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------- AlertDialog: Eliminar Lección -------------------- */}
      <AlertDialog
        open={!!deleteLessonTarget}
        onOpenChange={(o) => !o && setDeleteLessonTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta lección?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteLessonTarget && (
                <>
                  Se eliminará <strong>{deleteLessonTarget.title}</strong>.
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={lessonSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={lessonSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {lessonSubmitting ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
