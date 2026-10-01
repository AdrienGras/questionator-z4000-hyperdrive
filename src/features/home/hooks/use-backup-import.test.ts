import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { serializeBackup } from '@/domain/backup/serialize'
import { readCommentDraft, writeCommentDraft } from '@/lib/comment-draft'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import type { Session } from '@/domain/session/types'
import { makeSession } from '@/testing/session-fixtures'
import { useBackupImport } from './use-backup-import'

function file(session: Session): File {
  return new File([serializeBackup(session)], 'backup.json', { type: 'application/json' })
}

beforeEach(async () => {
  await db.sessions.clear()
})

test('deux imports lancés dans le même tick : seul le premier écrit', async () => {
  const { result } = renderHook(() => useBackupImport())
  await act(async () => {
    await Promise.all([
      result.current.importFile(file(makeSession({ name: 'Première' }))),
      result.current.importFile(file(makeSession({ id: 'session-2', name: 'Seconde' }))),
    ])
  })
  expect((await db.sessions.toArray()).map((session) => session.name)).toEqual(['Première'])
  expect(result.current.importing).toBe(false)
})

test('un import pendant un conflit en attente est ignoré : le conflit reste', async () => {
  await putSession(makeSession({ name: 'Ancienne' }))
  const { result } = renderHook(() => useBackupImport())
  await act(() => result.current.importFile(file(makeSession({ name: 'Nouvelle' }))))
  await waitFor(() => expect(result.current.state.kind).toBe('conflict'))
  await act(() => result.current.importFile(file(makeSession({ id: 'session-2', name: 'Autre' }))))
  const { state } = result.current
  expect(state.kind === 'conflict' && state.incoming.name).toBe('Nouvelle')
  expect(await db.sessions.count()).toBe(1)
})

test('remplacement par un backup : brouillons de commentaire de la session effacés', async () => {
  await putSession(makeSession({ name: 'Ancienne' }))
  writeCommentDraft('session-1', 'student-1', 'brouillon')
  writeCommentDraft('session-2', 'student-1', 'autre session')
  const { result } = renderHook(() => useBackupImport())
  await act(() => result.current.importFile(file(makeSession({ name: 'Nouvelle' }))))
  await waitFor(() => expect(result.current.state.kind).toBe('conflict'))
  expect(readCommentDraft('session-1', 'student-1')).toBe('brouillon')

  await act(() => result.current.replace())

  expect((await db.sessions.get('session-1'))?.name).toBe('Nouvelle')
  expect(readCommentDraft('session-1', 'student-1')).toBeUndefined()
  expect(readCommentDraft('session-2', 'student-1')).toBe('autre session')
})

test('import sans conflit : brouillons orphelins du même id effacés', async () => {
  writeCommentDraft('session-1', 'student-1', 'orphelin')
  const { result } = renderHook(() => useBackupImport())

  await act(() => result.current.importFile(file(makeSession())))

  expect(await db.sessions.count()).toBe(1)
  expect(readCommentDraft('session-1', 'student-1')).toBeUndefined()
})
