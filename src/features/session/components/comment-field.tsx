import { useEffect, useId, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Student } from '@/domain/session/types'
import { clearCommentDraft, readCommentDraft, writeCommentDraft } from '@/lib/comment-draft'
import { useAutosave, type AutosaveStatus } from '@/features/session/hooks/use-autosave'
import type { Ui } from '@/lib/i18n/use-ui'
import type { UiMessageParams } from '@/lib/i18n/ui-messages'

type CommentStatusKey = Extract<keyof UiMessageParams, `comment_${string}`>

/** Seuls le succès et l'échec sont annoncés aux lecteurs d'écran. */
const ANNOUNCED_KEY: Partial<Record<AutosaveStatus, CommentStatusKey>> = {
  saved: 'comment_saved',
  error: 'comment_error',
}

const STATUS_KEY: Record<AutosaveStatus, CommentStatusKey | undefined> = {
  idle: undefined,
  saving: 'comment_saving',
  saved: 'comment_saved',
  error: 'comment_error',
}

type CommentFieldProps = Readonly<{
  ui: Ui
  sessionId: string
  student: Student
  onSave: (studentId: string, comment: string) => Promise<boolean>
}>

/**
 * Commentaire de l'étudiant, sauvegardé en différé (F12). À monter avec `key={student.id}` : l'état
 * local n'est initialisé qu'une fois, la liveQuery n'écrase donc jamais la frappe, et le démontage
 * (changement d'étudiant) flushe la dernière valeur sur l'étudiant de CE montage (Review Focus 1).
 */
export function CommentField({ ui, sessionId, student, onSave }: CommentFieldProps) {
  const { text } = ui
  const id = useId()
  const studentId = student.id
  // Copie locale laissée par un rechargement avant l'enregistrement : elle l'emporte si elle diffère.
  const [restored] = useState(() => {
    const draft = readCommentDraft(sessionId, studentId)
    return draft !== undefined && draft !== (student.comment ?? '') ? draft : undefined
  })
  const [value, setValue] = useState(restored ?? student.comment ?? '')
  const { schedule, flush, status } = useAutosave(async (comment) => {
    const ok = await onSave(studentId, comment)
    if (ok) clearCommentDraft(sessionId, studentId, comment)
    return ok
  })
  useEffect(() => {
    if (restored === undefined) clearCommentDraft(sessionId, studentId)
    else schedule(restored)
    // Au montage seulement : le champ est monté par étudiant (`key`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const statusKey = STATUS_KEY[status]
  const announcedKey = ANNOUNCED_KEY[status]

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
          writeCommentDraft(sessionId, studentId, event.target.value)
          schedule(event.target.value)
        }}
        onBlur={flush}
      />
      <p className="min-h-5 text-sm text-muted-foreground">
        {statusKey === undefined ? null : text(statusKey, {})}
      </p>
      {/* Seul le résultat (enregistré / échec) est annoncé : « Enregistrement… » resterait du bruit. */}
      <p className="sr-only" aria-live="polite">
        {announcedKey === undefined ? null : text(announcedKey, {})}
      </p>
    </section>
  )
}
