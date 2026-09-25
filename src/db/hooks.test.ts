import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import { Dexie } from 'dexie'
import { beforeEach, describe, expect, test } from 'vitest'
import { makeSession } from '../test/session-fixtures'
import { createDb, db } from './db'
import { useDbStatus, useSession, useSessions } from './hooks'
import { createSession, deleteSession, updateSession } from './sessions'

beforeEach(async () => {
  await db.sessions.clear()
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
    await waitFor(() => expect(result.current?.name).toBe('Oral de test'))

    await act(() => updateSession('session-1', (s) => ({ ...s, name: 'Renommée' })))
    await waitFor(() => expect(result.current?.name).toBe('Renommée'))

    await act(() => deleteSession('session-1'))
    await waitFor(() => expect(result.current).toBeNull())
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
    await waitFor(() => expect(result.current?.name).toBe('Session A'))
    rerender({ id: 'b' })
    expect(result.current?.name).not.toBe('Session A')
    await waitFor(() => expect(result.current?.name).toBe('Session B'))
  })
})

describe('useDbStatus', () => {
  test('open, puis outdated après un changement de schéma venu d’ailleurs', async () => {
    const database = createDb('hooks-status')
    await database.open()
    const { result } = renderHook(() => useDbStatus(database))
    expect(result.current).toBe('open')

    const newer = new Dexie('hooks-status')
    newer.version(2).stores({ sessions: 'id' })
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
