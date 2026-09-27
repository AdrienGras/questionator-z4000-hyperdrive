import { TooltipProvider } from '@/components/ui/tooltip'
import { PassageError } from '@/domain/passage/errors'
import { passageErrorMessage } from '@/domain/passage/messages'
import { currentPending } from '@/domain/passage/selectors'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { usePassageActions } from '@/features/session/hooks/use-passage-actions'
import { useUi } from '@/lib/i18n/use-ui'
import { AbsentState } from './absent-state'
import { CategoryGrid } from './category-grid'
import { DoneState } from './done-state'
import { PassageHeader } from './passage-header'
import { QuestionPanel } from './question-panel'
import { StudentPicker } from './student-picker'

/**
 * Écran de passage (§7) : en-tête, sélecteur provisoire d'étudiant, aiguillage par statut de
 * l'étudiant actif, grille de tirage et panneau de la question en cours. `<aside>` vide réservé F12.
 */
export function ExaminerView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { text, locale } = ui
  const { config } = session
  const student = session.students.find((s) => s.id === session.activeStudentId)
  const actions = usePassageActions(session.id, student?.id)
  const status = student === undefined ? undefined : studentStatus(student, config)
  const pending = student === undefined ? undefined : currentPending(student)

  const picker = (
    <StudentPicker
      ui={ui}
      students={session.students}
      config={config}
      // Id résolu (et non `session.activeStudentId` brut) : un id qui ne désigne plus d'étudiant
      // (backup restauré, étudiant retiré) doit afficher « Aucun étudiant sélectionné » et une
      // valeur vide, jamais présélectionner le premier étudiant de la liste (revue tâche 4).
      activeStudentId={student?.id}
      disabled={actions.busy}
      onSelect={(studentId) => void actions.selectStudent(studentId)}
    />
  )

  const errorMessage =
    actions.error === null
      ? undefined
      : actions.error instanceof PassageError
        ? passageErrorMessage(actions.error, locale)
        : text('passage_error_generic', {})

  return (
    <TooltipProvider>
      <main className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <PassageHeader ui={ui} config={config} student={student} picker={picker} />
        <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex flex-col gap-4">
            {student === undefined ? (
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{text('passage_no_student_title', {})}</h2>
                <p className="text-muted-foreground">{text('passage_no_student_body', {})}</p>
              </div>
            ) : status === 'absent' ? (
              <AbsentState ui={ui} />
            ) : status === 'done' ? (
              <DoneState
                ui={ui}
                rawScore={formatScore(computeScores(student, config).raw, 'raw', config, locale)}
              />
            ) : (
              <>
                {errorMessage !== undefined && <p role="alert">{errorMessage}</p>}
                {pending !== undefined && (
                  <QuestionPanel
                    ui={ui}
                    config={config}
                    attempt={pending}
                    disabled={actions.busy}
                    onScore={(attemptId, value) => void actions.score(attemptId, value)}
                  />
                )}
                <CategoryGrid
                  ui={ui}
                  config={config}
                  student={student}
                  disabled={pending !== undefined || actions.busy}
                  onDraw={(categoryId) => void actions.draw(categoryId)}
                />
              </>
            )}
          </div>
          <aside aria-hidden="true" />
        </div>
      </main>
    </TooltipProvider>
  )
}
