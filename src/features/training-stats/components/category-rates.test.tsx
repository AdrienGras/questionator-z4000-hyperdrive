import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { CategoryRates } from './category-rates'
import { rowCells } from '@/testing/table-assertions'

const percent = (value: number) => new Intl.NumberFormat('fr', { style: 'percent' }).format(value)

test('une ligne par niveau, dans l’ordre de la config : taux et couverture', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<CategoryRates ui={makeUi()} categories={stats.byCategory} />)

  const table = screen.getByRole('table', { name: 'Par niveau' })
  expect(
    within(table)
      .getAllByRole('rowheader')
      .map((h) => h.textContent),
  ).toEqual(['A', 'B'])
  expect(rowCells(table, 'A')).toEqual([percent(0.75), '2 / 3'])
  expect(rowCells(table, 'B')).toEqual(['—', '0 / 1'])
  expect(
    within(table).getByRole('progressbar', { name: `A : ${percent(0.75)}` }),
  ).toBeInTheDocument()
})
