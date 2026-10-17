import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import { SpaceIcon } from './space-icon'

test('tuile teintée de la couleur de l’espace, cachée aux lecteurs d’écran', () => {
  const { container } = render(<SpaceIcon space="sessions" size="lg" />)
  const tile = container.firstElementChild
  expect(tile).toHaveAttribute('aria-hidden', 'true')
  expect(tile).toHaveClass('size-13', 'bg-space-sessions/14', 'text-space-sessions')
})
