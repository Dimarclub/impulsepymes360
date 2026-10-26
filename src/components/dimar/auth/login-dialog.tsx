'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { signIn } from 'next-auth/react'
import { Loader2, LogIn, UserPlus, Eye, EyeOff, Sparkles } from 'lucide-react'
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
import { useAppStore } from '@/lib/store'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LoginForm {
  email: string
  password: string
}

interface RegisterForm {
  name: string
  email: string
  phone: string
  city: string
  password: string
  sponsorCode: string
  role: 'CLIENT' | 'AFFILIATE'
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const setUser = useAppStore((s) => s.setUser)
  const toast = useAppStore((s) => s.toast)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

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
      role: 'CLIENT',
    },
  })

  const refreshUser = async (): Promise<boolean> => {
    try {
      const r = await fetch('/api/auth/me')
      if (!r.ok) return false
      const me = await r.json()
      if (me) {
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
        toast('No se pudo cargar tu sesión', 'error')
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
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          city: data.city || undefined,
          role: data.role,
          sponsorCode: data.sponsorCode || undefined,
        }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto scroll-thin">
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
            Accede a tu cuenta o crea una nueva para comprar, recomendar y ganar comisiones.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="gap-1.5">
              <LogIn className="size-4" /> Iniciar sesión
            </TabsTrigger>
            <TabsTrigger value="register" className="gap-1.5">
              <UserPlus className="size-4" /> Registrarse
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
                  onClick={() => toast('Función disponible próximamente', 'info')}
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
                      className="grid grid-cols-2 gap-2"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <Label
                        htmlFor="reg-client"
                        className="flex items-start gap-2 rounded-md border p-2.5 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition"
                      >
                        <RadioGroupItem id="reg-client" value="CLIENT" className="mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Cliente</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            Compra, recomienda y gana comisiones
                          </p>
                        </div>
                      </Label>
                      <Label
                        htmlFor="reg-courier"
                        className="flex items-start gap-2 rounded-md border p-2.5 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-900/20 transition"
                      >
                        <RadioGroupItem id="reg-courier" value="COURIER" className="mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">Courier / Delta</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            Mensajero con App Delta
                          </p>
                        </div>
                      </Label>
                    </RadioGroup>
                  )}
                />
              </div>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
