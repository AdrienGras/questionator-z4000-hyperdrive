import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatsEmptyState } from './stats-empty-state'

test('avec titre : région nommée, corps et action', () => {
  render(
    <StatsEmptyState
      title="Pas encore de statistiques"
      body="Aucune question tirée."
      action={<a href="#/x">Aller au passage</a>}
    />,
  )
  expect(screen.getByRole('region', { name: 'Pas encore de statistiques' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Pas encore de statistiques')
  expect(screen.getByText('Aucune question tirée.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Aller au passage' })).toBeInTheDocument()
})

test('sans titre : corps et action, aucun titre', () => {
  render(<StatsEmptyState body="Journal vide." action={<a href="#/y">Aller à l’entraînement</a>} />)
  expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  expect(screen.getByText('Journal vide.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Aller à l’entraînement' })).toBeInTheDocument()
})
