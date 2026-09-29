import { describe, expect, test } from 'vitest'
import { normalize, type NormalizedConfig } from '@/domain/config/normalize'
import type { ParsedConfig } from '@/domain/config/schema'
import type { Session, Student } from '@/domain/session/types'
import { minimalConfig } from '@/testing/config-fixtures'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { toProjectedView, type ProjectedStudentView } from './projected-view'

/** Deux catégories : « a » (3 questions, barème 0-2) et « b » (1 seule question, barème 0-4). */
function buildConfig(
  patch: {
    scoring?: Partial<ParsedConfig['scoring']>
    presentation?: ParsedConfig['presentation']
  } = {},
): NormalizedConfig {
  const config = minimalConfig()
  config.scoring = { ...config.scoring, questionsPerStudent: 2, ...patch.scoring }
  if (patch.presentation !== undefined) config.presentation = patch.presentation
  config.categories = [
    {
      id: 'a',
      label: 'Catégorie A',
      scale: [0, 1, 1.5, 2],
      color: '#ff0000',
      icon: 'star',
      questions: [
        { id: 'a-1', prompt: 'Énoncé A1' },
        { id: 'a-2', prompt: 'Énoncé A2' },
        { id: 'a-3', prompt: 'Énoncé A3' },
      ],
    },
    {
      id: 'b',
      label: 'Catégorie B',
      scale: [0, 2, 4],
      questions: [{ id: 'b-1', prompt: 'Énoncé B1' }],
    },
  ]
  return normalize(config)
}

function sessionOf(
  student: Student,
  patch: Parameters<typeof buildConfig>[0] = {},
  extra: Partial<Session> = {},
): Session {
  return makeSession({
    config: buildConfig(patch),
    students: [student],
    projection: { mode: 'student', studentId: student.id },
    ...extra,
  })
}

function studentView(session: Session): ProjectedStudentView {
  const view = toProjectedView(session)
  if (view.mode !== 'student') throw new Error('vue étudiant attendue')
  return view
}

const revealed = '2026-09-29T10:00:00.000Z'

