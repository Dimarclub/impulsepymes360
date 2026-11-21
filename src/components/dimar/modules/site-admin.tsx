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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Save, Loader2, Trash2, Edit, Eye, EyeOff, Image as ImageIcon, Users } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from '@/components/dimar/image-upload'
import { VEHICLE_LABELS, type UserRole } from '@/lib/types'

interface Banner { id: string; title: string; imageUrl?: string | null; videoUrl?: string | null; gifUrl?: string | null; linkUrl?: string | null; placement: string; width: number; height: number; active: boolean; order: number }
interface BrandLogo { id: string; name: string; logoUrl: string; linkUrl?: string | null; active: boolean; order: number }
interface UserRow { id: string; name: string; email: string; role: string; city?: string | null; phone?: string | null; affiliateCode?: string | null }

const SUPPLIER_CATEGORIES = [
  'Bazar', 'Papelería', 'Cosméticos', 'Juguetes', 'Electrónica',
  'Ropa', 'Comida', 'Restaurantes', 'Servicios', 'Otro',
] as const

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'CLIENT', label: 'Cliente' },
  { value: 'AFFILIATE', label: 'Afiliado' },
  { value: 'SUPPLIER', label: 'Proveedor' },
  { value: 'COURIER', label: 'Mensajero' },
  { value: 'PARTNER', label: 'Socio' },
  { value: 'ADMIN', label: 'Administrador' },
]

const ROLE_BADGE_CLS: Record<string, string> = {
  ADMIN: 'bg-emerald-100 text-emerald-700',
  AFFILIATE: 'bg-amber-100 text-amber-700',
  CLIENT: 'bg-muted text-muted-foreground',
  SUPPLIER: 'bg-emerald-100 text-emerald-700',
  COURIER: 'bg-amber-100 text-amber-700',
  PARTNER: 'bg-emerald-100 text-emerald-700',
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', AFFILIATE: 'Afiliado', CLIENT: 'Cliente',
  SUPPLIER: 'Proveedor', COURIER: 'Mensajero', PARTNER: 'Socio',
}

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
  const [users, setUsers] = useState<UserRow[]>([])
  const [userDialog, setUserDialog] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [m, p, sl, b, l, u] = await Promise.all([
        fetch('/api/settings?key=marquee_text').then((r) => r.json()).catch(() => ({ value: '' })),
        fetch('/api/settings?key=contact_phone').then((r) => r.json()).catch(() => ({ value: '' })),
        fetch('/api/settings?key=site_logo_url').then((r) => r.json()).catch(() => ({ value: '' })),
        fetch('/api/banners').then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/brand-logos').then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/users').then((r) => r.ok ? r.json() : []).catch(() => []),
      ])
      setMarqueeText(m.value || ''); setContactPhone(p.value || '+593992689844'); setSiteLogo(sl.value || '')
      setBanners(b); setLogos(l); setUsers(u)
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
      <div><h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configuración del sitio</h1><p className="text-muted-foreground text-sm mt-1">Edita textos, banners, logos y crea usuarios</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">Texto marquee, contacto y logo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Texto marquee</Label><Textarea value={marqueeText} onChange={(e) => setMarqueeText(e.target.value)} rows={3} /></div>
          <div><Label>Teléfono de contacto</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
          <div><Label>Logo del sitio</Label><ImageUpload value={siteLogo} onChange={setSiteLogo} label="Logo" /></div>
          <Button onClick={saveSettings} disabled={saving}>{saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Save className="size-4 mr-1" />}Guardar</Button>
        </CardContent>
      </Card>

      {/* ============ Usuarios ============ */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Users className="size-4" /> Usuarios</CardTitle>
            <CardDescription>Crea y administra cuentas de cualquier rol.</CardDescription>
          </div>
          <Button onClick={() => setUserDialog(true)}><Plus className="size-4 mr-1" />Crear usuario</Button>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No hay usuarios cargados (o no tienes permiso de admin).</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin pr-1">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.city && <p className="text-xs text-muted-foreground truncate">{u.city}</p>}
                  </div>
                  <Badge className={ROLE_BADGE_CLS[u.role] || 'bg-muted'} variant="secondary">
                    {ROLE_LABEL[u.role] || u.role}
                  </Badge>
                  {u.affiliateCode && (
                    <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{u.affiliateCode}</span>
                  )}
                </div>
              ))}
            </div>
          )}
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
      <CreateUserDialog
        open={userDialog}
        onOpenChange={setUserDialog}
        onSaved={() => { setUserDialog(false); fetchAll() }}
        toast={toast}
      />
    </div>
  )
}

/* ---------------- Create user dialog ---------------- */

