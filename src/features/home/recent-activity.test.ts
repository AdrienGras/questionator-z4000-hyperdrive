import { expect, test } from 'vitest'
import type { DamagedSession } from '@/lib/db/damaged-session'
import { makeSession } from '@/testing/session-fixtures'
import { makeTraining } from '@/testing/training-fixtures'
import { recentActivity, type RecentItem } from './recent-activity'

const at = (day: number) => `2026-10-${String(day).padStart(2, '0')}T09:00:00.000Z`

/** Identifiant de l'enregistrement d'un élément, préfixé de son type. */
function label(item: RecentItem): string {
  return item.kind === 'session' ? `s:${item.session.id}` : `t:${item.training.id}`
}

test('trois éléments au plus, sessions et entraînements mêlés, le plus récent d’abord', () => {
  const sessions = [
    makeSession({ id: 's10', updatedAt: at(10) }),
    makeSession({ id: 's14', updatedAt: at(14) }),
    makeSession({ id: 's2', updatedAt: at(2) }),
  ]
  const trainings = [
    makeTraining({ id: 't13', updatedAt: at(13) }),
    makeTraining({ id: 't1', updatedAt: at(1) }),
  ]
  expect(recentActivity(sessions, trainings).map(label)).toEqual(['s:s14', 't:t13', 's:s10'])
})

test('endommagés exclus', () => {
  const damaged: DamagedSession = {
    id: 'abime',
    damaged: true,
    raw: { updatedAt: at(30) },
    issues: [],
  }
  const sessions = [damaged, makeSession({ id: 's1', updatedAt: at(1) })]
  expect(recentActivity(sessions, []).map(label)).toEqual(['s:s1'])
})

test('rien de lisible : liste vide', () => {
  expect(recentActivity([], [])).toEqual([])
})
