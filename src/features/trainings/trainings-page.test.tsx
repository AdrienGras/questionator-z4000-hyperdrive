import 'fake-indexeddb/auto'
import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { db, type DbStatus } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { bannerInteractiveNames } from '@/testing/page-shell-assertions'
import { renderAt } from '@/testing/render-at'
import { makeTraining } from '@/testing/training-fixtures'

const dbState = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => dbState.status,
}))

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
  dbState.status = 'open'
})

describe('page Entraînement', () => {
  test('en-tête : titre « Entraînement », sous-titre, lien « Nouvel entraînement » vers /training/new', async () => {
    renderAt('/trainings')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Révisez seul, à partir d’une config générée par un LLM.'),
    ).toBeInTheDocument()
    expect(bannerInteractiveNames()).toEqual(['Nouvel entraînement'])
    expect(screen.getByRole('link', { name: 'Nouvel entraînement' })).toHaveAttribute(
      'href',
      '/training/new',
    )
  })

  test('compteur, cartes de la plus récente à la plus ancienne', async () => {
    await createTraining(
      makeTraining({ id: 'old', name: 'Ancien', updatedAt: '2026-10-01T09:00:00.000Z' }),
    )
    await createTraining(
      makeTraining({ id: 'new', name: 'Récent', updatedAt: '2026-10-04T09:00:00.000Z' }),
    )
    renderAt('/trainings')
    const trainings = await screen.findByRole('region', { name: 'Mes entraînements' })
    await within(trainings).findByRole('heading', { level: 3, name: 'Récent' })
    const names = within(trainings)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    expect(names).toEqual(['Récent', 'Ancien'])
    expect(
      within(trainings).getByText('2 entraînements · dernière activité d’abord'),
    ).toBeInTheDocument()
    expect(within(trainings).getByRole('list')).toHaveClass(
      'grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]',
    )
  })

  test('aucun entraînement : message « Aucun entraînement »', async () => {
    renderAt('/trainings')
    expect(await screen.findByRole('heading', { name: 'Aucun entraînement' })).toBeInTheDocument()
    expect(screen.getByText('Lancez un entraînement à partir d’une config.')).toBeInTheDocument()
  })

  test('unavailable : bandeau, pas de « Nouvel entraînement »', async () => {
    dbState.status = 'unavailable'
    renderAt('/trainings')
    expect(await screen.findByText(/stockage local est indisponible/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nouvel entraînement' })).not.toBeInTheDocument()
  })

  test('outdated : bandeau à la place de la liste', async () => {
    await createTraining(makeTraining())
    dbState.status = 'outdated'
    renderAt('/trainings')
    expect(await screen.findByText(/Rechargez la page/)).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Entraînement de test' }),
    ).not.toBeInTheDocument()
  })
})
