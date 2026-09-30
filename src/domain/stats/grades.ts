import type { NormalizedConfig } from '@/domain/config/normalize'
import { asMilli, toMilli, type Milli } from '@/domain/scoring/milli'
import { mean, median, populationStdDev } from './numbers'
import type { GradeStats, HistogramBin, StudentScore } from './types'

/** Notes finales (millièmes) des seuls étudiants terminés. */
function finals(scored: StudentScore[]): Milli[] {
  const values: Milli[] = []
  for (const { status, scores } of scored) {
    if (status !== 'done') continue
    if (scores.final === null) throw new RangeError('Étudiant terminé sans note finale')
    values.push(scores.final)
  }
  return values
}

/** Agrégats des notes finales des étudiants terminés ; tout à `null` si aucun. */
export function computeGrades(scored: StudentScore[]): GradeStats {
  const values = finals(scored)
  if (values.length === 0) {
    return { count: 0, min: null, max: null, mean: null, median: null, stdDev: null }
  }
  return {
    count: values.length,
    min: asMilli(Math.min(...values)),
    max: asMilli(Math.max(...values)),
    mean: mean(values),
    median: median(values),
    stdDev: populationStdDev(values),
  }
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000

/**
 * Histogramme des notes finales : pas de 1 jusqu'à /20, sinon 20 barres de `finalScale / 20`.
 * L'indice se calcule en entiers ; la dernière barre est fermée et absorbe la note maximale.
 */
export function computeHistogram(scored: StudentScore[], config: NormalizedConfig): HistogramBin[] {
  const { finalScale } = config.scoring
  const small = finalScale <= 20
  const count = small ? Math.ceil(finalScale) : 20
  const width = small ? 1 : finalScale / 20
  const scaleMilli = toMilli(finalScale)
  const bins: HistogramBin[] = Array.from({ length: count }, (_, k) => ({
    from: round3(k * width),
    to: round3(Math.min((k + 1) * width, finalScale)),
    count: 0,
  }))
  for (const value of finals(scored)) {
    const index = small ? Math.floor(value / 1000) : Math.floor((value * 20) / scaleMilli)
    const bin = bins[Math.min(index, count - 1)]
    if (bin) bin.count++
  }
  return bins
}
