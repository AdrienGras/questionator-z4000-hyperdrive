import 'fake-indexeddb/auto'
import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { renderAt } from '@/testing/render-at'
import { makeTraining } from '@/testing/training-fixtures'

// Journal jamais lu : la carte reste dans l'état de chargement.
vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useTrainingDraws: () => undefined,
}))

beforeEach(async () => {
  await db.trainings.clear()
})

test('journal pas encore lu : carte et liens, sans chiffres', async () => {
  await createTraining(makeTraining())
  renderAt('/trainings')
  const heading = await screen.findByRole('heading', { level: 3, name: 'Entraînement de test' })
  const card = heading.closest('li')
  if (card === null) throw new Error('carte introuvable')
  expect(within(card).getByRole('link', { name: /^Reprendre/ })).toBeInTheDocument()
  expect(within(card).getByRole('link', { name: 'Stats' })).toBeInTheDocument()
  expect(within(card).queryByText('de réussite')).not.toBeInTheDocument()
  expect(within(card).queryByText('questions notées')).not.toBeInTheDocument()
})
