import 'fake-indexeddb/auto'
import { screen } from '@testing-library/react'
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

/** Fait attendre une nouvelle version dans l'instance courante. */
function makeUpdateReady() {
  pwaUpdate.start((options) => {
    options.onNeedRefresh?.()
    return () => Promise.resolve()
  }, makeFakeContainer(true))
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
  expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/')
})

test('une config en anglais donne une vue examinateur entièrement en anglais', async () => {
  await putSession(themedSession('en'))
  renderAt('/session/session-1')
  expect(await screen.findByText('Question 1 / 1')).toBeInTheDocument()
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
  expect(document.documentElement).not.toHaveClass('dark')
  expect(document.documentElement.lang).toBe('fr')
})

test("d'une session à l'autre, --primary, la classe .dark et lang suivent la config active", async () => {
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
  expect(document.documentElement).not.toHaveClass('dark')
  expect(document.documentElement.lang).toBe('fr')

  router.history.back()
  await screen.findByRole('heading', { name: 'Session A' })
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('rgb(1, 2, 3)')
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.lang).toBe('en')

  await router.navigate({ to: '/' })
  await screen.findByRole('heading', { name: 'Questionator Z-4000 Hyperdrive' })
  // Mode global system, matchMedia simulé en clair : aucun token ni `.dark` à l'accueil.
  expect(document.documentElement.style.getPropertyValue('--primary')).toBe('')
  expect(document.documentElement).not.toHaveClass('dark')
  expect(document.documentElement.lang).toBe('fr')
})

test('la pastille de mise à jour s’affiche sur l’accueil quand une version attend', async () => {
  makeUpdateReady()
  renderAt('/')
  expect(await screen.findByRole('status')).toHaveTextContent('Nouvelle version disponible')
})

test('la pastille n’est jamais rendue sur /present/…', async () => {
  await putSession(themedSession())
  makeUpdateReady()
  renderAt('/present/session-1')
  await screen.findByRole('heading', { name: 'Oral de PHP' })
  expect(screen.queryByRole('status')).toBeNull()
  // La vue projetée se recharge seule, une fois, au lieu d'afficher la pastille.
  expect(reload).toHaveBeenCalledTimes(1)
})
