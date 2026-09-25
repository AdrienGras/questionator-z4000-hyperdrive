import { APP_VERSION } from '../app-version'
import type { NormalizedConfig } from '../config/normalize'
import type { Session, Student } from '../domain/types'

export type BuildSessionInput = {
  name: string
  examiner: string
  config: NormalizedConfig
  students: readonly { lastName: string; firstName: string }[]
}

export type BuildSessionDeps = { newId: () => string; now: () => Date }

/**
 * Session fraîche (F06) : config normalisée figée, étudiants dans l'ordre du CSV, premier
 * étudiant actif, projection en attente. Examinateur vide → clé absente (D11).
 */
export function buildSession(input: BuildSessionInput, deps: BuildSessionDeps): Session {
  if (input.students.length === 0) throw new Error('Une session exige au moins un étudiant.')
  const timestamp = deps.now().toISOString()
  const id = deps.newId()
  const students: Student[] = input.students.map((student, index) => ({
    id: deps.newId(),
    lastName: student.lastName,
    firstName: student.firstName,
    order: index + 1,
    addedDuringSession: false,
    absent: false,
    attempts: [],
  }))
  const examiner = input.examiner.trim()
  return {
    id,
    name: input.name.trim(),
    ...(examiner !== '' && { examiner }),
    createdAt: timestamp,
    updatedAt: timestamp,
    appVersion: APP_VERSION,
    config: input.config,
    students,
    activeStudentId: students[0]?.id,
    projection: { mode: 'waiting' },
  }
}
