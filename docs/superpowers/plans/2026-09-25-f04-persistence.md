# F04 — Persistance — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une base Dexie versionnée qui stocke un document par session, une seule voie d'écriture transactionnelle (`updateSession`), des hooks réactifs, l'état de connexion (`versionchange`) et l'état du stockage persistant.

**Architecture:** `src/db/db.ts` définit `QuestionatorDb` (Dexie 4) et son état de connexion ; `sessions.ts` porte le CRUD et `updateSession` sur le singleton `db` ; `hooks.ts` expose `useLiveQuery` et `useSyncExternalStore` ; `persistence.ts` est un store autonome autour de `navigator.storage`. Aucune UI.

**Tech Stack:** Dexie 4.4, dexie-react-hooks 4.4, React 19, TypeScript strict, Vitest + jsdom + `fake-indexeddb` 6, `@testing-library/react` (`renderHook`, `waitFor`).

**Spec:** `docs/superpowers/specs/2026-09-25-f04-persistence-design.md` (décisions D12, D22, D23, D45, D46 dans `docs/DECISIONS.md`).

## Global Constraints

- Dépendances exactes : `dexie@^4.4.6`, `dexie-react-hooks@^4.4.0` (dependencies), `fake-indexeddb@^6.2.5` (devDependencies). Rien d'autre.
- Une table `sessions`, schéma `version(1).stores({ sessions: 'id, updatedAt' })`, base nommée `'questionator'`.
- `updateSession` est la seule voie d'écriture des mutations métier ; mutator synchrone `(session: Session) => Session`, appelé sur la session lue dans la transaction, sans `structuredClone` (D46).
- `src/db/` peut importer via l'alias `@/` ; `src/test/` garde des imports relatifs (comme l'existant).
- Aucune assertion `as` (règle oxlint `typescript/no-unsafe-type-assertion`), pas de ternaire imbriqué (SonarQube), pas d'`expect` dans un `if` (`vitest/no-conditional-expect`), `items.map((x, i) => f(x, i))` plutôt que `items.map(f)` (Sonar S7727).
- Tests : `import { describe, expect, test } from 'vitest'`, fichiers `*.test.ts(x)` à côté du code, noms en français ; chaque fichier de test de `src/db/` commence par `import 'fake-indexeddb/auto'`.
- Test ciblé : `./node_modules/.bin/vitest run <fichier>` — **jamais `pnpm vitest`** (réécrit par le hook RTK, laisse `.vitest/`). Vérification complète : `pnpm check` ; en fin de tâche 1 et 4 aussi `pnpm build`.
- Commits gitmoji, message au présent en français, emoji Unicode, pied :
  ```
  Co-Authored-By: <modèle qui écrit le commit> <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_016w1nyky4gGcgYAfqw2Z9YW
  ```
- Branche `feat/f04-persistence` (déjà créée, spec commitée).

## Review Focus

1. **`useSession(id)` quand l'`id` change sans démontage** (navigation d'un étudiant/d'une session à l'autre) : le hook doit renvoyer la nouvelle session, pas l'ancienne. Test : Task 3, « suit un changement d'id ».
2. **`navigator.storage.persisted()` qui rejette** (navigateur privé, politique d'entreprise) : l'état passe à `'best-effort'`, sans rejet non géré. Test : Task 4.
3. **Écriture sur une base passée `'outdated'`** : l'appel rejette avec `DatabaseClosedError` au lieu de réussir en silence ou de se rouvrir. Test : Task 1.
4. **Mutator qui modifie la session en place puis lève** : rien n'est écrit. Test : Task 2.
5. **Deux mutations concurrentes où la seconde dépend de la première** (deux onglets examinateur) : le second mutator voit l'état écrit par le premier. Test : Task 2 (le second mutator compte les étudiants qu'il reçoit).

---

### Task 1: dépendances, `QuestionatorDb`, état de connexion, erreurs, fixture

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (via `pnpm add`), `.oxlintrc.json` (`import/no-unassigned-import.allow`)
- Create: `src/db/db.ts`, `src/db/db.test.ts`, `src/db/errors.ts`, `src/test/session-fixtures.ts`

