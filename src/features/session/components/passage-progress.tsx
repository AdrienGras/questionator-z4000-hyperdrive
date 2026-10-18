import type { NormalizedConfig } from '@/domain/config/normalize'
import { questionIndex } from '@/domain/passage/selectors'
import type { Student } from '@/domain/session/types'
import { passageSegments, type PassageSegment } from '@/features/session/passage-segments'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { categoryAccent } from '@/lib/appearance/category-accent'

const FILL: Record<PassageSegment['state'], string> = {
  scored: 'w-full',
  pending: 'w-1/2',
  todo: 'w-0',
}

/** Phrase lue à la place de la barre : « Question 2 sur 3 : Facile notée, Normal en cours ». */
function progressLabel(
  ui: Ui,
  segments: readonly PassageSegment[],
  index: { current: number; total: number },
) {
  const detail = segments
    .filter((segment) => segment.state !== 'todo')
    .map((segment) =>
      ui.text(segment.state === 'scored' ? 'passage_progress_scored' : 'passage_progress_pending', {
        category: segment.categoryLabel ?? '',
      }),
    )
    .join(', ')
  return ui.text('passage_progress_label', { ...index, detail })
}

/**
 * Progression du passage (artboard `passage-question`) : « Question 2 / 3 » et une barre segmentée,
 * un segment par question, rempli à la couleur de sa catégorie (moitié pour la question en cours).
 * Le dessin est caché aux lecteurs d'écran, qui lisent une phrase (oxlint refuse `role="img"`).
 */
export function PassageProgress({
  ui,
  config,
  student,
}: Readonly<{ ui: Ui; config: NormalizedConfig; student: Student }>) {
  const segments = passageSegments(student, config)
  const index = questionIndex(student, config)
  return (
    <div className="flex min-w-45 flex-col gap-1.5">
      <span className="sr-only">{progressLabel(ui, segments, index)}</span>
      <span aria-hidden="true" className="text-small text-muted-foreground tabular-nums">
        <b className="font-semibold text-foreground">
          {ui.text('passage_question_number', { current: index.current })}
        </b>
        {` / ${index.total}`}
      </span>
      <span aria-hidden="true" className="flex gap-1">
        {segments.map((segment) => {
          const style = categoryAccent(segment.color)
          return (
            <span key={segment.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                style={style}
                className={cn(
                  'block h-full rounded-full bg-[var(--category-ink,var(--color-primary))]',
                  FILL[segment.state],
                )}
              />
            </span>
          )
        })}
      </span>
    </div>
  )
}
