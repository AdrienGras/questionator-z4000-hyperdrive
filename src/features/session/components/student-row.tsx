import type { ComponentProps } from 'react'
import { IconDeviceDesktop } from '@tabler/icons-react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { rosterScore } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { studentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'
import { STATUS_KEY } from '@/features/session/student-status-label'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { AbsentButton } from './absent-button'

type StudentRowProps = Readonly<{
  ui: Ui
  config: NormalizedConfig
  student: Student
  active: boolean
  projected: boolean
  /** Verrouille le bouton d'absence pendant une écriture. */
  disabled: boolean
  onSelect: (studentId: string) => void
  onSetAbsent: ComponentProps<typeof AbsentButton>['onChange']
}>

/** Note de la ligne : « brute · finale » (« — » si non calculée), ou le libellé d'absence (D68). */
function scoreText(student: Student, config: NormalizedConfig, ui: Ui): string {
  const score = rosterScore(student, config)
  if (score.kind === 'absent') return config.absent.label
  return ui.text('students_row_scores', {
    raw: formatScore(score.raw, 'raw', config, ui.locale),
    final:
      score.final === null
        ? ui.text('score_not_computed', {})
        : formatScore(score.final, 'final', config, ui.locale),
  })
}

/**
 * Ligne de la liste des étudiants : identité, statut, projection, puis notes, et le bouton
 * d'absence à côté (jamais dans le bouton de sélection : pas de bouton imbriqué).
 */
export function StudentRow({
  ui,
  config,
  student,
  active,
  projected,
  disabled,
  onSelect,
  onSetAbsent,
}: StudentRowProps) {
  const { text } = ui
  return (
    <li className="flex items-start gap-1">
      <button
        type="button"
        aria-current={active ? 'true' : undefined}
        onClick={() => onSelect(student.id)}
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-1 rounded-lg border p-2 text-left text-sm transition-colors outline-none',
          'hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          active && 'border-primary bg-accent hover:bg-accent',
        )}
      >
        <span className="flex items-center gap-2">
          <span
            className={cn('min-w-0 font-medium break-words', active && 'text-accent-foreground')}
          >{`${student.lastName} ${student.firstName}`}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {text(STATUS_KEY[studentStatus(student, config)], {})}
          </span>
          {projected && (
            <IconDeviceDesktop
              className="ml-auto size-4"
              aria-label={text('students_projected', {})}
            />
          )}
        </span>
        <span className={cn('text-muted-foreground', active && 'text-accent-foreground')}>
          {scoreText(student, config, ui)}
        </span>
      </button>
      <AbsentButton ui={ui} student={student} disabled={disabled} compact onChange={onSetAbsent} />
    </li>
  )
}
