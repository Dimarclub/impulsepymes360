'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Play, Pause, Volume2, VolumeX, DollarSign, Share2, ShoppingCart,
  Camera, CheckCircle2, Loader2, AlertTriangle, Copy, ExternalLink,
  Wallet, TrendingUp, Award, Clock, X, RotateCcw, Eye, EyeOff,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const fmtUsd = (n: number) => `$${(n || 0).toFixed(2)}`

const PHOTO_TYPE_LABELS: Record<string, string> = {
  PHOTO_BOLSO: 'Foto con bolso PubliBags',
  PHOTO_STORE: 'Foto en la tienda',
  PHOTO_STICKER: 'Foto con sticker',
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
  VIDEO: 'Ver video',
  SHARE: 'Compartir contenido',
  VISIT: 'Visitar enlace',
  SUBSCRIBE: 'Suscribirse',
}

const MAX_STRIKES = 3

interface CompletionInfo {
  id: string
  status: string
  photoUrl?: string | null
  rewardAmount?: number
  completedAt: string
  reviewedAt?: string | null
  adminNotes?: string | null
}

interface CpaTaskData {
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
  completions?: CompletionInfo[]
}

interface MineData {
  ok: boolean
  available: CpaTaskData[]
  completed: CpaTaskData[]
  pending: CpaTaskData[]
  rejected: CpaTaskData[]
  stats: {
    available: number
    completed: number
    pending: number
    rejected: number
    totalEarned: number
  }
}

