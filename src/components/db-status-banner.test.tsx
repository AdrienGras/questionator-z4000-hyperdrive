import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { makeUi } from '@/testing/make-ui'
import { DbStatusBanner } from './db-status-banner'

test('outdated : titre puis corps, bouton « Recharger »', () => {
  render(<DbStatusBanner ui={makeUi()} status="outdated" />)
  const alert = screen.getByRole('alert')
  expect(alert).toHaveTextContent(
    /^L’application a été mise à jour dans un autre onglet\.\s*Rechargez la page pour continuer\.\s*Recharger$/,
  )
  expect(screen.getByText('L’application a été mise à jour dans un autre onglet.').tagName).toBe(
    'STRONG',
  )
  expect(screen.getByRole('button', { name: 'Recharger' })).toBeInTheDocument()
})

test('unavailable : titre en strong, corps, aucun bouton, ton danger', () => {
  render(<DbStatusBanner ui={makeUi()} status="unavailable" />)
  const alert = screen.getByRole('alert')
  expect(screen.getByText('Le stockage local est indisponible').tagName).toBe('STRONG')
  expect(alert).toHaveTextContent(
    'Le stockage local est indisponible (navigation privée ou cookies bloqués ?). Les sessions ne peuvent pas être enregistrées.',
  )
  expect(screen.queryByRole('button')).toBeNull()
  expect(alert).toHaveClass('border-destructive/45')
})

test('open : rien', () => {
  const { container } = render(<DbStatusBanner ui={makeUi()} status="open" />)
  expect(container).toBeEmptyDOMElement()
})

test('anglais', () => {
  render(<DbStatusBanner ui={makeUi('en')} status="outdated" />)
  expect(screen.getByRole('alert')).toHaveTextContent(
    /^The app was updated in another tab\.\s*Reload the page to continue\.\s*Reload$/,
  )
})
