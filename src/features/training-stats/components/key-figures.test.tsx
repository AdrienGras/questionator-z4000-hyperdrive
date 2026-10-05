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
  // La couverture visible est masquée aux lecteurs d'écran : la barre la porte dans son nom.
  expect(within(region).getByText('2 / 4 questions notées')).toHaveAttribute('aria-hidden', 'true')
  const bar = within(region).getByRole('progressbar', { name: '2 / 4 questions notées' })
  expect(bar).toHaveAttribute('aria-valuenow', '50')
})

test('aucune question dans la config : couverture « 0 / 0 » et barre à zéro', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<KeyFigures ui={makeUi()} stats={{ ...stats, coverage: { covered: 0, total: 0 } }} />)

  const bar = screen.getByRole('progressbar', { name: '0 / 0 question notée' })
  expect(bar).toHaveAttribute('aria-valuenow', '0')
})
