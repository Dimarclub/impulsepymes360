'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Save, Loader2, Trash2, Edit, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '@/components/dimar/image-upload'

interface Banner { id: string; title: string; imageUrl?: string | null; videoUrl?: string | null; gifUrl?: string | null; linkUrl?: string | null; placement: string; width: number; height: number; active: boolean; order: number }
interface BrandLogo { id: string; name: string; logoUrl: string; linkUrl?: string | null; active: boolean; order: number }

export function SiteAdminModule() {
  const toast = useAppStore((s) => s.toast)
  const [marqueeText, setMarqueeText] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [siteLogo, setSiteLogo] = useState('')
  const [saving, setSaving] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [logos, setLogos] = useState<BrandLogo[]>([])
  const [loading, setLoading] = useState(true)
  const [bannerDialog, setBannerDialog] = useState(false)
  const [logoDialog, setLogoDialog] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [editingLogo, setEditingLogo] = useState<BrandLogo | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, p, sl, b, l] = await Promise.all([
        fetch('/api/settings?key=marquee_text').then((r) => r.json()).catch(() => ({ value: '' })),
        fetch('/api/settings?key=contact_phone').then((r) => r.json()).catch(() => ({ value: '' })),
        fetch('/api/settings?key=site_logo_url').then((r) => r.json()).catch(() => ({ value: '' })),
        fetch('/api/banners').then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/brand-logos').then((r) => r.ok ? r.json() : []).catch(() => []),
      ])
      setMarqueeText(m.value || ''); setContactPhone(p.value || '+593992689844'); setSiteLogo(sl.value || '')
      setBanners(b); setLogos(l)
    } catch { /* */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'marquee_text', value: marqueeText }) }),
        fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'contact_phone', value: contactPhone }) }),
        fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'site_logo_url', value: siteLogo }) }),
      ])
      toast('Configuración guardada', 'success')
    } catch { toast('Error', 'error') } finally { setSaving(false) }
  }

  const toggleBanner = async (b: Banner) => { await fetch(`/api/banners/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !b.active }) }); fetchAll() }
  const deleteBanner = async (id: string) => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/banners/${id}`, { method: 'DELETE' }); toast('Eliminado', 'success'); fetchAll() }
  const toggleLogo = async (l: BrandLogo) => { await fetch(`/api/brand-logos/${l.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !l.active }) }); fetchAll() }
  const deleteLogo = async (id: string) => { if (!confirm('¿Eliminar?')) return; await fetch(`/api/brand-logos/${id}`, { method: 'DELETE' }); toast('Eliminado', 'success'); fetchAll() }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1320px] mx-auto">
      <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configuración del sitio</h1><p className="text-muted-foreground text-sm mt-1">Edita textos, banners y logos</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Texto marquee, contacto y logo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Texto marquee</Label><Textarea value={marqueeText} onChange={(e) => setMarqueeText(e.target.value)} rows={3} /></div>
          <div><Label>Teléfono de contacto</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
          <div><Label>Logo del sitio</Label><ImageUpload value={siteLogo} onChange={setSiteLogo} label="Logo" /></div>
          <Button onClick={saveSettings} disabled={saving}>{saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />}Guardar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Banners publicitarios (1320×330)</CardTitle></div>
          <Button onClick={() => { setEditingBanner(null); setBannerDialog(true) }}><Plus className="size-4 mr-1" />Nuevo</Button></CardHeader>
        <CardContent>
          {banners.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No hay banners.</p> : (
            <div className="space-y-3">{banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="size-16 rounded bg-muted overflow-hidden shrink-0">{b.imageUrl ? <img src={b.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="size-8 m-auto text-muted-foreground mt-4" />}</div>
                <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{b.title}</p><p className="text-xs text-muted-foreground">{b.width}×{b.height}px · {b.linkUrl || 'sin enlace'}</p></div>
                <Button variant="ghost" size="icon" onClick={() => toggleBanner(b)}>{b.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => { setEditingBanner(b); setBannerDialog(true) }}><Edit className="size-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteBanner(b.id)}><Trash2 className="size-4 text-red-500" /></Button>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-base">Logos de marcas</CardTitle></div>
          <Button onClick={() => { setEditingLogo(null); setLogoDialog(true) }}><Plus className="size-4 mr-1" />Nuevo</Button></CardHeader>
        <CardContent>
          {logos.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No hay logos.</p> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{logos.map((l) => (
              <div key={l.id} className="rounded-lg border p-3 text-center space-y-2">
                <img src={l.logoUrl} alt={l.name} className="h-12 mx-auto object-contain" />
                <p className="text-xs font-medium truncate">{l.name}</p>
                <div className="flex items-center justify-center gap-1">
                  <Switch checked={l.active} onCheckedChange={() => toggleLogo(l)} />
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditingLogo(l); setLogoDialog(true) }}><Edit className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => deleteLogo(l.id)}><Trash2 className="size-3 text-red-500" /></Button>
                </div>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>
      {bannerDialog && <BannerDialog open={bannerDialog} onOpenChange={setBannerDialog} banner={editingBanner} onSaved={() => { setBannerDialog(false); fetchAll() }} toast={toast} />}
      {logoDialog && <LogoDialog open={logoDialog} onOpenChange={setLogoDialog} logo={editingLogo} onSaved={() => { setLogoDialog(false); fetchAll() }} toast={toast} />}
    </div>
  )
}

function BannerDialog({ open, onOpenChange, banner, onSaved, toast }: any) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '', width: 1320, height: 330, active: true, order: 0 })
  useEffect(() => { if (banner) setForm({ title: banner.title, imageUrl: banner.imageUrl || '', linkUrl: banner.linkUrl || '', width: banner.width, height: banner.height, active: banner.active, order: banner.order })
    else setForm({ title: '', imageUrl: '', linkUrl: '', width: 1320, height: 330, active: true, order: 0 }) }, [banner, open])
  const save = async () => {
    if (!form.title) { toast('Título requerido', 'error'); return }
    setSaving(true)
    try {
      const method = banner ? 'PATCH' : 'POST'; const url = banner ? `/api/banners/${banner.id}` : '/api/banners'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { toast('Error', 'error'); return }
      toast(banner ? 'Actualizado' : 'Creado', 'success'); onSaved()
    } catch { toast('Error', 'error') } finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{banner ? 'Editar banner' : 'Nuevo banner'}</DialogTitle><DialogDescription>1320×330px</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Imagen</Label><ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} /></div>
        <div><Label>URL de destino (enlace a tienda)</Label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/w/tecnoexpress o /?module=marketplace" /></div>
        <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Activo</Label></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />}Guardar</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}

function LogoDialog({ open, onOpenChange, logo, onSaved, toast }: any) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', logoUrl: '', linkUrl: '', active: true, order: 0 })
  useEffect(() => { if (logo) setForm({ name: logo.name, logoUrl: logo.logoUrl, linkUrl: logo.linkUrl || '', active: logo.active, order: logo.order })
    else setForm({ name: '', logoUrl: '', linkUrl: '', active: true, order: 0 }) }, [logo, open])
  const save = async () => {
    if (!form.name || !form.logoUrl) { toast('Nombre y logo requeridos', 'error'); return }
    setSaving(true)
    try {
      const method = logo ? 'PATCH' : 'POST'; const url = logo ? `/api/brand-logos/${logo.id}` : '/api/brand-logos'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { toast('Error', 'error'); return }
      toast(logo ? 'Actualizado' : 'Creado', 'success'); onSaved()
    } catch { toast('Error', 'error') } finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{logo ? 'Editar logo' : 'Nuevo logo'}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Logo *</Label><ImageUpload value={form.logoUrl} onChange={(url) => setForm({ ...form, logoUrl: url })} /></div>
        <div><Label>URL de destino (enlace a tienda del proveedor)</Label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/w/tecnoexpress" /></div>
        <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Activo</Label></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />}Guardar</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}
