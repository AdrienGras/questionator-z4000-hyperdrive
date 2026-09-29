import { normalize } from '@/domain/config/normalize'
import type { ParsedConfig } from '@/domain/config/schema'
import type { Attempt, Session, Student } from '@/domain/session/types'
import { minimalConfig } from './config-fixtures'
import { makeSession } from './session-fixtures'
import { makeStudent } from './student-fixtures'

/** Attempt explicite (catégorie et question au choix) ; `score` seul → `scored`, `skipReason` → `skipped`. */
export function attemptOf(
  categoryId: string,
  questionId: string,
  result: number | 'pending' | { skipped?: string },
  id = `${categoryId}-${questionId}-${Math.random()}`,
): Attempt {
  const base = { id, categoryId, questionId, drawnAt: '2026-09-25T09:00:00.000Z' }
  if (result === 'pending') return { ...base, outcome: 'pending' }
  if (typeof result === 'number') return { ...base, outcome: 'scored', score: result }
  return result.skipped === undefined
    ? { ...base, outcome: 'skipped' }
    : { ...base, outcome: 'skipped', skipReason: result.skipped }
}

/** Session dont un seul étudiant (ou plusieurs) porte les attempts donnés, config surchargeable. */
export function sessionWith(
  attemptsPerStudent: Attempt[][],
  config: ParsedConfig = minimalConfig(),
  overrides: (index: number) => Partial<Student> = () => ({}),
): Session {
  return makeSession({
    config: normalize(config),
    students: attemptsPerStudent.map((attempts, index) =>
      makeStudent([], {
        id: `student-${index + 1}`,
        order: index + 1,
        attempts,
        ...overrides(index),
      }),
    ),
  })
}