describe('toProjectedView', () => {
  test('waiting : titre et apparence seulement', () => {
    const session = makeSession({ projection: { mode: 'waiting' } })
    expect(toProjectedView(session)).toEqual({
      mode: 'waiting',
      examTitle: session.config.exam.title,
      appearance: {
        theme: session.config.theme,
        presentation: { defaultColorMode: session.config.presentation.defaultColorMode },
      },
    })
  })

  test('locale de la config reprise dans appearance', () => {
    const session = makeSession({ projection: { mode: 'waiting' } })
    session.config.locale = 'en'
    expect(toProjectedView(session).appearance.locale).toBe('en')
  })

  test('studentId inconnu : waiting', () => {
    const session = makeSession({ projection: { mode: 'student', studentId: 'inconnu' } })
    expect(toProjectedView(session).mode).toBe('waiting')
  })

  test('étudiant projeté absent : waiting', () => {
    const session = sessionOf(makeStudent([], { absent: true }))
    expect(toProjectedView(session).mode).toBe('waiting')
  })

  test('étudiant sans tirage : catégories dans l’ordre, aucune question en cours', () => {
    const view = studentView(sessionOf(makeStudent([])))
    expect(view.student).toEqual({ firstName: 'Alice', lastName: 'Durand' })
    expect(view.categories).toEqual([
      {
        id: 'a',
        label: 'Catégorie A',
        maxPoints: 2,
        color: '#ff0000',
        icon: 'star',
        exhausted: false,
        disabled: false,
      },
      { id: 'b', label: 'Catégorie B', maxPoints: 4, exhausted: false, disabled: false },
    ])
    expect('current' in view).toBe(false)
    expect(view.questionIndex).toEqual({ current: 1, total: 2 })
    expect(view.finished).toBe(false)
    expect(view.drawAnimation).toBe(true)
    expect('final' in view).toBe(false)
    expect('detail' in view).toBe(false)
  })

  test('question en cours : énoncé seul, catégories désactivées', () => {
    const view = studentView(sessionOf(makeStudent(['pending'])))
    expect(view.current).toEqual({
      categoryId: 'a',
      prompt: 'Énoncé A1',
      drawnAt: '2026-09-25T09:00:00.000Z',
    })
    expect(view.categories.every((category) => category.disabled)).toBe(true)
  })

  test('catégorie à une seule question déjà tirée : épuisée', () => {
    const student = makeStudent([1])
    student.attempts[0] = { ...student.attempts[0]!, categoryId: 'b', questionId: 'b-1' }
    const view = studentView(sessionOf(student))
    expect(view.categories.map((category) => category.exhausted)).toEqual([false, true])
  })

  test('cumul : absent sans showCumulativeScore, somme des points notés sinon', () => {
    const student = makeStudent([1.5, 2])
    const off = studentView(sessionOf(student, { presentation: { showCumulativeScore: false } }))
    expect('cumulativeRaw' in off).toBe(false)
    const on = studentView(sessionOf(student, { presentation: { showCumulativeScore: true } }))
    expect(on.cumulativeRaw).toBe(3.5)
  })

  test('terminé sans révélation : finished, pas de final, catégories désactivées', () => {
    const view = studentView(sessionOf(makeStudent([1, 2])))
    expect(view.finished).toBe(true)
    expect('final' in view).toBe(false)
    expect(view.categories.every((category) => category.disabled)).toBe(true)
  })

  describe('terminé et révélé', () => {
    // raw = 3, maxRawScore 4, échelle 20 → converti 15 ; ajustement +1,5 → final 16,5.
    const student = makeStudent([1, 2], {
      finalRevealedAt: revealed,
      adjustment: { value: 1.5 },
    })
    const scoring = { maxRawScore: 4, finalScale: 20 }

    test('raw : note brute et échelle', () => {
      const view = studentView(
        sessionOf(student, { scoring, presentation: { finalScoreDisplay: 'raw' } }),
      )
      expect(view.final).toEqual({ raw: 3, scale: 20 })
    })

    test('converted : note finale, ajustement compris', () => {
      const view = studentView(
        sessionOf(student, { scoring, presentation: { finalScoreDisplay: 'converted' } }),
      )
      expect(view.final).toEqual({ final: 16.5, scale: 20 })
    })

    test('both : les trois clés', () => {
      const view = studentView(
        sessionOf(student, { scoring, presentation: { finalScoreDisplay: 'both' } }),
      )
      expect(view.final).toEqual({ raw: 3, final: 16.5, scale: 20 })
    })
  })

  test('révélé mais note finale non calculable (pas terminé) : aucun final', () => {
    const student = makeStudent([1], { finalRevealedAt: revealed })
    const view = studentView(sessionOf(student, { presentation: { finalScoreDisplay: 'both' } }))
    expect(view.finished).toBe(false)
    expect('final' in view).toBe(false)
  })

  test('detail : dans l’ordre du tirage, passe sans points', () => {
    const student = makeStudent([1, { skipped: 'Hors sujet' }, 2])
    const view = studentView(
      sessionOf(student, {
        scoring: { questionsPerStudent: 2 },
        presentation: { showStatsOnFinal: true },
      }),
    )
    expect(view.detail).toEqual([
      { categoryLabel: 'Catégorie A', title: 'Énoncé A1', points: 1, maxPoints: 2, skipped: false },
      { categoryLabel: 'Catégorie A', title: 'Énoncé A2', maxPoints: 2, skipped: true },
      { categoryLabel: 'Catégorie A', title: 'Énoncé A3', points: 2, maxPoints: 2, skipped: false },
    ])
    expect('points' in view.detail![1]!).toBe(false)
  })

  test('detail : absent sans showStatsOnFinal', () => {
    const view = studentView(
      sessionOf(makeStudent([1, 2]), { presentation: { showStatsOnFinal: false } }),
    )
    expect('detail' in view).toBe(false)
  })

  describe('étanchéité', () => {
    const markers = ['FUITE-ANSWER', 'FUITE-TAG', 'FUITE-COMMENT', 'FUITE-REASON', 'FUITE-SKIP']
    // Montant d'ajustement et date d'édition improbables : ne doivent jamais apparaître tels quels.
    const editedAt = '1999-12-31T23:59:59.999Z'
    const adjustmentValue = 0.37
    const other = makeStudent([], {
      id: 'student-secret-2',
      firstName: 'FUITE-PRENOM',
      lastName: 'FUITE-NOM',
      order: 2,
    })

    function leakySession(student: Student, projection: Session['projection']): Session {
      const config = buildConfig({
        scoring: { maxRawScore: 4, finalScale: 20 },
        presentation: { finalScoreDisplay: 'both', showStatsOnFinal: true },
      })
      for (const category of config.categories) {
        for (const question of category.questions) {
          question.answer = 'FUITE-ANSWER'
          question.tags = ['FUITE-TAG']
        }
      }
      for (const attempt of student.attempts) attempt.editedAt = editedAt
      return makeSession({ config, students: [student, other], projection })
    }

    /** Marqueurs et identifiants d'étudiants retrouvés dans la vue sérialisée (attendu : aucun). */
    function leaks(session: Session): string[] {
      const json = JSON.stringify(toProjectedView(session))
      const forbidden = [
        ...markers,
        'FUITE-PRENOM',
        'FUITE-NOM',
        editedAt,
        String(adjustmentValue),
        ...session.students.map((student) => student.id),
      ]
      return forbidden.filter((value) => json.includes(value))
    }

    const base = {
      comment: 'FUITE-COMMENT',
      adjustment: { value: adjustmentValue, reason: 'FUITE-REASON' },
    }

    test('waiting', () => {
      expect(leaks(leakySession(makeStudent([1], base), { mode: 'waiting' }))).toEqual([])
    })

    test('question en cours', () => {
      const student = makeStudent([{ skipped: 'FUITE-SKIP' }, 'pending'], base)
      expect(leaks(leakySession(student, { mode: 'student', studentId: student.id }))).toEqual([])
    })

    test('terminé, révélé, détail et note complète', () => {
      const student = makeStudent([1, { skipped: 'FUITE-SKIP' }, 2], {
        ...base,
        finalRevealedAt: revealed,
      })
      const session = leakySession(student, { mode: 'student', studentId: student.id })
      expect(toProjectedView(session).mode).toBe('student')
      expect(leaks(session)).toEqual([])
    })
  })
})
