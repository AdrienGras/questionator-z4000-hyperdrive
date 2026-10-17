import type { NormalizedConfig } from '@/domain/config/normalize'
import type { Student } from '@/domain/session/types'

/** Un segment de la barre de progression du passage : une question notée, en cours ou à venir. */
export type PassageSegment = Readonly<{
  state: 'scored' | 'pending' | 'todo'
  categoryId?: string
  categoryLabel?: string
  color?: string
}>

/**
 * Segments de la barre de progression (artboard `passage-question`) : les questions notées dans
 * l'ordre du tirage, puis celle en cours, puis des segments vides jusqu'à `questionsPerStudent`.
 * Une question passée n'occupe aucun segment : elle ne compte pas dans le passage (F10).
 */
export function passageSegments(student: Student, config: NormalizedConfig): PassageSegment[] {
  const total = config.scoring.questionsPerStudent
  const filled = student.attempts
    .filter((attempt) => attempt.outcome !== 'skipped')
    .toSorted((a, b) => Number(a.outcome === 'pending') - Number(b.outcome === 'pending'))
    .map((attempt): PassageSegment => {
      const category = config.categories.find((c) => c.id === attempt.categoryId)
      return {
        state: attempt.outcome === 'pending' ? 'pending' : 'scored',
        categoryId: attempt.categoryId,
        categoryLabel: category?.label ?? attempt.categoryId,
        ...(category?.color !== undefined && { color: category.color }),
      }
    })
    .slice(0, total)
  const todo = Array.from({ length: total - filled.length }, (): PassageSegment => ({
    state: 'todo',
  }))
  return [...filled, ...todo]
}
