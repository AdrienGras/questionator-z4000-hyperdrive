import 'fake-indexeddb/auto'
import { Dexie } from 'dexie'
import { describe, expect, test, vi } from 'vitest'
import { makeSession } from '@/testing/session-fixtures'
import { createDb, db } from './db'
import { SessionExistsError, SessionNotFoundError } from './errors'

describe('QuestionatorDb', () => {
  test('stocke et relit une session', async () => {
    const database = createDb('db-roundtrip')
    await database.sessions.put(makeSession())
    expect(await database.sessions.get('session-1')).toEqual(makeSession())
    expect(database.status).toBe('open')
    database.close()
  })

  test('un changement de schéma venu d’ailleurs ferme la connexion et passe à outdated (D45)', async () => {
    const database = createDb('db-versionchange')
    await database.open()
    const listener = vi.fn<() => void>()
    database.onStatusChange(listener)

    const newer = new Dexie('db-versionchange')
    newer.version(2).stores({ sessions: 'id, updatedAt, name' })
    await newer.open()

    expect(newer.verno).toBe(2)
    expect(database.isOpen()).toBe(false)
    expect(database.status).toBe('outdated')
    expect(listener).toHaveBeenCalledTimes(1)
    await expect(database.sessions.put(makeSession())).rejects.toMatchObject({
      name: 'DatabaseClosedError',
    })
    newer.close()
  })

  test('onStatusChange renvoie une désinscription', async () => {
    const database = createDb('db-unsubscribe')
    await database.open()
    const listener = vi.fn<() => void>()
    const unsubscribe = database.onStatusChange(listener)
    unsubscribe()

    const newer = new Dexie('db-unsubscribe')
    newer.version(2).stores({ sessions: 'id' })
    await newer.open()

    expect(database.status).toBe('outdated')
    expect(listener).not.toHaveBeenCalled()
    newer.close()
  })

  test('la base est exposée en dev sur window.__questionatorDb (D23)', () => {
    expect(import.meta.env.DEV).toBe(true)
    // oxlint-disable-next-line no-underscore-dangle -- convention de nommage historique pour un hook dev global (D23).
    expect(window.__questionatorDb).toBe(db)
  })

  test('IndexedDB bloqué ou absent fait passer le statut à unavailable (D47)', async () => {
    // Simule le SecurityError synchrone que Safari lève depuis indexedDB.open() en navigation
    // privée ou cookies bloqués : Dexie capture ce throw dans la promesse d'ouverture et la
    // rejette, exactement comme un vrai échec d'ouverture.
    const indexedDB = {
      open: () => {
        throw new DOMException('IndexedDB inaccessible.', 'SecurityError')
      },
    }
    const database = createDb('db-unavailable', { indexedDB, IDBKeyRange })
    const listener = vi.fn<() => void>()
    database.onStatusChange(listener)

    await vi.waitFor(() => {
      expect(database.status).toBe('unavailable')
    })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('une ouverture normale reste open', async () => {
    const database = createDb('db-open-normal')
    await database.open()
    expect(database.status).toBe('open')
    database.close()
  })
})

describe('erreurs', () => {
  test('portent l’id et se reconnaissent par instanceof', () => {
    const notFound = new SessionNotFoundError('s-9')
    expect(notFound).toBeInstanceOf(Error)
    expect(notFound).toBeInstanceOf(SessionNotFoundError)
    expect(notFound).toMatchObject({ id: 's-9', name: 'SessionNotFoundError' })
    const exists = new SessionExistsError('s-9')
    expect(exists).toBeInstanceOf(SessionExistsError)
    expect(exists).toMatchObject({ id: 's-9', name: 'SessionExistsError' })
  })
})
