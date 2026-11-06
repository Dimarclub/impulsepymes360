'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

export function PublicForm({
  id,
  name,
  description,
  fields,
  submitLabel,
  successMessage,
  isActive,
}: {
  id: string
  name: string
  description: string | null
  fields: FormField[]
  submitLabel: string
  successMessage: string
  isActive: boolean
}) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isActive) {
    return (
      <Card className="w-full max-w-xl mx-auto p-8 text-center">
        <CardContent className="p-0 space-y-2">
          <AlertCircle className="mx-auto size-8 text-amber-600" />
          <CardTitle className="text-lg">Formulario no disponible</CardTitle>
          <CardDescription>
            Este formulario fue desactivado por el propietario.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  const setValue = (k: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [k]: v }))
  }

  const toggleCheckbox = (k: string, opt: string) => {
    setValues((prev) => {
      const arr = Array.isArray(prev[k]) ? (prev[k] as string[]) : []
      return {
        ...prev,
        [k]: arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Validación cliente
    for (const f of fields) {
      if (f.required) {
        const v = values[f.name]
        const empty =
          v === undefined ||
          v === null ||
          (Array.isArray(v) ? v.length === 0 : String(v).trim() === '')
        if (empty) {
          setError(`El campo "${f.label}" es obligatorio`)
          return
        }
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/formularios/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo enviar el formulario')
      }
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Card className="w-full max-w-xl mx-auto p-8 text-center">
        <CardContent className="p-0 space-y-3">
          <div className="mx-auto size-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200">
            <CheckCircle2 className="size-7" />
          </div>
          <CardTitle className="text-lg">¡Enviado!</CardTitle>
          <CardDescription className="text-sm">{successMessage}</CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-emerald-800">{name}</CardTitle>
        {description ? (
          <CardDescription className="text-sm">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => {
            const fieldId = `f-${f.name}`
            return (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={fieldId} className="text-sm flex items-center gap-1">
                  {f.label}
                  {f.required ? <span className="text-red-500">*</span> : null}
                </Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    id={fieldId}
                    value={asString(values[f.name])}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    rows={3}
                    required={!!f.required}
                  />
                ) : f.type === 'select' ? (
                  <Select
                    value={asString(values[f.name])}
                    onValueChange={(v) => setValue(f.name, v)}
                    required={!!f.required}
                  >
                    <SelectTrigger id={fieldId}>
                      <SelectValue placeholder={f.placeholder || 'Selecciona...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o, i) => (
                        <SelectItem key={i} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'radio' ? (
                  <RadioGroup
                    value={asString(values[f.name])}
                    onValueChange={(v) => setValue(f.name, v)}
                    required={!!f.required}
                  >
                    {(f.options ?? []).map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={o} id={`${fieldId}-${i}`} />
                        <Label htmlFor={`${fieldId}-${i}`} className="text-sm font-normal cursor-pointer">
                          {o}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : f.type === 'checkbox' ? (
                  <div className="space-y-2">
                    {(f.options ?? []).map((o, i) => {
                      const arr = Array.isArray(values[f.name])
                        ? (values[f.name] as string[])
                        : []
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Checkbox
                            id={`${fieldId}-${i}`}
                            checked={arr.includes(o)}
                            onCheckedChange={() => toggleCheckbox(f.name, o)}
                          />
                          <Label htmlFor={`${fieldId}-${i}`} className="text-sm font-normal cursor-pointer">
                            {o}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Input
                    id={fieldId}
                    type={
                      f.type === 'number'
                        ? 'number'
                        : f.type === 'date'
                        ? 'date'
                        : f.type === 'email'
                        ? 'email'
                        : f.type === 'tel'
                        ? 'tel'
                        : 'text'
                    }
                    value={asString(values[f.name])}
                    onChange={(e) => setValue(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    required={!!f.required}
                  />
                )}
              </div>
            )
          })}

          {error ? (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="size-4" />
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? <Loader2 className="animate-spin" /> : null}
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}
