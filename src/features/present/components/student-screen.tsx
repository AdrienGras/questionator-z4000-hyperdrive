import { useState } from 'react'
import { Markdown } from '@/components/markdown/markdown'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { CategoryTiles } from '@/features/present/components/category-tiles'
import { DrawReveal } from '@/features/present/components/draw-reveal'
import { FinalCard } from '@/features/present/components/final-card'
import { useUi } from '@/lib/i18n/use-ui'

/** Écran étudiant de la vue projetée : nom, catégories, énoncé en cours, progression, note finale. */
export function StudentScreen({ view }: Readonly<{ view: ProjectedStudentView }>) {
  const ui = useUi()
  // `drawnAt` présent au montage (ouverture, réouverture, changement d'étudiant) : jamais animé.
  const [initialDrawnAt] = useState(view.current?.drawnAt)
  const format = new Intl.NumberFormat(ui.locale, { maximumFractionDigits: 2 })
  const { student, current, questionIndex, cumulativeRaw, final, finished, detail } = view
  return (
    <div className="flex min-h-svh flex-col gap-8 p-6 sm:p-10">
      <header className="flex flex-col gap-1">
        <p className="text-xl text-muted-foreground">{view.examTitle}</p>
        <h1 className="text-5xl font-bold tracking-tight">
          {student.firstName} {student.lastName}
        </h1>
      </header>
      <CategoryTiles ui={ui} categories={view.categories} />
      {current !== undefined && (
        <DrawReveal
          key={current.drawnAt}
          color={view.categories.find((category) => category.id === current.categoryId)?.color}
          animate={view.drawAnimation && current.drawnAt !== initialDrawnAt}
        >
          <section aria-label={ui.text('present_prompt_label', {})}>
            <Markdown source={current.prompt} ui={ui} size="projection" />
          </section>
        </DrawReveal>
      )}
      {finished ? (
        final === undefined ? (
          <p className="text-4xl font-semibold">{ui.text('present_finished', {})}</p>
        ) : (
          <FinalCard ui={ui} final={final} detail={detail} />
        )
      ) : (
        <p className="text-2xl text-muted-foreground">
          {ui.text('present_question_index', questionIndex)}
        </p>
      )}
      {cumulativeRaw !== undefined && (
        <p className="text-2xl">
          {ui.text('present_cumulative', { score: format.format(cumulativeRaw) })}
        </p>
      )}
    </div>
  )
}
