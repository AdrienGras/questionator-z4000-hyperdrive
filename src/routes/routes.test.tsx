import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'

beforeEach(async () => {
  await db.sessions.clear()
})

function themedSession(locale?: 'fr' | 'en') {
  const config = makeConfig()
  return makeSession({
    id: 'session-1',
    config: {
      ...config,
      ...(locale !== undefined && { locale }),
      exam: { title: 'Oral de PHP' },
      theme: { light: { primary: 'rgb(1, 2, 3)' }, dark: {} },
      categories: config.categories.map((category) => ({
        ...category,
        label: 'Bases',
        color: '#ff0000',
      })),
    },
  })
}

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

test('la route /session/$sessionId affiche la session thémée et ses catégories', async () => {
  await putSession(themedSession())
  renderAt('/session/session-1')
  expect(await screen.findByRole('heading', { name: 'Oral de PHP' })).toBeInTheDocument()
  expect(screen.getByText('Bases')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Bientôt disponible' })).toBeDisabled()
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
})

test('une session inconnue affiche « Session introuvable » avec un lien de retour', async () => {
  renderAt('/session/inconnue')
  expect(await screen.findByRole('heading', { name: 'Session introuvable' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
})

test('une config en anglais donne une vue examinateur entièrement en anglais', async () => {
  await putSession(themedSession('en'))
  renderAt('/session/session-1')
  expect(await screen.findByRole('button', { name: 'Coming soon' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^Display mode:/ })).toBeInTheDocument()
  expect(document.documentElement.lang).toBe('en')
})

test('la route /present/$sessionId affiche l’écran d’attente thémé', async () => {
  await putSession(themedSession())
  renderAt('/present/session-1')
  expect(await screen.findByRole('heading', { name: 'Oral de PHP' })).toBeInTheDocument()
  expect(screen.getByText("L'épreuve va bientôt commencer.")).toBeInTheDocument()
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
})

test('revenir à l’accueil depuis une session thémée ne laisse aucun token sur <html>', async () => {
  await putSession(themedSession())
  const { router } = renderAt('/session/session-1')
  await screen.findByRole('heading', { name: 'Oral de PHP' })
  await router.navigate({ to: '/' })
  expect(
    await screen.findByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' }),
  ).toBeInTheDocument()
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('')
})
