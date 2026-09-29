import 'fake-indexeddb/auto'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { drawQuestion } from '@/domain/passage/draw'
import { PassageError } from '@/domain/passage/errors'
import { db } from '@/lib/db/db'
import { getSession, putSession, updateSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig, makeStudent } from '@/testing/student-fixtures'
import { usePassageActions } from './use-passage-actions'

beforeEach(async () => {
  await db.sessions.clear()
})

describe('usePassageActions', () => {
  test('draw écrit un attempt pending ; busy reste verrouillé jusqu’à ce que sessionUpdatedAt rattrape l’écriture', async () => {
    const initialSession = makeSession()
    await putSession(initialSession)
    const { result, rerender } = renderHook(
      ({ sessionUpdatedAt }: { sessionUpdatedAt: string }) =>
        usePassageActions('session-1', 'student-1', sessionUpdatedAt),
      { initialProps: { sessionUpdatedAt: initialSession.updatedAt } },
    )

    await act(async () => {
      await result.current.draw('a')
    })

    expect(result.current.error).toBeNull()
    // Le prop `sessionUpdatedAt` (encore celui d'avant l'écriture) n'a pas rattrapé l'écriture :
    // le verrou reste actif tant que l'appelant ne re-rend pas avec la session fraîche.
    expect(result.current.busy).toBe(true)
    const session = await getSession('session-1')
    expect(session?.students[0]?.attempts).toHaveLength(1)
    expect(session?.students[0]?.attempts[0]?.outcome).toBe('pending')

    rerender({ sessionUpdatedAt: session?.updatedAt ?? initialSession.updatedAt })
    expect(result.current.busy).toBe(false)
  })

  test('score passe l’attempt en scored', async () => {
    const initialSession = makeSession({ students: [makeStudent(['pending'])] })
    await putSession(initialSession)
    const { result } = renderHook(() =>
      usePassageActions('session-1', 'student-1', initialSession.updatedAt),
    )

    await act(async () => {
      await result.current.score('attempt-1', 1)
    })

    const session = await getSession('session-1')
    expect(session?.students[0]?.attempts[0]?.outcome).toBe('scored')
    expect(session?.students[0]?.attempts[0]?.score).toBe(1)
  })

  test('selectStudent change activeStudentId', async () => {
    const initialSession = makeSession({
      students: [makeStudent(), makeStudent([], { id: 'student-2', order: 2 })],
    })
    await putSession(initialSession)
    const { result } = renderHook(() =>
      usePassageActions('session-1', 'student-1', initialSession.updatedAt),
    )

    await act(async () => {
      await result.current.selectStudent('student-2')
    })

    const session = await getSession('session-1')
    expect(session?.activeStudentId).toBe('student-2')
  })

  test('concurrence en base : deux tirages simultanés → un seul attempt, l’autre refusé', async () => {
    await putSession(makeSession())
    const deps = { random: () => 0, newId: () => crypto.randomUUID(), now: () => new Date() }
    const input = { studentId: 'student-1', categoryId: 'a' }

    const results = await Promise.all(
      [
        updateSession('session-1', (s) => drawQuestion(s, input, deps)),
        updateSession('session-1', (s) => drawQuestion(s, input, deps)),
      ].map((p) => p.catch((e: unknown) => e)),
    )

    const session = await getSession('session-1')
    expect(session?.students[0]?.attempts).toHaveLength(1)
    expect(results.some((r) => r instanceof PassageError && r.code === 'pending_exists')).toBe(true)
  })

  test('double appel dans le même act : un seul tirage, aucune erreur affichée, busy reste verrouillé jusqu’au rattrapage', async () => {
    const initialSession = makeSession()
    await putSession(initialSession)
    const { result, rerender } = renderHook(
      ({ sessionUpdatedAt }: { sessionUpdatedAt: string }) =>
        usePassageActions('session-1', 'student-1', sessionUpdatedAt),
      { initialProps: { sessionUpdatedAt: initialSession.updatedAt } },
    )

    await act(async () => {
      const first = result.current.draw('a')
      const second = result.current.draw('a')
      await Promise.all([first, second])
    })

    const session = await getSession('session-1')
    expect(session?.students[0]?.attempts).toHaveLength(1)
    expect(result.current.error).toBeNull()
    expect(result.current.busy).toBe(true)

    rerender({ sessionUpdatedAt: session?.updatedAt ?? initialSession.updatedAt })
    expect(result.current.busy).toBe(false)
  })

  test('refus métier : draw alors qu’un pending existe déjà, rien n’est écrit, le verrou est relâché', async () => {
    const initialSession = makeSession({ students: [makeStudent(['pending'])] })
    await putSession(initialSession)
    const { result } = renderHook(() =>
      usePassageActions('session-1', 'student-1', initialSession.updatedAt),
    )

    await act(async () => {
      await result.current.draw('a')
    })

    const { error } = result.current
    expect(error).toBeInstanceOf(PassageError)
    if (!(error instanceof PassageError)) throw new Error('error devrait être une PassageError')
    expect(error.code).toBe('pending_exists')
    // Une écriture refusée ne verrouille rien : `busy` est relâché immédiatement (Review Focus 1).
    expect(result.current.busy).toBe(false)
    const session = await getSession('session-1')
    expect(session?.students[0]?.attempts).toHaveLength(1)
  })

  test('studentId indéfini : draw et score ne font rien', async () => {
    const initialSession = makeSession()
    await putSession(initialSession)
    const { result } = renderHook(() =>
      usePassageActions('session-1', undefined, initialSession.updatedAt),
    )

    await act(async () => {
      await result.current.draw('a')
      await result.current.score('attempt-1', 1)
    })

    expect(result.current.busy).toBe(false)
    expect(result.current.error).toBeNull()
    const session = await getSession('session-1')
    expect(session?.students[0]?.attempts).toHaveLength(0)
  })

  test('une action réussie après une erreur remet error à null', async () => {
    const initialSession = makeSession({ students: [makeStudent(['pending'])] })
    await putSession(initialSession)
    const { result } = renderHook(() =>
      usePassageActions('session-1', 'student-1', initialSession.updatedAt),
    )

    await act(async () => {
      await result.current.draw('a')
    })
    expect(result.current.error).not.toBeNull()

    await act(async () => {
      await result.current.score('attempt-1', 1)
    })
    expect(result.current.error).toBeNull()
  })

  describe('actions de fin de passage (F11)', () => {
    const config = makeConfig({
      questionsPerStudent: 1,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
    })

    async function setup(withStudent = true) {
      const initialSession = makeSession({
        config,
        students: [makeStudent([13.5]), makeStudent([], { id: 'student-2', order: 2 })],
        activeStudentId: 'student-1',
        projection: { mode: 'student', studentId: 'student-1' },
      })
      await putSession(initialSession)
      const hook = renderHook(() =>
        usePassageActions(
          'session-1',
          withStudent ? 'student-1' : undefined,
          initialSession.updatedAt,
        ),
      )
      return { initialSession, ...hook }
    }

    test('adjust avec reveal écrit ajustement et révélation dans la même écriture', async () => {
      const { initialSession, result } = await setup()

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.adjust(1, 'r', { reveal: true })
      })

      expect(ok).toBe(true)
      const session = await getSession('session-1')
      const student = session?.students[0]
      expect(student?.adjustment).toEqual({ value: 1, reason: 'r' })
      expect(student?.finalRevealedAt).toBeDefined()
      expect(session?.updatedAt).not.toBe(initialSession.updatedAt)
    })

    test('adjust sans reveal ne pose pas finalRevealedAt', async () => {
      const { result } = await setup()

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.adjust(1, undefined, { reveal: false })
      })

      expect(ok).toBe(true)
      const student = (await getSession('session-1'))?.students[0]
      expect(student?.adjustment).toEqual({ value: 1 })
      expect(student?.finalRevealedAt).toBeUndefined()
    })

    test('adjust invalide renvoie false avec une PassageError adjustment_invalid', async () => {
      const { result } = await setup()

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.adjust(0.3, 'r', { reveal: true })
      })

      expect(ok).toBe(false)
      const { error } = result.current
      expect(error).toBeInstanceOf(PassageError)
      if (!(error instanceof PassageError)) throw new Error('error devrait être une PassageError')
      expect(error.code).toBe('adjustment_invalid')
      const student = (await getSession('session-1'))?.students[0]
      expect(student?.adjustment).toBeUndefined()
      expect(student?.finalRevealedAt).toBeUndefined()
    })

    test('revealFinal écrit la date de révélation', async () => {
      const { result } = await setup()

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.revealFinal()
      })

      expect(ok).toBe(true)
      expect((await getSession('session-1'))?.students[0]?.finalRevealedAt).toBeDefined()
    })

    test('reset vide les attempts', async () => {
      const { result } = await setup()

      let ok: boolean | undefined
      await act(async () => {
        ok = await result.current.reset()
      })

      expect(ok).toBe(true)
      expect((await getSession('session-1'))?.students[0]?.attempts).toEqual([])
    })

    test('next change activeStudentId sans toucher la projection', async () => {
      const { result } = await setup()

      await act(async () => {
        await result.current.next()
      })

      const session = await getSession('session-1')
      expect(session?.activeStudentId).toBe('student-2')
      expect(session?.projection).toEqual({ mode: 'student', studentId: 'student-1' })
    })

    test('double adjust simultané : une seule écriture, le second renvoie false sans erreur', async () => {
      const { result } = await setup()

      let results: boolean[] = []
      await act(async () => {
        results = await Promise.all([
          result.current.adjust(1, 'r', { reveal: true }),
          result.current.adjust(1, 'r', { reveal: true }),
        ])
      })

      expect(results).toEqual([true, false])
      expect(result.current.error).toBeNull()
    })

    test('studentId indéfini : les quatre actions ne font rien', async () => {
      const { initialSession, result } = await setup(false)

      const results: boolean[] = []
      await act(async () => {
        results.push(await result.current.adjust(1, 'r', { reveal: true }))
        results.push(await result.current.revealFinal())
        await result.current.reset()
        await result.current.next()
      })

      expect(results).toEqual([false, false])
      expect(result.current.error).toBeNull()
      const session = await getSession('session-1')
      expect(session?.updatedAt).toBe(initialSession.updatedAt)
    })
  })
})