**Interfaces:**
- Consumes: `Session` (`src/domain/types.ts`), `makeConfig`, `makeStudent` (`src/test/student-fixtures.ts`).
- Produces:
  - `type DbStatus = 'open' | 'outdated'`
  - `class QuestionatorDb extends Dexie` avec `declare readonly sessions: EntityTable<Session, 'id'>`, `get status(): DbStatus`, `onStatusChange(listener: () => void): () => void`
  - `createDb(name: string): QuestionatorDb`, `export const db: QuestionatorDb` (nom `'questionator'`)
  - `class SessionNotFoundError extends Error { readonly id: string }`, `class SessionExistsError extends Error { readonly id: string }`
  - `makeSession(overrides?: Partial<Session>): Session` dans `src/test/session-fixtures.ts`

- [ ] **Step 1: Installer les dépendances et autoriser l'import de `fake-indexeddb/auto`**

```bash
pnpm add dexie@^4.4.6 dexie-react-hooks@^4.4.0
pnpm add -D fake-indexeddb@^6.2.5
```

Dans `.oxlintrc.json`, compléter la liste `allow` de `import/no-unassigned-import` :

```json
{ "allow": ["**/*.css", "@testing-library/jest-dom/vitest", "fake-indexeddb/auto"] }
```

- [ ] **Step 2: Écrire la fixture de session**

`src/test/session-fixtures.ts` :

```ts
import type { Session } from '../domain/types'
import { makeConfig, makeStudent } from './student-fixtures'

/** Session de test minimale et valide ; nouvel objet à chaque appel. */
export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    name: 'Oral de test',
    createdAt: '2026-09-25T08:00:00.000Z',
    updatedAt: '2026-09-25T08:00:00.000Z',
    appVersion: '0.1.0',
    config: makeConfig(),
    students: [makeStudent()],
    projection: { mode: 'waiting' },
    ...overrides,
  }
}
```

- [ ] **Step 3: Écrire les tests en échec**

`src/db/db.test.ts` :

```ts
import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, test, vi } from 'vitest'
import { makeSession } from '../test/session-fixtures'
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
    const listener = vi.fn()
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
    const listener = vi.fn()
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
    expect(window.__questionatorDb).toBe(db)
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
```

- [ ] **Step 4: Vérifier l'échec**

Run: `./node_modules/.bin/vitest run src/db/db.test.ts`
Expected: FAIL, modules `./db` et `./errors` introuvables.

- [ ] **Step 5: Implémenter**

`src/db/errors.ts` :

```ts
/** Aucune session n'a cet identifiant. */
export class SessionNotFoundError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Session « ${id} » introuvable.`)
    this.name = 'SessionNotFoundError'
    this.id = id
  }
}

/** Une session existe déjà avec cet identifiant (`createSession`). */
export class SessionExistsError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Une session « ${id} » existe déjà.`)
    this.name = 'SessionExistsError'
    this.id = id
  }
}
```

`src/db/db.ts` :

```ts
import Dexie, { type EntityTable } from 'dexie'
import type { Session } from '@/domain/types'

/** `outdated` : un autre onglet a monté le schéma, cette connexion est fermée (D45). */
export type DbStatus = 'open' | 'outdated'

/** Un document par session, étudiants et attempts imbriqués (D22). */
export class QuestionatorDb extends Dexie {
  declare readonly sessions: EntityTable<Session, 'id'>

  #status: DbStatus = 'open'
  readonly #listeners = new Set<() => void>()

  constructor(name: string) {
    super(name)
    // Toute évolution passe par version(n).stores(...).upgrade(...).
    this.version(1).stores({ sessions: 'id, updatedAt' })
    // Remplace le traitement par défaut de Dexie (fermeture + log console) : l'onglet qui
    // monte de version n'est jamais bloqué, et celui-ci expose un état observable.
    this.on('versionchange', () => {
      this.close()
      this.#setStatus('outdated')
      return false
    })
  }

  get status(): DbStatus {
    return this.#status
  }

  onStatusChange(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #setStatus(status: DbStatus): void {
    this.#status = status
    for (const listener of this.#listeners) listener()
  }
}

export function createDb(name: string): QuestionatorDb {
  return new QuestionatorDb(name)
}

export const db = createDb('questionator')

declare global {
  interface Window {
    /** Dev uniquement (D23) : vérification manuelle de la réactivité entre fenêtres. */
    __questionatorDb?: QuestionatorDb
  }
}

if (import.meta.env.DEV) window.__questionatorDb = db
```

