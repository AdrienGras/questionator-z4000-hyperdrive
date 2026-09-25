import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderAt } from '@/testing/render-at'

test("la route / affiche l'accueil", async () => {
  renderAt('/')
  expect(
    await screen.findByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' }),
  ).toBeInTheDocument()
})

test('une route inconnue affiche la page 404 avec un lien de retour', async () => {
  renderAt('/nimporte-quoi')
  expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
})

test("la route /new affiche l'écran de création", async () => {
  renderAt('/new')
  expect(await screen.findByRole('heading', { name: 'Nouvelle session' })).toBeInTheDocument()
})

test('la route /session/$sessionId affiche la page provisoire', async () => {
  renderAt('/session/abc')
  expect(await screen.findByRole('heading', { name: 'Bientôt disponible' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
})