async function setupPanel(withStudent = true) {
  const initialSession = makeSession({
    config: makeConfig({
      questionsPerStudent: 1,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals: 2, step: 0.5 },
    }),
    students: [makeStudent([13.5]), makeStudent([], { id: 'student-2', order: 2 })],
    activeStudentId: 'student-1',
    projection: { mode: 'student', studentId: 'student-1' },
  })
  await putSession(initialSession)
  const hook = renderHook(
    ({ sessionUpdatedAt }: { sessionUpdatedAt: string }) =>
      usePassageActions('session-1', withStudent ? 'student-1' : undefined, sessionUpdatedAt),
    { initialProps: { sessionUpdatedAt: initialSession.updatedAt } },
  )
  return { initialSession, ...hook }
}

describe('actions du panneau (F12)', () => {
  test('editScore écrit score et editedAt', async () => {
    const { result } = await setupPanel()

    await act(async () => {
      await result.current.editScore('attempt-1', 2)
    })

    const attempt = (await getSession('session-1'))?.students[0]?.attempts[0]
    expect(attempt?.score).toBe(2)
    expect(attempt?.editedAt).toBeDefined()
  })

  test('setComment vise l’étudiant explicite et renvoie true', async () => {
    const { result } = await setupPanel()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.setComment('student-2', 'x')
    })

    expect(ok).toBe(true)
    const session = await getSession('session-1')
    expect(session?.students[1]?.comment).toBe('x')
    expect(session?.students[0]?.comment).toBeUndefined()
  })

  test('setComment identique : true et updatedAt inchangé', async () => {
    const { result } = await setupPanel()
    await act(async () => {
      await result.current.setComment('student-1', 'x')
    })
    const written = await getSession('session-1')

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.setComment('student-1', 'x')
    })

    expect(ok).toBe(true)
    expect((await getSession('session-1'))?.updatedAt).toBe(written?.updatedAt)
  })

  test('busy redevient faux après une écriture sans changement, sans nouvel updatedAt', async () => {
    const { result, rerender } = await setupPanel()
    await act(async () => {
      await result.current.setComment('student-1', 'x')
    })
    const written = await getSession('session-1')
    rerender({ sessionUpdatedAt: written?.updatedAt ?? '' })
    expect(result.current.busy).toBe(false)

    await act(async () => {
      await result.current.setComment('student-1', 'x')
    })

    expect(result.current.busy).toBe(false)
  })

  test('setAbsent(true) vide les attempts et renvoie true', async () => {
    const { result } = await setupPanel()

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.setAbsent(true)
    })

    expect(ok).toBe(true)
    const student = (await getSession('session-1'))?.students[0]
    expect(student?.absent).toBe(true)
    expect(student?.attempts).toEqual([])
  })

  test('studentId indéfini : editScore ne fait rien, setAbsent renvoie false', async () => {
    const { initialSession, result } = await setupPanel(false)

    let ok: boolean | undefined
    await act(async () => {
      await result.current.editScore('attempt-1', 2)
      ok = await result.current.setAbsent(true)
    })

    expect(ok).toBe(false)
    expect((await getSession('session-1'))?.updatedAt).toBe(initialSession.updatedAt)
  })
})
