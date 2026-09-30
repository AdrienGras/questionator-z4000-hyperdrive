import type { Session } from '@/domain/session/types'
import {
  addToTally,
  emptyTally,
  presentAttempts,
  questionKey,
  successRate,
  type Tally,
} from './config-order'
import type { TagStats } from './types'

type TaggedQuestion = { tags: string[]; scale: number[] }

/** Tags et barème de chaque question de la config, et un compteur vide par tag (ordre de première apparition). */
function indexTags(session: Session): {
  tallies: Map<string, Tally>
  tagsOf: Map<string, TaggedQuestion>
} {
  const tallies = new Map<string, Tally>()
  const tagsOf = new Map<string, TaggedQuestion>()
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
  return { tallies, tagsOf }
}

/** Notes et taux de réussite par tag, dans l'ordre de première apparition dans la config. */
export function computeTags(session: Session): TagStats[] {
  const { tallies, tagsOf } = indexTags(session)
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
