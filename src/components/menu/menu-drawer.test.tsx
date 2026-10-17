import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderAt } from '@/testing/render-at'

// jsdom n'applique pas les classes `md:` : la barre du haut et le menu latéral sont tous deux
// dans le DOM. Les requêtes passent par le bouton « Menu » et le dialogue qu'il ouvre.

async function openDrawer() {
  fireEvent.click(await screen.findByRole('button', { name: 'Menu' }))
  return screen.findByRole('dialog', { name: 'Menu' })
}

test('le bouton Menu ouvre le tiroir', async () => {
  renderAt('/')
  const menuButton = await screen.findByRole('button', { name: 'Menu' })
  expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  const drawer = within(await openDrawer())
  expect(drawer.getByRole('link', { name: 'Sessions' })).toHaveAttribute('href', '/sessions')
  expect(drawer.getByRole('link', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page')
  expect(drawer.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument()
  expect(drawer.queryByRole('button', { name: 'Replier le menu' })).toBeNull()
})

test('un lien choisi ferme le tiroir et navigue', async () => {
  const { router } = renderAt('/')
  const drawer = within(await openDrawer())
  fireEvent.click(drawer.getByRole('link', { name: 'Éditeur de config' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull())
  expect(router.state.location.pathname).toBe('/editor')
})

test('Échap ferme le tiroir et rend le focus au bouton Menu', async () => {
  renderAt('/')
  const dialog = await openDrawer()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull())
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Menu' })),
  )
})

test('« Fermer le menu » ferme le tiroir', async () => {
  renderAt('/')
  const drawer = within(await openDrawer())
  fireEvent.click(drawer.getByRole('button', { name: 'Fermer le menu' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull())
})
