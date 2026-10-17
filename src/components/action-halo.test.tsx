import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ActionHalo } from './action-halo'

test.each([
  ['start', '-left-6'],
  ['end', '-right-6'],
] as const)('halo %s caché aux lecteurs d’écran, sans pointeur, du bon côté', (side, edge) => {
  const { container } = render(
    <ActionHalo side={side}>
      <button type="button">Créer</button>
    </ActionHalo>,
  )
  expect(screen.getByRole('button', { name: 'Créer' })).toBeInTheDocument()
  const halo = container.querySelector('[aria-hidden="true"]')
  expect(halo).toHaveClass('pointer-events-none', edge)
})
