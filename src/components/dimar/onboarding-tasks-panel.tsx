'use client'

import { useCallback, useEffect, useState } from 'react'
import { Award, Camera, CheckCircle2, Clock, Gift, MessageSquare, QrCode, Share2, Store, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUpload } from '@/components/dimar/image-upload'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * Checklist único de las 6 tareas del bolso. Reemplaza las tres copias que había en
 * supplier-backoffice, affiliate-backoffice y grid. Usa /api/tasks/progress, que ahora
 * guarda cada etapa como una tarea PPA (CpaCompletion).
 */
const STEPS = [
  { key: 'scanDone', label: 'Escanear código QR', desc: 'Escanea el QR del bolso o del grid', icon: QrCode },
  { key: 'identifyDone', label: 'Identificar empresa', desc: 'Identifica qué empresa es el QR', icon: Store },
  { key: 'visitWebDone', label: 'Visitar sitio web', desc: 'Navega el sitio autogenerado', icon: ArrowRight },
  { key: 'shareDone', label: 'Compartir oferta', desc: 'Comparte en WhatsApp o redes', icon: Share2 },
  { key: 'commentDone', label: 'Dejar comentario', desc: 'Comenta en el sitio', icon: MessageSquare },
  { key: 'photoDone', label: 'Foto en tienda', desc: 'Visita la tienda y sube tu foto', icon: Camera },
] as const

interface Progress6 {
  [k: string]: unknown
  completed: boolean
  rewardClaimed: boolean
  photoPending?: boolean
  photoRejected?: boolean
  photoNotes?: string | null
}

export function OnboardingTasksPanel({
  title = 'Tareas del bolso',
  subtitle = 'Completa las 6 tareas para recibir bolso + álbum + sticker',
}: {
  title?: string
  subtitle?: string
}) {
  const toast = useAppStore((s) => s.toast)
  const [progress, setProgress] = useState<Progress6 | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks/progress')
      setProgress(res.ok ? await res.json() : null)
    } catch {
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const mark = async (key: string, extra?: Record<string, unknown>) => {
    setBusy(true)
    try {
      const res = await fetch('/api/tasks/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: true, ...extra }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'No se pudo guardar', 'error')
        return
      }
      setProgress(d)
      if (key === 'photoDone') {
        setPhotoUrl('')
        toast('Foto enviada: queda pendiente de revisión', 'success')
      }
    } finally {
      setBusy(false)
    }
  }

  const claim = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/tasks/complete', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error || 'Error', 'error')
        return
      }
      toast('¡Recompensa reclamada! Bolso + Álbum + Sticker', 'success')
      load()
    } finally {
      setBusy(false)
    }
  }

  if (loading || !progress) return <Skeleton className="h-64" />

  const done = (k: string) => progress[k] === true
  const count = STEPS.filter((s) => done(s.key)).length
  const percent = Math.round((count / STEPS.length) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="size-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Progreso: {count}/{STEPS.length}</span>
            <span className="font-bold text-primary">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>

        {STEPS.map((s) => {
          const Icon = s.icon
          const isDone = done(s.key)
          const isPhoto = s.key === 'photoDone'
          const pending = isPhoto && progress.photoPending === true
          return (
            <div key={s.key} className="space-y-2">
              <button
                disabled={busy || isDone || pending || isPhoto}
                onClick={() => !isPhoto && mark(s.key)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  isDone ? 'bg-emerald-50 border-emerald-300' : 'bg-card border-border hover:bg-muted/50',
                )}
              >
                <div className={cn('size-9 rounded-full flex items-center justify-center shrink-0', isDone ? 'bg-emerald-500' : 'bg-muted')}>
                  {isDone ? <CheckCircle2 className="size-5 text-white" /> : pending ? <Clock className="size-5 text-amber-600" /> : <Icon className="size-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>{s.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {pending ? 'Foto en revisión por el administrador' : s.desc}
                  </p>
                </div>
              </button>
              {isPhoto && !isDone && !pending && (
                <div className="rounded-lg border p-3 space-y-2">
                  {progress.photoRejected && (
                    <p className="text-xs text-destructive">
                      Tu foto fue rechazada{progress.photoNotes ? `: ${progress.photoNotes}` : ''}. Sube una nueva.
                    </p>
                  )}
                  <ImageUpload value={photoUrl} onChange={setPhotoUrl} label="Tu foto en la tienda" />
                  <Button size="sm" disabled={busy || !photoUrl} onClick={() => mark('photoDone', { photoUrl })}>
                    Enviar foto a revisión
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {progress.completed && !progress.rewardClaimed && (
          <Button className="w-full" size="lg" disabled={busy} onClick={claim}>
            <Gift className="size-5 mr-2" />Reclamar recompensa
          </Button>
        )}
        {progress.rewardClaimed && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
            <CheckCircle2 className="size-8 mx-auto text-emerald-600 mb-2" />
            <p className="font-medium text-emerald-800">¡Recompensa reclamada!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
