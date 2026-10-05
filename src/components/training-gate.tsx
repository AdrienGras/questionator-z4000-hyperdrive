import type { ReactNode } from 'react'
import { DamagedTrainingScreen } from '@/components/damaged-training-screen'
import { DbStatusBanner } from '@/components/db-status-banner'
import { SessionAppearance } from '@/components/session-appearance'
import { SessionFallback } from '@/components/session-fallback'
import type { Training, TrainingDraw } from '@/domain/training/types'
import { isDamagedTraining } from '@/lib/db/damaged-training'
import { useDbStatus, useTraining, useTrainingDraws } from '@/lib/db/hooks'
import { useUi } from '@/lib/i18n/use-ui'

type TrainingGateProps = Readonly<{
  trainingId: string
  /** Titre de l'écran « introuvable » ; par défaut, celui de l'écran d'entraînement. */
  notFound?: string
  /** Titre de l'écran « endommagé » ; par défaut, le titre générique. */
  damaged?: string
  /** Rendu sous l'apparence de la config, une fois l'entraînement et son journal lus. */
  children: (training: Training, draws: TrainingDraw[]) => ReactNode
}>

/**
 * États communs des écrans d'un entraînement (F43.3, F43.4) : base indisponible, introuvable,
 * chargement, endommagé, puis le contenu sous l'apparence de la config (mode couleur propre à
 * l'entraînement, distinct des sessions). `useUi()` ici ne sert qu'aux états sans config.
 */
export function TrainingGate({ trainingId, notFound, damaged, children }: TrainingGateProps) {
  const training = useTraining(trainingId)
  const draws = useTrainingDraws(trainingId)
  const status = useDbStatus()
  const ui = useUi()
  const messages = {
    loading: ui.text('training_loading', {}),
    notFound: notFound ?? ui.text('training_not_found', {}),
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
  if (isDamagedTraining(training))
    return <DamagedTrainingScreen ui={ui} damaged={training} title={damaged} />
  return (
    <SessionAppearance
      sessionId={`training-${training.id}`}
      view="examiner"
      config={training.config}
    >
      {children(training, draws)}
    </SessionAppearance>
  )
}
