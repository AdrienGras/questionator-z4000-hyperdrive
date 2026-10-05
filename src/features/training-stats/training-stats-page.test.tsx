import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { renderAt } from '@/testing/render-at'
import { rowCells } from '@/testing/table-assertions'
import {
  makeDraw,
  makeScoredDraw,
  makeStatsDraws,
  makeTraining,
  makeTrainingConfig,
} from '@/testing/training-fixtures'

const percent = (value: number) => new Intl.NumberFormat('fr', { style: 'percent' }).format(value)

beforeEach(async () => {
  localStorage.clear()
  vi.stubGlobal('CSS', { supports: () => true })
  await db.trainings.clear()
  await db.trainingDraws.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function seed(draws = makeStatsDraws(), config = makeTrainingConfig()) {
  await createTraining(makeTraining({ config }))
  await db.trainingDraws.bulkAdd(draws)
}

describe('écran de stats d’un entraînement', () => {
  test('titre, retour à l’entraînement, chiffres, à revoir, niveaux, notions et détail', async () => {
    await seed()
    renderAt('/training/training-1/stats')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement de test' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’entraînement' })).toHaveAttribute(
      'href',
      '/training/training-1',
    )

    const figures = screen.getByRole('region', { name: 'Chiffres clés' })
    expect(within(figures).getByText('3 réponses notées')).toBeInTheDocument()
    expect(within(figures).getByText('1 passée')).toBeInTheDocument()
    expect(within(figures).getByText('2 / 4 questions notées')).toBeInTheDocument()

    const review = screen.getByRole('region', { name: 'À revoir' })
    expect(within(review).getAllByRole('listitem')).toHaveLength(1)
    expect(within(review).getByText('Question A1')).toBeInTheDocument()

    const levels = screen.getByRole('table', { name: 'Par niveau' })
    expect(rowCells(levels, 'A')).toEqual([percent(0.75), '2 / 3'])
    const tags = screen.getByRole('table', { name: 'Par notion' })
    expect(rowCells(tags, 'y')).toEqual([percent(1)])

    const summary = screen.getByText('Détail des 4 questions')
    expect(summary.closest('details')).not.toHaveAttribute('open')
    fireEvent.click(summary)
    expect(summary.closest('details')).toHaveAttribute('open')
    const details = screen.getByRole('table', { name: 'Détail des 4 questions' })
    expect(rowCells(details, 'Question A1').at(-1)).toBe('À revoir')
  })

  test('journal vide (tirage en cours seulement) : carte d’invitation, aucun tableau', async () => {
    await seed([makeDraw()])
    renderAt('/training/training-1/stats')

    expect(
      await screen.findByText(
        'Pas encore de réponse notée. Tirez une première question pour voir vos stats.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aller à l’entraînement' })).toHaveAttribute(
      'href',
      '/training/training-1',
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Chiffres clés' })).not.toBeInTheDocument()
  })

  test('config sans tag : pas de bloc « Par notion »', async () => {
    const config = makeTrainingConfig()
    for (const category of config.categories)
      category.questions = category.questions.map((q) => ({ ...q, tags: [] }))
    await seed(makeStatsDraws(), config)
    renderAt('/training/training-1/stats')

    expect(await screen.findByRole('table', { name: 'Par niveau' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Par notion' })).not.toBeInTheDocument()
  })

  test('barème modifié : la note figée du tirage fait foi (« 2 / 2 », 100 %)', async () => {
    // Le barème actuel de B plafonne à 1 ; le tirage a été noté sur un barème à 2.
    await seed([makeScoredDraw('b-1', 2, 2)])
    renderAt('/training/training-1/stats')

    const levels = await screen.findByRole('table', { name: 'Par niveau' })
    expect(rowCells(levels, 'B')).toEqual([percent(1), '1 / 1'])
    fireEvent.click(screen.getByText('Détail des 4 questions'))
    const details = screen.getByRole('table', { name: 'Détail des 4 questions' })
    expect(rowCells(details, 'Question B1')).toEqual(['B', '1', '2 / 2', percent(1), ''])
  })

  test('id absent : écran « introuvable » avec retour', async () => {
    renderAt('/training/absent/stats')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entraînement introuvable' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
  })

  test('entraînement endommagé : écran dédié', async () => {
    await db.table('trainings').put({ id: 'training-1', name: 'Cassé' })
    renderAt('/training/training-1/stats')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cet entraînement est endommagé' }),
    ).toBeInTheDocument()
  })

  test('accès depuis l’écran d’entraînement : lien « Voir les stats »', async () => {
    await seed()
    renderAt('/training/training-1')

    const link = await screen.findByRole('link', { name: 'Voir les stats' })
    expect(link).toHaveAttribute('href', '/training/training-1/stats')
    fireEvent.click(link)
    expect(await screen.findByRole('region', { name: 'Chiffres clés' })).toBeInTheDocument()
  })

  test('accès depuis la carte d’accueil : lien « Stats » à côté de « Reprendre »', async () => {
    await seed()
    renderAt('/')

    const heading = await screen.findByRole('heading', { level: 3, name: 'Entraînement de test' })
    const card = heading.closest('li')
    if (card === null) throw new Error('carte introuvable')
    expect(within(card).getByRole('link', { name: 'Stats' })).toHaveAttribute(
      'href',
      '/training/training-1/stats',
    )
  })
})
