import type { Session } from '@/domain/session/types'
import { addToTally, emptyTally, presentAttempts, successRate } from './config-order'
import type { CategoryStats } from './types'

/** Choix, notes et taux de réussite par catégorie, dans l'ordre de la config. */
export function computeCategories(session: Session): CategoryStats[] {
  const attempts = presentAttempts(session)
  return session.config.categories.map((category) => {
    const tally = emptyTally()
    let choices = 0
    for (const attempt of attempts) {
      if (attempt.categoryId !== category.id) continue
      if (attempt.outcome === 'scored') {
        choices++
        addToTally(tally, attempt, category.scale)
      } else if (attempt.outcome === 'skipped') {
        choices++
      }
    }
    return {
      categoryId: category.id,
      choices,
      scored: tally.scored,
      successRate: successRate(tally),
    }
  })
}
