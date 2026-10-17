import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { exportWorkbook } from '@/components/export/export-workbook'
import type { PersistenceStatus } from '@/lib/db/persistence'
import { db, type DbStatus } from '@/lib/db/db'
import { renderAt } from '@/testing/render-at'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const persistence = vi.hoisted((): { status: PersistenceStatus | undefined } => ({
  status: 'persisted',
}))
const download = vi.hoisted(() => vi.fn<(fileName: string, text: string) => void>())

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => dbState.status,
}))
vi.mock('@/lib/db/persistence', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/persistence')>()),
  usePersistenceStatus: () => persistence.status,
}))
vi.mock('@/lib/download', () => ({ downloadText: download }))
vi.mock('@/components/export/export-workbook')

beforeEach(async () => {
  await db.sessions.clear()
  await db.trainings.clear()
  await db.trainingDraws.clear()
  dbState.status = 'open'
  persistence.status = 'persisted'
  download.mockClear()
  vi.mocked(exportWorkbook).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('accueil', () => {
  test.each([['persisted'], ['unsupported'], [undefined]] as const)(
    'pas d’indicateur de persistance pour %s',
    async (status) => {
      persistence.status = status
      renderAt('/')
      await screen.findByRole('region', { name: 'Actions' })
      expect(screen.queryByRole('button', { name: 'Stockage non garanti' })).not.toBeInTheDocument()
    },
  )

  test('indicateur de persistance affiché en best-effort', async () => {
    persistence.status = 'best-effort'
    renderAt('/')
    await screen.findByRole('region', { name: 'Actions' })
    expect(screen.getByRole('button', { name: 'Stockage non garanti' })).toBeInTheDocument()
  })

  test('navigateur en anglais : interface en anglais', async () => {
    Object.defineProperty(window.navigator, 'languages', { value: ['en-US'], configurable: true })
    try {
      renderAt('/')
      expect(await screen.findByRole('link', { name: 'Create a session' })).toBeInTheDocument()
    } finally {
      Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR'], configurable: true })
    }
  })
})
