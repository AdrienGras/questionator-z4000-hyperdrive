import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { DbStatusBanner } from '@/components/db-status-banner'
import { PageShell } from '@/components/page-shell'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import { SMALL_TEXT_LINK_CLASS } from '@/components/text-link'
import { currentPending } from '@/domain/training/cycle-draw'
import { TrainingError } from '@/domain/training/errors'
import { trainingErrorMessage } from '@/domain/training/errors-messages'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { isDamagedTraining } from '@/lib/db/damaged-training'
import { useDbStatus, useTraining, useTrainingDraws } from '@/lib/db/hooks'
import { useUi, type Ui } from '@/lib/i18n/use-ui'
import { cn } from '@/lib/utils'
import { DamagedTrainingScreen } from '@/features/training/components/damaged-training-screen'
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
 * Corps de l'écran, une colonne : les tuiles, ou la question en cours qui les remplace. Le focus
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
      ui={ui}
      title={training.name}
      back={
        <Link to="/" className={cn('self-start', SMALL_TEXT_LINK_CLASS)}>
          {ui.text('back_home', {})}
        </Link>
      }
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
      )}
    </PageShell>
  )
}

/**
 * Écran d'entraînement (F43.3) : états de chargement, introuvable et endommagé, puis la vue sous
 * l'apparence de la config (mode couleur propre à l'entraînement, distinct des sessions).
 */
export function TrainingPage() {
  const { trainingId } = route.useParams()
  const training = useTraining(trainingId)
  const draws = useTrainingDraws(trainingId)
  const status = useDbStatus()
  const ui = useUi()
  const messages = {
    loading: ui.text('training_loading', {}),
    notFound: ui.text('training_not_found', {}),
  }
  if (status !== 'open')
    return (
      <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 sm:p-6">
        <DbStatusBanner ui={ui} status={status} />
      </main>
    )
  if (training === null) return <SessionFallback ui={ui} kind="not-found" messages={messages} />
  if (training === undefined || draws === undefined)
    return <SessionFallback ui={ui} kind="loading" messages={messages} />
  if (isDamagedTraining(training)) return <DamagedTrainingScreen ui={ui} damaged={training} />
  return (
    <SessionAppearance
      sessionId={`training-${training.id}`}
      view="examiner"
      config={training.config}
    >
      <TrainingView training={training} draws={draws} />
    </SessionAppearance>
  )
}
