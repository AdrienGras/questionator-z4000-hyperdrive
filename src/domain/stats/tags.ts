import type { Session } from '@/domain/session/types'
import { addToTally, emptyTally, presentAttempts, questionKey, successRate } from './config-order'
import type { TagStats } from './types'

/** Notes et taux de réussite par tag, dans l'ordre de première apparition dans la config. */
export function computeTags(session: Session): TagStats[] {
  const tallies = new Map<string, ReturnType<typeof emptyTally>>()
  const tagsOf = new Map<string, { tags: string[]; scale: number[] }>()
  for (const category of session.config.categories) {
    for (const question of category.questions) {
      tagsOf.set(questionKey(category.id, question.id), {
        tags: question.tags,
        scale: category.scale,
      })
      for (const tag of question.tags) {
        if (!tallies.has(tag)) tallies.set(tag, emptyTally())
      }
    }
  }
  for (const attempt of presentAttempts(session)) {
    if (attempt.outcome !== 'scored') continue
    const known = tagsOf.get(questionKey(attempt.categoryId, attempt.questionId))
    if (!known) continue
    for (const tag of new Set(known.tags)) {
      const tally = tallies.get(tag)
      if (tally) addToTally(tally, attempt, known.scale)
    }
  }
  return [...tallies].map(([tag, tally]) => ({
    tag,
    scored: tally.scored,
    successRate: successRate(tally),
  }))
}
