import 'fake-indexeddb/auto'
import { screen, within } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { pwaUpdate, type PwaUpdate } from '@/lib/pwa/pwa-update'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { renderAt } from '@/testing/render-at'
import { makeSession } from '@/testing/session-fixtures'
import { makeConfig } from '@/testing/student-fixtures'

// Le singleton est remplacé par une instance neuve à chaque test : aucune fuite d'état.
const pwa = vi.hoisted(() => ({ current: undefined as PwaUpdate | undefined }))
vi.mock('@/lib/pwa/pwa-update', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pwa/pwa-update')>()
  return {
    ...actual,
    get pwaUpdate() {
      pwa.current ??= new actual.PwaUpdate(() => undefined)
      return pwa.current
    },
  }
})

// jsdom n'implémente pas `location.reload` : la vue projetée reçoit un rechargement espion.
const reload = vi.hoisted(() => vi.fn<() => void>())
vi.mock('@/lib/pwa/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pwa/hooks')>()
  return {
    ...actual,
    useReloadOnUpdate: (dbOutdated: boolean, update?: PwaUpdate) =>
      actual.useReloadOnUpdate(dbOutdated, update, reload),
  }
})

/** Fait attendre une nouvelle version dans l'instance courante ; `activate()` simule sa prise de
 * contrôle depuis un autre onglet. */
function makeUpdateWaiting() {
  const container = makeFakeContainer(true)
  pwaUpdate.start((options) => {
    options.onNeedRefresh?.()
    return () => Promise.resolve()
  }, container)
  return { activate: () => container.dispatchEvent(new Event('controllerchange')) }
}

beforeEach(async () => {
  pwa.current = undefined
  reload.mockClear()
  await db.sessions.clear()
})

function sessionWith(
  id: string,
  title: string,
  overrides: Readonly<{
    locale?: 'fr' | 'en'
    primary: string
    defaultColorMode: 'light' | 'dark' | 'system'
  }>,
) {
  const config = makeConfig()
  return makeSession({
    id,
    config: {
      ...config,
      ...(overrides.locale !== undefined && { locale: overrides.locale }),
      exam: { title },
      presentation: { ...config.presentation, defaultColorMode: overrides.defaultColorMode },
      theme: { light: { primary: overrides.primary }, dark: { primary: overrides.primary } },
    },
  })
}

function themedSession(locale?: 'fr' | 'en') {
  const config = makeConfig()
  return makeSession({
    id: 'session-1',
    activeStudentId: 'student-1',
    config: {
      ...config,
      ...(locale !== undefined && { locale }),
      exam: { title: 'Oral de PHP' },
      // Thème sombre forcé pendant la refonte (D102) : seul `theme.dark` s'applique.
      theme: { light: {}, dark: { primary: 'rgb(1, 2, 3)' } },
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
  expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
})

test("la route /new affiche l'écran de création", async () => {
  renderAt('/new')
  expect(await screen.findByRole('heading', { name: 'Nouvelle session' })).toBeInTheDocument()
})

test('la route /session/$sessionId affiche la session thémée', async () => {
  await putSession(themedSession())
  renderAt('/session/session-1')
  expect(await screen.findByRole('heading', { name: 'Oral de PHP' })).toBeInTheDocument()
  expect(screen.getByText('Question 1 / 1')).toBeInTheDocument()
  expect(screen.getByText('Bases')).toBeInTheDocument()
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
})

test('une session inconnue affiche « Session introuvable » avec un lien de retour', async () => {
  renderAt('/session/inconnue')
  expect(await screen.findByRole('heading', { name: 'Session introuvable' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
})

test('une config en anglais donne une vue examinateur en anglais, menu dans la langue de l’app', async () => {
  await putSession(themedSession('en'))
  renderAt('/session/session-1')
  expect(await screen.findByText('Question 1 / 1')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument()
  // Le menu garde la langue de l'application (D105) : l'aide y est en français.
  const aside = screen.getByRole('complementary')
  expect(within(aside).getByRole('link', { name: 'Aide (nouvel onglet)' })).toBeInTheDocument()
  expect(aside).toHaveAttribute('lang', 'fr')
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
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.lang).toBe('fr')
})

test("d'une session à l'autre, --primary et lang suivent la config active, .dark reste forcée", async () => {
  await putSession(
    sessionWith('session-a', 'Session A', {
      locale: 'en',
      primary: 'rgb(1, 2, 3)',
      defaultColorMode: 'dark',
    }),
  )
  await putSession(
    sessionWith('session-b', 'Session B', { primary: 'rgb(9, 9, 9)', defaultColorMode: 'light' }),
  )

  const { router } = renderAt('/session/session-a')
  await screen.findByRole('heading', { name: 'Session A' })
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.lang).toBe('en')

  await router.navigate({ to: '/session/$sessionId', params: { sessionId: 'session-b' } })
  await screen.findByRole('heading', { name: 'Session B' })
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(9, 9, 9)')
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.lang).toBe('fr')

  router.history.back()
  await screen.findByRole('heading', { name: 'Session A' })
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.lang).toBe('en')

  await router.navigate({ to: '/' })
  await screen.findByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' })
  // matchMedia simulé en clair : aucun token à l'accueil, `.dark` forcée (D102).
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('')
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.lang).toBe('fr')
})

test('la pastille de mise à jour s’affiche sur l’accueil quand une version attend', async () => {
  makeUpdateWaiting()
  renderAt('/')
  expect(await screen.findByRole('status')).toHaveTextContent('Nouvelle version disponible')
})

test('sur /present/…, une version en attente : ni pastille, ni rechargement', async () => {
  await putSession(themedSession())
  makeUpdateWaiting()
  renderAt('/present/session-1')
  await screen.findByRole('heading', { name: 'Oral de PHP' })
  expect(screen.queryByRole('status')).toBeNull()
  // Recharger ici ferait boucler la vue projetée : la version attend toujours après rechargement.
  expect(reload).not.toHaveBeenCalled()
})

test('sur /present/…, une version activée ailleurs : rechargement unique, sans pastille', async () => {
  await putSession(themedSession())
  const { activate } = makeUpdateWaiting()
  activate()
  renderAt('/present/session-1')
  await screen.findByRole('heading', { name: 'Oral de PHP' })
  expect(screen.queryByRole('status')).toBeNull()
  expect(reload).toHaveBeenCalledTimes(1)
})

/** Liens marqués actifs dans le menu latéral. */
function activeMenuLinks() {
  return within(screen.getByRole('complementary'))
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent)
}

test('menu : Sessions actif sur une session', async () => {
  await putSession(themedSession())
  renderAt('/session/session-1')
  await screen.findByRole('heading', { name: 'Oral de PHP' })
  expect(activeMenuLinks()).toEqual(['Sessions'])
})

test('menu : Entraînement actif sur la mise en place', async () => {
  renderAt('/training/new')
  await screen.findByRole('complementary')
  expect(activeMenuLinks()).toEqual(['Entraînement'])
})

test('menu : présent sur la 404, aucun lien actif', async () => {
  renderAt('/nimporte-quoi')
  await screen.findByRole('heading', { name: 'Page introuvable' })
  expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toBeInTheDocument()
  expect(activeMenuLinks()).toEqual([])
})

test('menu : absent de la vue projetée', async () => {
  await putSession(themedSession())
  renderAt('/present/session-1')
  await screen.findByRole('heading', { name: 'Oral de PHP' })
  expect(screen.queryByRole('navigation', { name: 'Navigation principale' })).toBeNull()
  expect(screen.queryByRole('complementary')).toBeNull()
})
