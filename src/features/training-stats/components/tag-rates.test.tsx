import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { computeTrainingStats } from '@/domain/training/training-stats'
import { makeUi } from '@/testing/make-ui'
import { makeStatsDraws, makeTrainingConfig } from '@/testing/training-fixtures'
import { TagRates } from './tag-rates'

const percent = (value: number) => new Intl.NumberFormat('fr', { style: 'percent' }).format(value)

test('une ligne par notion, dans l’ordre des stats : nom, taux et barre', () => {
  const stats = computeTrainingStats(makeTrainingConfig(), makeStatsDraws())
  render(<TagRates ui={makeUi()} tags={stats.byTag} />)

  const region = screen.getByRole('region', { name: 'Par notion' })
  const items = within(region).getAllByRole('listitem')
  expect(items.map((li) => li.textContent)).toEqual([`x${percent(0.75)}`, `y${percent(1)}`])
  expect(items[0]!.querySelector<HTMLElement>('[aria-hidden] > span')?.style.width).toBe('75%')
})
