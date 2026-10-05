import { isDamagedTraining, type StoredTraining } from '@/lib/db/damaged-training'
import type { Ui } from '@/lib/i18n/use-ui'
import { DamagedTrainingCard } from './damaged-training-card'
import { TrainingCard } from './training-card'

type TrainingListProps = Readonly<{ ui: Ui; trainings: readonly StoredTraining[] }>

/** Cartes des entraînements, dans l'ordre de `listTrainings` (dernière activité d'abord). */
export function TrainingList({ ui, trainings }: TrainingListProps) {
  return (
    <ul className="grid gap-4 2xl:grid-cols-2">
      {trainings.map((training) => (
        <li key={training.id}>
          {isDamagedTraining(training) ? (
            <DamagedTrainingCard ui={ui} damaged={training} />
          ) : (
            <TrainingCard ui={ui} training={training} />
          )}
        </li>
      ))}
    </ul>
  )
}
