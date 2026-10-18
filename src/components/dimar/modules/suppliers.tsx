'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Building2, CheckCircle2, Star, Package, Plus, Upload, FileDown, Search,
  Phone, MapPin, FileText, Boxes, ShieldCheck, Loader2, ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import type { Category, Product, Supplier } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SupplierWithRelations extends Supplier {
  user?: { name: string; email: string; phone?: string | null; city?: string | null }
  products?: Pick<Product, 'id' | 'name' | 'price' | 'stock' | 'status'>[]
}

const usd = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0)

const CSV_TEMPLATE = `name,price,stock,sku,categoryid,description,imageurl
Camiseta Algodón Premium,14.99,120,CAM-001,"Camiseta 100% algodón orgánico","https://picsum.photos/seed/cam-001/600/600"
Termo Acero Inoxidable 500ml,19.50,80,TERM-500,"Termo de doble pared, mantiene temperatura 12h","https://picsum.photos/seed/termo-500/600/600"
Mochila Urbana 20L,39.90,40,MOCH-20L,"Mochila impermeable con puerto USB","https://picsum.photos/seed/moch-20l/600/600"
`

function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${value} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
            i < full ? 'fill-amber-400 text-amber-400' : i === full && half ? 'fill-amber-200 text-amber-400' : 'text-muted-foreground/40'
          )}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  )
}

const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#e2e8f0"/><text x="50%" y="50%" font-size="9" text-anchor="middle" dy=".35em" fill="#64748b">sin img</text></svg>`
)