- [ ] **Step 6: Vérifier**

Run: `./node_modules/.bin/vitest run src/db/db.test.ts`
Expected: PASS (5 tests). Si `fake-indexeddb` échoue sous jsdom faute de `structuredClone`, s'arrêter et le signaler (ne pas ajouter de polyfill sans accord).

Run: `pnpm check` puis `pnpm build`
Expected: verts, build sans avertissement.

Run: `grep -r __questionatorDb dist/ ; echo "exit $?"`
Expected: aucune ligne, `exit 1`.

- [ ] **Step 7: Commit**

```bash
rtk git add package.json pnpm-lock.yaml .oxlintrc.json src/db src/test/session-fixtures.ts
rtk git commit -m "✨ Pose la base Dexie et son état de connexion" -m "<pied de commit>"
```

---

### Task 2: `sessions.ts` — CRUD et `updateSession`

**Files:**
- Create: `src/db/sessions.ts`, `src/db/sessions.test.ts`

**Interfaces:**
- Consumes: `db` (`./db`), `SessionExistsError`, `SessionNotFoundError` (`./errors`), `Session`, `makeSession`, `makeStudent`.
- Produces:
  - `createSession(session: Session): Promise<void>`
  - `getSession(id: string): Promise<Session | null>`
  - `listSessions(): Promise<Session[]>` (tri `updatedAt` décroissant)
  - `putSession(session: Session): Promise<void>`
  - `deleteSession(id: string): Promise<void>`
  - `updateSession(id: string, mutator: (session: Session) => Session): Promise<Session>`

- [ ] **Step 1: Écrire les tests en échec**

`src/db/sessions.test.ts` :

```ts
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { Session } from '../domain/types'
import { makeSession } from '../test/session-fixtures'
import { makeStudent } from '../test/student-fixtures'
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
    const written = await updateSession('session-1', (session) => ({ ...session, name: 'Renommée' }))
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
    const mutator = vi.fn((session: Session) => session)
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
```

- [ ] **Step 2: Vérifier l'échec**

Run: `./node_modules/.bin/vitest run src/db/sessions.test.ts`
Expected: FAIL, module `./sessions` introuvable.

- [ ] **Step 3: Implémenter**

`src/db/sessions.ts` :

```ts
import Dexie from 'dexie'
import type { Session } from '@/domain/types'
import { db } from './db'
import { SessionExistsError, SessionNotFoundError } from './errors'

/** Crée une session construite par F06 ; refuse un id existant (D46). */
export async function createSession(session: Session): Promise<void> {
  try {
    await db.sessions.add(session)
  } catch (error) {
    if (error instanceof Dexie.ConstraintError) throw new SessionExistsError(session.id)
    throw error
  }
}

export async function getSession(id: string): Promise<Session | null> {
  return (await db.sessions.get(id)) ?? null
}

/** Sessions de la plus récemment modifiée à la plus ancienne. */
export function listSessions(): Promise<Session[]> {
  return db.sessions.orderBy('updatedAt').reverse().toArray()
}

/** Écrase la session de même id (import F05, après confirmation de l'utilisateur). */
export async function putSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export function deleteSession(id: string): Promise<void> {
  return db.sessions.delete(id)
}

/**
 * Seule voie d'écriture des mutations métier (D22, D46). Lecture, mutation et écriture dans une
 * seule transaction `rw` : deux onglets examinateur ne perdent aucune écriture. Le mutator est
 * synchrone et reçoit la session fraîche (copie issue d'IndexedDB) : c'est là que se font les
 * contrôles métier. S'il lève, rien n'est écrit et l'erreur remonte telle quelle.
 */
export function updateSession(
  id: string,
  mutator: (session: Session) => Session,
): Promise<Session> {
  return db.transaction('rw', db.sessions, async () => {
    const current = await db.sessions.get(id)
    if (current === undefined) throw new SessionNotFoundError(id)
    const next = mutator(current)
    if (next.id !== id) {
      throw new Error(`Un mutator ne peut pas changer l'id de la session (« ${id} » → « ${next.id} »).`)
    }
    const written = { ...next, updatedAt: new Date().toISOString() }
    await db.sessions.put(written)
    return written
  })
}
```

Si `Dexie.ConstraintError` n'est pas exposé comme classe sur le défaut importé (vérifier dans `node_modules/dexie/dist/dexie.d.ts`), tester plutôt `error instanceof Error && error.name === 'ConstraintError'`.

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/vitest run src/db/sessions.test.ts` puis `pnpm check`
Expected: PASS (12 tests), vert.

