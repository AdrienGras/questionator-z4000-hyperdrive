import { IconCheck } from '@tabler/icons-react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { formatRawScore } from '@/domain/scoring/format'
import { toMilli } from '@/domain/scoring/milli'
import type { Student } from '@/domain/session/types'
import type { StudentStanding } from '@/features/session/student-standing'
import type { Ui } from '@/lib/i18n/use-ui'
import { PassageProgress } from './passage-progress'

type PassageHeaderStatsProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student | undefined
  /** Statut et notes de `student`, calculés par `ExaminerView`. */
  standing: StudentStanding | undefined
}>

/**
 * En-tête de l'écran de passage, à gauche du bouton « Panneau » : progression et score brut sur
 * son maximum pendant le passage, pastille « Passage terminé » une fois fini (la note se lit dans
 * l'écran final). Rien pour un étudiant absent ni sans étudiant actif.
 */
export function PassageHeaderStats({ ui, config, student, standing }: PassageHeaderStatsProps) {
  if (student === undefined || standing === undefined) return null
  const { text, locale } = ui
  if (standing.status === 'done') {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-space-training/15 px-2.5 text-small font-semibold text-space-training">
        <IconCheck aria-hidden className="size-4" />
        {text('passage_done_title', {})}
      </span>
    )
  }
  if (standing.status === 'absent') return null
  return (
    <div className="flex flex-wrap items-center gap-6">
      <PassageProgress ui={ui} config={config} student={student} />
      <dl className="flex flex-col gap-0.5">
        <dt className="text-small text-muted-foreground">{text('passage_raw_score_label', {})}</dt>
        <dd className="text-h2 font-bold tabular-nums">
          {formatRawScore(standing.scores.raw, locale)}{' '}
          <span className="text-small font-medium text-muted-foreground">
            {text('attempt_out_of', {
              max: formatRawScore(toMilli(config.scoring.maxRawScore), locale),
            })}
          </span>
        </dd>
      </dl>
    </div>
  )
}
