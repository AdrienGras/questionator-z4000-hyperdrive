import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

const pythonConfig = fileURLToPath(
  new URL('./fixtures/languages-python.config.json', import.meta.url),
)
const unknownConfig = fileURLToPath(
  new URL('./fixtures/languages-unknown.config.json', import.meta.url),
)

// Sans service worker : le pré-cache (F17) télécharge toutes les grammaires et fausserait le décompte.
test.use({ serviceWorkers: 'block' })

const manifestSchema = z.record(
  z.string(),
  z.object({ file: z.string(), src: z.string().optional() }),
)

/** Noms de fichier (`assets/<nom>-<hash>.js`) du catalogue `shiki/langs` et de chaque grammaire, lus dans le build. */
function shikiChunkFiles(): { catalog: string; grammars: Map<string, string> } {
  const manifest = manifestSchema.parse(
    JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')),
  )
  const catalog = Object.entries(manifest).find(([key]) => /^_langs[.-]/.test(key))?.[1].file
  if (catalog === undefined) throw new Error('chunk du catalogue absent du manifeste')
  const grammars = new Map<string, string>()
  for (const entry of Object.values(manifest)) {
    const name = /@shikijs\/langs\/dist\/([^/]+)\.mjs$/.exec(entry.src ?? '')?.[1]
    if (name !== undefined) grammars.set(name, entry.file)
  }
  return { catalog, grammars }
}

/** Fichiers JS demandés par la page, tous noms confondus (`assets/…`). */
function trackAssetRequests(page: import('@playwright/test').Page): string[] {
  const requested: string[] = []
  page.on('request', (request) => {
    const match = /\/(assets\/[^/?#]+\.js)/.exec(request.url())
    if (match?.[1] !== undefined) requested.push(match[1])
  })
  return requested
}

test("l'accueil ne charge ni le catalogue ni aucune grammaire", async ({ page }) => {
  const requested = trackAssetRequests(page)
  await new HomePage(page).goto()
  await page.waitForLoadState('networkidle')
  const { catalog, grammars } = shikiChunkFiles()

  expect(requested.length).toBeGreaterThan(0)
  expect(requested).not.toContain(catalog)
  expect(requested.filter((file) => [...grammars.values()].includes(file))).toEqual([])
})

test('seul le chunk de la grammaire python est chargé', async ({ page }) => {
  const requested = trackAssetRequests(page)
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(pythonConfig)
  await create.fillName('Session python')
  const examiner = await create.submit()

  await examiner.draw('Facile')
  await expect(examiner.highlightedCode).toBeAttached()

  const { catalog, grammars } = shikiChunkFiles()
  expect(requested).toContain(catalog)
  expect(requested).toContain(grammars.get('python'))
  for (const other of ['yaml', 'dockerfile', 'emacs-lisp']) {
    expect(requested, other).not.toContain(grammars.get(other))
  }
})

test('un langage inconnu reste en texte brut et est signalé', async ({ page }) => {
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(unknownConfig)
  await expect(
    page.getByText(
      'Le langage « pyhton » d’un bloc de code de la question facile-001 n’est pas reconnu : il s’affichera en texte brut.',
    ),
  ).toBeVisible()
  await create.fillName('Session langage inconnu')
  const examiner = await create.submit()

  await examiner.draw('Facile')
  await expect(examiner.plainCode).toBeAttached()
  await expect(examiner.highlightedCode).toHaveCount(0)
})
