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

test('formatPercent : arrondi sans dérive flottante (0,145 donne 15 %, pas 14 %)', () => {
  expect(formatPercent(0.145, 'en')).toBe('15%')
  expect(formatPercent(0.285, 'en')).toBe('29%')
})

test('taux noté : pourcentage lisible et barre décorative de même arrondi', () => {
  const { container } = render(<RateCell ui={makeUi()} rate={0.145} color="#21d3ee" />)

  expect(screen.getByText(percent(0.15), { normalizer: (s) => s })).not.toHaveAttribute(
    'aria-hidden',
  )
  expect(container.querySelector<HTMLElement>('[aria-hidden] > span')?.style.width).toBe('15%')
})

test('sans note : — et pas de barre', () => {
  const { container } = render(<RateCell ui={makeUi()} rate={null} />)

  expect(screen.getByText('—')).toBeInTheDocument()
  expect(container.querySelector('[aria-hidden]')).toBeNull()
})
