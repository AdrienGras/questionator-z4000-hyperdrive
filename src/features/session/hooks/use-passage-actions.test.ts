import 'fake-indexeddb/auto'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'
import { drawQuestion } from '@/domain/passage/draw'
import { PassageError } from '@/domain/passage/errors'
import { db } from '@/lib/db/db'
import { getSession, putSession, updateSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
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
})
