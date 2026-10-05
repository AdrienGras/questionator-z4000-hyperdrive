import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { formatPercent, RateCell } from './rate-cell'

const percent = (value: number) => new Intl.NumberFormat('fr', { style: 'percent' }).format(value)

test('formatPercent : pourcentage entier arrondi, — sans note', () => {
  expect(formatPercent(0.625, 'fr')).toBe(percent(0.63))
  expect(formatPercent(1, 'en')).toBe('100%')
  expect(formatPercent(0.004, 'en')).toBe('0%')
  expect(formatPercent(null, 'fr')).toBe('—')
})

test('taux noté : pourcentage et barre nommée par le libellé', () => {
  render(<RateCell ui={makeUi()} label="Facile" rate={0.82} />)

  expect(screen.getByText(percent(0.82), { normalizer: (s) => s })).toBeInTheDocument()
  const bar = screen.getByRole('progressbar', { name: `Facile : ${percent(0.82)}` })
  expect(bar).toHaveAttribute('aria-valuenow', '82')
})

test('sans note : — et pas de barre', () => {
  render(<RateCell ui={makeUi()} label="Facile" rate={null} />)

  expect(screen.getByText('—')).toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
