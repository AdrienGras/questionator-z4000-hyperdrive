import type { NormalizedConfig } from '@/domain/config/normalize'
import { mean } from './numbers'
import type { Strategy, StudentScore } from './types'

type Composition = Strategy['composition']

/** Composition d'un étudiant : catégories de ses questions notées, dans l'ordre de la config. */
function compositionOf(
  student: StudentScore['student'],
  rankOf: (categoryId: string) => number,
): Composition {
  const counts = new Map<string, number>()
  for (const attempt of student.attempts) {
    if (attempt.outcome !== 'scored') continue
    counts.set(attempt.categoryId, (counts.get(attempt.categoryId) ?? 0) + 1)
  }
  return [...counts]
    .map(([categoryId, count]) => ({ categoryId, count }))
    .toSorted(
      (a, b) =>
        rankOf(a.categoryId) - rankOf(b.categoryId) || a.categoryId.localeCompare(b.categoryId),
    )
}

/** Départage deux compositions : ordre des catégories, puis nombre décroissant. */
function compareCompositions(
  a: Composition,
  b: Composition,
  rankOf: (id: string) => number,
): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i]
    const y = b[i]
    if (!x || !y) return x ? 1 : -1
    const diff =
      rankOf(x.categoryId) - rankOf(y.categoryId) ||
      x.categoryId.localeCompare(y.categoryId) ||
      y.count - x.count
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * Stratégies des étudiants terminés : multiensemble des catégories de leurs questions notées.
 * Triées par effectif décroissant, puis par composition.
 */
export function computeStrategies(scored: StudentScore[], config: NormalizedConfig): Strategy[] {
  const ranks = new Map(config.categories.map((category, index) => [category.id, index]))
  const rankOf = (categoryId: string): number => ranks.get(categoryId) ?? Number.MAX_SAFE_INTEGER
  const groups = new Map<
    string,
    { composition: Composition; finals: NonNullable<StudentScore['scores']['final']>[] }
  >()
  for (const { student, status, scores } of scored) {
    if (status !== 'done' || scores.final === null) continue
    const composition = compositionOf(student, rankOf)
    const key = composition.map((c) => `${c.categoryId}×${c.count}`).join('+')
    const group = groups.get(key)
    if (group) group.finals.push(scores.final)
    else groups.set(key, { composition, finals: [scores.final] })
  }
  return [...groups.values()]
    .map(({ composition, finals }) => ({
      composition,
      students: finals.length,
      meanFinal: mean(finals) ?? 0,
    }))
    .toSorted(
      (a, b) =>
        b.students - a.students || compareCompositions(a.composition, b.composition, rankOf),
    )
}
