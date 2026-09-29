import { TooltipProvider } from '@/components/ui/tooltip'
import { PassageError } from '@/domain/passage/errors'
import { passageErrorMessage } from '@/domain/passage/messages'
import { currentPending } from '@/domain/passage/selectors'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { usePassageActions } from '@/features/session/hooks/use-passage-actions'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { AbsentToggle } from './absent-toggle'
import { CommentField } from './comment-field'
import { PassageBody } from './passage-body'
import { PassageHeader } from './passage-header'
import { SidePanel } from './side-panel'
import { StudentTab } from './student-tab'
import { StudentPicker } from './student-picker'

/**
 * Message de la dernière action refusée, ou `undefined` (spec F09 §7). En if/return plutôt qu'en
 * ternaires imbriqués (Sonar S3358).
 */
function errorText(error: Error | null, ui: Ui): string | undefined {
  if (error === null) return undefined
  if (error instanceof PassageError) return passageErrorMessage(error, ui.locale)
  return ui.text('passage_error_generic', {})
}

/**
 * Écran de passage (§7) : en-tête, sélecteur provisoire d'étudiant, aiguillage par statut de
 * l'étudiant actif, grille de tirage, panneau de la question en cours et panneau latéral (F12).
 */
export function ExaminerView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { config } = session
  const student = session.students.find((s) => s.id === session.activeStudentId)
  const actions = usePassageActions(session.id, student?.id, session.updatedAt)
  const status = student === undefined ? undefined : studentStatus(student, config)
  const pending = student === undefined ? undefined : currentPending(student)
  const errorMessage = errorText(actions.error, ui)

  const picker = (
    <StudentPicker
      ui={ui}
      students={session.students}
      config={config}
      // Id résolu (et non `session.activeStudentId` brut) : un id qui ne désigne plus d'étudiant
      // (backup restauré, étudiant retiré) doit afficher « Aucun étudiant sélectionné » et une
      // valeur vide, jamais présélectionner le premier étudiant de la liste (spec F09 §7).
      activeStudentId={student?.id}
      disabled={actions.busy}
      onSelect={(studentId) => void actions.selectStudent(studentId)}
    />
  )

  return (
    <TooltipProvider>
      <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <PassageHeader ui={ui} config={config} student={student} picker={picker} />
        <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex flex-col gap-4">
            {/* Rendu une seule fois, au-dessus de l'aiguillage par statut : une erreur touchant
                un état sans passage (aucun étudiant, absent, terminé) doit rester visible. */}
            {errorMessage !== undefined && <p role="alert">{errorMessage}</p>}
            <PassageBody
              ui={ui}
              config={config}
              session={session}
              student={student}
              status={status}
              pending={pending}
              disabled={actions.busy}
              onDraw={(categoryId) => void actions.draw(categoryId)}
              onScore={(attemptId, value) => void actions.score(attemptId, value)}
              onSkip={(attemptId, reason) => void actions.skip(attemptId, reason)}
              onAdjust={(value, reason, options) => actions.adjust(value, reason, options)}
              onRevealFinal={() => actions.revealFinal()}
              onReset={() => actions.reset()}
              onNext={() => void actions.next()}
            />
          </div>
          <SidePanel
            ui={ui}
            studentTab={
              <StudentTab
                ui={ui}
                session={session}
                student={student}
                disabled={actions.busy}
                onEditScore={(attemptId, score) => void actions.editScore(attemptId, score)}
                commentSlot={
                  student && (
                    // `key` : un montage par étudiant, dont le démontage flushe le commentaire
                    // tapé sur CET étudiant (Review Focus 1).
                    <CommentField
                      key={student.id}
                      ui={ui}
                      student={student}
                      onSave={actions.setComment}
                    />
                  )
                }
                absentSlot={
                  student && (
                    <AbsentToggle
                      ui={ui}
                      student={student}
                      disabled={actions.busy}
                      onChange={actions.setAbsent}
                    />
                  )
                }
              />
            }
          />
        </div>
      </main>
    </TooltipProvider>
  )
}