export function SuppliersModule() {
  const toast = useAppStore((s) => s.toast)
  const [suppliers, setSuppliers] = useState<SupplierWithRelations[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Dialogs
  const [newSupplierOpen, setNewSupplierOpen] = useState(false)
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    companyName: '', email: '', phone: '', taxId: '', address: '', city: '', category: '',
  })
  const [productForm, setProductForm] = useState({
    name: '', price: '', compareAtPrice: '', stock: '', sku: '', categoryId: '', description: '', imageUrl: '',
  })
  const [csvText, setCsvText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suppliers')
      const data = await res.json()
      setSuppliers(data)
      if (data.length && !selectedId) setSelectedId(data[0].id)
    } catch {
      toast('Error al cargar proveedores', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch {
      /* noop */
    }
  }

  const fetchProducts = async (supplierId: string) => {
    setLoadingProducts(true)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/products`)
      const data = await res.json()
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => { fetchSuppliers(); fetchCategories() }, [])
  useEffect(() => {
    if (selectedId) fetchProducts(selectedId)
    else setProducts([])
  }, [selectedId])

  const filtered = useMemo(() => {
    if (!search) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter((s) =>
      s.companyName.toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    )
  }, [suppliers, search])

  const selected = suppliers.find((s) => s.id === selectedId) || null

  const stats = useMemo(() => {
    const total = suppliers.length
    const verified = suppliers.filter((s) => s.verified).length
    const productsTotal = suppliers.reduce((acc, s) => acc + (s.products?.length || 0), 0)
    const avgRating = total ? suppliers.reduce((acc, s) => acc + (s.rating || 0), 0) / total : 0
    return { total, verified, productsTotal, avgRating }
  }, [suppliers])

  const allCategories = useMemo(() => {
    const flat: Category[] = []
    categories.forEach((c) => {
      flat.push(c)
      if (c.children) c.children.forEach((ch) => flat.push(ch))
    })
    return flat
  }, [categories])

  const handleCreateSupplier = async () => {
    if (!supplierForm.companyName || !supplierForm.email) {
      toast('Empresa y email son obligatorios', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      })
      if (!res.ok) throw new Error()
      await fetchSuppliers()
      setNewSupplierOpen(false)
      setSupplierForm({ companyName: '', email: '', phone: '', taxId: '', address: '', city: '', category: '' })
      toast('Proveedor creado correctamente')
    } catch {
      toast('Error al crear proveedor', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!selectedId) return
    if (!productForm.name || !productForm.price || !productForm.categoryId) {
      toast('Nombre, precio y categoría son obligatorios', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: productForm.name,
        price: parseFloat(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? parseFloat(productForm.compareAtPrice) : null,
        stock: parseInt(productForm.stock || '0'),
        sku: productForm.sku || null,
        categoryId: productForm.categoryId,
        supplierId: selectedId,
        description: productForm.description,
        imageUrl: productForm.imageUrl || null,
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      await fetchProducts(selectedId)
      await fetchSuppliers()
      setNewProductOpen(false)
      setProductForm({ name: '', price: '', compareAtPrice: '', stock: '', sku: '', categoryId: '', description: '', imageUrl: '' })
      toast('Producto agregado correctamente')
    } catch {
      toast('Error al agregar producto', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_productos.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '')
      setCsvText(text)
      toast(`Archivo "${file.name}" cargado`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleBulk = async () => {
    if (!selectedId) return
    if (!csvText.trim()) {
      toast('Pega o sube un CSV primero', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText, supplierId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      await fetchProducts(selectedId)
      await fetchSuppliers()
      setBulkOpen(false)
      setCsvText('')
      toast(`Importación: ${data.created} creados, ${data.errors?.length || 0} errores de ${data.total}`, data.errors?.length ? 'info' : 'success')
    } catch {
      toast('Error en la carga masiva', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu red de proveedores y su catálogo de productos.</p>
        </div>
        <Button onClick={() => setNewSupplierOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" /> Nuevo proveedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Building2 className="size-5" />} label="Total proveedores" value={stats.total} accent="emerald" />
        <StatCard icon={<ShieldCheck className="size-5" />} label="Verificados" value={stats.verified} accent="emerald" />
        <StatCard icon={<Boxes className="size-5" />} label="Productos totales" value={stats.productsTotal} accent="amber" />
        <StatCard icon={<Star className="size-5" />} label="Rating promedio" value={stats.avgRating.toFixed(2)} accent="amber" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* List */}
        <Card className="lg:sticky lg:top-4 h-fit">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Listado</CardTitle>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{filtered.length}</Badge>
            </div>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedor…"
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                <Building2 className="size-8 mx-auto mb-2 opacity-40" />
                Sin proveedores
              </div>
            ) : (
              <ul className="max-h-[70vh] overflow-y-auto scroll-thin -mx-2 px-2 space-y-1">
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className={cn(
                        'w-full text-left rounded-lg border p-3 transition-colors',
                        s.id === selectedId
                          ? 'border-emerald-500 bg-emerald-50/60'
                          : 'border-transparent hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">{s.companyName}</span>
                            {s.verified && <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="inline-flex items-center gap-0.5"><MapPin className="size-3" />{s.city || '—'}</span>
                          </div>
                        </div>
                        {s.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50 shrink-0">
                            {s.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Stars value={s.rating || 0} />
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Package className="size-3" /> {s.products?.length || 0}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Detail */}
        <Card>
          {selected ? (
            <>
              <CardHeader className="border-b bg-gradient-to-br from-emerald-50/60 to-amber-50/40">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-xl">{selected.companyName}</CardTitle>
                      {selected.verified ? (
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                          <CheckCircle2 className="size-3" /> Verificado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">No verificado</Badge>
                      )}
                      {selected.category && (
                        <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                          {selected.category}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2"><Stars value={selected.rating || 0} /></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setNewProductOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="size-4" /> Agregar producto
                    </Button>
                    <Button onClick={() => setBulkOpen(true)} size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50">
                      <Upload className="size-4" /> Carga masiva CSV
                    </Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
                  <InfoLine icon={<FileText className="size-3.5" />} label="RUC / Tax ID" value={selected.taxId || '—'} />
                  <InfoLine icon={<Phone className="size-3.5" />} label="Teléfono" value={selected.phone || '—'} />
                  <InfoLine icon={<MapPin className="size-3.5" />} label="Dirección" value={selected.address || '—'} />
                  <InfoLine icon={<Building2 className="size-3.5" />} label="Ciudad" value={selected.city || '—'} />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Package className="size-4 text-emerald-600" /> Productos del proveedor
                  </h3>
                  <span className="text-xs text-muted-foreground">{products.length} productos</span>
                </div>
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg">
                    <ImageIcon className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Este proveedor aún no tiene productos.</p>
                    <Button onClick={() => setNewProductOpen(true)} size="sm" variant="outline" className="mt-3">
                      <Plus className="size-4" /> Agregar el primero
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-[55vh] overflow-y-auto scroll-thin">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-14">Imagen</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead className="text-center">Stock</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <img
                                src={p.imageUrl || PLACEHOLDER_IMG}
                                alt={p.name}
                                className="size-10 rounded-md object-cover border bg-muted"
                                loading="lazy"
                              />
                            </TableCell>
                            <TableCell className="font-medium max-w-[260px] truncate">{p.name}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">{p.sku || '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="font-semibold">{usd(p.price)}</div>
                              {p.compareAtPrice ? (
                                <div className="text-xs text-muted-foreground line-through">{usd(p.compareAtPrice)}</div>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={
                                  p.stock > 0
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-red-100 text-red-700 hover:bg-red-100'
                                }
                              >
                                {p.stock}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {p.status === 'ACTIVE' ? 'Activo' : p.status === 'DRAFT' ? 'Borrador' : 'Archivado'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="py-20">
              <div className="text-center max-w-md mx-auto">
                <div className="size-16 rounded-2xl bg-emerald-50 mx-auto flex items-center justify-center mb-4">
                  <Building2 className="size-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold">Selecciona un proveedor</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Elige un proveedor del listado para ver su información y gestionar su catálogo de productos.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New supplier dialog */}
      <Dialog open={newSupplierOpen} onOpenChange={setNewSupplierOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
            <DialogDescription>Registra un nuevo proveedor en la plataforma.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Empresa *</Label>
              <Input value={supplierForm.companyName} onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })} placeholder="TecnoExpress S.A." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Email *</Label>
                <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} placeholder="ventas@empresa.com" />
              </div>
              <div className="grid gap-1.5">
                <Label>Teléfono</Label>
                <Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} placeholder="04 222-2333" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>RUC / Tax ID</Label>
                <Input value={supplierForm.taxId} onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })} placeholder="0992345678001" />
              </div>
              <div className="grid gap-1.5">
                <Label>Ciudad</Label>
                <Input value={supplierForm.city} onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })} placeholder="Guayaquil" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Dirección</Label>
              <Input value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} placeholder="Av. Principal 123" />
            </div>
            <div className="grid gap-1.5">
              <Label>Rubro / Categoría</Label>
              <Input value={supplierForm.category} onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })} placeholder="Electrónica" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSupplierOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateSupplier} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Crear proveedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New product dialog */}
      <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
            <DialogDescription>
              Para: <span className="font-medium text-emerald-700">{selected?.companyName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nombre *</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Camiseta de algodón" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label>Precio USD *</Label>
                <Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="14.99" />
              </div>
              <div className="grid gap-1.5">
                <Label>Antes</Label>
                <Input type="number" step="0.01" value={productForm.compareAtPrice} onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })} placeholder="19.99" />
              </div>
              <div className="grid gap-1.5">
                <Label>Stock</Label>
                <Input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} placeholder="100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>SKU</Label>
                <Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="CAM-001" />
              </div>
              <div className="grid gap-1.5">
                <Label>Categoría *</Label>
                <Select value={productForm.categoryId} onValueChange={(v) => setProductForm({ ...productForm, categoryId: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Descripción</Label>
              <Textarea rows={2} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Breve descripción del producto…" />
            </div>
            <div className="grid gap-1.5">
              <Label>URL de imagen</Label>
              <Input value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProductOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateProduct} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk CSV dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogHeader>
            <DialogTitle>Carga masiva CSV</DialogTitle>
            <DialogDescription>
              Pega el contenido CSV o sube un archivo. Cabecera:{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">name,price,stock,sku,categoryid,description,imageurl</code>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">
                <FileDown className="size-3.5 inline mr-1 -mt-0.5" />
                ¿No tienes el formato? Descarga la plantilla.
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={downloadTemplate}>
                  <FileDown className="size-4" /> Descargar plantilla
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="border-amber-400 text-amber-700 hover:bg-amber-50">
                  <Upload className="size-4" /> Subir archivo
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Contenido CSV</Label>
              <Textarea
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={CSV_TEMPLATE}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={handleBulk} disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Importar productos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon, label, value, accent,
}: { icon: React.ReactNode; label: string; value: React.ReactNode; accent: 'emerald' | 'amber' }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn(
          'size-10 rounded-lg flex items-center justify-center shrink-0',
          accent === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-bold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoLine({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-medium text-sm truncate">{value}</div>
      </div>
    </div>
  )
}
