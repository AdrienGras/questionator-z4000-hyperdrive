import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { RateRing } from './rate-ring'

const CIRCUMFERENCE = 2 * Math.PI * 58

/** Premier nombre du `stroke-dasharray` de l'arc, `undefined` sans arc. */
function arcLength(container: HTMLElement): number | undefined {
  const arc = container.querySelector('circle[stroke-dasharray]')
  return arc === null ? undefined : Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0])
}

test('phrase pour les lecteurs d’écran, valeur au centre, arc proportionnel', () => {
  const { container } = render(
    <RateRing
      rate={0.833}
      value="83,3 %"
      label="Réussite Facile : 83,3 %"
      caption="réussite"
      color="#21d3ee"
    />,
  )
  expect(screen.getByText('Réussite Facile : 83,3 %')).toHaveClass('sr-only')
  expect(screen.getByText('83,3 %').closest('[aria-hidden]')).not.toBeNull()
  expect(screen.getByText('réussite')).toBeInTheDocument()
  expect(container.querySelectorAll('circle')).toHaveLength(2)
  expect(arcLength(container)).toBeCloseTo(0.833 * CIRCUMFERENCE, 1)
  expect(
    container
      .querySelector<HTMLElement>(':scope > span')!
      .style.getPropertyValue('--category-color'),
  ).toBe('#21d3ee')
})

test('sans taux : piste seule et « — »', () => {
  const { container } = render(
    <RateRing rate={null} value="—" label="Réussite Normal : —" caption="réussite" />,
  )
  expect(container.querySelectorAll('circle')).toHaveLength(1)
  expect(arcLength(container)).toBeUndefined()
  expect(screen.getByText('—')).toBeInTheDocument()
})

test('taux hors de [0 ; 1] : arc borné, texte inchangé', () => {
  const { container: under } = render(
    <RateRing rate={-0.2} value="−20 %" label="x" caption="réussite" />,
  )
  expect(arcLength(under)).toBe(0)
  expect(screen.getByText('−20 %')).toBeInTheDocument()
  const { container: over } = render(
    <RateRing rate={1.3} value="130 %" label="y" caption="réussite" />,
  )
  expect(arcLength(over)).toBeCloseTo(CIRCUMFERENCE)
})