- [ ] **Step 5: Commit**

```bash
rtk git add src/db/sessions.ts src/db/sessions.test.ts
rtk git commit -m "✨ Ajoute le CRUD des sessions et la mutation transactionnelle" -m "<pied de commit>"
```

---

### Task 3: hooks réactifs

**Files:**
- Create: `src/db/hooks.ts`, `src/db/hooks.test.ts`

**Interfaces:**
- Consumes: `db`, `QuestionatorDb`, `DbStatus`, `createDb` (`./db`) ; `getSession`, `listSessions`, `createSession`, `deleteSession`, `updateSession` (`./sessions`) ; `makeSession`.
- Produces:
  - `useSessions(): Session[] | undefined`
  - `useSession(id: string): Session | null | undefined`
  - `useDbStatus(database?: QuestionatorDb): DbStatus` (défaut : le singleton `db`)

- [ ] **Step 1: Écrire les tests en échec**

`src/db/hooks.test.ts` :

```ts
import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import Dexie from 'dexie'
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
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `./node_modules/.bin/vitest run src/db/hooks.test.ts`
Expected: FAIL, module `./hooks` introuvable.

- [ ] **Step 3: Implémenter**

`src/db/hooks.ts` :

```ts
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useSyncExternalStore } from 'react'
import type { Session } from '@/domain/types'
import { db, type DbStatus, type QuestionatorDb } from './db'
import { getSession, listSessions } from './sessions'

/**
 * Toutes les sessions, de la plus récemment modifiée à la plus ancienne ; `undefined` pendant le
 * chargement. `useLiveQuery` suit aussi les écritures des autres fenêtres (D12).
 */
export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => listSessions(), [])
}

/** `undefined` pendant le chargement, `null` si la session est absente ou supprimée. */
export function useSession(id: string): Session | null | undefined {
  return useLiveQuery(() => getSession(id), [id])
}

/** `outdated` quand un autre onglet a monté le schéma (D45) : la page doit être rechargée. */
export function useDbStatus(database: QuestionatorDb = db): DbStatus {
  const subscribe = useCallback(
    (listener: () => void) => database.onStatusChange(listener),
    [database],
  )
  return useSyncExternalStore(subscribe, () => database.status)
}
```

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/vitest run src/db/hooks.test.ts` puis `pnpm check`
Expected: PASS (6 tests), sans avertissement `act(...)` dans la sortie ; vert. Un avertissement `act` est un défaut à corriger (envelopper l'écriture dans `act`), pas à ignorer.

- [ ] **Step 5: Commit**

```bash
rtk git add src/db/hooks.ts src/db/hooks.test.ts
rtk git commit -m "✨ Ajoute les hooks réactifs de lecture des sessions" -m "<pied de commit>"
```

---

### Task 4: stockage persistant et point d'entrée `index.ts`

**Files:**
- Create: `src/db/persistence.ts`, `src/db/persistence.test.ts`, `src/db/index.ts`

**Interfaces:**
- Consumes: tout `src/db/` des tâches précédentes (pour `index.ts`).
- Produces:
  - `type PersistenceStatus = 'persisted' | 'best-effort' | 'unsupported'`
  - `requestPersistentStorage(): Promise<boolean>`
  - `usePersistenceStatus(): PersistenceStatus | undefined`
  - `src/db/index.ts` : réexports publics

- [ ] **Step 1: Écrire les tests en échec**

`src/db/persistence.test.ts` (le store est au niveau du module : chaque test recharge le module) :

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

type Storage = { persisted?: () => Promise<boolean>; persist?: () => Promise<boolean> }

function stubStorage(storage: Storage | undefined) {
  vi.stubGlobal('navigator', { ...window.navigator, storage })
}

async function load() {
  return import('./persistence')
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePersistenceStatus', () => {
  test('persisted', async () => {
    stubStorage({ persisted: async () => true, persist: async () => true })
    const { usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('persisted'))
  })

  test('best-effort', async () => {
    stubStorage({ persisted: async () => false, persist: async () => false })
    const { usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('best-effort'))
  })

  test('unsupported sans API, et requestPersistentStorage renvoie false', async () => {
    stubStorage(undefined)
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('unsupported'))
    expect(await requestPersistentStorage()).toBe(false)
  })

  test('persisted() qui rejette : best-effort, sans rejet non géré', async () => {
    stubStorage({ persisted: () => Promise.reject(new Error('refus')), persist: async () => false })
    const { usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('best-effort'))
  })
})

