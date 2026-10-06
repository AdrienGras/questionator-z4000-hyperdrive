import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { TagRates } from './tag-rates'
import { rowCells } from '@/testing/table-assertions'

const percent = (value: number) => new Intl.NumberFormat('fr', { style: 'percent' }).format(value)

test('une ligne par notion, dans l’ordre des stats, avec son taux', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<TagRates ui={makeUi()} tags={stats.byTag} />)

  const table = screen.getByRole('table', { name: 'Par notion' })
  expect(
    within(table)
      .getAllByRole('rowheader')
      .map((h) => h.textContent),
  ).toEqual(['x', 'y'])
  expect(rowCells(table, 'x')).toEqual([percent(0.75)])
  expect(rowCells(table, 'y')).toEqual([percent(1)])
  expect(within(table).getByRole('progressbar', { name: `y : ${percent(1)}` })).toBeInTheDocument()
})
