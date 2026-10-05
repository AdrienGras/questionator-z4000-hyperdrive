import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { KeyFigures } from './key-figures'

test('trois chiffres clés : réponses notées, passées et couverture avec sa barre', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<KeyFigures ui={makeUi()} stats={stats} />)

  const region = screen.getByRole('region', { name: 'Chiffres clés' })
  expect(within(region).getByText('3 réponses notées')).toBeInTheDocument()
  expect(within(region).getByText('1 passée')).toBeInTheDocument()
  expect(within(region).getByText('2 / 4 questions notées')).toBeInTheDocument()
  const bar = within(region).getByRole('progressbar', { name: '2 / 4 questions notées' })
  expect(bar).toHaveAttribute('aria-valuenow', '50')
})