describe('requestPersistentStorage', () => {
  test('une demande acceptée fait passer le hook de best-effort à persisted', async () => {
    let granted = false
    const persist = vi.fn(async () => {
      granted = true
      return true
    })
    stubStorage({ persisted: async () => granted, persist })
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    await waitFor(() => expect(result.current).toBe('best-effort'))

    expect(await requestPersistentStorage()).toBe(true)
    expect(persist).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current).toBe('persisted'))
  })

  test('une demande refusée renvoie false et laisse best-effort', async () => {
    stubStorage({ persisted: async () => false, persist: async () => false })
    const { requestPersistentStorage, usePersistenceStatus } = await load()
    const { result } = renderHook(() => usePersistenceStatus())
    expect(await requestPersistentStorage()).toBe(false)
    await waitFor(() => expect(result.current).toBe('best-effort'))
  })
})
```

- [ ] **Step 2: Vérifier l'échec**

Run: `./node_modules/.bin/vitest run src/db/persistence.test.ts`
Expected: FAIL, module `./persistence` introuvable.

- [ ] **Step 3: Implémenter**

`src/db/persistence.ts` :

```ts
import { useSyncExternalStore } from 'react'

/** `best-effort` : le navigateur peut effacer la base en cas de manque d'espace (F05 l'indique). */
export type PersistenceStatus = 'persisted' | 'best-effort' | 'unsupported'

let status: PersistenceStatus | undefined
let firstRead: Promise<void> | undefined
const listeners = new Set<() => void>()

function storageManager(): StorageManager | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.storage
}

async function readStatus(): Promise<PersistenceStatus> {
  const storage = storageManager()
  if (typeof storage?.persisted !== 'function') return 'unsupported'
  try {
    return (await storage.persisted()) ? 'persisted' : 'best-effort'
  } catch {
    // Impossible de savoir : on suppose le pire, F05 recommandera les backups.
    return 'best-effort'
  }
}

async function refresh(): Promise<void> {
  status = await readStatus()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  firstRead ??= refresh()
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Demande au navigateur de ne pas effacer la base (appelée par F06 à la première création de
 * session). Idempotente ; renvoie `true` si le stockage est persistant.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = storageManager()
  if (typeof storage?.persist !== 'function') {
    await refresh()
    return false
  }
  let granted: boolean
  try {
    granted = await storage.persist()
  } catch {
    granted = false
  }
  await refresh()
  return granted
}

/** `undefined` tant que la première lecture n'a pas répondu. */
export function usePersistenceStatus(): PersistenceStatus | undefined {
  return useSyncExternalStore(subscribe, () => status)
}
```

`src/db/index.ts` :

```ts
export { createDb, db, QuestionatorDb, type DbStatus } from './db'
export { SessionExistsError, SessionNotFoundError } from './errors'
export { useDbStatus, useSession, useSessions } from './hooks'
export {
  requestPersistentStorage,
  usePersistenceStatus,
  type PersistenceStatus,
} from './persistence'
export {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  putSession,
  updateSession,
} from './sessions'
```

- [ ] **Step 4: Vérifier**

Run: `./node_modules/.bin/vitest run src/db` puis `pnpm check` puis `pnpm build`
Expected: PASS, verts, build sans avertissement.

Run: `grep -r __questionatorDb dist/ ; echo "exit $?"`
Expected: aucune ligne, `exit 1`.

- [ ] **Step 5: Commit**

```bash
rtk git add src/db/persistence.ts src/db/persistence.test.ts src/db/index.ts
rtk git commit -m "✨ Suit l'état du stockage persistant" -m "<pied de commit>"
```
