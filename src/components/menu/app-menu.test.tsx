import 'fake-indexeddb/auto'
import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { renderAt } from '@/testing/render-at'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

/** Le menu latéral (`aside`) : le tiroir de la Task 4 et le fil d'Ariane ont des liens de même nom. */
async function menu() {
  return within(await screen.findByRole('complementary'))
}

test('liens du menu, Éditeur actif', async () => {
  renderAt('/editor')
  const aside = await menu()
  const main = within(aside.getByRole('navigation', { name: 'Navigation principale' }))
  const spaces = within(aside.getByRole('navigation', { name: 'Espaces' }))
  expect(main.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/')
  expect(spaces.getByRole('link', { name: 'Sessions' })).toHaveAttribute('href', '/sessions')
  expect(spaces.getByRole('link', { name: 'Éditeur de config' })).toHaveAttribute('href', '/editor')
  expect(spaces.getByRole('link', { name: 'Entraînement' })).toHaveAttribute('href', '/trainings')
  const current = aside
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
  expect(current.map((link) => link.getAttribute('href'))).toEqual(['/editor'])
  expect(aside.getByText('Espaces')).toBeInTheDocument()
  expect(aside.getByText('Questionator Z-4000')).toBeInTheDocument()
})

test('aide en pied : doc dans un nouvel onglet', async () => {
  renderAt('/editor')
  const help = within((await menu()).getByRole('navigation', { name: 'Aide' }))
  const link = help.getByRole('link', { name: 'Aide (nouvel onglet)' })
  expect(link).toHaveAttribute('href', `${import.meta.env.BASE_URL}docs/`)
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(link).toHaveTextContent('Aide')
})

test('replier puis déplier, état mémorisé', async () => {
  const { unmount } = renderAt('/editor')
  const aside = await menu()
  const toggle = aside.getByRole('button', { name: 'Replier le menu' })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  fireEvent.click(toggle)
  const expand = aside.getByRole('button', { name: 'Déplier le menu' })
  expect(expand).toHaveAttribute('aria-expanded', 'false')
  expect(localStorage.getItem('questionator:menu-collapsed')).toBe('true')
  expect(aside.getByRole('link', { name: 'Sessions' })).toBeInTheDocument()
  expect(aside.getByText('Questionator Z-4000')).toHaveClass('sr-only')
  expect(aside.queryByText('Espaces')).not.toBeInTheDocument()
  unmount()

  renderAt('/editor')
  expect((await menu()).getByRole('button', { name: 'Déplier le menu' })).toBeInTheDocument()
})

test('stockage illisible : déplié, bascule utilisable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqué')
  })
  renderAt('/editor')
  const aside = await menu()
  fireEvent.click(aside.getByRole('button', { name: 'Replier le menu' }))
  expect(aside.getByRole('button', { name: 'Déplier le menu' })).toBeInTheDocument()
})

test('clavier : liens et bouton natifs, dans l’ordre du parcours', async () => {
  renderAt('/editor')
  const aside = await screen.findByRole('complementary')
  // jsdom ne simule pas Tab : l'ordre de tabulation est celui du DOM pour des éléments natifs.
  const focusable = [...aside.querySelectorAll('a[href], button')]
  expect(focusable.every((el) => !el.hasAttribute('tabindex'))).toBe(true)
  expect(focusable.map((el) => el.getAttribute('aria-label') ?? el.textContent)).toEqual([
    'Accueil',
    'Sessions',
    'Éditeur de config',
    'Entraînement',
    'Aide (nouvel onglet)',
    'Replier le menu',
  ])
})
