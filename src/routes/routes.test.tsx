import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { createAppRouter } from '@/router'

function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }))
  render(<RouterProvider router={router} />)
}

test("la route / affiche l'accueil", async () => {
  renderAt('/')
  expect(
    await screen.findByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument()
})

test('une route inconnue affiche la page 404 avec un lien de retour', async () => {
  renderAt('/nimporte-quoi')
  expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
})

test.each(['/new', '/session/abc'])('%s affiche la page provisoire', async (path) => {
  renderAt(path)
  expect(await screen.findByRole('heading', { name: 'Bientôt disponible' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
})
