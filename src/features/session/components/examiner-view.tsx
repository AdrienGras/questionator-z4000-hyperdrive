import { TooltipProvider } from '@/components/ui/tooltip'
import { PassageError } from '@/domain/passage/errors'
import { passageErrorMessage } from '@/domain/passage/messages'
import { formatScore } from '@/domain/scoring/format'
import { computeScores } from '@/domain/scoring/score'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { usePassageActions } from '@/features/session/hooks/use-passage-actions'
import { useUi } from '@/lib/i18n/use-ui'
import { AbsentState } from './absent-state'
import { DoneState } from './done-state'
import { PassageHeader } from './passage-header'
import { StudentPicker } from './student-picker'

/**
 * Écran de passage (§7) : en-tête, sélecteur provisoire d'étudiant, aiguillage par statut de
 * l'étudiant actif. La zone de passage (`todo` / `in_progress`) reste un emplacement pour la
 * tâche 5 (grille de catégories + panneau de question) ; `<aside>` vide réservé F12.
 */
export function ExaminerView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { text, locale } = ui
  const { config } = session
  const student = session.students.find((s) => s.id === session.activeStudentId)
  const actions = usePassageActions(session.id, student?.id)
  const status = student === undefined ? undefined : studentStatus(student, config)

  const picker = (
    <StudentPicker
      ui={ui}
      students={session.students}
      config={config}
      activeStudentId={session.activeStudentId}
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
                {/* passage */}
              </>
            )}
          </div>
          <aside aria-hidden="true" />
        </div>
      </main>
    </TooltipProvider>
  )
}