function CreateUserDialog({
  open,
  onOpenChange,
  onSaved,
  toast,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            Crea una cuenta nueva con el rol que elijas. Si es SUPPLIER se creará la empresa, una sucursal principal y las frases de Dima.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CreateUserFormBody
            onCancel={() => onOpenChange(false)}
            onSaved={onSaved}
            toast={toast}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreateUserFormBody({
  onCancel,
  onSaved,
  toast,
}: {
  onCancel: () => void
  onSaved: () => void
  toast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState<UserRole>('CLIENT')
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '',
    // SUPPLIER
    companyName: '', category: 'Bazar', address: '',
    branchName: '', branchCity: '', branchAddress: '', branchPhone: '',
    phrase1: '', phrase2: '', phrase3: '', phrase4: '', phrase5: '',
    // COURIER
    vehicleType: 'MOTORCYCLE', zone: '',
    // PARTNER
    contributionAmount: '300',
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const valid = form.name.trim() !== '' && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 6
  const supplierValid = role !== 'SUPPLIER' || form.companyName.trim() !== ''

  const submit = async () => {
    if (!valid) { toast('Revisa nombre, email y contraseña (mín 6)', 'error'); return }
    if (!supplierValid) { toast('Nombre de empresa requerido para SUPPLIER', 'error'); return }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role,
        phone: form.phone.trim() || undefined,
        city: form.city.trim() || undefined,
      }
      if (role === 'SUPPLIER') {
        payload.companyName = form.companyName.trim()
        payload.category = form.category
        payload.address = form.address.trim() || undefined
        if (form.branchName.trim() && form.branchCity.trim() && form.branchAddress.trim()) {
          payload.branchName = form.branchName.trim()
          payload.branchCity = form.branchCity.trim()
          payload.branchAddress = form.branchAddress.trim()
          payload.branchPhone = form.branchPhone.trim() || undefined
        }
        const phrases = [form.phrase1, form.phrase2, form.phrase3, form.phrase4, form.phrase5]
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
        if (phrases.length > 0) payload.phrases = phrases
      } else if (role === 'COURIER') {
        payload.vehicleType = form.vehicleType
        payload.zone = form.zone.trim() || undefined
      } else if (role === 'PARTNER') {
        const amt = Number(form.contributionAmount)
        payload.contributionAmount = Number.isFinite(amt) && amt > 0 ? amt : 300
      }
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) { toast('Ya existe una cuenta con ese email', 'error'); return }
      if (!res.ok) {
        const e = await res.json().catch(() => null)
        toast(e?.error || 'No se pudo crear el usuario', 'error'); return
      }
      toast('Usuario creado correctamente', 'success')
      onSaved()
    } catch {
      toast('Error al crear el usuario', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="space-y-3 py-1">
        <div className="space-y-1.5">
          <Label>Rol *</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nombre *</Label>
            <Input id="u-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="María Pérez" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email *</Label>
            <Input id="u-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@dominio.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-phone">Teléfono</Label>
            <Input id="u-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="099 123 4567" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-city">Ciudad</Label>
            <Input id="u-city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Guayaquil" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="u-pwd">Contraseña * (mínimo 6)</Label>
            <Input id="u-pwd" type="text" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="dimar123" />
          </div>
        </div>

        {role === 'SUPPLIER' && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Datos del proveedor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="u-company">Nombre de empresa *</Label>
                <Input id="u-company" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Distribuidora XYZ" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-cat">Categoría</Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger id="u-cat" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-addr">Dirección</Label>
                <Input id="u-addr" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Av. Principal 123" />
              </div>
            </div>

            <div className="rounded-md border bg-background p-3 space-y-2">
              <p className="text-xs font-medium">Sucursal principal (opcional)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="u-bn">Nombre sucursal</Label>
                  <Input id="u-bn" value={form.branchName} onChange={(e) => set('branchName', e.target.value)} placeholder="Matriz" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-bc">Ciudad</Label>
                  <Input id="u-bc" value={form.branchCity} onChange={(e) => set('branchCity', e.target.value)} placeholder="Guayaquil" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="u-ba">Dirección</Label>
                  <Input id="u-ba" value={form.branchAddress} onChange={(e) => set('branchAddress', e.target.value)} placeholder="Calle y número" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="u-bp">Teléfono sucursal</Label>
                  <Input id="u-bp" value={form.branchPhone} onChange={(e) => set('branchPhone', e.target.value)} placeholder="099 123 4567" />
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-background p-3 space-y-2">
              <p className="text-xs font-medium">Frases de posicionamiento para Dima (hasta 5)</p>
              <div className="grid grid-cols-1 gap-2">
                {(['phrase1', 'phrase2', 'phrase3', 'phrase4', 'phrase5'] as const).map((p, i) => (
                  <Input key={p} placeholder={`Frase ${i + 1}`} value={form[p]} onChange={(e) => set(p, e.target.value)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {role === 'COURIER' && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Datos del mensajero</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="u-vehicle">Tipo de vehículo</Label>
                <Select value={form.vehicleType} onValueChange={(v) => set('vehicleType', v)}>
                  <SelectTrigger id="u-vehicle" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-zone">Zona</Label>
                <Input id="u-zone" value={form.zone} onChange={(e) => set('zone', e.target.value)} placeholder="Norte de Quito" />
              </div>
            </div>
          </div>
        )}

        {role === 'PARTNER' && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Datos del socio</p>
            <div className="space-y-1.5">
              <Label htmlFor="u-amt">Aporte inicial (USD)</Label>
              <Input id="u-amt" type="number" min="1" value={form.contributionAmount} onChange={(e) => set('contributionAmount', e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Rendimiento mensual estimado: 3% del aporte.</p>
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button onClick={submit} disabled={saving || !valid || !supplierValid}>
          {saving ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Plus className="size-4 mr-1" />}
          Crear usuario
        </Button>
      </DialogFooter>
    </>
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
