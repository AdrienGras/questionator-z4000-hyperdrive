import { describe, expect, test } from 'vitest'
import type { NormalizedConfig } from '../config/normalize'
import { makeSession } from '../test/session-fixtures'
import { makeStudent } from '../test/student-fixtures'
import { APP_VERSION } from '../app-version'
import { SessionSchema, type ParsedSession } from './schema'
import type { Session } from './types'

type Equal<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` distribue la comparaison sur A et B ; c'est le point de l'égalité de types, pas une inutilité.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
// `Simplify` aplatit l'intersection en un type objet simple : sans lui, `Equal` compare une
// intersection à un littéral d'objet et les juge différents alors qu'ils ont la même forme.
type Simplify<T> = { [K in keyof T]: T[K] }
type WithConfig = Simplify<Omit<ParsedSession, 'config'> & { config: NormalizedConfig }>
// Casse `tsc` si Session et SessionSchema divergent.
const aligned: Equal<WithConfig, Session> = true

function richSession(): Session {
  return makeSession({
    examiner: 'M. Dupont',
    activeStudentId: 'student-1',
    projection: { mode: 'student', studentId: 'student-1' },
    students: [
      makeStudent([2, { skipped: 'Déjà vue' }, 'pending'], {
        adjustment: { value: -0.5, reason: 'Hors sujet' },
        comment: 'Bien',
        finalRevealedAt: '2026-09-25T10:00:00.000Z',
      }),
      makeStudent([], { id: 'student-2', order: 2, absent: true }),
    ],
  })
}

function champManquant(s: Record<string, unknown>): void {
  delete s.name
}

function typeFaux(s: Record<string, unknown>): void {
  s.students = 'x'
}

function cleInconnue(s: Record<string, unknown>): void {
  s.extra = 1
}

function dateNonIso(s: Record<string, unknown>): void {
  s.updatedAt = '25/09/2026'
}

function nomVide(s: Record<string, unknown>): void {
  s.name = '   '
}

function outcomeInconnu(s: Record<string, unknown>): void {
  const attempt: unknown = {
    id: 'x',
    categoryId: 'a',
    questionId: 'a-1',
    drawnAt: '2026-09-25T09:00:00.000Z',
    outcome: 'done',
  }
  const student: unknown = { ...makeStudent(), attempts: [attempt] }
  s.students = [student]
}

describe('SessionSchema', () => {
  test('les types restent alignés', () => {
    expect(aligned).toBe(true)
  })

  test('accepte une session complète', () => {
    expect(SessionSchema.safeParse(richSession()).success).toBe(true)
  })

  test.each([
    ['champ manquant', champManquant],
    ['type faux', typeFaux],
    ['clé inconnue', cleInconnue],
    ['date non ISO', dateNonIso],
    ['nom vide', nomVide],
    ['outcome inconnu', outcomeInconnu],
  ])('refuse : %s', (_label, mutate) => {
    const session: Record<string, unknown> = { ...richSession() }
    mutate(session)
    expect(SessionSchema.safeParse(session).success).toBe(false)
  })

  test('APP_VERSION vient de package.json', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })
})
