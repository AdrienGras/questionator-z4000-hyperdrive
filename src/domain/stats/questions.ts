import type { Session } from '@/domain/session/types'
import { presentAttempts, questionKey, questionRanks, UNKNOWN_RANK } from './config-order'
import type { DrawnQuestion, SkippedQuestion } from './types'

const TOP_DRAWN_LIMIT = 10

type Ranks = Map<string, number>
type Keyed = { categoryId: string; questionId: string }

const rankOf = (ranks: Ranks, item: Keyed): number =>
  ranks.get(questionKey(item.categoryId, item.questionId)) ?? UNKNOWN_RANK

/** Ordre de la config, puis ids (déterminisme pour les questions inconnues). */
function byConfigOrder(ranks: Ranks, a: Keyed, b: Keyed): number {
  return (
    rankOf(ranks, a) - rankOf(ranks, b) ||
    a.categoryId.localeCompare(b.categoryId) ||
    a.questionId.localeCompare(b.questionId)
  )
}

/** Nombre d'attempts par question, indexé par clé, en gardant l'identité de la question. */
function countBy<T>(items: T[], keyOf: (item: T) => string): Map<string, { first: T; items: T[] }> {
  const groups = new Map<string, { first: T; items: T[] }>()
  for (const item of items) {
    const key = keyOf(item)
    const group = groups.get(key)
    if (group) group.items.push(item)
    else groups.set(key, { first: item, items: [item] })
  }
  return groups
}

/** Les 10 questions les plus tirées (tous résultats), ex æquo dans l'ordre de la config. */
export function computeTopDrawn(session: Session): DrawnQuestion[] {
  const ranks = questionRanks(session.config)
  const groups = countBy(presentAttempts(session), (a) => questionKey(a.categoryId, a.questionId))
  return [...groups.values()]
    .map(({ first, items }) => ({
      categoryId: first.categoryId,
      questionId: first.questionId,
      count: items.length,
    }))
    .toSorted((a, b) => b.count - a.count || byConfigOrder(ranks, a, b))
    .slice(0, TOP_DRAWN_LIMIT)
}

/** Questions passées au moins une fois, avec leurs motifs (« sans motif » = `null`, en dernier). */
export function computeSkipped(session: Session): SkippedQuestion[] {
  const ranks = questionRanks(session.config)
  const configured = session.config.skips.reasons
  const reasonRank = (reason: string): number => {
    const index = configured.indexOf(reason)
    return index === -1 ? UNKNOWN_RANK : index
  }
  const skips = presentAttempts(session).filter((attempt) => attempt.outcome === 'skipped')
  const groups = countBy(skips, (a) => questionKey(a.categoryId, a.questionId))
  return [...groups.values()]
    .map(({ first, items }) => {
      const counts = new Map<string | null, number>()
      for (const attempt of items) {
        const reason = attempt.skipReason ?? null
        counts.set(reason, (counts.get(reason) ?? 0) + 1)
      }
      const reasons = [...counts]
        .map(([reason, count]) => ({ reason, count }))
        .toSorted((a, b) => {
          if (a.reason === null || b.reason === null) {
            return Number(a.reason === null) - Number(b.reason === null)
          }
          return (
            b.count - a.count ||
            reasonRank(a.reason) - reasonRank(b.reason) ||
            a.reason.localeCompare(b.reason)
          )
        })
      return {
        categoryId: first.categoryId,
        questionId: first.questionId,
        total: items.length,
        reasons,
      }
    })
    .toSorted((a, b) => b.total - a.total || byConfigOrder(ranks, a, b))
}
