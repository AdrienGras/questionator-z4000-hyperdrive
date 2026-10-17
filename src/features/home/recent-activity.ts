import type { Session } from '@/domain/session/types'
import type { Training } from '@/domain/training/types'
import { isDamaged, type StoredSession } from '@/lib/db/damaged-session'
import { isDamagedTraining, type StoredTraining } from '@/lib/db/damaged-training'
import { compareRecords } from '@/lib/db/record-order'

export type RecentItem =
  | { kind: 'session'; session: Session }
  | { kind: 'training'; training: Training }

const recordOf = (item: RecentItem) => (item.kind === 'session' ? item.session : item.training)

/**
 * Section « Reprendre » de l'accueil (D103) : les `limit` éléments les plus récents, sessions et
 * entraînements confondus, dans l'ordre des listes (`compareRecords`) ; les endommagés n'y sont
 * pas, ils ne se reprennent pas.
 */
export function recentActivity(
  sessions: readonly StoredSession[],
  trainings: readonly StoredTraining[],
  limit = 3,
): RecentItem[] {
  const items: RecentItem[] = [
    ...sessions
      .filter((s): s is Session => !isDamaged(s))
      .map((session) => ({ kind: 'session' as const, session })),
    ...trainings
      .filter((t): t is Training => !isDamagedTraining(t))
      .map((training) => ({ kind: 'training' as const, training })),
  ]
  return items.toSorted((a, b) => compareRecords(recordOf(a), recordOf(b))).slice(0, limit)
}
