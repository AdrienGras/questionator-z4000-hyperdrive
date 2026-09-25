import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { db, type DbStatus } from '@/lib/db/db'
import { renderAt } from '@/testing/render-at'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => dbState.status,
}))

beforeEach(async () => {
  await db.sessions.clear()
  dbState.status = 'unavailable'
})

test.each([['/session/session-1'], ['/present/session-1']])(
  "%s : le bandeau d'indisponibilité de la base est enveloppé dans <main>",
  async (path) => {
    renderAt(path)
    const alert = await screen.findByRole('alert')
    const main = alert.closest('main')
    expect(main).not.toBeNull()
    expect(main).toHaveClass(
      'mx-auto',
      'flex',
      'min-h-svh',
      'max-w-3xl',
      'flex-col',
      'gap-6',
      'p-4',
      'sm:p-6',
    )
  },
)
