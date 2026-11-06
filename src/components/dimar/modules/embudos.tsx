'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Filter,
  GitCommitVertical,
  Plus,
  RefreshCw,
  DollarSign,
  Inbox,
  Layers,
  TrendingUp,
  Trophy,
  Trash2,
  ChevronDown,
  CalendarDays,
  User,
  StickyNote,
  Pencil,
  GripVertical,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

/* ============================================================ */
/* Tipos                                                        */
/* ============================================================ */

interface StageMeta {
  id: string
  name: string
  order: number
  color: string | null
  total: number
  count: number
}

interface FunnelMeta {
  id: string
  name: string
  description: string | null
  userId: string
  createdAt: string
  updatedAt: string
  stages: StageMeta[]
  stats: { totalValue: number; totalDeals: number }
}

interface DealContact {
  id: string
  name: string
  company: string | null
  email: string
  phone: string | null
}

interface DealStage {
  id: string
  name: string
  order: number
  color: string | null
}

interface Deal {
  id: string
  funnelId: string
  stageId: string
  stage: DealStage
  contactId: string | null
  contact: DealContact | null
  title: string
  value: number
  currency: string
  probability: number
  expectedCloseDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface ContactLite {
  id: string
  name: string
  company: string | null
  email: string
}

/* ============================================================ */
/* Helpers                                                      */
/* ============================================================ */

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0)

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

const STAGE_COLOR_MAP: Record<string, { dot: string; border: string; bg: string; text: string; ring: string }> = {
  emerald: {
    dot: 'bg-emerald-500',
    border: 'border-t-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200/60',
  },
  amber: {
    dot: 'bg-amber-500',
    border: 'border-t-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-200/60',
  },
  purple: {
    dot: 'bg-purple-500',
    border: 'border-t-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    ring: 'ring-purple-200/60',
  },
  cyan: {
    dot: 'bg-cyan-500',
    border: 'border-t-cyan-500',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    ring: 'ring-cyan-200/60',
  },
  rose: {
    dot: 'bg-rose-500',
    border: 'border-t-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'ring-rose-200/60',
  },
}

const stageColor = (c: string | null) => STAGE_COLOR_MAP[c || ''] || STAGE_COLOR_MAP.emerald

/* ============================================================ */
/* Componente principal                                         */
/* ============================================================ */

