import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeScoredDraw, makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { ReviewList } from './review-list'

test('une entrée par question à revoir : titre, niveau, dernière note et passages', () => {
  const config = makeTrainingConfig()
  const stats = computeTrainingStats(config, makeStatsDraws())
  render(<ReviewList ui={makeUi()} config={config} questions={stats.questions} />)

  const region = screen.getByRole('region', { name: 'À revoir' })
  expect(within(region).getByText('1 question')).toBeInTheDocument()
  const items = within(region).getAllByRole('listitem')
  expect(items).toHaveLength(1)
  const [item] = items
  if (item === undefined) throw new Error('entrée attendue')
  expect(within(item).getByText('Question A1')).toBeInTheDocument()
  expect(within(item).getByText('A')).toBeInTheDocument()
  expect(item).toHaveTextContent('Dernière note 0,5 / 2 · 2 passages')
})

test('aucune question à revoir : phrase dédiée, ni liste ni compteur', () => {
  const config = makeTrainingConfig()
  const stats = computeTrainingStats(config, [makeScoredDraw('a-1', 2, 2)])
  render(<ReviewList ui={makeUi()} config={config} questions={stats.questions} />)

  expect(screen.getByText('Aucune question à revoir pour l’instant.')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
  expect(screen.queryByText(/^\d+ questions?$/)).not.toBeInTheDocument()
})

test('niveau absent de la config affichée : l’id de catégorie sert de repli', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  const other = makeTrainingConfig()
  other.categories = other.categories.filter((c) => c.id !== 'a')
  render(<ReviewList ui={makeUi()} config={other} questions={stats.questions} />)

  expect(within(screen.getByRole('listitem')).getByText('a')).toBeInTheDocument()
})
