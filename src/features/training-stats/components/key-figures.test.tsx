import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { KeyFigures } from './key-figures'

/** Texte de chaque carte (chiffre puis libellé). */
function figures(region: HTMLElement): string[] {
  return [...region.querySelectorAll('p')].map((p) => p.textContent)
}

test('trois cartes : réponses notées, passées et couverture avec sa barre', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<KeyFigures ui={makeUi()} stats={stats} />)

  const region = screen.getByRole('region', { name: 'Chiffres clés' })
  expect(screen.getByRole('heading', { level: 2, name: 'Chiffres clés' })).toHaveClass('uppercase')
  expect(figures(region)).toEqual(['3 réponses notées', '1 passée', '2 / 4 questions notées'])
  const fill = region.querySelector<HTMLElement>('[aria-hidden] > span')
  expect(fill?.style.width).toBe('50%')
  expect(fill).toHaveClass('from-primary')
})

test('aucune question dans la config : « 0 / 0 » et barre vide', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<KeyFigures ui={makeUi()} stats={{ ...stats, coverage: { covered: 0, total: 0 } }} />)

  const region = screen.getByRole('region', { name: 'Chiffres clés' })
  expect(figures(region).at(-1)).toBe('0 / 0 questions notées')
  expect(region.querySelector('[aria-hidden] > span')).toBeNull()
})
