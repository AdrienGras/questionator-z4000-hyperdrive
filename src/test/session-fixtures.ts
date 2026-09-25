import type { Session } from '../domain/types'
import { makeConfig, makeStudent } from './student-fixtures'

/** Session de test minimale et valide ; nouvel objet à chaque appel. */
export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    name: 'Oral de test',
    createdAt: '2026-09-25T08:00:00.000Z',
    updatedAt: '2026-09-25T08:00:00.000Z',
    appVersion: '0.1.0',
    config: makeConfig(),
    students: [makeStudent()],
    projection: { mode: 'waiting' },
    ...overrides,
  }
}
