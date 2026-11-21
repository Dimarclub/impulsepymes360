'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { Loader2, LogIn, UserPlus, Eye, EyeOff, Sparkles, Send, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import type { UserRole } from '@/lib/types'
import { VEHICLE_LABELS } from '@/lib/types'

export type LoginDialogTab = 'login' | 'register' | 'apply'

export interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: LoginDialogTab
  defaultRole?: UserRole
}

interface LoginForm {
  email: string
  password: string
}

const SUPPLIER_CATEGORIES = [
  'Bazar',
  'Papelería',
  'Cosméticos',
  'Juguetes',
  'Electrónica',
  'Ropa',
  'Comida',
  'Restaurantes',
  'Servicios',
  'Otro',
] as const

interface RegisterForm {
  name: string
  email: string
  phone: string
  city: string
  password: string
  sponsorCode: string
  role: UserRole
  // SUPPLIER
  companyName: string
  category: string
  address: string
  branchName: string
  branchCity: string
  branchAddress: string
  branchPhone: string
  phrase1: string
  phrase2: string
  phrase3: string
  phrase4: string
  phrase5: string
  // COURIER
  vehicleType: string
  zone: string
  // PARTNER
  contributionAmount: string
}

interface ApplyForm {
  name: string
  email: string
  phone: string
  type: 'SUPPLIER' | 'COURIER' | 'PARTNER'
  // SUPPLIER
  companyName: string
  category: string
  city: string
  branchName: string
  branchCity: string
  branchAddress: string
  branchPhone: string
  phrase1: string
  phrase2: string
  phrase3: string
  phrase4: string
  phrase5: string
  // COURIER
  vehicleType: string
  zone: string
  // PARTNER
  amount: string
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'CLIENT', label: 'Cliente', desc: 'Compra, recomienda y gana comisiones' },
  { value: 'AFFILIATE', label: 'Afiliado', desc: 'Red de 3 niveles de comisiones' },
  { value: 'SUPPLIER', label: 'Proveedor', desc: 'Vende en marketplace con sucursales' },
  { value: 'COURIER', label: 'Mensajero', desc: 'App Delta de mensajería' },
  { value: 'PARTNER', label: 'Socio', desc: 'Aporta capital y recibe rendimientos' },
]

const APPLY_TYPE_OPTIONS: {
  value: 'SUPPLIER' | 'COURIER' | 'PARTNER'
  label: string
  desc: string
}[] = [
  { value: 'SUPPLIER', label: 'Proveedor', desc: 'Vende en el marketplace' },
  { value: 'COURIER', label: 'Mensajero', desc: 'App Delta de mensajería' },
  { value: 'PARTNER', label: 'Socio', desc: 'Aporta capital y recibe rendimientos' },
]

/**
 * Wrapper del diálogo de login/registro.
 * Monta el cuerpo (con todo el estado) sólo cuando open=true, así los
 * defaults (defaultTab, defaultRole) se aplican frescos cada vez que
 * el usuario abre el diálogo (sin useEffect+setState).
 */
