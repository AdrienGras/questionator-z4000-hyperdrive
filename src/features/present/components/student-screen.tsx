import { ColorModeToggle } from '@/components/color-mode-toggle'
import { Markdown } from '@/components/markdown/markdown'
import type { ProjectedStudentView } from '@/domain/presentation/projected-view'
import { CategoryTiles } from '@/features/present/components/category-tiles'
import { FinalCard } from '@/features/present/components/final-card'
import { useUi } from '@/lib/i18n/use-ui'

/** Écran étudiant de la vue projetée : nom, catégories, énoncé en cours, progression, note finale. */
export function StudentScreen({ view }: Readonly<{ view: ProjectedStudentView }>) {
  const ui = useUi()
  const format = new Intl.NumberFormat(ui.locale, { maximumFractionDigits: 2 })
  const { student, current, questionIndex, cumulativeRaw, final, finished, detail } = view
  return (
    <main className="relative flex min-h-svh flex-col gap-8 p-6 sm:p-10">
      <div className="absolute top-4 right-4">
        <ColorModeToggle ui={ui} />
      </div>
      <header className="flex flex-col gap-1">
        <p className="text-xl text-muted-foreground">{view.examTitle}</p>
        <h1 className="text-5xl font-bold tracking-tight">
          {student.firstName} {student.lastName}
        </h1>
      </header>
      <CategoryTiles ui={ui} categories={view.categories} />
      {current !== undefined && <Markdown source={current.prompt} ui={ui} size="projection" />}
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
    </main>
  )
}
