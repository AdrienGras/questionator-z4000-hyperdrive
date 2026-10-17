import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatusScreen } from './status-screen'

test('titre en h1, icône, actions, dans un main centré', () => {
  render(
    <StatusScreen icon={<svg data-testid="icone" />} title="Session introuvable">
      <a href="/">Retour</a>
    </StatusScreen>,
  )
  const main = screen.getByRole('main')
  expect(main).toHaveClass('flex', 'min-h-svh', 'items-center', 'justify-center', 'text-center')
  expect(screen.getByRole('heading', { level: 1, name: 'Session introuvable' })).toBeInTheDocument()
  const tile = screen.getByTestId('icone').parentElement
  expect(tile).toHaveClass('bg-muted', 'text-muted-foreground')
  expect(tile).toHaveAttribute('aria-hidden', 'true')
  expect(screen.getByRole('link', { name: 'Retour' })).toBeInTheDocument()
})

test('ton danger', () => {
  render(<StatusScreen icon={<svg data-testid="icone" />} tone="danger" title="Endommagée" />)
  expect(screen.getByTestId('icone').parentElement).toHaveClass('text-destructive')
})
