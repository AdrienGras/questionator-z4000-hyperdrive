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

test('taux noté : pourcentage et barre nommée par le libellé', () => {
  render(<RateCell ui={makeUi()} label="Facile" rate={0.82} />)

  // Le pourcentage visible est masqué aux lecteurs d'écran : la barre le porte déjà dans son nom.
  expect(screen.getByText(percent(0.82), { normalizer: (s) => s })).toHaveAttribute(
    'aria-hidden',
    'true',
  )
  const bar = screen.getByRole('progressbar', { name: `Facile : ${percent(0.82)}` })
  expect(bar).toHaveAttribute('aria-valuenow', '82')
})

test('sans note : — et pas de barre', () => {
  render(<RateCell ui={makeUi()} label="Facile" rate={null} />)

  // Sans barre, « — » reste la seule information : lisible par les lecteurs d'écran.
  expect(screen.getByText('—')).not.toHaveAttribute('aria-hidden')
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})

test('barre et texte arrondis de la même façon : 0,145 donne 15 des deux côtés', () => {
  render(<RateCell ui={makeUi()} label="Facile" rate={0.145} />)

  const bar = screen.getByRole('progressbar', { name: `Facile : ${percent(0.15)}` })
  expect(bar).toHaveAttribute('aria-valuenow', '15')
})
