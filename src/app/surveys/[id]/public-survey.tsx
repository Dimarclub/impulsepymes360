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
import { Loader2, CheckCircle2, AlertCircle, Star } from 'lucide-react'

type QuestionType = 'text' | 'rating' | 'choice' | 'scale'

interface SurveyQuestion {
  text: string
  type: QuestionType
  required?: boolean
  options?: string[]
}

export function PublicSurvey({
  id,
  title,
  description,
  questions,
  isActive,
}: {
  id: string
  title: string
  description: string | null
  questions: SurveyQuestion[]
  isActive: boolean
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [respondentName, setRespondentName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [averageRating, setAverageRating] = useState<number | null>(null)

  if (!isActive) {
    return (
      <Card className="w-full max-w-xl mx-auto p-8 text-center">
        <CardContent className="p-0 space-y-2">
          <AlertCircle className="mx-auto size-8 text-amber-600" />
          <CardTitle className="text-lg">Encuesta no disponible</CardTitle>
          <CardDescription>
            Esta encuesta fue desactivada por el propietario.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  const setAnswer = (i: number, v: unknown) => {
    setAnswers((prev) => ({ ...prev, [String(i)]: v }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (q.required) {
        const v = answers[String(i)]
        const empty =
          v === undefined ||
          v === null ||
          (Array.isArray(v) ? v.length === 0 : String(v).trim() === '')
        if (empty) {
          setError(`La pregunta "${q.text}" es obligatoria`)
          return
        }
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/encuestas/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondentName: respondentName.trim() || null,
          answers,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo enviar la encuesta')
      }
      if (typeof data.averageRating === 'number') {
        setAverageRating(data.averageRating)
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
          <CardTitle className="text-lg">¡Gracias por tu respuesta!</CardTitle>
          <CardDescription className="text-sm">
            Tu opinión nos ayuda a mejorar.
          </CardDescription>
          {averageRating != null && averageRating > 0 ? (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">
                Rating promedio de la encuesta
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        n <= Math.round(averageRating)
                          ? 'size-5 fill-amber-400 text-amber-400'
                          : 'size-5 text-muted-foreground/30'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-emerald-800">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-sm">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="respondent" className="text-sm">Tu nombre (opcional)</Label>
            <Input
              id="respondent"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder="Ej. María Pérez"
            />
          </div>

          {questions.map((q, i) => (
            <QuestionInput
              key={i}
              index={i}
              question={q}
              value={answers[String(i)]}
              onChange={(v) => setAnswer(i, v)}
            />
          ))}

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
            Enviar respuestas
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function QuestionInput({
  index,
  question,
  value,
  onChange,
}: {
  index: number
  question: SurveyQuestion
  value: unknown
  onChange: (v: unknown) => void
}) {
  const asString = (v: unknown) => {
    if (v === undefined || v === null) return ''
    return String(v)
  }
  return (
    <div className="space-y-2">
      <Label className="text-sm flex items-start gap-1.5">
        <span className="text-muted-foreground font-medium">{index + 1}.</span>
        <span>
          {question.text}
          {question.required ? <span className="text-red-500"> *</span> : null}
        </span>
      </Label>
      {question.type === 'text' ? (
        <Textarea
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu respuesta..."
          rows={2}
          required={!!question.required}
        />
      ) : question.type === 'rating' ? (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const sel = Number(value) === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="p-1"
                aria-label={`${n} estrellas`}
              >
                <Star
                  className={
                    sel
                      ? 'size-7 fill-amber-400 text-amber-400'
                      : 'size-7 text-muted-foreground/40 hover:text-amber-300'
                  }
                />
              </button>
            )
          })}
        </div>
      ) : question.type === 'choice' ? (
        <RadioGroup
          value={asString(value)}
          onValueChange={(v) => onChange(v)}
          required={!!question.required}
        >
          {(question.options ?? []).map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem value={o} id={`q-${index}-${i}`} />
              <Label htmlFor={`q-${index}-${i}`} className="text-sm font-normal cursor-pointer">
                {o}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : question.type === 'scale' ? (
        <Select
          value={asString(value)}
          onValueChange={(v) => onChange(Number(v))}
          required={!!question.required}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona del 1 al 10" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }).map((_, i) => {
              const n = i + 1
              return (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
