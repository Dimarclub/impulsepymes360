import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PublicForm } from './public-form'

export const dynamic = 'force-dynamic'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  options?: string[]
  placeholder?: string
}

function parseFields(raw: string): FormField[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as FormField[]
  } catch {
    return []
  }
}


export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const form = await db.formTemplate.findUnique({ where: { id } })
  if (!form) notFound()
  const fields = parseFields(form.fields)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col">
      <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-8">
        <PublicForm
          id={form.id}
          name={form.name}
          description={form.description ?? null}
          fields={fields}
          submitLabel={form.submitLabel || 'Enviar'}
          successMessage={
            form.successMessage?.trim() || '¡Gracias por tu respuesta!'
          }
          isActive={form.isActive}
        />
      </main>
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by <span className="font-semibold text-emerald-700">DimarClub</span>
      </footer>
    </div>
  )
}