export function LoginDialog({
  open,
  onOpenChange,
  defaultTab = 'login',
  defaultRole = 'CLIENT',
}: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto scroll-thin">
        {open && (
          <LoginDialogBody
            onOpenChange={onOpenChange}
            defaultTab={defaultTab}
            defaultRole={defaultRole}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function LoginDialogBody({
  onOpenChange,
  defaultTab,
  defaultRole,
}: {
  onOpenChange: (open: boolean) => void
  defaultTab: LoginDialogTab
  defaultRole: UserRole
}) {
  const setUser = useAppStore((s) => s.setUser)
  const toast = useAppStore((s) => s.toast)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const loginForm = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<RegisterForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      password: '',
      sponsorCode: '',
      role: defaultRole,
      companyName: '',
      category: 'Bazar',
      address: '',
      branchName: '',
      branchCity: '',
      branchAddress: '',
      branchPhone: '',
      phrase1: '',
      phrase2: '',
      phrase3: '',
      phrase4: '',
      phrase5: '',
      vehicleType: 'MOTORCYCLE',
      zone: '',
      contributionAmount: '300',
    },
  })

  const applyForm = useForm<ApplyForm>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      type: 'SUPPLIER',
      companyName: '',
      category: 'Bazar',
      city: '',
      branchName: '',
      branchCity: '',
      branchAddress: '',
      branchPhone: '',
      phrase1: '',
      phrase2: '',
      phrase3: '',
      phrase4: '',
      phrase5: '',
      vehicleType: 'MOTORCYCLE',
      zone: '',
      amount: '300',
    },
  })

  const role = registerForm.watch('role')
  const applyType = applyForm.watch('type')

  const refreshUser = async (): Promise<boolean> => {
    try {
      // Pequeña pausa para que la cookie de sesión se establezca
      await new Promise((resolve) => setTimeout(resolve, 200))
      const r = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!r.ok) return false
      const me = await r.json()
      if (me && me.id) {
        setUser(me)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const onLogin = async (data: LoginForm) => {
    setLoginLoading(true)
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (!res || res.error) {
        toast('Credenciales inválidas', 'error')
        return
      }
      const ok = await refreshUser()
      if (!ok) {
        toast('Sesión iniciada. Recargando...', 'success')
        setTimeout(() => {
          window.location.reload()
        }, 800)
        return
      }
      toast('¡Bienvenido!', 'success')
      onOpenChange(false)
      loginForm.reset()
    } catch {
      toast('Credenciales inválidas', 'error')
    } finally {
      setLoginLoading(false)
    }
  }

  const onRegister = async (data: RegisterForm) => {
    setRegisterLoading(true)
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        city: data.city || undefined,
        role: data.role,
        sponsorCode: data.sponsorCode || undefined,
      }

      if (data.role === 'SUPPLIER') {
        payload.companyName = data.companyName || undefined
        payload.category = data.category || undefined
        payload.address = data.address || undefined
        const phrases = [data.phrase1, data.phrase2, data.phrase3, data.phrase4, data.phrase5]
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
        if (phrases.length > 0) payload.phrases = phrases
        if (data.branchName && data.branchCity && data.branchAddress) {
          payload.branches = [
            {
              name: data.branchName,
              city: data.branchCity,
              address: data.branchAddress,
              phone: data.branchPhone || null,
              isMain: true,
            },
          ]
        }
      } else if (data.role === 'COURIER') {
        payload.vehicleType = data.vehicleType || 'MOTORCYCLE'
        payload.zone = data.zone || undefined
      } else if (data.role === 'PARTNER') {
        const amt = Number(data.contributionAmount)
        payload.contributionAmount = Number.isFinite(amt) && amt > 0 ? amt : 300
      }

      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (r.status === 409) {
        toast('Este email ya está registrado', 'error')
        return
      }
      if (!r.ok) {
        const e = await r.json().catch(() => null)
        toast(e?.error || 'Error al crear la cuenta', 'error')
        return
      }

      // Auto-login tras registro exitoso
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (!res || res.error) {
        toast('Cuenta creada. Inicia sesión para continuar.', 'info')
        onOpenChange(false)
        return
      }
      await refreshUser()
      toast('¡Cuenta creada! Bienvenido a Dimarclub', 'success')
      onOpenChange(false)
      registerForm.reset()
    } catch {
      toast('Error al crear la cuenta', 'error')
    } finally {
      setRegisterLoading(false)
    }
  }

  const onApply = async (data: ApplyForm) => {
    setApplyLoading(true)
    try {
      const details: Record<string, unknown> = {}
      if (data.type === 'SUPPLIER') {
        if (data.companyName) details.companyName = data.companyName.trim()
        if (data.category) details.category = data.category
        if (data.city) details.city = data.city.trim()
        if (data.branchName) details.branchName = data.branchName.trim()
        if (data.branchCity) details.branchCity = data.branchCity.trim()
        if (data.branchAddress) details.branchAddress = data.branchAddress.trim()
        if (data.branchPhone) details.branchPhone = data.branchPhone.trim()
        const phrases = [data.phrase1, data.phrase2, data.phrase3, data.phrase4, data.phrase5]
          .map((p) => p.trim())
          .filter((p) => p.length > 0)
        if (phrases.length > 0) details.phrases = phrases
      } else if (data.type === 'COURIER') {
        details.vehicleType = data.vehicleType
        if (data.zone) details.zone = data.zone.trim()
      } else if (data.type === 'PARTNER') {
        const amt = Number(data.amount)
        if (Number.isFinite(amt) && amt > 0) details.amount = amt
      }

      const r = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || null,
          details,
        }),
      })

      if (!r.ok) {
        const e = await r.json().catch(() => null)
        toast(e?.error || 'No se pudo enviar la solicitud', 'error')
        return
      }
      toast('Solicitud enviada. El admin la revisará.', 'success')
      onOpenChange(false)
      applyForm.reset()
    } catch {
      toast('No se pudo enviar la solicitud', 'error')
    } finally {
      setApplyLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            Dimarclub
          </span>
        </DialogTitle>
        <DialogDescription>
          Accede, regístrate o postúlate como proveedor, mensajero o socio.
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="login" className="gap-1">
            <LogIn className="size-4" /> Entrar
          </TabsTrigger>
          <TabsTrigger value="register" className="gap-1">
            <UserPlus className="size-4" /> Registro
          </TabsTrigger>
          <TabsTrigger value="apply" className="gap-1">
            <Send className="size-4" /> Postular
          </TabsTrigger>
        </TabsList>

        {/* ============ LOGIN TAB ============ */}
        <TabsContent value="login" className="mt-4">
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-3" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@dominio.com"
                {...loginForm.register('email', { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-10"
                  {...loginForm.register('password', { required: true })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loginLoading} className="w-full" size="lg">
              {loginLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Ingresando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
            <div className="text-center">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-primary transition"
                onClick={() => setForgotOpen(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              Cuentas demo: admin@dimarclub.com · ana@dimarclub.com · pedro@dimarclub.com
              <br />
              Contraseña: <span className="font-mono">dimar123</span>
            </p>
          </form>
        </TabsContent>

        {/* ============ REGISTER TAB ============ */}
        <TabsContent value="register" className="mt-4">
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-3" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Nombre completo *</Label>
              <Input
                id="reg-name"
                placeholder="Ej: María Pérez"
                autoComplete="name"
                {...registerForm.register('name', { required: true })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@dominio.com"
                  {...registerForm.register('email', { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Teléfono</Label>
                <Input
                  id="reg-phone"
                  placeholder="0991234567"
                  autoComplete="tel"
                  {...registerForm.register('phone')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-city">Ciudad</Label>
                <Input
                  id="reg-city"
                  placeholder="Guayaquil"
                  autoComplete="address-level2"
                  {...registerForm.register('city')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                    {...registerForm.register('password', { required: true, minLength: 6 })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-sponsor">Código de referido (opcional)</Label>
              <Input
                id="reg-sponsor"
                placeholder="Ej: DIMAR-001"
                {...registerForm.register('sponsorCode')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de cuenta</Label>
              <Controller
                control={registerForm.control}
                name="role"
                render={({ field }) => (
                  <RadioGroup
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        htmlFor={`reg-${opt.value.toLowerCase()}`}
                        className="flex items-start gap-2 rounded-md border p-2.5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition"
                      >
                        <RadioGroupItem
                          id={`reg-${opt.value.toLowerCase()}`}
                          value={opt.value}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {opt.desc}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>

            {/* ============ Campos SUPPLIER ============ */}
            {role === 'SUPPLIER' && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Datos del proveedor
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="reg-company">Nombre de empresa *</Label>
                    <Input
                      id="reg-company"
                      placeholder="Distribuidora XYZ"
                      {...registerForm.register('companyName', { required: true })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-category">Categoría</Label>
                    <Controller
                      control={registerForm.control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="reg-category" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPLIER_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-address">Dirección (opcional)</Label>
                    <Input
                      id="reg-address"
                      placeholder="Av. Principal 123"
                      {...registerForm.register('address')}
                    />
                  </div>
                </div>

                <div className="rounded-md border bg-background p-3 space-y-2">
                  <p className="text-xs font-medium">Sucursal principal (opcional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-branch-name">Nombre sucursal</Label>
                      <Input
                        id="reg-branch-name"
                        placeholder="Matriz"
                        {...registerForm.register('branchName')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-branch-city">Ciudad</Label>
                      <Input
                        id="reg-branch-city"
                        placeholder="Guayaquil"
                        {...registerForm.register('branchCity')}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="reg-branch-address">Dirección</Label>
                      <Input
                        id="reg-branch-address"
                        placeholder="Calle y número"
                        {...registerForm.register('branchAddress')}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="reg-branch-phone">Teléfono sucursal</Label>
                      <Input
                        id="reg-branch-phone"
                        placeholder="099 123 4567"
                        {...registerForm.register('branchPhone')}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border bg-background p-3 space-y-2">
                  <p className="text-xs font-medium">
                    Frases de posicionamiento para Dima (hasta 5)
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {(['phrase1', 'phrase2', 'phrase3', 'phrase4', 'phrase5'] as const).map(
                      (p, i) => (
                        <Input
                          key={p}
                          placeholder={`Frase ${i + 1} (ej: mayorista de bazar en Guayaquil)`}
                          {...registerForm.register(p)}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============ Campos COURIER ============ */}
            {role === 'COURIER' && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Datos del mensajero
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-vehicle">Tipo de vehículo</Label>
                    <Controller
                      control={registerForm.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="reg-vehicle" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-zone">Zona de cobertura</Label>
                    <Input
                      id="reg-zone"
                      placeholder="Norte de Quito"
                      {...registerForm.register('zone')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============ Campos PARTNER ============ */}
            {role === 'PARTNER' && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Datos del socio
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-contribution">Aporte inicial (USD)</Label>
                  <Input
                    id="reg-contribution"
                    type="number"
                    min="1"
                    placeholder="300"
                    {...registerForm.register('contributionAmount')}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Rendimiento mensual estimado: 3% del aporte.
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" disabled={registerLoading} className="w-full" size="lg">
              {registerLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creando cuenta…
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              Al registrarte aceptas los términos y la política de privacidad de Dimarclub.
            </p>
          </form>
        </TabsContent>

        {/* ============ APPLY TAB (crea Application pendiente) ============ */}
        <TabsContent value="apply" className="mt-4">
          <form onSubmit={applyForm.handleSubmit(onApply)} className="space-y-3" noValidate>
            <p className="text-xs text-muted-foreground leading-relaxed rounded-md bg-muted/50 p-2">
              Postúlate como proveedor, mensajero o socio. El admin revisará tu solicitud y
              aprobará la cuenta (te llegará contraseña <span className="font-mono">dimar123</span>).
            </p>
            <div className="space-y-1.5">
              <Label>Tipo de solicitud *</Label>
              <Controller
                control={applyForm.control}
                name="type"
                render={({ field }) => (
                  <RadioGroup
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {APPLY_TYPE_OPTIONS.map((opt) => (
                      <Label
                        key={opt.value}
                        htmlFor={`apply-${opt.value.toLowerCase()}`}
                        className="flex items-start gap-2 rounded-md border p-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition"
                      >
                        <RadioGroupItem
                          id={`apply-${opt.value.toLowerCase()}`}
                          value={opt.value}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {opt.desc}
                          </p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apply-name">Nombre completo *</Label>
              <Input
                id="apply-name"
                placeholder="Ej: María Pérez"
                {...applyForm.register('name', { required: true })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="apply-email">Email *</Label>
                <Input
                  id="apply-email"
                  type="email"
                  placeholder="tucorreo@dominio.com"
                  {...applyForm.register('email', { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apply-phone">Teléfono</Label>
                <Input
                  id="apply-phone"
                  placeholder="0991234567"
                  {...applyForm.register('phone')}
                />
              </div>
            </div>

            {/* ============ Campos SUPPLIER (apply) ============ */}
            {applyType === 'SUPPLIER' && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Datos del proveedor
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-company">Empresa</Label>
                    <Input
                      id="apply-company"
                      placeholder="Distribuidora XYZ"
                      {...applyForm.register('companyName')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-category">Categoría</Label>
                    <Controller
                      control={applyForm.control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="apply-category" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPLIER_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-city">Ciudad</Label>
                    <Input
                      id="apply-city"
                      placeholder="Guayaquil"
                      {...applyForm.register('city')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-branch-name">Sucursal</Label>
                    <Input
                      id="apply-branch-name"
                      placeholder="Matriz"
                      {...applyForm.register('branchName')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-branch-city">Ciudad sucursal</Label>
                    <Input
                      id="apply-branch-city"
                      placeholder="Guayaquil"
                      {...applyForm.register('branchCity')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-branch-address">Dirección sucursal</Label>
                    <Input
                      id="apply-branch-address"
                      placeholder="Calle y número"
                      {...applyForm.register('branchAddress')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-branch-phone">Teléfono sucursal</Label>
                    <Input
                      id="apply-branch-phone"
                      placeholder="099 123 4567"
                      {...applyForm.register('branchPhone')}
                    />
                  </div>
                </div>
                <div className="rounded-md border bg-background p-3 space-y-2">
                  <p className="text-xs font-medium">
                    Frases de posicionamiento para Dima (hasta 5)
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {(['phrase1', 'phrase2', 'phrase3', 'phrase4', 'phrase5'] as const).map(
                      (p, i) => (
                        <Input
                          key={p}
                          placeholder={`Frase ${i + 1}`}
                          {...applyForm.register(p)}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============ Campos COURIER (apply) ============ */}
            {applyType === 'COURIER' && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Datos del mensajero
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-vehicle">Tipo de vehículo</Label>
                    <Controller
                      control={applyForm.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="apply-vehicle" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(VEHICLE_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apply-zone">Zona</Label>
                    <Input
                      id="apply-zone"
                      placeholder="Norte de Quito"
                      {...applyForm.register('zone')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============ Campos PARTNER (apply) ============ */}
            {applyType === 'PARTNER' && (
              <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Datos del socio
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="apply-amount">Aporte (USD)</Label>
                  <Input
                    id="apply-amount"
                    type="number"
                    min="1"
                    placeholder="300"
                    {...applyForm.register('amount')}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={applyLoading} className="w-full" size="lg">
              {applyLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Send className="size-4" /> Enviar solicitud
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
              El admin revisará tu solicitud. Una vez aprobada, podrás acceder con tu email y
              contraseña <span className="font-mono">dimar123</span>.
            </p>
          </form>
        </TabsContent>
      </Tabs>

      {forgotOpen && (
        <ForgotPasswordDialogBody
          onClose={() => setForgotOpen(false)}
          onSent={() => {
            setForgotOpen(false)
          }}
        />
      )}
    </>
  )
}

// ============ Forgot Password Dialog ============
function ForgotPasswordDialogBody({
  onClose,
  onSent,
}: {
  onClose: () => void
  onSent: () => void
}) {
  const toast = useAppStore((s) => s.toast)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()

      // Siempre mostrar el mismo mensaje (evita user enumeration)
      setSent(true)
      toast('Si el email existe, recibirás un enlace de recuperación', 'info')
    } catch (err) {
      toast('Error al enviar el email. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 12,
          maxWidth: 420,
          width: '100%',
          padding: 24,
        }}
        className="bg-background text-foreground"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            ¿Olvidaste tu contraseña?
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
            style={{
              background: 'transparent',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
              Si el email <strong style={{ color: 'hsl(var(--foreground))' }}>{email}</strong> existe
              en nuestra base de datos, recibirás un enlace de recuperación en breve.
            </p>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12, margin: 0 }}>
              Revisa tu bandeja de entrada y tu carpeta de spam.
              El enlace expira en 1 hora.
            </p>
            <Button onClick={onSent} variant="outline" className="mt-4 w-full">
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Escribe tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
            <div>
              <Label htmlFor="forgot-email" className="text-xs mb-1.5 block">
                Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@dominio.com"
                autoFocus
                required
              />
            </div>
            <Button type="submit" disabled={loading || !email} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Enviando…
                </>
              ) : (
                <>
                  <Send className="size-4 mr-2" /> Enviar enlace de recuperación
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition text-center"
            >
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
