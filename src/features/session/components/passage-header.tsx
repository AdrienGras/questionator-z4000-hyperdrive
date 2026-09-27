import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ColorModeToggle } from '@/components/color-mode-toggle'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { questionIndex } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'

type PassageHeaderProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student | undefined
  picker: ReactNode
}>

/**
 * En-tête de l'écran de passage (§7) : titre de l'examen, identité de l'étudiant actif,
 * position dans le passage et score brut courant. La progression n'est affichée que pendant
 * le passage (`todo` / `in_progress`) : le score final se lit dans `DoneState` (pas de doublon).
 */
export function PassageHeader({ ui, config, student, picker }: PassageHeaderProps) {
  const { text, locale } = ui
  const status = student === undefined ? undefined : studentStatus(student, config)
  const showProgress = status === 'todo' || status === 'in_progress'
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <Link to="/" className="self-start text-sm text-primary underline underline-offset-4">
          {text('back_home', {})}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{config.exam.title}</h1>
        {student !== undefined && (
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
        )}
      </div>
      <div className="flex items-center gap-3">
        {picker}
        <ColorModeToggle ui={ui} />
      </div>
    </header>
  )
}
