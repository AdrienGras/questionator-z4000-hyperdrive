import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { App } from '@/App'

test("affiche le titre de l'application", () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' }),
  ).toBeInTheDocument()
})
