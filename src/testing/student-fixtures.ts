import { normalize, type NormalizedConfig } from '@/domain/config/normalize'
import type { ParsedConfig } from '@/domain/config/schema'
import type { Attempt, Student } from '@/domain/session/types'
import { minimalConfig } from './config-fixtures'

/** Config normalisée de test : `minimalConfig` avec `scoring` et `absent` surchargés. */
export function makeConfig(
  scoring: Partial<ParsedConfig['scoring']> = {},
  absent?: ParsedConfig['absent'],
): NormalizedConfig {
  const config = minimalConfig()
  config.scoring = { ...config.scoring, ...scoring }
  if (absent !== undefined) config.absent = absent
  return normalize(config)
}

/** Nombre → attempt `scored` ; `'pending'` ; `{ skipped }` → attempt `skipped` avec ce motif. */
export type AttemptSpec = number | 'pending' | { skipped: string }

function makeAttempt(spec: AttemptSpec, index: number): Attempt {
  const base = {
    id: `attempt-${index + 1}`,
    categoryId: 'a',
    questionId: `a-${index + 1}`,
    drawnAt: '2026-09-25T09:00:00.000Z',
  }
  if (spec === 'pending') return { ...base, outcome: 'pending' }
  if (typeof spec === 'number') return { ...base, outcome: 'scored', score: spec }
  return { ...base, outcome: 'skipped', skipReason: spec.skipped }
}

export function makeStudent(
  attempts: AttemptSpec[] = [],
  overrides: Partial<Student> = {},
): Student {
  return {
    id: 'student-1',
    lastName: 'Durand',
    firstName: 'Alice',
    order: 1,
    addedDuringSession: false,
    absent: false,
    attempts: attempts.map((spec, index) => makeAttempt(spec, index)),
    ...overrides,
  }
}
