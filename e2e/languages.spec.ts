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
  z.object({
    file: z.string(),
    src: z.string().optional(),
    isEntry: z.boolean().optional(),
    imports: z.array(z.string()).optional(),
    dynamicImports: z.array(z.string()).optional(),
  }),
)
type Manifest = z.infer<typeof manifestSchema>

/** Entrée du manifeste, ou erreur : une recherche qui ne trouve rien rendrait les assertions vides. */
function entryOf(manifest: Manifest, key: string): Manifest[string] {
  const entry = manifest[key]
  if (entry === undefined) throw new Error(`clé absente du manifeste : ${key}`)
  return entry
}

/** Fichiers d'une clé et de tous ses imports statiques. */
function staticFiles(manifest: Manifest, start: string): Set<string> {
  const keys = new Set<string>()
  const queue = [start]
  for (const key of queue) {
    if (keys.has(key)) continue
    keys.add(key)
    queue.push(...(entryOf(manifest, key).imports ?? []))
  }
  return new Set([...keys].map((key) => entryOf(manifest, key).file))
}

/**
 * Lu dans `dist/.vite/manifest.json` : fichier du catalogue `shiki/langs`, fichiers de toutes les
 * grammaires (ceux que le catalogue importe dynamiquement, dépendances partagées comprises) et
 * fichiers propres à une grammaire donnée (elle-même et ses imports statiques).
 */
function shikiChunkFiles(): {
  catalog: string
  allGrammars: Set<string>
  grammarFiles: (language: string) => Set<string>
} {
  const manifest = manifestSchema.parse(
    JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')),
  )
  const catalogKey = Object.keys(manifest).find((key) => /^_langs[.-]/.test(key))
  if (catalogKey === undefined) throw new Error('chunk du catalogue absent du manifeste')
  const catalogEntry = entryOf(manifest, catalogKey)
  const grammarKeys = catalogEntry.dynamicImports ?? []
  if (grammarKeys.length < 100) throw new Error('le catalogue n’importe presque aucune grammaire')
  // Les fichiers déjà dans le bundle initial (runtime de Rolldown, vendor) ne comptent pas comme grammaires.
  const initial = new Set(
    Object.keys(manifest)
      .filter((key) => manifest[key]?.isEntry === true)
      .flatMap((key) => [...staticFiles(manifest, key)]),
  )
  const grammarOnly = (files: Set<string>): Set<string> =>
    new Set([...files].filter((file) => !initial.has(file)))
  const allGrammars = grammarOnly(
    new Set(grammarKeys.flatMap((key) => [...staticFiles(manifest, key)])),
  )
  return {
    catalog: catalogEntry.file,
    allGrammars,
    grammarFiles(language) {
      const key = grammarKeys.find((candidate) => candidate.endsWith(`/dist/${language}.mjs`))
      if (key === undefined) throw new Error(`grammaire absente du manifeste : ${language}`)
      return grammarOnly(staticFiles(manifest, key))
    },
  }
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
  const { catalog, allGrammars } = shikiChunkFiles()

  expect(requested.length).toBeGreaterThan(0)
  expect(requested).not.toContain(catalog)
  expect(requested.filter((file) => allGrammars.has(file))).toEqual([])
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

  const { catalog, allGrammars, grammarFiles } = shikiChunkFiles()
  const python = grammarFiles('python')
  expect(requested).toContain(catalog)
  // Toutes les grammaires demandées sont celles de python (et ses dépendances), aucune autre.
  expect(requested.filter((file) => allGrammars.has(file)).toSorted()).toEqual(
    [...python].toSorted(),
  )
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
  // Laisse le temps à une éventuelle coloration tardive avant d'affirmer que le bloc reste brut.
  await page.waitForLoadState('networkidle')
  await expect(examiner.highlightedCode).toHaveCount(0)
})
