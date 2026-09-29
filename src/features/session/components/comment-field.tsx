import { useId, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Student } from '@/domain/session/types'
import { useAutosave, type AutosaveStatus } from '@/features/session/hooks/use-autosave'
import type { Ui } from '@/lib/i18n/use-ui'
import type { UiMessageParams } from '@/lib/i18n/ui-messages'

type CommentStatusKey = Extract<keyof UiMessageParams, `comment_${string}`>

const STATUS_KEY: Record<AutosaveStatus, CommentStatusKey | undefined> = {
  idle: undefined,
  saving: 'comment_saving',
  saved: 'comment_saved',
  error: 'comment_error',
}

type CommentFieldProps = Readonly<{
  ui: Ui
  student: Student
  onSave: (studentId: string, comment: string) => Promise<boolean>
}>

/**
 * Commentaire de l'étudiant, sauvegardé en différé (F12). À monter avec `key={student.id}` : l'état
 * local n'est initialisé qu'une fois, la liveQuery n'écrase donc jamais la frappe, et le démontage
 * (changement d'étudiant) flushe la dernière valeur sur l'étudiant de CE montage (Review Focus 1).
 */
export function CommentField({ ui, student, onSave }: CommentFieldProps) {
  const { text } = ui
  const id = useId()
  const [value, setValue] = useState(student.comment ?? '')
  const studentId = student.id
  const { schedule, flush, status } = useAutosave((comment) => onSave(studentId, comment))
  const statusKey = STATUS_KEY[status]

  return (
    <section className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-semibold">
        {text('comment_label', {})}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          schedule(event.target.value)
        }}
        onBlur={flush}
      />
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {statusKey === undefined ? null : text(statusKey, {})}
      </p>
    </section>
  )
}
