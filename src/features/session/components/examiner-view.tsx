import { useMemo, useRef } from 'react'
import { IconChartBar, IconLayoutSidebarRight } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { PageShell } from '@/components/page-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { toProjectedView } from '@/domain/presentation/projected-view'
import { PassageError } from '@/domain/passage/errors'
import { passageErrorMessage } from '@/domain/passage/messages'
import { currentPending } from '@/domain/passage/selectors'
import { studentStatus } from '@/domain/scoring/status'
import type { Session } from '@/domain/session/types'
import { usePassageActions } from '@/features/session/hooks/use-passage-actions'
import type { Failure } from '@/features/session/hooks/use-fresh-error'
import { useSidePanel } from '@/features/session/hooks/use-side-panel'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { AbsentToggle } from './absent-toggle'
import { CommentField } from './comment-field'
import { ExportButton } from './export-button'
import { PassageBody } from './passage-body'
import { PassageMeta } from './passage-meta'
import { ProjectionBanner } from './projection-banner'
import { ProjectionControls } from './projection-controls'
import { ProjectionPreview } from './projection-preview'
import { SidePanel } from './side-panel'
import { StudentTab } from './student-tab'
import { StudentsTab } from './students-tab'

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
 * Écran de passage (§7) : coque commune (titre, thème), aiguillage par statut de
 * l'étudiant actif, grille de tirage, panneau de la question en cours et panneau latéral (F12),
 * avec, en colonne droite, l'aperçu de la vue projetée et les contrôles de projection (F22),
 * en tiroir ouvert par le bouton « Panneau » de la barre de titre (F21). Le tiroir se ferme après
 * un changement d'étudiant actif réussi ; il reste ouvert sinon, erreur visible dans le tiroir, au-dessus des onglets.
 */
export function ExaminerView({ session }: Readonly<{ session: Session }>) {
  const ui = useUi()
  const { config } = session
  const student = session.students.find((s) => s.id === session.activeStudentId)
  const actions = usePassageActions(session.id, student?.id, session.updatedAt)
  const status = student === undefined ? undefined : studentStatus(student, config)
  const pending = student === undefined ? undefined : currentPending(student)
  // Un objet par échec (`actions.error` est neuf à chaque échec) : le tiroir distingue ainsi
  // l'erreur survenue ouvert de celle déjà là à son ouverture.
  const failure = useMemo<Failure | undefined>(() => {
    const message = errorText(actions.error, ui)
    return message === undefined ? undefined : { message }
    // Identité = occurrence : `ui` (neuf à chaque rendu) et la langue n'en font pas partie. La langue
    // vient de la config de session et ne change pas pendant un passage : le message figé à l'échec
    // ne peut donc pas être périmé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.error])
  const errorMessage = failure?.message
  const projected = useMemo(() => toProjectedView(session), [session])
  const panel = useSidePanel()
  const panelButton = useRef<HTMLButtonElement>(null)

  const selectStudent = async (studentId: string) => {
    if (await actions.selectStudent(studentId)) panel.setOpen(false)
  }
  // Le booléen revient tel quel au dialogue d'ajout, qui ne se ferme que sur succès.
  const addStudent = async (
    names: { lastName: string; firstName: string },
    options: { activate: boolean },
  ) => {
    const added = await actions.addStudent(names, options)
    if (added && options.activate) panel.setOpen(false)
    return added
  }

  return (
    <TooltipProvider>
      <PageShell
        ui={ui}
        back={
          <Link to="/" className="self-start text-sm text-primary underline underline-offset-4">
            {ui.text('back_home', {})}
          </Link>
        }
        title={config.exam.title}
        meta={<PassageMeta ui={ui} config={config} student={student} />}
        actions={
          <Button
            ref={panelButton}
            type="button"
            variant="outline"
            onClick={() => panel.setOpen(true)}
          >
            <IconLayoutSidebarRight aria-hidden />
            {ui.text('side_panel_open', {})}
          </Button>
        }
      >
        <div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
          <div className="flex w-full max-w-xl flex-col gap-3 lg:col-start-2 lg:row-start-1 lg:max-w-none">
            <ProjectionPreview ui={ui} view={projected} />
            <ProjectionControls
              ui={ui}
              sessionId={session.id}
              projection={session.projection}
              activeStudentId={student?.id}
              disabled={actions.busy}
              onProject={actions.project}
            />
            <ProjectionBanner ui={ui} session={session} activeStudentId={student?.id} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
            {/* Rendu une seule fois, au-dessus de l'aiguillage par statut : une erreur touchant
                un état sans passage (aucun étudiant, absent, terminé) doit rester visible. */}
            {errorMessage !== undefined && <p role="alert">{errorMessage}</p>}
            <PassageBody
              ui={ui}
              config={config}
              session={session}
              student={student}
              status={status}
              onShowPanel={panel.show}
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
        </div>
        <SidePanel
          ui={ui}
          open={panel.open}
          tab={panel.tab}
          onOpenChange={panel.setOpen}
          onTabChange={panel.setTab}
          error={failure}
          returnFocusRef={panelButton}
          studentsTab={
            <StudentsTab
              ui={ui}
              session={session}
              // Id résolu (et non `session.activeStudentId` brut) : un id qui ne désigne plus
              // d'étudiant (backup restauré, étudiant retiré) ne doit surligner aucune ligne
              // ni présélectionner le premier étudiant de la liste (spec F09 §7).
              activeStudentId={student?.id}
              disabled={actions.busy}
              onSelect={(studentId) => void selectStudent(studentId)}
              onAdd={addStudent}
              actionsSlot={
                <div className="flex flex-wrap items-start gap-2">
                  {/* Lien stylé en bouton : l'écran des statistiques est une route (F15), et
                        `features/session` n'importe rien de `features/stats`. */}
                  <Link
                    to="/session/$sessionId/stats"
                    params={{ sessionId: session.id }}
                    className={buttonVariants({ variant: 'outline' })}
                  >
                    <IconChartBar aria-hidden />
                    {ui.text('stats_open', {})}
                  </Link>
                  <ExportButton ui={ui} session={session} />
                </div>
              }
            />
          }
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
                    sessionId={session.id}
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
      </PageShell>
    </TooltipProvider>
  )
}
