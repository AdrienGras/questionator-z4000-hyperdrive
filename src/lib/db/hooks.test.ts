import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Dexie } from 'dexie'
import { beforeEach, describe, expect, test } from 'vitest'
import { healthy } from '@/testing/healthy-session'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { makeDraw, makeTraining } from '@/testing/training-fixtures'
import { isDamaged } from './damaged-session'
import { createDb, db } from './db'
import {
  useDbStatus,
  useSession,
  useSessions,
  useTraining,
  useTrainingDraws,
  useTrainings,
} from './hooks'
import { createSession, deleteSession, updateSession } from './sessions'
import { createTraining, deleteTraining, drawTrainingQuestion, getTrainingDraws } from './trainings'

beforeEach(async () => {
  await db.sessions.clear()
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

describe('useSessions', () => {
  test('undefined pendant le chargement, puis la liste triée, mise à jour après écriture', async () => {
    await createSession(makeSession({ id: 'a', updatedAt: '2026-09-25T08:00:00.000Z' }))
    const { result } = renderHook(() => useSessions())
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current?.map((s) => s.id)).toEqual(['a']))

    await act(() => createSession(makeSession({ id: 'b', updatedAt: '2026-09-25T09:00:00.000Z' })))
    await waitFor(() => expect(result.current?.map((s) => s.id)).toEqual(['b', 'a']))
  })
})

describe('useSession', () => {
  test('undefined → session → mise à jour → null après suppression', async () => {
    await createSession(makeSession())
    const { result } = renderHook(() => useSession('session-1'))
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(healthy(result.current)?.name).toBe('Oral de test'))

    await act(() => updateSession('session-1', (s) => ({ ...s, name: 'Renommée' })))
    await waitFor(() => expect(healthy(result.current)?.name).toBe('Renommée'))

    await act(() => deleteSession('session-1'))
    await waitFor(() => expect(result.current).toBeNull())
  })

  test('forme endommagée, et bascule de saine à endommagée après corruption', async () => {
    await createSession(makeSession())
    const { result } = renderHook(() => useSession('session-1'))
    await waitFor(() => expect(result.current?.id).toBe('session-1'))
    expect(result.current && isDamaged(result.current)).toBe(false)

    const corrupted = makeSession({ students: [makeStudent([1])] })
    delete corrupted.students[0]!.attempts[0]!.score
    await act(() => db.sessions.put(corrupted))
    await waitFor(() => expect(result.current && isDamaged(result.current)).toBe(true))
    expect(result.current).toMatchObject({ id: 'session-1', damaged: true, raw: corrupted })
  })

  test('null pour une session absente', async () => {
    const { result } = renderHook(() => useSession('absente'))
    await waitFor(() => expect(result.current).toBeNull())
  })

  test('suit un changement d’id sans démontage', async () => {
    await createSession(makeSession({ id: 'a', name: 'Session A' }))
    await createSession(makeSession({ id: 'b', name: 'Session B' }))
    const { result, rerender } = renderHook(({ id }) => useSession(id), {
      initialProps: { id: 'a' },
    })
    await waitFor(() => expect(healthy(result.current)?.name).toBe('Session A'))
    rerender({ id: 'b' })
    expect(healthy(result.current)?.name).not.toBe('Session A')
    await waitFor(() => expect(healthy(result.current)?.name).toBe('Session B'))
  })
})

describe('useTrainings', () => {
  test('undefined pendant le chargement, puis la liste triée, mise à jour après écriture', async () => {
    await createTraining(makeTraining({ id: 'a', updatedAt: '2026-10-05T08:00:00.000Z' }))
    const { result } = renderHook(() => useTrainings())
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current?.map((t) => t.id)).toEqual(['a']))

    await act(() =>
      createTraining(makeTraining({ id: 'b', updatedAt: '2026-10-05T09:00:00.000Z' })),
    )
    await waitFor(() => expect(result.current?.map((t) => t.id)).toEqual(['b', 'a']))
  })
})

describe('useTraining', () => {
  test('undefined → entraînement → null après suppression', async () => {
    await createTraining(makeTraining())
    const { result } = renderHook(() => useTraining('training-1'))
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current?.id).toBe('training-1'))

    await act(() => deleteTraining('training-1'))
    await waitFor(() => expect(result.current).toBeNull())
  })

  test('null pour un entraînement absent', async () => {
    const { result } = renderHook(() => useTraining('absent'))
    await waitFor(() => expect(result.current).toBeNull())
  })

  test('suit un changement d’id sans démontage', async () => {
    await createTraining(makeTraining({ id: 'a' }))
    await createTraining(makeTraining({ id: 'b' }))
    const { result, rerender } = renderHook(({ id }) => useTraining(id), {
      initialProps: { id: 'a' },
    })
    await waitFor(() => expect(result.current?.id).toBe('a'))
    rerender({ id: 'b' })
    expect(result.current?.id).not.toBe('a')
    await waitFor(() => expect(result.current?.id).toBe('b'))
  })
})

describe('useTrainingDraws', () => {
  test('undefined → journal vide → mis à jour après un tirage', async () => {
    await createTraining(makeTraining())
    const { result } = renderHook(() => useTrainingDraws('training-1'))
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toEqual([]))

    await act(() =>
      drawTrainingQuestion('training-1', 'a', {
        random: () => 0,
        now: () => new Date('2026-10-05T10:00:00.000Z'),
      }),
    )
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current?.[0]).toMatchObject({
      trainingId: 'training-1',
      outcome: { kind: 'pending' },
    })
  })

  test('suit un changement d’id sans montrer le journal de l’ancien', async () => {
    await createTraining(makeTraining({ id: 'a' }))
    await createTraining(makeTraining({ id: 'b' }))
    await db.trainingDraws.add(makeDraw({ trainingId: 'a' }))
    const { result, rerender } = renderHook(({ id }) => useTrainingDraws(id), {
      initialProps: { id: 'a' },
    })
    await waitFor(() => expect(result.current).toHaveLength(1))
    rerender({ id: 'b' })
    expect(result.current).toBeUndefined()
    await waitFor(() => expect(result.current).toEqual([]))
    expect(await getTrainingDraws('a')).toHaveLength(1)
  })
})

describe('useDbStatus', () => {
  test('open, puis outdated après un changement de schéma venu d’ailleurs', async () => {
    const database = createDb('hooks-status')
    await database.open()
    const { result } = renderHook(() => useDbStatus(database))
    expect(result.current).toBe('open')

    const newer = new Dexie('hooks-status')
    newer.version(3).stores({ sessions: 'id' })
    await act(() => newer.open())

    await waitFor(() => expect(result.current).toBe('outdated'))
    newer.close()
  })

  test('lit le singleton par défaut', () => {
    const { result } = renderHook(() => useDbStatus())
    expect(result.current).toBe(db.status)
  })

  test('unavailable quand IndexedDB est bloqué (D47)', async () => {
    const indexedDB = {
      open: () => {
        throw new DOMException('IndexedDB inaccessible.', 'SecurityError')
      },
    }
    const database = createDb('hooks-unavailable', { indexedDB, IDBKeyRange })
    const { result } = renderHook(() => useDbStatus(database))

    await waitFor(() => expect(result.current).toBe('unavailable'))
  })
})
