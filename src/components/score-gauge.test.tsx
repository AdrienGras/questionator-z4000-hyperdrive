import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ScoreGauge } from './score-gauge'

function filledArc(container: HTMLElement): SVGPathElement | null {
  return container.querySelector('path[data-filled]')
}

test('phrase pour les lecteurs d’écran, contenu visible caché', () => {
  render(
    <ScoreGauge ratio={0.575} size="md" label="Note finale : 11,50 sur 20">
      <span>11,50</span>
    </ScoreGauge>,
  )
  // Une seule phrase pour les lecteurs d'écran ; la note visible est décorative.
  expect(screen.getByText('Note finale : 11,50 sur 20')).toHaveClass('sr-only')
  expect(screen.getByText('11,50').closest('[aria-hidden="true"]')).not.toBeNull()
})

test.each([
  [0.575, '57.5 100'],
  [1.4, '100 100'],
  [-1, '0 100'],
])('arc rempli au prorata, borné (%s)', (ratio, dasharray) => {
  const { container } = render(
    <ScoreGauge ratio={ratio} size="lg" label="Note">
      <span />
    </ScoreGauge>,
  )
  expect(filledArc(container)).toHaveAttribute('stroke-dasharray', dasharray)
})

test('sans note : pas d’arc rempli', () => {
  const { container } = render(
    <ScoreGauge ratio={undefined} size="md" label="Note finale : —">
      <span>—</span>
    </ScoreGauge>,
  )
  expect(filledArc(container)).toBeNull()
})
