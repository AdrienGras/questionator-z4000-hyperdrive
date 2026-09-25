import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Session } from '@/domain/session/types'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { db } from './db'
import { SessionExistsError, SessionNotFoundError } from './errors'
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  putSession,
  updateSession,
} from './sessions'

beforeEach(async () => {
  await db.sessions.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CRUD', () => {
  test('createSession puis getSession', async () => {
    await createSession(makeSession())
    expect(await getSession('session-1')).toEqual(makeSession())
  })

  test('createSession refuse un id existant sans rien écraser', async () => {
    await createSession(makeSession())
    const error = await createSession(makeSession({ name: 'Autre' })).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SessionExistsError)
    expect(error).toMatchObject({ id: 'session-1' })
    expect((await getSession('session-1'))?.name).toBe('Oral de test')
  })

  test('getSession renvoie null pour une session absente', async () => {
    expect(await getSession('absente')).toBeNull()
  })

  test('putSession écrase', async () => {
    await createSession(makeSession())
    await putSession(makeSession({ name: 'Importée' }))
    expect((await getSession('session-1'))?.name).toBe('Importée')
  })

  test('deleteSession supprime, et ne lève pas sur une session absente', async () => {
    await createSession(makeSession())
    await deleteSession('session-1')
    expect(await getSession('session-1')).toBeNull()
    await expect(deleteSession('session-1')).resolves.toBeUndefined()
  })

  test('listSessions trie par updatedAt décroissant', async () => {
    await createSession(makeSession({ id: 'a', updatedAt: '2026-09-25T08:00:00.000Z' }))
    await createSession(makeSession({ id: 'b', updatedAt: '2026-09-25T10:00:00.000Z' }))
    await createSession(makeSession({ id: 'c', updatedAt: '2026-09-25T09:00:00.000Z' }))
    expect((await listSessions()).map((session) => session.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('updateSession', () => {
  test('applique le mutator, pose updatedAt et renvoie la session écrite', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-25T12:34:56.000Z'))
    await createSession(makeSession())
    const written = await updateSession('session-1', (session) => ({
      ...session,
      name: 'Renommée',
    }))
    expect(written).toMatchObject({ name: 'Renommée', updatedAt: '2026-09-25T12:34:56.000Z' })
    expect(await getSession('session-1')).toEqual(written)
  })

  test('accepte une modification en place', async () => {
    await createSession(makeSession())
    await updateSession('session-1', (session) => {
      session.examiner = 'M. Martin'
      return session
    })
    expect((await getSession('session-1'))?.examiner).toBe('M. Martin')
  })

  test('SessionNotFoundError sur une session absente', async () => {
    const mutator = vi.fn<(session: Session) => Session>((session) => session)
    const error = await updateSession('absente', mutator).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(SessionNotFoundError)
    expect(error).toMatchObject({ id: 'absente' })
    expect(mutator).not.toHaveBeenCalled()
  })

  test('un mutator qui modifie en place puis lève ne laisse rien écrit', async () => {
    await createSession(makeSession())
    await expect(
      updateSession('session-1', (session) => {
        session.name = 'Corrompue'
        throw new Error('contrôle métier refusé')
      }),
    ).rejects.toThrow('contrôle métier refusé')
    expect(await getSession('session-1')).toEqual(makeSession())
  })

  test('refuse un changement d’id sans rien écrire', async () => {
    await createSession(makeSession())
    await expect(
      updateSession('session-1', (session) => ({ ...session, id: 'autre' })),
    ).rejects.toThrow(/id/)
    expect(await getSession('session-1')).toEqual(makeSession())
    expect(await getSession('autre')).toBeNull()
  })

  test('deux appels concurrents ne perdent aucune écriture, le second voit le premier', async () => {
    await createSession(makeSession({ students: [] }))
    const seen: number[] = []
    const addStudent = (id: string) => (session: Session) => {
      seen.push(session.students.length)
      return { ...session, students: [...session.students, makeStudent([], { id })] }
    }
    await Promise.all([
      updateSession('session-1', addStudent('s-a')),
      updateSession('session-1', addStudent('s-b')),
    ])
    const students = (await getSession('session-1'))?.students.map((student) => student.id)
    expect(students?.toSorted()).toEqual(['s-a', 's-b'])
    expect(seen).toEqual([0, 1])
  })
})
