import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeScoredDraw, makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { ReviewList } from './review-list'

const levels = new Map([
  ['a', 'A'],
  ['b', 'B'],
])

test('une entrée par question à revoir : niveau, titre, dernière note et passages', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<ReviewList ui={makeUi()} questions={stats.questions} levels={levels} />)

  const region = screen.getByRole('region', { name: 'À revoir' })
  const items = within(region).getAllByRole('listitem')
  expect(items).toHaveLength(1)
  const [item] = items
  if (item === undefined) throw new Error('entrée attendue')
  expect(within(item).getByText('Question A1')).toBeInTheDocument()
  expect(item).toHaveTextContent('A')
  expect(item).toHaveTextContent('Dernière note : 0,5 / 2')
  expect(item).toHaveTextContent('2 passages')
})

test('aucune question à revoir : phrase dédiée, pas de liste', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), [makeScoredDraw('a-1', 2, 2)])
  render(<ReviewList ui={makeUi()} questions={stats.questions} levels={levels} />)

  expect(screen.getByText('Aucune question à revoir pour l’instant.')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
})

test('niveau absent de la table des libellés : l’id de catégorie sert de repli', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<ReviewList ui={makeUi()} questions={stats.questions} levels={new Map()} />)

  const item = screen.getByRole('listitem')
  expect(item).toHaveTextContent('a · Dernière note : 0,5 / 2 · 2 passages')
})
