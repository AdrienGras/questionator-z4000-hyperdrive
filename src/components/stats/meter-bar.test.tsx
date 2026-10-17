import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MeterBar } from './meter-bar'

/** Remplissage de la barre (premier enfant de la piste), `null` sans remplissage. */
function fill(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('[aria-hidden] > span')
}

test('largeur proportionnelle au taux, dessin caché', () => {
  const { container } = render(<MeterBar value={0.25} tone="primary" />)
  expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  expect(fill(container)?.style.width).toBe('25%')
  expect(fill(container)).toHaveClass('bg-primary')
})

test('taux hors de [0 ; 1] : barre bornée', () => {
  const { container: under } = render(<MeterBar value={-0.1} tone="primary" />)
  expect(fill(under)?.style.width).toBe('0%')
  const { container: over } = render(<MeterBar value={1.4} tone="primary" />)
  expect(fill(over)?.style.width).toBe('100%')
})

test('sans taux : la piste seule', () => {
  const { container } = render(<MeterBar value={null} tone="primary" />)
  expect(fill(container)).toBeNull()
})

test('teinte de catégorie posée en variable, repli neutre sans couleur', () => {
  const { container: colored } = render(<MeterBar value={0.5} tone="category" color="#21d3ee" />)
  const track = colored.querySelector<HTMLElement>(':scope > span')!
  expect(track.style.getPropertyValue('--category-color')).toBe('#21d3ee')
  const { container: neutral } = render(<MeterBar value={0.5} tone="category" />)
  expect(neutral.firstElementChild).not.toHaveAttribute('style')
  expect(fill(neutral)?.className).toContain('var(--category-color,var(--color-muted-foreground))')
})

test('dégradé d’action sur demande', () => {
  const { container } = render(<MeterBar value={0.5} tone="primary" gradient />)
  expect(fill(container)).toHaveClass('from-primary', 'to-action-to')
})