export function EmbudosModule() {
  const toast = useAppStore((s) => s.toast)

  const [funnels, setFunnels] = useState<FunnelMeta[]>([])
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null)
  const [funnelDetail, setFunnelDetail] = useState<{
    id: string
    name: string
    description: string | null
    userId: string
    stages: (StageMeta & { deals: Deal[] })[]
  } | null>(null)

  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [createFunnelOpen, setCreateFunnelOpen] = useState(false)
  const [dealDialogState, setDealDialogState] = useState<{
    open: boolean
    mode: 'create' | 'edit'
    deal: Deal | null
    presetStageId: string | null
  }>({ open: false, mode: 'create', deal: null, presetStageId: null })

  // drag state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const dragCounter = useRef(0)

  /* ----- Carga inicial de lista ----- */
  const loadFunnels = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/embudos', { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar embudos')
      const data = await res.json()
      const list: FunnelMeta[] = data.funnels || []
      setFunnels(list)
      // Auto-seleccionar el primero si no hay seleccionado o el seleccionado ya no existe
      setSelectedFunnelId((prev) => {
        if (prev && list.some((f) => f.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch (err) {
      toast((err as Error).message || 'Error al cargar embudos', 'error')
    } finally {
      setLoadingList(false)
    }
  }, [toast])

  /* ----- Carga del detalle del embudo seleccionado ----- */
  const loadDetail = useCallback(async () => {
    if (!selectedFunnelId) {
      setFunnelDetail(null)
      return
    }
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/embudos/${selectedFunnelId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar el embudo')
      const data = await res.json()
      const funnel = data.funnel
      // Estructurar stages con deals
      const stagesWithDeals: (StageMeta & { deals: Deal[] })[] = (funnel.stages || []).map(
        (s: StageMeta & { deals?: Deal[] }) => ({
          id: s.id,
          name: s.name,
          order: s.order,
          color: s.color,
          total: (s as StageMeta).total ?? 0,
          count: (s as StageMeta).count ?? 0,
          deals: s.deals || [],
        })
      )
      setFunnelDetail({
        id: funnel.id,
        name: funnel.name,
        description: funnel.description,
        userId: funnel.userId,
        stages: stagesWithDeals,
      })
    } catch (err) {
      toast((err as Error).message || 'Error al cargar el embudo', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }, [selectedFunnelId, toast])

  useEffect(() => {
    loadFunnels()
  }, [loadFunnels])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  /* ----- Stats globales ----- */
  const stats = useMemo(() => {
    const totalFunnels = funnels.length
    let totalDeals = 0
    let pipelineValue = 0
    let closedValue = 0
    for (const f of funnels) {
      totalDeals += f.stats.totalDeals
      pipelineValue += f.stats.totalValue
      // "Cerrados" = valor de la última stage (Ventas Cerradas)
      const lastStage = f.stages[f.stages.length - 1]
      if (lastStage) closedValue += lastStage.total
    }
    return { totalFunnels, totalDeals, pipelineValue, closedValue }
  }, [funnels])

  /* ----- Handlers ----- */
  const handleCreateFunnel = async (form: {
    name: string
    description: string
  }) => {
    try {
      const res = await fetch('/api/embudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'No se pudo crear el embudo')
      }
      const data = await res.json()
      toast('Embudo creado correctamente')
      setCreateFunnelOpen(false)
      await loadFunnels()
      setSelectedFunnelId(data.funnel.id)
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleDeleteFunnel = async () => {
    if (!selectedFunnelId) return
    if (!confirm('¿Eliminar este embudo y todos sus deals? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/embudos/${selectedFunnelId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar el embudo')
      toast('Embudo eliminado')
      setSelectedFunnelId(null)
      setFunnelDetail(null)
      await loadFunnels()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleCreateDeal = async (form: DealFormValues) => {
    if (!selectedFunnelId) return
    try {
      const res = await fetch(`/api/embudos/${selectedFunnelId}/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'No se pudo crear el deal')
      }
      toast('Deal creado')
      setDealDialogState({ open: false, mode: 'create', deal: null, presetStageId: null })
      await loadDetail()
      await loadFunnels()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleUpdateDeal = async (dealId: string, form: DealFormValues) => {
    if (!selectedFunnelId) return
    try {
      const res = await fetch(`/api/embudos/${selectedFunnelId}/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'No se pudo actualizar el deal')
      }
      toast('Deal actualizado')
      setDealDialogState({ open: false, mode: 'create', deal: null, presetStageId: null })
      await loadDetail()
      await loadFunnels()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!selectedFunnelId) return
    if (!confirm('¿Eliminar este deal?')) return
    try {
      const res = await fetch(`/api/embudos/${selectedFunnelId}/deals/${dealId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('No se pudo eliminar el deal')
      toast('Deal eliminado')
      setDealDialogState({ open: false, mode: 'create', deal: null, presetStageId: null })
      await loadDetail()
      await loadFunnels()
    } catch (err) {
      toast((err as Error).message, 'error')
    }
  }

  const handleMoveDeal = async (dealId: string, newStageId: string) => {
    if (!selectedFunnelId) return
    // Optimistic: mover el deal localmente
    setFunnelDetail((prev) => {
      if (!prev) return prev
      let movedDeal: Deal | null = null
      const nextStages = prev.stages.map((s) => {
        const idx = s.deals.findIndex((d) => d.id === dealId)
        if (idx >= 0) {
          movedDeal = s.deals[idx]
          return { ...s, deals: s.deals.filter((d) => d.id !== dealId) }
        }
        return s
      })
      if (!movedDeal) return prev
      const finalStages = nextStages.map((s) =>
        s.id === newStageId
          ? { ...s, deals: [{ ...(movedDeal as Deal), stageId: newStageId }, ...s.deals] }
          : s
      )
      return { ...prev, stages: finalStages }
    })

    try {
      const res = await fetch(`/api/embudos/${selectedFunnelId}/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId: newStageId }),
      })
      if (!res.ok) throw new Error('No se pudo mover el deal')
      toast('Deal movido de etapa')
      // Recargar para sincronizar totales
      await loadDetail()
      await loadFunnels()
    } catch (err) {
      toast((err as Error).message, 'error')
      await loadDetail()
    }
  }

  /* ----- Drag handlers ----- */
  const onDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
  }
  const onDragEnd = () => {
    setDraggedDealId(null)
    setDragOverStageId(null)
    dragCounter.current = 0
  }
  const onDragEnterStage = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    dragCounter.current++
    setDragOverStageId(stageId)
  }
  const onDragLeaveStage = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragOverStageId(null)
    }
  }
  const onDragOverStage = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onDropStage = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const dealId = draggedDealId || e.dataTransfer.getData('text/plain')
    setDragOverStageId(null)
    dragCounter.current = 0
    setDraggedDealId(null)
    if (dealId) handleMoveDeal(dealId, stageId)
  }

  /* ----- Render ----- */
  return (
    <div className="space-y-6">
      <ModuleHeader
        loading={loadingList || loadingDetail}
        onReload={() => {
          loadFunnels()
          loadDetail()
        }}
        onNewFunnel={() => setCreateFunnelOpen(true)}
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Layers}
          label="Embudos activos"
          value={String(stats.totalFunnels)}
          tone="emerald"
        />
        <StatCard
          icon={Inbox}
          label="Total deals"
          value={String(stats.totalDeals)}
          tone="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Valor pipeline"
          value={usd(stats.pipelineValue)}
          tone="emerald"
        />
        <StatCard
          icon={Trophy}
          label="Ventas cerradas"
          value={usd(stats.closedValue)}
          tone="amber"
        />
      </div>

      {/* Empty state */}
      {!loadingList && funnels.length === 0 ? (
        <EmptyState onCreate={() => setCreateFunnelOpen(true)} />
      ) : (
        <>
          {/* Selector de embudo */}
          <FunnelSelector
            funnels={funnels}
            selectedId={selectedFunnelId}
            onSelect={setSelectedFunnelId}
            onDelete={handleDeleteFunnel}
            loading={loadingList}
          />

          {/* Kanban */}
          <Card className="p-0 overflow-hidden">
            <CardHeader className="px-4 py-3 border-b">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitCommitVertical className="size-4 text-primary" />
                    <span className="truncate">
                      {funnelDetail?.name || 'Selecciona un embudo'}
                    </span>
                  </CardTitle>
                  {funnelDetail?.description && (
                    <CardDescription className="text-xs truncate">
                      {funnelDetail.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {funnelDetail?.stages.length || 0} etapas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="flex gap-4 overflow-x-auto scroll-thin p-4 min-h-[28rem]"
                onDragEnter={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
              >
                {loadingDetail || !funnelDetail ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="min-w-[280px] flex-shrink-0">
                      <KanbanColumnSkeleton />
                    </div>
                  ))
                ) : (
                  funnelDetail.stages.map((stage) => (
                    <KanbanColumn
                      key={stage.id}
                      stage={stage}
                      deals={stage.deals}
                      allStages={funnelDetail.stages.map((s) => ({
                        id: s.id,
                        name: s.name,
                        color: s.color,
                        order: s.order,
                      }))}
                      onAddDeal={() =>
                        setDealDialogState({
                          open: true,
                          mode: 'create',
                          deal: null,
                          presetStageId: stage.id,
                        })
                      }
                      onEditDeal={(d) =>
                        setDealDialogState({
                          open: true,
                          mode: 'edit',
                          deal: d,
                          presetStageId: null,
                        })
                      }
                      onMoveDeal={handleMoveDeal}
                      isDragOver={dragOverStageId === stage.id}
                      draggedDealId={draggedDealId}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      onDragEnterStage={onDragEnterStage}
                      onDragLeaveStage={onDragLeaveStage}
                      onDragOverStage={onDragOverStage}
                      onDropStage={onDropStage}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog: crear embudo */}
      <CreateFunnelDialog
        open={createFunnelOpen}
        onOpenChange={setCreateFunnelOpen}
        onSubmit={handleCreateFunnel}
      />

      {/* Dialog: crear / editar deal */}
      <DealFormDialog
        open={dealDialogState.open}
        mode={dealDialogState.mode}
        deal={dealDialogState.deal}
        presetStageId={dealDialogState.presetStageId}
        stages={funnelDetail?.stages.map((s) => ({ id: s.id, name: s.name, color: s.color, order: s.order })) || []}
        onOpenChange={(open) =>
          !open &&
          setDealDialogState({ open: false, mode: 'create', deal: null, presetStageId: null })
        }
        onCreate={handleCreateDeal}
        onUpdate={handleUpdateDeal}
        onDelete={handleDeleteDeal}
      />
    </div>
  )
}

/* ============================================================ */
/* Header                                                       */
/* ============================================================ */

function ModuleHeader({
  loading,
  onReload,
  onNewFunnel,
}: {
  loading: boolean
  onReload: () => void
  onNewFunnel: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-gradient">
          Embudos de Venta
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestiona tu pipeline de ventas con un tablero Kanban drag &amp; drop.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} />
          Actualizar
        </Button>
        <Button size="sm" onClick={onNewFunnel}>
          <Plus />
          Nuevo embudo
        </Button>
      </div>
    </div>
  )
}

/* ============================================================ */
/* Stat card                                                    */
/* ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Layers
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

/* ============================================================ */
/* Empty state                                                  */
/* ============================================================ */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="p-0">
      <CardContent className="py-16 flex flex-col items-center justify-center text-center">
        <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Filter className="size-8" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No tienes embudos todavía</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Crea tu primer embudo de ventas para visualizar tus oportunidades en un tablero Kanban
          y arrastra tus deals entre etapas.
        </p>
        <Button onClick={onCreate}>
          <Plus />
          Crea tu primer embudo
        </Button>
      </CardContent>
    </Card>
  )
}

/* ============================================================ */
/* Funnel selector                                              */
/* ============================================================ */

function FunnelSelector({
  funnels,
  selectedId,
  onSelect,
  onDelete,
  loading,
}: {
  funnels: FunnelMeta[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: () => void
  loading: boolean
}) {
  const selected = funnels.find((f) => f.id === selectedId)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers className="size-4" />
        <span>Embudo:</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading || funnels.length === 0}>
            <span className="truncate max-w-[200px]">
              {selected?.name || 'Selecciona un embudo'}
            </span>
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Mis embudos</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {funnels.map((f) => (
            <DropdownMenuItem
              key={f.id}
              onClick={() => onSelect(f.id)}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{f.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {f.stats.totalDeals} deals
              </span>
            </DropdownMenuItem>
          ))}
          {funnels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-rose-600 focus:text-rose-700"
              >
                <Trash2 className="size-3.5" />
                Eliminar embudo actual
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected && (
        <Badge variant="outline" className="text-xs">
          {selected.stats.totalDeals} deals · {usd(selected.stats.totalValue)}
        </Badge>
      )}
    </div>
  )
}

/* ============================================================ */
/* Kanban column                                                */
/* ============================================================ */

interface KanbanColumnProps {
  stage: StageMeta
  deals: Deal[]
  allStages: { id: string; name: string; color: string | null; order: number }[]
  onAddDeal: () => void
  onEditDeal: (d: Deal) => void
  onMoveDeal: (dealId: string, stageId: string) => void
  isDragOver: boolean
  draggedDealId: string | null
  onDragStart: (e: React.DragEvent, dealId: string) => void
  onDragEnd: () => void
  onDragEnterStage: (e: React.DragEvent, stageId: string) => void
  onDragLeaveStage: (e: React.DragEvent) => void
  onDragOverStage: (e: React.DragEvent) => void
  onDropStage: (e: React.DragEvent, stageId: string) => void
}

function KanbanColumn({
  stage,
  deals,
  allStages,
  onAddDeal,
  onEditDeal,
  onMoveDeal,
  isDragOver,
  draggedDealId,
  onDragStart,
  onDragEnd,
  onDragEnterStage,
  onDragLeaveStage,
  onDragOverStage,
  onDropStage,
}: KanbanColumnProps) {
  const c = stageColor(stage.color)
  return (
    <div
      className={`min-w-[280px] w-[280px] flex-shrink-0 flex flex-col`}
      onDragEnter={(e) => onDragEnterStage(e, stage.id)}
      onDragLeave={onDragLeaveStage}
      onDragOver={onDragOverStage}
      onDrop={(e) => onDropStage(e, stage.id)}
    >
      <div
        className={`rounded-lg border border-t-4 bg-muted/40 p-3 flex flex-col gap-2 h-full transition-colors ${c.border} ${
          isDragOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`size-2.5 rounded-full ${c.dot} shrink-0`} />
            <span className="text-sm font-semibold truncate">{stage.name}</span>
          </div>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${c.bg} ${c.text} shrink-0`}>
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="size-3" />
          <span className="font-medium text-foreground">{usd(stage.total)}</span>
          <span>· valor total</span>
        </div>

        <Separator className="my-0.5" />

        {/* Lista scrollable */}
        <div className="flex flex-col gap-2 flex-1 max-h-[34rem] overflow-y-auto scroll-thin pr-1 -mr-1">
          {deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-6 text-xs text-muted-foreground border border-dashed rounded-md">
              <Inbox className="size-4 mb-1 opacity-60" />
              Sin deals
            </div>
          ) : (
            deals.map((d) => (
              <DealCard
                key={d.id}
                deal={d}
                allStages={allStages}
                onClick={() => onEditDeal(d)}
                onMove={(stageId) => onMoveDeal(d.id, stageId)}
                isDragging={draggedDealId === d.id}
                onDragStart={(e) => onDragStart(e, d.id)}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </div>

        {/* Botón añadir */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddDeal}
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Añadir deal
        </Button>
      </div>
    </div>
  )
}

function KanbanColumnSkeleton() {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-6" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Separator className="my-0.5" />
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-7 w-full" />
    </div>
  )
}

/* ============================================================ */
/* Deal card                                                    */
/* ============================================================ */

function DealCard({
  deal,
  allStages,
  onClick,
  onMove,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  deal: Deal
  allStages: { id: string; name: string; color: string | null; order: number }[]
  onClick: () => void
  onMove: (stageId: string) => void
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group bg-card rounded-lg border p-3 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all ${
        isDragging ? 'opacity-40 ring-2 ring-primary/40' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm truncate flex-1 group-hover:text-primary transition-colors">
          {deal.title}
        </p>
        <GripVertical className="size-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="text-sm font-semibold text-emerald-700">
          {usd(deal.value)}
        </span>
        {deal.probability > 0 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {deal.probability}%
          </Badge>
        )}
      </div>

      {/* Probabilidad barra */}
      {deal.probability > 0 && (
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.max(2, Math.min(100, deal.probability))}%` }}
          />
        </div>
      )}

      {/* Metadata */}
      <div className="mt-2 flex flex-col gap-1 text-[10px] text-muted-foreground">
        {deal.contact && (
          <span className="flex items-center gap-1 truncate">
            <User className="size-3 shrink-0" />
            <span className="truncate">{deal.contact.name}</span>
          </span>
        )}
        {deal.expectedCloseDate && (
          <span className="flex items-center gap-1 text-amber-700">
            <CalendarDays className="size-3 shrink-0" />
            Cierre: {shortDate(deal.expectedCloseDate)}
          </span>
        )}
      </div>

      {/* Fallback mobile: select de stage */}
      <div
        className="mt-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Select
          value={deal.stageId}
          onValueChange={(v) => v !== deal.stageId && onMove(v)}
        >
          <SelectTrigger className="h-7 text-[10px] px-2 py-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allStages.map((s) => {
              const sc = stageColor(s.color)
              return (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${sc.dot}`} />
                    {s.name}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/* ============================================================ */
/* Create funnel dialog                                         */
/* ============================================================ */

function CreateFunnelDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (form: { name: string; description: string }) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nuevo embudo de venta</DialogTitle>
          <DialogDescription>
            Se crearán 4 etapas por defecto: Nuevos Leads → Contactados → Propuesta Enviada → Ventas Cerradas.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CreateFunnelFormBody
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreateFunnelFormBody({
  onSubmit,
  onCancel,
}: {
  onSubmit: (form: { name: string; description: string }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ name: '', description: '' })
  const valid = form.name.trim().length > 0

  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="f-name">Nombre *</Label>
          <Input
            id="f-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej: Embudo principal · Marketplace"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-desc">Descripción</Label>
          <Textarea
            id="f-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="¿Para qué sirve este embudo?"
            rows={3}
          />
        </div>
        {/* Preview de stages por defecto */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Etapas que se crearán:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { n: 'Nuevos Leads', c: 'emerald' },
              { n: 'Contactados', c: 'amber' },
              { n: 'Propuesta Enviada', c: 'purple' },
              { n: 'Ventas Cerradas', c: 'cyan' },
            ].map((s) => (
              <span
                key={s.n}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${stageColor(s.c).bg} ${stageColor(s.c).text}`}
              >
                <span className={`size-1.5 rounded-full ${stageColor(s.c).dot}`} />
                {s.n}
              </span>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!valid} onClick={() => onSubmit(form)}>
          <Plus />
          Crear embudo
        </Button>
      </DialogFooter>
    </>
  )
}

/* ============================================================ */
/* Deal form dialog (create + edit)                             */
/* ============================================================ */

interface DealFormValues {
  stageId: string
  title: string
  value?: number
  contactId?: string | null
  probability?: number
  expectedCloseDate?: string | null
  notes?: string | null
}

function DealFormDialog({
  open,
  mode,
  deal,
  presetStageId,
  stages,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean
  mode: 'create' | 'edit'
  deal: Deal | null
  presetStageId: string | null
  stages: { id: string; name: string; color: string | null; order: number }[]
  onOpenChange: (v: boolean) => void
  onCreate: (form: DealFormValues) => void
  onUpdate: (dealId: string, form: DealFormValues) => void
  onDelete: (dealId: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <Pencil className="size-4 text-primary" />
                Editar deal
              </>
            ) : (
              <>
                <Plus className="size-4 text-primary" />
                Nuevo deal
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Actualiza los campos del deal o muévelo de etapa.'
              : 'Agrega una nueva oportunidad a tu embudo.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <DealFormBody
            mode={mode}
            deal={deal}
            presetStageId={presetStageId}
            stages={stages}
            onCancel={() => onOpenChange(false)}
            onCreate={onCreate}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DealFormBody({
  mode,
  deal,
  presetStageId,
  stages,
  onCancel,
  onCreate,
  onUpdate,
  onDelete,
}: {
  mode: 'create' | 'edit'
  deal: Deal | null
  presetStageId: string | null
  stages: { id: string; name: string; color: string | null; order: number }[]
  onCancel: () => void
  onCreate: (form: DealFormValues) => void
  onUpdate: (dealId: string, form: DealFormValues) => void
  onDelete: (dealId: string) => void
}) {
  const [contacts, setContacts] = useState<ContactLite[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [form, setForm] = useState<DealFormValues>(() => {
    if (mode === 'edit' && deal) {
      return {
        stageId: deal.stageId,
        title: deal.title,
        value: deal.value,
        contactId: deal.contactId,
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate
          ? deal.expectedCloseDate.split('T')[0]
          : '',
        notes: deal.notes || '',
      }
    }
    return {
      stageId: presetStageId || stages[0]?.id || '',
      title: '',
      value: 0,
      contactId: null,
      probability: 0,
      expectedCloseDate: '',
      notes: '',
    }
  })

  // Cargar contactos al montar
  useEffect(() => {
    let cancelled = false
    fetch('/api/crm/contacts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data)
          ? data.map((c: { id: string; name: string; company: string | null; email: string }) => ({
              id: c.id,
              name: c.name,
              company: c.company,
              email: c.email,
            }))
          : []
        setContacts(list)
      })
      .catch(() => {
        if (!cancelled) setContacts([])
      })
      .finally(() => {
        if (!cancelled) setLoadingContacts(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const valid = form.stageId && form.title.trim().length > 0

  const submit = () => {
    if (!valid) return
    const payload: DealFormValues = {
      stageId: form.stageId,
      title: form.title.trim(),
      value: Number(form.value) || 0,
      contactId: form.contactId || null,
      probability: Number(form.probability) || 0,
      expectedCloseDate: form.expectedCloseDate || null,
      notes: form.notes || null,
    }
    if (mode === 'edit' && deal) {
      onUpdate(deal.id, payload)
    } else {
      onCreate(payload)
    }
  }

  return (
    <>
      <div className="grid gap-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="d-title">Título *</Label>
          <Input
            id="d-title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Ej: Venta de mobiliario de oficina"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="d-stage">Etapa *</Label>
            <Select
              value={form.stageId}
              onValueChange={(v) => setForm((f) => ({ ...f, stageId: v }))}
            >
              <SelectTrigger id="d-stage" className="w-full">
                <SelectValue placeholder="Selecciona etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => {
                  const c = stageColor(s.color)
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${c.dot}`} />
                        {s.name}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-value">Valor (USD)</Label>
            <Input
              id="d-value"
              inputMode="numeric"
              value={String(form.value || '')}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  value: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0,
                }))
              }
              placeholder="1500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="d-prob">Probabilidad de cierre</Label>
            <Badge variant="outline" className="text-[10px]">
              {form.probability}%
            </Badge>
          </div>
          <Slider
            id="d-prob"
            min={0}
            max={100}
            step={5}
            value={[form.probability || 0]}
            onValueChange={(v) => setForm((f) => ({ ...f, probability: v[0] }))}
            className="py-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="d-contact">Contacto</Label>
            <Select
              value={form.contactId || '__none__'}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, contactId: v === '__none__' ? null : v }))
              }
            >
              <SelectTrigger id="d-contact" className="w-full">
                <SelectValue placeholder="Sin contacto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Sin contacto —</SelectItem>
                {loadingContacts ? (
                  <SelectItem value="__loading__" disabled>
                    Cargando…
                  </SelectItem>
                ) : contacts.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    No hay contactos
                  </SelectItem>
                ) : (
                  contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-close">Cierre esperado</Label>
            <Input
              id="d-close"
              type="date"
              value={form.expectedCloseDate || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="d-notes">
            <StickyNote className="size-3.5 inline mr-1" />
            Notas
          </Label>
          <Textarea
            id="d-notes"
            value={form.notes || ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Contexto, próximos pasos, requisitos…"
            rows={3}
          />
        </div>

        {/* Resumen rápido solo en edición */}
        {mode === 'edit' && deal && (
          <div className="rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
            <CalendarDays className="size-3.5" />
            Creado el {shortDate(deal.createdAt)}
            {deal.contact && (
              <>
                <Separator orientation="vertical" className="h-3 mx-1" />
                <User className="size-3.5" />
                {deal.contact.name}
              </>
            )}
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        {mode === 'edit' && deal && (
          <Button
            variant="destructive"
            onClick={() => onDelete(deal.id)}
            className="mr-auto"
          >
            <Trash2 />
            Eliminar
          </Button>
        )}
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!valid} onClick={submit}>
          {mode === 'edit' ? (
            <>
              <Pencil />
              Guardar
            </>
          ) : (
            <>
              <Plus />
              Crear deal
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}
