import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { PublicSurvey } from './public-survey'

export const dynamic = 'force-dynamic'

interface SurveyQuestion {
  text: string
  type: 'text' | 'rating' | 'choice' | 'scale'
  required?: boolean
  options?: string[]
}

function parseQuestions(raw: string): SurveyQuestion[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SurveyQuestion[]
  } catch {
    return []
  }
}


export default async function PublicSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const survey = await db.survey.findUnique({ where: { id } })
  if (!survey) notFound()
  const questions = parseQuestions(survey.questions)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col">
      <main className="flex-1 flex items-start sm:items-center justify-center p-4 sm:p-8">
        <PublicSurvey
          id={survey.id}
          title={survey.title}
          description={survey.description ?? null}
          questions={questions}
          isActive={survey.isActive}
        />
      </main>
      <footer className="text-center py-4 text-xs text-muted-foreground">
        Powered by <span className="font-semibold text-emerald-700">DimarClub</span>
      </footer>
    </div>
  )
}
