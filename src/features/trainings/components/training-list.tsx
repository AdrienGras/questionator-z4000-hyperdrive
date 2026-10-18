import { isDamagedTraining, type StoredTraining } from '@/lib/db/damaged-training'
import type { Ui } from '@/lib/i18n/use-ui'
import { DamagedTrainingCard } from './damaged-training-card'
import { TrainingCard } from './training-card'

type TrainingListProps = Readonly<{ ui: Ui; trainings: readonly StoredTraining[] }>

/** Compteur et cartes des entraînements, dans l'ordre de `listTrainings` (dernière activité d'abord). */
export function TrainingList({ ui, trainings }: TrainingListProps) {
  return (
    <>
      <p className="text-[13px] leading-[18px] text-muted-foreground tabular-nums">
        {ui.text('trainings_count', { count: trainings.length })}
      </p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] gap-4">
        {trainings.map((training) => (
          <li key={training.id} className="flex">
            {isDamagedTraining(training) ? (
              <DamagedTrainingCard ui={ui} damaged={training} />
            ) : (
              <TrainingCard ui={ui} training={training} />
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
