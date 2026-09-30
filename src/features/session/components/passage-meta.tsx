import type { NormalizedConfig } from '@/domain/config/normalize'
import { questionIndex } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type PassageMetaProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student | undefined
}>

/**
 * Ligne d'infos de l'écran de passage (§7), posée sous le titre de la coque `PageShell` :
 * identité de l'étudiant actif, position dans le passage et score brut courant. La progression
 * n'est affichée que pendant le passage (`todo` / `in_progress`) : le score final se lit dans
 * `FinalScreen` (pas de doublon). Sans étudiant actif, rien n'est rendu.
 */
export function PassageMeta({ ui, config, student }: PassageMetaProps) {
  if (student === undefined) return null
  const { text, locale } = ui
  const status = studentStatus(student, config)
  const showProgress = status === 'todo' || status === 'in_progress'
  return (
    <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
      <span>{`${student.lastName} ${student.firstName}`}</span>
      {showProgress && (
        <>
          <span>{text('passage_question_index', questionIndex(student, config))}</span>
          <span>
            {text('passage_raw_score', {
              score: formatScore(computeScores(student, config).raw, 'raw', config, locale),
            })}
          </span>
        </>
      )}
    </div>
  )
}
