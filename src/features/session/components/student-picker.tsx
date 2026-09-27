import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'
import { studentStatus, type StudentStatus } from '@/domain/scoring/status'
import type { Ui } from '@/lib/i18n/use-ui'
import type { UiMessageParams } from '@/lib/i18n/ui-messages'
import { cn } from '@/lib/utils'

type StatusKey = Extract<keyof UiMessageParams, `passage_status_${string}`>

const STATUS_KEY: Record<StudentStatus, StatusKey> = {
  todo: 'passage_status_todo',
  in_progress: 'passage_status_in_progress',
  done: 'passage_status_done',
  absent: 'passage_status_absent',
}

type StudentPickerProps = Readonly<{
  ui: Ui
  students: Student[]
  config: NormalizedConfig
  activeStudentId: string | undefined
  disabled: boolean
  onSelect: (studentId: string) => void
}>

/** Sélecteur provisoire de l'étudiant actif (F09 tâche 4) ; option triées par `order` (§7). */
export function StudentPicker({
  ui,
  students,
  config,
  activeStudentId,
  disabled,
  onSelect,
}: StudentPickerProps) {
  const { text } = ui
  const sorted = students.toSorted((a, b) => a.order - b.order)
  return (
    <label className="flex items-center gap-2 text-sm">
      <span>{text('passage_student_picker', {})}</span>
      <select
        value={activeStudentId ?? ''}
        disabled={disabled}
        onChange={(event) => onSelect(event.target.value)}
        className={cn(
          'h-8 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
          'md:text-sm dark:bg-input/30 dark:disabled:bg-input/80',
        )}
      >
        {activeStudentId === undefined && (
          <option value="" disabled>
            {text('passage_no_student_title', {})}
          </option>
        )}
        {sorted.map((student) => (
          <option key={student.id} value={student.id}>
            {text('passage_student_option', {
              name: `${student.lastName} ${student.firstName}`,
              status: text(STATUS_KEY[studentStatus(student, config)], {}),
            })}
          </option>
        ))}
      </select>
    </label>
  )
}
