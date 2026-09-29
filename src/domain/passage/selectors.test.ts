import { describe, expect, test } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import type { NormalizedCategory } from '@/domain/config/normalize'
import type { Attempt } from '@/domain/session/types'
import {
  availableQuestions,
  currentPending,
  isCategoryExhausted,
  nextStudent,
  questionIndex,
  shouldAutoOpenAdjustment,
} from './selectors'

const config = makeConfig({ questionsPerStudent: 3 })
const category: NormalizedCategory = {
  ...config.categories[0]!,
  questions: [
    { id: 'a-1', title: 'Q1', tags: [], prompt: 'Prompt 1' },
    { id: 'a-2', title: 'Q2', tags: [], prompt: 'Prompt 2' },
    { id: 'a-3', title: 'Q3', tags: [], prompt: 'Prompt 3' },
  ],
}

function attempt(overrides: Partial<Attempt>): Attempt {
  return {
    id: 'attempt-x',
    categoryId: 'a',
    questionId: 'a-1',
    drawnAt: '2026-09-25T09:00:00.000Z',
    outcome: 'scored',
    ...overrides,
  }
}

describe('availableQuestions', () => {
  test('exclut les questions déjà tirées (scored, pending, skipped)', () => {
    const student = makeStudent([], {
      attempts: [
        attempt({ id: 'a1', questionId: 'a-1', outcome: 'scored', score: 1 }),
        attempt({ id: 'a2', questionId: 'a-2', outcome: 'pending' }),
        attempt({ id: 'a3', questionId: 'a-3', outcome: 'skipped', skipReason: 'x' }),
      ],
    })
    expect(availableQuestions(student, category)).toEqual([])
  })

  test("un tirage d'un autre étudiant n'influe pas", () => {
    const student = makeStudent([])
    expect(availableQuestions(student, category)).toHaveLength(3)
  })

  test("un attempt de même questionId mais autre categoryId n'exclut rien", () => {
    const student = makeStudent([], {
      attempts: [
        attempt({ id: 'a1', categoryId: 'autre', questionId: 'a-1', outcome: 'scored', score: 1 }),
      ],
    })
    expect(availableQuestions(student, category)).toHaveLength(3)
  })
})

describe('isCategoryExhausted', () => {
  test('vrai quand toutes les questions sont tirées', () => {
    const student = makeStudent([], {
      attempts: [
        attempt({ id: 'a1', questionId: 'a-1', outcome: 'scored', score: 1 }),
        attempt({ id: 'a2', questionId: 'a-2', outcome: 'scored', score: 1 }),
        attempt({ id: 'a3', questionId: 'a-3', outcome: 'scored', score: 1 }),
      ],
    })
    expect(isCategoryExhausted(student, category)).toBe(true)
  })

  test('faux sinon', () => {
    const student = makeStudent([], {
      attempts: [attempt({ id: 'a1', questionId: 'a-1', outcome: 'scored', score: 1 })],
    })
    expect(isCategoryExhausted(student, category)).toBe(false)
  })
})

describe('currentPending', () => {
  test("renvoie l'attempt pending", () => {
    const pending = attempt({ id: 'a2', questionId: 'a-2', outcome: 'pending' })
    const student = makeStudent([], { attempts: [pending] })
    expect(currentPending(student)).toEqual(pending)
  })

  test('undefined sinon', () => {
    const student = makeStudent([], {
      attempts: [attempt({ id: 'a1', questionId: 'a-1', outcome: 'scored', score: 1 })],
    })
    expect(currentPending(student)).toBeUndefined()
  })
})

describe('questionIndex', () => {
  const indexConfig = makeConfig({ questionsPerStudent: 3 })

  test.each<[Parameters<typeof makeStudent>[0], { current: number; total: number }]>([
    [[], { current: 1, total: 3 }],
    [['pending'], { current: 1, total: 3 }],
    [[1], { current: 2, total: 3 }],
    [[1, { skipped: 'x' }], { current: 2, total: 3 }],
    [[1, 1, 1], { current: 3, total: 3 }],
  ])('%j → %j', (attempts, expected) => {
    expect(questionIndex(makeStudent(attempts), indexConfig)).toEqual(expected)
  })
})

describe('nextStudent', () => {
  const one = makeConfig({ questionsPerStudent: 1 })
  const s1 = makeStudent([10], { id: 's1', order: 1 })
  const s2 = makeStudent([], { id: 's2', order: 2, absent: true })
  const s3 = makeStudent([], { id: 's3', order: 3 })
  const s4 = makeStudent(['pending'], { id: 's4', order: 4 })
  const s5 = makeStudent([12], { id: 's5', order: 5 })
  const sorted = makeSession({ config: one, students: [s1, s2, s3, s4, s5] })
  const unsorted = makeSession({ config: one, students: [s3, s1, s5, s4, s2] })

  test.each([
    ['s1', 's3'],
    ['s3', 's4'],
    ['s4', 's3'],
    ['s5', 's3'],
    ['inconnu', 's3'],
    [undefined, 's3'],
  ])('depuis %s → %s', (currentId, expected) => {
    expect(nextStudent(sorted, currentId)).toBe(expected)
    expect(nextStudent(unsorted, currentId)).toBe(expected)
  })

  test('seul candidat = courant → null', () => {
    const session = makeSession({ config: one, students: [s1, s2, s3, s5] })
    expect(nextStudent(session, 's3')).toBeNull()
  })

  test('tous done ou absents → null', () => {
    const session = makeSession({ config: one, students: [s1, s2, s5] })
    expect(nextStudent(session, 's1')).toBeNull()
    expect(nextStudent(session, undefined)).toBeNull()
  })
})

describe('shouldAutoOpenAdjustment', () => {
  const one = makeConfig({ questionsPerStudent: 1 })

  test('done sans finalRevealedAt → vrai', () => {
    expect(shouldAutoOpenAdjustment(makeStudent([10]), one)).toBe(true)
  })

  test('done avec finalRevealedAt → faux', () => {
    const student = makeStudent([10], { finalRevealedAt: '2026-09-25T10:00:00.000Z' })
    expect(shouldAutoOpenAdjustment(student, one)).toBe(false)
  })

  test('en cours → faux', () => {
    expect(shouldAutoOpenAdjustment(makeStudent(['pending']), one)).toBe(false)
  })

  test('absent → faux', () => {
    expect(shouldAutoOpenAdjustment(makeStudent([], { absent: true }), one)).toBe(false)
  })
})
