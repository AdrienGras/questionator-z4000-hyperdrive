import type { NormalizedConfig } from '@/domain/config/normalize'
import { skipsRemaining } from '@/domain/passage/skip'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import type { StudentStatus } from '@/domain/scoring/status'
import type { Attempt, Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { AbsentState } from './absent-state'
import { CategoryGrid } from './category-grid'
import { DoneState } from './done-state'
import { QuestionPanel } from './question-panel'

type PassageBodyProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student | undefined
  status: StudentStatus | undefined
  pending: Attempt | undefined
  disabled: boolean
  onDraw: (categoryId: string) => void
  onScore: (attemptId: string, value: number) => void
  onSkip: (attemptId: string, reason: string | undefined) => void
}>

/**
 * Aiguillage par statut de l'étudiant actif (spec F09 §7), en if/return plutôt qu'en ternaires
 * imbriqués (Sonar S3358).
 */
export function PassageBody({
  ui,
  config,
  student,
  status,
  pending,
  disabled,
  onDraw,
  onScore,
  onSkip,
}: PassageBodyProps) {
  const { text, locale } = ui

  if (student === undefined) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{text('passage_no_student_title', {})}</h2>
        <p className="text-muted-foreground">{text('passage_no_student_body', {})}</p>
      </div>
    )
  }

  if (status === 'absent') return <AbsentState ui={ui} />

  if (status === 'done') {
    return (
      <DoneState
        ui={ui}
        rawScore={formatScore(computeScores(student, config).raw, 'raw', config, locale)}
      />
    )
  }

  return (
    <>
      {pending !== undefined && (
        <QuestionPanel
          ui={ui}
          config={config}
          attempt={pending}
          disabled={disabled}
          skipsRemaining={skipsRemaining(student, config)}
          onScore={onScore}
          onSkip={onSkip}
        />
      )}
      <CategoryGrid
        ui={ui}
        config={config}
        student={student}
        disabled={pending !== undefined || disabled}
        onDraw={onDraw}
      />
    </>
  )
}