export function CpaTasksModule() {
  const currentUser = useAppStore((s) => s.currentUser)
  const [tasks, setTasks] = useState<CpaTaskData[]>([])
  const [mine, setMine] = useState<MineData | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'video' | 'photo'>('video')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, mineRes] = await Promise.all([
        fetch('/api/cpa-tasks'),
        currentUser ? fetch('/api/cpa-tasks/mine') : Promise.resolve(null),
        currentUser ? fetch('/api/cooperative') : Promise.resolve(null),
      ])
      const listData = await listRes.json()
      setTasks(listData.tasks || [])
      if (mineRes) {
        const md = await mineRes.json()
        setMine(md)
      }
      if (currentUser) {
        // Fetch cooperative balance
        try {
          const coopRes = await fetch('/api/cooperative')
          if (coopRes.ok) {
            const coop = await coopRes.json()
            setWalletBalance(coop.balance || 0)
          }
        } catch { /* ignore */ }
      }
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { fetchData() }, [fetchData])

  // Merge: combine the public task list with the user's completion info
  const videoTypes = new Set(['VIDEO', 'SHARE', 'VISIT', 'SUBSCRIBE'])
  const photoTypes = new Set(['PHOTO_BOLSO', 'PHOTO_STORE', 'PHOTO_STICKER'])

  const videoTasks = tasks.filter((t) => videoTypes.has(t.type))
  const photoTasks = tasks.filter((t) => photoTypes.has(t.type))

  const totalEarned = mine?.stats?.totalEarned || 0
  const completedCount = mine?.stats?.completed || 0
  const availableCount = (mine?.stats?.available ?? videoTasks.length + photoTasks.length)

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1280px] mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-amber-500 p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Hub de Tareas CPA</h1>
            <p className="text-white/90 text-sm md:text-base mt-1">
              Gana dinero real completando tareas simples · Cost-Per-Action
            </p>
          </div>
          {!currentUser && (
            <div className="rounded-lg bg-white/15 backdrop-blur px-4 py-2 text-sm">
              Inicia sesión para reclamar comisiones →
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Award className="size-4" /> Disponibles</div>
          <p className="text-2xl font-bold text-emerald-600">{availableCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="size-4" /> Completadas</div>
          <p className="text-2xl font-bold">{completedCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="size-4" /> Ganancia total</div>
          <p className="text-2xl font-bold text-amber-600">{fmtUsd(totalEarned)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Wallet className="size-4" /> Saldo billetera</div>
          <p className="text-2xl font-bold text-emerald-700">{fmtUsd(walletBalance)}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'video' | 'photo')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="video"><Play className="size-4 mr-1.5" /> Tareas de Video</TabsTrigger>
          <TabsTrigger value="photo"><Camera className="size-4 mr-1.5" /> Tareas de Foto</TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="mt-4 space-y-4">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          ) : videoTasks.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Play className="size-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="font-medium">No hay tareas de video disponibles</p>
              <p className="text-sm text-muted-foreground mt-1">Vuelve pronto, los proveedores publican nuevas tareas cada semana.</p>
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {videoTasks.map((task) => (
                <VideoTaskCard key={task.id} task={task} onComplete={fetchData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photo" className="mt-4 space-y-4">
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : photoTasks.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Camera className="size-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="font-medium">No hay tareas de foto disponibles</p>
              <p className="text-sm text-muted-foreground mt-1">Las tareas de foto con bolso PubliBags aparecerán aquí.</p>
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {photoTasks.map((task) => (
                <PhotoTaskCard key={task.id} task={task} onComplete={fetchData} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pending review notice */}
      {mine && mine.pending.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Tienes {mine.pending.length} foto(s) en revisión</p>
                <p className="text-amber-700 mt-0.5">El equipo administrativo revisará tu(s) foto(s) y acreditará la comisión al aprobarse.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============ VIDEO TASK CARD ============
function VideoTaskCard({ task, onComplete }: { task: CpaTaskData; onComplete: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const setModule = useAppStore((s) => s.setModule)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [strikes, setStrikes] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [shared, setShared] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)

  // Completions: si ya completó, mostramos estado "done"
  const myCompletion = task.completions?.[0]
  const isDone = myCompletion?.status === 'COMPLETED'

  // Reset state when task changes
  useEffect(() => {
    setPlaying(false); setProgress(0); setCurrent(0); setVideoEnded(false)
    setStrikes(0); setBlocked(false); setShared(false); setPurchased(false)
  }, [task.id])

  // Anti-fraud: detect tab blur while video is playing → pause + strike
  useEffect(() => {
    if (!playing) return
    const onBlur = () => {
      const v = videoRef.current
      if (v && !v.paused) {
        v.pause()
        setPlaying(false)
        setStrikes((s) => {
          const ns = s + 1
          if (ns >= MAX_STRIKES) {
            setBlocked(true)
            toast(`Has perdido el foco ${ns} veces. Tarea bloqueada por sospecha de fraude.`, 'error')
          } else {
            toast(`Pausamos el video porque cambiaste de pestaña. Intento ${ns}/${MAX_STRIKES}.`, 'warning')
          }
          return ns
        })
      }
    }
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onBlur)
    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onBlur)
    }
  }, [playing, toast])

  // Anti-fraud: detect seek forward → reset to current
  const handleSeeking = () => {
    const v = videoRef.current
    if (!v) return
    // If seeking more than 1s ahead of currentTime, reset
    if (v.currentTime > current + 1) {
      v.currentTime = current
      toast('No puedes adelantar el video', 'warning')
    }
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v || blocked) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v) return
    setCurrent(v.currentTime)
    if (v.duration > 0) {
      setProgress((v.currentTime / v.duration) * 100)
    }
  }

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (v) setDuration(v.duration)
  }

  const handleEnded = () => {
    setPlaying(false)
    setVideoEnded(true)
    setProgress(100)
    toast('¡Video completado! Ya puedes reclamar tu comisión.', 'success')
  }

  const handleRewind = () => {
    const v = videoRef.current
    if (!v) return
    const newT = Math.max(0, v.currentTime - 5)
    v.currentTime = newT
    setCurrent(newT)
  }

  const claim = async () => {
    if (!currentUser) { toast('Inicia sesión para reclamar la comisión', 'error'); return }
    if (!videoEnded) { toast('Debes ver el video completo primero', 'warning'); return }
    setClaiming(true)
    try {
      const res = await fetch(`/api/cpa-tasks/${task.id}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoWatched: true, shared, purchased, strikeCount: strikes }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error al reclamar', 'error'); return
      }
      toast(`¡Comisión de ${fmtUsd(task.commission)} acreditada a tu billetera!`, 'success')
      onComplete()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setClaiming(false)
    }
  }

  const openShare = () => setShowShareDialog(true)

  const buy = () => {
    setPurchased(true)
    if (task.offerUrl) {
      window.open(task.offerUrl, '_blank', 'noopener,noreferrer')
    } else {
      setModule('marketplace')
    }
    toast('Abriendo la oferta en el marketplace…', 'info')
  }

  // Format helpers
  const fmtTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const cupoText = task.maxParticipants
    ? `${task.currentParticipants}/${task.maxParticipants} cupos`
    : 'Cupo ilimitado'

  const endDate = new Date(task.endDate)
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (86400000))

  // ---- DONE state ----
  if (isDone) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <span className="line-through opacity-60">{task.title}</span>
          </CardTitle>
          <CardDescription>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✅ Completada</Badge>
            <span className="ml-2 text-emerald-700 font-medium">
              {fmtUsd(myCompletion?.rewardAmount || task.commission)} acreditados
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Completada el {new Date(myCompletion!.completedAt).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>
    )
  }

  // ---- BLOCKED state ----
  if (blocked) {
    return (
      <Card className="border-red-300 bg-red-50">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="size-12 mx-auto text-red-600 mb-3" />
          <p className="font-medium text-red-800">Tarea bloqueada</p>
          <p className="text-sm text-red-700 mt-1">
            Detectamos {MAX_STRIKES} intentos de salir de la pantalla mientras el video se reproducía.
            Recarga la página para intentarlo de nuevo.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            <RotateCcw className="size-4 mr-1.5" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Video player */}
      <div ref={containerRef} className="relative bg-black aspect-video">
        {task.videoUrl ? (
          <video
            ref={videoRef}
            src={task.videoUrl}
            className="size-full object-contain"
            playsInline
            preload="metadata"
            controlsList="nodownload noplaybackrate noremoteplayback"
            disablePictureInPicture
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onSeeking={handleSeeking}
            onEnded={handleEnded}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : (
          <div className="size-full flex items-center justify-center text-white/60 text-sm">Sin video</div>
        )}

        {/* Custom controls overlay */}
        {!videoEnded && (
          <div className={cn(
            'absolute inset-0 flex flex-col justify-end p-3 transition-opacity',
            playing ? 'opacity-0 hover:opacity-100' : 'opacity-100',
          )}>
            {!playing && !videoEnded && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center group"
                aria-label="Reproducir"
              >
                <span className="size-16 rounded-full bg-white/90 group-hover:bg-white shadow-lg flex items-center justify-center">
                  <Play className="size-7 text-emerald-700 ml-1" fill="currentColor" />
                </span>
              </button>
            )}
            <div className="bg-black/60 backdrop-blur rounded-lg p-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Progress bar */}
              <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-white">
                <button onClick={togglePlay} className="p-1 hover:bg-white/10 rounded" aria-label={playing ? 'Pausar' : 'Reproducir'}>
                  {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                </button>
                <button onClick={handleRewind} className="p-1 hover:bg-white/10 rounded" aria-label="Retroceder 5s">
                  <RotateCcw className="size-4" />
                </button>
                <button onClick={toggleMute} className="p-1 hover:bg-white/10 rounded" aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <span className="text-xs tabular-nums">{fmtTime(current)} / {fmtTime(duration)}</span>
                <div className="flex-1" />
                <button
                  onClick={() => setShowControls(!showControls)}
                  className="p-1 hover:bg-white/10 rounded"
                  aria-label={showControls ? 'Ocultar controles' : 'Mostrar controles'}
                >
                  {showControls ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finished overlay */}
        {videoEnded && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white text-center p-4">
            <CheckCircle2 className="size-12 text-emerald-400 mb-3" />
            <p className="text-lg font-bold">¡Video completado!</p>
            <p className="text-sm text-white/80 mt-1">Ya puedes reclamar tu comisión de {fmtUsd(task.commission)}</p>
          </div>
        )}

        {/* Strike indicator */}
        {strikes > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/90 text-white px-2 py-1 rounded text-xs">
            <AlertTriangle className="size-3" />
            {strikes}/{MAX_STRIKES} strikes
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{task.title}</h3>
            {task.offerTitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.offerTitle}</p>
            )}
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 shrink-0">
            <DollarSign className="size-3 mr-0.5" />{fmtUsd(task.commission)}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{VIDEO_TYPE_LABELS[task.type] || task.type}</Badge>
          <span className="flex items-center gap-1"><Users className="size-3" />{cupoText}</span>
          {daysLeft >= 0 && (
            <span className="flex items-center gap-1"><Clock className="size-3" />{daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d restantes`}</span>
          )}
        </div>

        {/* Action buttons */}
        {!videoEnded ? (
          <div className="rounded-lg bg-muted/50 border p-3 text-center">
            <p className="text-xs text-muted-foreground">
              {playing
                ? 'Mantén el video reproduciéndose. No cambies de pestaña.'
                : 'Dale play y mira el video completo para desbloquear la recompensa.'}
            </p>
            <div className="mt-2"><Progress value={progress} className="h-1.5" /></div>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={claim}
              disabled={claiming || !currentUser}
            >
              {claiming ? (
                <><Loader2 className="size-4 mr-1.5 animate-spin" /> Acreditando…</>
              ) : (
                <><DollarSign className="size-4 mr-1.5" /> Reclamar {fmtUsd(task.commission)}</>
              )}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={openShare}>
                <Share2 className="size-4 mr-1.5" /> Compartir
              </Button>
              <Button variant="outline" size="sm" onClick={buy}>
                <ShoppingCart className="size-4 mr-1.5" /> Comprar
              </Button>
            </div>
            {!currentUser && (
              <p className="text-xs text-center text-amber-600">Inicia sesión para reclamar la comisión</p>
            )}
          </div>
        )}
      </CardContent>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        task={task}
        onShared={() => setShared(true)}
      />
    </Card>
  )
}

// Lazy icon import (avoid adding to top imports just for this small use)
function Users({ className }: { className?: string }) {
  return <span className={cn('inline-block', className)} aria-hidden>👥</span>
}

// ============ PHOTO TASK CARD ============
function PhotoTaskCard({ task, onComplete }: { task: CpaTaskData; onComplete: () => void }) {
  const toast = useAppStore((s) => s.toast)
  const currentUser = useAppStore((s) => s.currentUser)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoData, setPhotoData] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [photoSize, setPhotoSize] = useState(0)

  const myCompletion = task.completions?.[0]
  const isPending = myCompletion?.status === 'PENDING_REVIEW'
  const isRejected = myCompletion?.status === 'REJECTED'
  const isApproved = myCompletion?.status === 'COMPLETED'

  // Reset state on task change
  useEffect(() => {
    setPhotoData(''); setPhotoSize(0)
  }, [task.id])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Selecciona un archivo de imagen', 'error'); return
    }
    if (file.size > 4 * 1024 * 1024) {
      toast('La imagen es muy grande (máx 4MB). Reduce su tamaño.', 'error'); return
    }
    setPhotoSize(file.size)
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoData(reader.result as string)
    }
    reader.onerror = () => toast('No se pudo leer el archivo', 'error')
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const submit = async () => {
    if (!currentUser) { toast('Inicia sesión para enviar la foto', 'error'); return }
    if (!photoData) { toast('Sube una foto primero', 'error'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/cpa-tasks/${task.id}/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: photoData, videoWatched: false }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error || 'Error al enviar', 'error'); return }
      toast(d.message || 'Foto enviada a revisión', 'success')
      setPhotoData(''); setPhotoSize(0)
      onComplete()
    } catch {
      toast('Error de red', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cupoText = task.maxParticipants
    ? `${task.currentParticipants}/${task.maxParticipants} cupos`
    : 'Cupo ilimitado'
  const endDate = new Date(task.endDate)
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (86400000))

  if (isApproved) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <span className="line-through opacity-60">{task.title}</span>
          </CardTitle>
          <CardDescription>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">✅ Aprobada</Badge>
            <span className="ml-2 text-emerald-700 font-medium">
              {fmtUsd(myCompletion?.rewardAmount || task.commission)} acreditados
            </span>
          </CardDescription>
        </CardHeader>
        {myCompletion?.photoUrl && (
          <CardContent>
            <img src={myCompletion.photoUrl} alt="Tu foto enviada" className="rounded-lg max-h-48 object-cover" />
          </CardContent>
        )}
      </Card>
    )
  }

  if (isPending) {
    return (
      <Card className="border-amber-300 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-5 text-amber-600" />
            {task.title}
          </CardTitle>
          <CardDescription>
            <Badge className="bg-amber-100 text-amber-700 border-amber-300">⏳ Pendiente de revisión</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myCompletion?.photoUrl && (
            <img src={myCompletion.photoUrl} alt="Tu foto enviada" className="rounded-lg max-h-48 object-cover mb-3" />
          )}
          <p className="text-sm text-amber-700">
            Tu foto fue enviada el {new Date(myCompletion!.completedAt).toLocaleDateString('es-EC')}.
            El equipo la revisará y acreditará {fmtUsd(task.commission)} al aprobarse.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={isRejected ? 'border-red-300' : ''}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="size-5 text-primary" />
          {task.title}
        </CardTitle>
        <CardDescription>
          {PHOTO_TYPE_LABELS[task.type] || 'Tarea de foto'}
          {' · '}
          <span className="text-emerald-700 font-medium">Recompensa {fmtUsd(task.commission)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}

        {task.imageUrl && (
          <img src={task.imageUrl} alt="Ejemplo" className="rounded-lg w-full max-h-40 object-cover" />
        )}

        {isRejected && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <p className="font-medium flex items-center gap-1.5"><X className="size-4" /> Tu foto fue rechazada</p>
            {myCompletion?.adminNotes && <p className="mt-1 text-xs">{myCompletion.adminNotes}</p>}
            <p className="mt-1 text-xs">Puedes subir una nueva foto.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="size-3" />{cupoText}</span>
          {daysLeft >= 0 && (
            <span className="flex items-center gap-1"><Clock className="size-3" />{daysLeft === 0 ? 'Vence hoy' : `${daysLeft}d restantes`}</span>
          )}
        </div>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {photoData ? (
            <div className="space-y-2">
              <img src={photoData} alt="Vista previa" className="rounded-lg max-h-48 mx-auto object-cover" />
              <p className="text-xs text-muted-foreground">
                {(photoSize / 1024).toFixed(0)} KB · Click para cambiar
              </p>
            </div>
          ) : (
            <div className="py-4">
              <Camera className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Sube tu foto</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click o arrastra una imagen (máx 4MB)</p>
            </div>
          )}
        </div>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={submit}
          disabled={!photoData || submitting || !currentUser}
        >
          {submitting ? (
            <><Loader2 className="size-4 mr-1.5 animate-spin" /> Enviando…</>
          ) : (
            <><Camera className="size-4 mr-1.5" /> Enviar foto y reclamar {fmtUsd(task.commission)}</>
          )}
        </Button>
        {!currentUser && (
          <p className="text-xs text-center text-amber-600">Inicia sesión para enviar la foto</p>
        )}
      </CardContent>
    </Card>
  )
}

