'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MapPin, Plus, Save, Trash2, Edit } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface Zone { id: string; name: string; city: string; description?: string | null; active: boolean; order: number; couriersCount: number }

export function ZonesModule() {
  const toast = useAppStore((s) => s.toast)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const [form, setForm] = useState({ name: '', city: 'Quito', description: '', order: 0 })

  const fetchZones = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/zones'); if (!res.ok) { setZones([]); return }; setZones(await res.json()) }
    catch { setZones([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchZones() }, [fetchZones])

  const openCreate = () => { setEditing(null); setForm({ name: '', city: 'Quito', description: '', order: zones.length + 1 }); setDialogOpen(true) }
  const openEdit = (z: Zone) => { setEditing(z); setForm({ name: z.name, city: z.city, description: z.description || '', order: z.order }); setDialogOpen(true) }

  const save = async () => {
    if (!form.name) { toast('Nombre requerido', 'error'); return }
    try {
      const method = editing ? 'PATCH' : 'POST'; const url = editing ? `/api/zones/${editing.id}` : '/api/zones'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { toast('Error', 'error'); return }
      toast(editing ? 'Zona actualizada' : 'Zona creada', 'success'); setDialogOpen(false); fetchZones()
    } catch { toast('Error', 'error') }
  }

  const toggleActive = async (z: Zone) => { await fetch(`/api/zones/${z.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !z.active }) }); fetchZones() }
  const remove = async (id: string) => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/zones/${id}`, { method: 'DELETE' }); toast('Eliminada', 'success'); fetchZones() }

  if (loading) return <Skeleton className="h-64" />

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Zonas de cobertura</h1><p className="text-muted-foreground text-sm mt-1">Gestiona las zonas donde opera Fuerza Delta</p></div>
        <Button onClick={openCreate}><Plus className="size-4 mr-1" />Nueva zona</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{zones.length}</p><p className="text-xs text-muted-foreground">Total zonas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{zones.filter(z => z.active).length}</p><p className="text-xs text-muted-foreground">Activas</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{zones.reduce((s, z) => s + z.couriersCount, 0)}</p><p className="text-xs text-muted-foreground">Mensajeros</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Zonas configuradas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Zona</TableHead><TableHead>Ciudad</TableHead><TableHead>Descripción</TableHead>
              <TableHead className="text-center">Mensajeros</TableHead><TableHead className="text-center">Estado</TableHead><TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {zones.map((z) => (
                <TableRow key={z.id} className={!z.active ? 'opacity-50' : ''}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><MapPin className="size-4 text-primary" /></div>{z.name}</div></TableCell>
                  <TableCell>{z.city}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs">{z.description || '—'}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline">{z.couriersCount}</Badge></TableCell>
                  <TableCell className="text-center"><Switch checked={z.active} onCheckedChange={() => toggleActive(z)} /></TableCell>
                  <TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(z)}><Edit className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(z.id)}><Trash2 className="size-4 text-red-500" /></Button></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar zona' : 'Nueva zona'}</DialogTitle><DialogDescription>Configura la zona de cobertura</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Quito Norte" /></div>
            <div><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Descripción (barrios)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Iñaquito, Jipijapa" /></div>
            <div><Label>Orden</Label><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={save}><Save className="size-4 mr-1" />Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
