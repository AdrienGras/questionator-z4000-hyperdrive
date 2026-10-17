import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { CategoryRates } from './category-rates'

test('un anneau par niveau, dans l’ordre de la config : taux et couverture', () => {
  const config = makeTrainingConfig()
  const stats = computeTrainingStats(config, makeStatsDraws())
  render(<CategoryRates ui={makeUi()} config={config} categories={stats.byCategory} />)

  const region = screen.getByRole('region', { name: 'Par niveau' })
  const items = within(region).getAllByRole('listitem')
  expect(items).toHaveLength(2)
  // `Intl` sépare le signe % par une espace insécable fine.
  expect(within(items[0]!).getByText(/^Réussite A : 75\s%$/u)).toHaveClass('sr-only')
  expect(within(items[0]!).getByText('2 / 3 notées')).toBeInTheDocument()
  expect(within(items[1]!).getByText('Réussite B : —')).toBeInTheDocument()
  expect(within(items[1]!).getByText('0 / 1 notées')).toBeInTheDocument()
})
