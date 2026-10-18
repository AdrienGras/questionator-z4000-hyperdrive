import { IconChartBar, IconRefresh } from '@tabler/icons-react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { BackLink } from '@/components/back-link'
import { PageShell } from '@/components/page-shell'
import { TrainingGate } from '@/components/training-gate'
import { buttonVariants } from '@/components/ui/button'
import { currentPending } from '@/domain/training/cycle-draw'
import { TrainingError } from '@/domain/training/errors'
import { trainingErrorMessage } from '@/domain/training/errors-messages'
import { categoryOfQuestion } from '@/domain/training/resolve-draw'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { LockedTiles } from '@/features/training/components/locked-tiles'
import { TrainingQuestion } from '@/features/training/components/training-question'
import { TrainingTiles } from '@/features/training/components/training-tiles'
import { journalStepOf, useTrainingActions } from '@/features/training/hooks/use-training-actions'

const route = getRouteApi('/training/$trainingId')

/** Message de la dernière écriture refusée, ou `undefined`. */
function errorText(error: Error | null, ui: Ui): string | undefined {
  if (error === null) return undefined
  if (error instanceof TrainingError) return trainingErrorMessage(error, ui.locale)
  return ui.text('passage_error_generic', {})
}

/**
 * Corps de l'écran, une colonne : les tuiles, ou la question en cours sous les tuiles verrouillées. Le focus
 * ne bouge qu'après une action de l'utilisateur (`acted`), jamais au chargement de la page.
 */
function TrainingView({
  training,
  draws,
}: Readonly<{ training: Training; draws: TrainingDraw[] }>) {
  const ui = useUi()
  const { config } = training
  const actions = useTrainingActions(training.id, journalStepOf(draws))
  const [acted, setActed] = useState(false)
  const pending = currentPending(draws)
  // Constante : son rétrécissement tient dans les rappels de la question.
  const drawId = pending?.id
  const errorMessage = errorText(actions.error, ui)
  const alertRef = useRef<HTMLParagraphElement>(null)

  // Les tuiles ou les boutons de la question sont désactivés pendant l'écriture : sans ça, le
  // focus retomberait sur `body` après un échec.
  useEffect(() => {
    if (actions.error !== null) alertRef.current?.focus()
  }, [actions.error])

  const act = (write: () => Promise<void>) => {
    setActed(true)
    void write()
  }

  return (
    <PageShell
      title={training.name}
      meta={ui.text('training_subtitle', { pending: pending !== undefined })}
      actions={
        <>
          <Link
            to="/training/$trainingId/update"
            params={{ trainingId: training.id }}
            className={buttonVariants({ variant: 'ghost' })}
          >
            <IconRefresh data-icon="inline-start" aria-hidden="true" />
            {ui.text('training_update_link', {})}
          </Link>
          <Link
            to="/training/$trainingId/stats"
            params={{ trainingId: training.id }}
            className={buttonVariants({ variant: 'outline' })}
          >
            <IconChartBar data-icon="inline-start" aria-hidden="true" />
            {ui.text('training_stats_link', {})}
          </Link>
        </>
      }
      back={<BackLink to="/">{ui.text('back_home', {})}</BackLink>}
    >
      {errorMessage !== undefined && (
        <p
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="text-sm text-destructive outline-none"
        >
          {errorMessage}
        </p>
      )}
      {pending === undefined || drawId === undefined ? (
        <TrainingTiles
          ui={ui}
          config={config}
          disabled={actions.busy}
          focusOnMount={acted}
          onDraw={(categoryId) => act(() => actions.draw(categoryId))}
        />
      ) : (
        <>
          <LockedTiles
            ui={ui}
            config={config}
            currentCategoryId={categoryOfQuestion(config, pending.questionId)?.id}
          />
          <TrainingQuestion
            key={drawId}
            ui={ui}
            config={config}
            questionId={pending.questionId}
            disabled={actions.busy}
            animate={config.presentation.drawAnimation}
            focusOnMount={acted}
            onScore={(points) => act(() => actions.score(drawId, points))}
            onPass={() => act(() => actions.pass(drawId))}
          />
        </>
      )}
    </PageShell>
  )
}

/**
 * Écran d'entraînement (F43.3) : les états de chargement, introuvable et endommagé sont ceux de
 * `TrainingGate`, puis la vue sous l'apparence de la config.
 */
export function TrainingPage() {
  const { trainingId } = route.useParams()
  return (
    <TrainingGate trainingId={trainingId}>
      {(training, draws) => <TrainingView training={training} draws={draws} />}
    </TrainingGate>
  )
}
