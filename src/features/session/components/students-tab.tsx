import type { ComponentProps, ReactNode } from 'react'
import type { Session } from '@/domain/session/types'
import type { WriteOutcome } from '@/features/session/hooks/use-passage-actions'
import type { Ui } from '@/lib/i18n/use-ui'
import { AddStudentDialog } from './add-student-dialog'
import { StudentRow } from './student-row'

type StudentsTabProps = Readonly<{
  ui: Ui
  session: Session
  /** Id résolu : un id qui ne désigne plus d'étudiant ne surligne aucune ligne. */
  activeStudentId: string | undefined
  /**
   * Verrouille les boutons d'envoi du dialogue et les boutons d'absence : les lignes elles-mêmes
   * gardent le focus clavier.
   */
  disabled: boolean
  onSelect: (studentId: string) => void
  /** Absence d'une ligne, sans changer l'étudiant actif (F38). */
  onSetAbsent: ComponentProps<typeof StudentRow>['onSetAbsent']
  onAdd: (
    names: { lastName: string; firstName: string },
    options: { activate: boolean },
  ) => Promise<WriteOutcome>
  /** Pied de l'onglet, réservé aux actions de liste (F15, F16). */
  actionsSlot?: ReactNode
}>

/**
 * Onglet « Étudiants » : liste triée par `order`, changement d'étudiant actif au clic sur la ligne,
 * absence par le bouton de la ligne (sans changer l'étudiant actif).
 */
export function StudentsTab({
  ui,
  session,
  activeStudentId,
  disabled,
  onSelect,
  onSetAbsent,
  onAdd,
  actionsSlot,
}: StudentsTabProps) {
  const { projection } = session
  const sorted = session.students.toSorted((a, b) => a.order - b.order)
  return (
    <div className="flex flex-col gap-4">
      <AddStudentDialog ui={ui} session={session} disabled={disabled} onAdd={onAdd} />
      <ul aria-label={ui.text('students_list_label', {})} className="flex flex-col gap-2">
        {sorted.map((student) => (
          <StudentRow
            key={student.id}
            ui={ui}
            config={session.config}
            student={student}
            active={student.id === activeStudentId}
            projected={projection.mode === 'student' && projection.studentId === student.id}
            disabled={disabled}
            onSetAbsent={onSetAbsent}
            // Garde : recliquer l'étudiant actif n'écrit rien.
            onSelect={(studentId) => {
              if (studentId !== activeStudentId) onSelect(studentId)
            }}
          />
        ))}
      </ul>
      <div>{actionsSlot}</div>
    </div>
  )
}
