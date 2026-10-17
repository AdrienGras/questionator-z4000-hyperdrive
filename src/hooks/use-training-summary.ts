import { useMemo } from 'react'
import { computeTrainingStats } from '@/domain/training/training-stats'
import type { Training } from '@/domain/training/types'
import { useTrainingDraws } from '@/lib/db/hooks'

/** Taux de réussite global (`null` sans note) et couverture d'un entraînement. */
export type TrainingSummary = { rate: number | null; coverage: { covered: number; total: number } }

/** Résumé d'un entraînement pour ses cartes ; `undefined` tant que le journal n'est pas lu. */
export function useTrainingSummary(training: Training): TrainingSummary | undefined {
  const draws = useTrainingDraws(training.id)
  return useMemo(() => {
    if (draws === undefined) return undefined
    const stats = computeTrainingStats(training.config, draws)
    return { rate: stats.rate.rate, coverage: stats.coverage }
  }, [training.config, draws])
}
