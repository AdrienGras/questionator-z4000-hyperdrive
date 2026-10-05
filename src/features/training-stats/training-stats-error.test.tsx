import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderAt } from '@/testing/render-at'

// La route des stats échoue (chunk introuvable, base illisible) : l'errorComponent prend le relais.
vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useTraining: () => {
    throw new Error('chunk introuvable')
  },
}))

test('erreur de la route : message traduit et retour à l’entraînement', async () => {
  // React journalise l'erreur attrapée : on la fait taire pour ce seul test.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  renderAt('/training/training-1/stats')

  expect(
    await screen.findByRole('heading', { name: 'Les stats n’ont pas pu être chargées.' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Retour à l’entraînement' })).toHaveAttribute(
    'href',
    '/training/training-1',
  )
})
