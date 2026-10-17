import type { ComponentProps } from 'react'
import type { Student } from '@/domain/session/types'
import type { Ui } from '@/lib/i18n/use-ui'
import { AbsentButton } from './absent-button'
import { CommentField } from './comment-field'

type CommentCardProps = Readonly<{
  ui: Ui
  sessionId: string
  student: Student
  disabled: boolean
  onSave: ComponentProps<typeof CommentField>['onSave']
  onSetAbsent: ComponentProps<typeof AbsentButton>['onChange']
}>

/**
 * Carte du commentaire de la colonne de droite (artboard `passage-question`) : commentaire de
 * l'étudiant actif, enregistré en différé, puis « Marquer absent » / « Marquer présent ».
 * `CommentField` est monté par étudiant (`key`) : changer d'étudiant le démonte, ce qui enregistre
 * la frappe en attente sur l'étudiant de CE montage (Review Focus 1 de F12 et de F44.7). La carte,
 * elle, ne l'est pas : un dialogue d'absence ouvert survit au changement d'étudiant actif (D67).
 */
export function CommentCard({
  ui,
  sessionId,
  student,
  disabled,
  onSave,
  onSetAbsent,
}: CommentCardProps) {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg bg-card p-5 shadow-card">
      <CommentField
        key={student.id}
        ui={ui}
        sessionId={sessionId}
        student={student}
        onSave={onSave}
      />
      <AbsentButton ui={ui} student={student} disabled={disabled} onChange={onSetAbsent} />
    </section>
  )
}
