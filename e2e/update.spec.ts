import { appendFile, cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { examplePath, expect, test as base } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

/**
 * Cycle de mise à jour du service worker (F17, D72), sans second build : une copie de `dist/`
 * servie par un petit serveur statique propre au test, dont on modifie `sw.js` d'un octet pour
 * simuler un déploiement. Exerce la vraie bibliothèque (`registerSW`, workbox-window) dans Chromium.
 */

const BASE = '/questionator-z4000-hyperdrive/'
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const PILL = 'Nouvelle version disponible'

/** La pastille de mise à jour (`<output>`, rôle `status`). */
function pill(page: Page) {
  return page.getByRole('status').filter({ hasText: PILL })
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

/** Serveur statique d'une copie de `dist/`, sur un port libre, en revalidation à chaque requête. */
async function serveCopy(root: string): Promise<Server> {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    const file = normalize(join(root, pathname.slice(BASE.length) || 'index.html'))
    if (!pathname.startsWith(BASE) || !file.startsWith(root + sep)) {
      response.writeHead(404).end()
      return
    }
    readFile(file).then(
      (body) => {
        response.writeHead(200, {
          'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
          // La vérification de mise à jour doit voir le nouveau `sw.js`.
          'Cache-Control': 'no-cache',
        })
        response.end(body)
      },
      () => {
        response.writeHead(404).end()
      },
    )
  })
  await new Promise<void>((resolve) => server.listen(0, 'localhost', resolve))
  return server
}

/** Copie de `dist/` servie pour un test : `root` est le dossier servi, `url` la base de l'app. */
type Site = { root: string; url: string }

/**
 * `site` : une copie neuve de `dist/` par test (le déploiement simulé la modifie), servie sur un port
 * libre ; `baseURL` pointe dessus. Chaque onglet compte ses chargements de document dans
 * `sessionStorage` (l'init script ne tourne pas aux navigations par ancre).
 */
const test = base.extend<{ site: Site }>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright exige un motif déstructuré, même vide.
  site: async ({}, use) => {
    const root = await mkdtemp(join(tmpdir(), 'questionator-update-'))
    await cp(DIST, root, { recursive: true })
    const server = await serveCopy(root)
    const address = server.address()
    if (address === null || typeof address === 'string')
      throw new Error('Adresse du serveur inconnue')
    await use({ root, url: `http://localhost:${address.port}${BASE}` })
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await rm(root, { recursive: true, force: true })
  },
  baseURL: async ({ site }, use) => {
    await use(site.url)
  },
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      sessionStorage.setItem('loads', String(Number(sessionStorage.getItem('loads') ?? '0') + 1))
    })
    await use(context)
  },
})

/** Nombre de chargements de l'onglet ; -1 pendant un rechargement (contexte d'exécution détruit). */
async function loads(page: Page): Promise<number> {
  try {
    return await page.evaluate(() => Number(sessionStorage.getItem('loads')))
  } catch {
    return -1
  }
}

async function waitForController(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })
}

/** Simule un déploiement : `sw.js` change d'un octet, puis l'onglet vérifie la mise à jour. */
async function deploy(page: Page, site: Site): Promise<void> {
  await appendFile(join(site.root, 'sw.js'), '\n// déploiement simulé\n')
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    await registration.update()
  })
}

test('nouvelle version : pastille aux examinateurs, seul l’onglet qui clique se recharge', async ({
  page: tabA,
  context,
  site,
}) => {
  // Installation, puis rechargement : l'onglet A démarre sous contrôle, comme B et la vue projetée.
  const home = new HomePage(tabA)
  await home.goto()
  await waitForController(tabA)
  await tabA.reload()
  await waitForController(tabA)

  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(examplePath('config.example.json'))
  await create.fillName('Session mise à jour')
  await create.submit()

  const [present] = await Promise.all([
    tabA.waitForEvent('popup'),
    tabA.getByRole('button', { name: 'Ouvrir la vue projetée' }).click(),
  ])
  await expect(present.getByRole('main')).toBeVisible()
  await waitForController(present)

  const tabB = await context.newPage()
  await tabB.goto(tabA.url())
  await waitForController(tabB)
  // Marqueur en mémoire du document : il disparaît si B est rechargé.
  await tabB.evaluate(() => {
    document.documentElement.dataset.marker = 'B'
  })

  const loadsA = await loads(tabA)
  const loadsB = await loads(tabB)
  const loadsPresent = await loads(present)

  await deploy(tabB, site)

  // Une version attend : pastille dans les deux onglets examinateur, rien dans la vue projetée,
  // qui ne se recharge pas tant que personne ne clique.
  await expect(pill(tabA)).toBeVisible()
  await expect(pill(tabB)).toBeVisible()
  await expect
    .poll(() =>
      present.evaluate(async () => (await navigator.serviceWorker.ready).waiting !== null),
    )
    .toBe(true)
  await expect(pill(present)).toHaveCount(0)
  expect(await loads(present)).toBe(loadsPresent)
  expect(await loads(tabA)).toBe(loadsA)
  expect(await loads(tabB)).toBe(loadsB)

  await pill(tabA).getByRole('button', { name: 'Recharger' }).click()

  // A se recharge une fois et repart à jour ; la vue projetée se recharge une fois.
  await expect.poll(() => loads(tabA)).toBe(loadsA + 1)
  await expect.poll(() => loads(present)).toBe(loadsPresent + 1)
  await expect(tabA.getByRole('button', { name: 'Ouvrir la vue projetée' })).toBeVisible()
  await expect(pill(tabA)).toHaveCount(0)
  await expect(present.getByRole('main')).toBeVisible()
  await expect(pill(present)).toHaveCount(0)

  // B garde son état (marqueur) et sa pastille : son « Recharger » ne ferait plus que recharger.
  await expect(pill(tabB)).toBeVisible()
  expect(await tabB.evaluate(() => document.documentElement.dataset.marker)).toBe('B')
  expect(await loads(tabB)).toBe(loadsB)
  expect(await loads(tabA)).toBe(loadsA + 1)
  expect(await loads(present)).toBe(loadsPresent + 1)
})

test('l’onglet du tout premier chargement (sans contrôleur initial) se recharge à son clic', async ({
  page,
  site,
}) => {
  await new HomePage(page).goto()
  await waitForController(page)
  const before = await loads(page)

  await deploy(page, site)
  await expect(pill(page)).toBeVisible()
  expect(await loads(page)).toBe(before)

  await pill(page).getByRole('button', { name: 'Recharger' }).click()
  await expect.poll(() => loads(page)).toBe(before + 1)
  await expect(page.getByRole('link', { name: 'Créer une session' }).first()).toBeVisible()
  await expect(pill(page)).toHaveCount(0)
})