// ============ SHARE DIALOG ============
function ShareDialog({
  open, onOpenChange, task, onShared,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  task: CpaTaskData
  onShared: () => void
}) {
  const currentUser = useAppStore((s) => s.currentUser)
  const toast = useAppStore((s) => s.toast)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const affCode = currentUser?.affiliateCode || ''
  const shareUrl = task.offerUrl
    ? `${task.offerUrl}${task.offerUrl.includes('?') ? '&' : '?'}ref=${affCode}`
    : `${origin}/?module=marketplace&ref=${affCode}&cpa=${task.id}`
  const text = `¡Mira esta oferta! ${task.offerTitle || task.title} — ${task.description || ''}`.trim()
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast('Enlace de afiliado copiado', 'success')
    onShared()
  }

  const openWa = () => {
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    onShared()
    toast('Abriendo WhatsApp…', 'info')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="size-5 text-primary" /> Compartir oferta</DialogTitle>
          <DialogDescription>
            Comparte con tu enlace de afiliado. Si alguien compra, ganas comisión extra.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Oferta</p>
            <p className="font-medium text-sm">{task.offerTitle || task.title}</p>
            {affCode && <p className="text-xs text-emerald-600">Tu código: <span className="font-mono">{affCode}</span></p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tu enlace de afiliado</Label>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button size="sm" onClick={copyLink}><Copy className="size-3.5" /></Button>
            </div>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openWa}>
            <ExternalLink className="size-4 mr-1.5" /> Compartir por WhatsApp
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Recibirás {fmtUsd(task.commission)} al reclamar la comisión, sin importar si compartes.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
