import type { ComponentProps } from 'react'
import { IconDeviceDesktop } from '@tabler/icons-react'
import type { NormalizedConfig } from '@/domain/config/normalize'
import { rosterScore } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { studentStatus } from '@/domain/scoring/status'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { AbsentButton } from './absent-button'
import { StudentStatusPill } from './student-status-pill'

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
 * Ligne de la liste des étudiants (artboard `passage-panneau`) : identité, projection et statut
 * en pastille, puis notes, et le bouton d'absence à côté (jamais dans le bouton de sélection : pas
 * de bouton imbriqué).
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
  const status = studentStatus(student, config)
  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        aria-current={active ? 'true' : undefined}
        onClick={() => onSelect(student.id)}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors outline-none',
          'hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          active && 'bg-accent shadow-[inset_0_0_0_1px_var(--color-primary)]',
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className={cn('truncate', active ? 'font-semibold' : 'font-medium')}>
              {`${student.lastName} ${student.firstName}`}
            </span>
            {projected && (
              <IconDeviceDesktop
                className="size-4 shrink-0 text-muted-foreground"
                aria-label={text('students_projected', {})}
              />
            )}
          </span>
          <StudentStatusPill ui={ui} status={status} />
        </span>
        <span
          className={cn(
            'text-sm whitespace-nowrap tabular-nums',
            status === 'done' ? 'font-semibold text-foreground' : 'text-muted-foreground',
          )}
        >
          {scoreText(student, config, ui)}
        </span>
      </button>
      <AbsentButton ui={ui} student={student} disabled={disabled} compact onChange={onSetAbsent} />
    </li>
  )
}
