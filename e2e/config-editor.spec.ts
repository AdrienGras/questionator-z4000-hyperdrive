import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'
import { ConfigEditorPage } from './pages/config-editor-page.ts'

// Sans service worker : le pré-cache (F17) téléchargerait tous les chunks et fausserait le décompte.
test.use({ serviceWorkers: 'block' })

const EXAMPLE = readFileSync(examplePath('config.example.json'), 'utf8')

/** Exemple dont une portion de texte est remplacée ; échoue si la portion est introuvable. */
function exampleWith(search: string, replacement: string): string {
  if (!EXAMPLE.includes(search)) throw new Error(`absent de l'exemple : ${search}`)
  return EXAMPLE.replace(search, replacement)
}

/** Numéro (base 1) de la première ligne de `text` qui contient `fragment`. */
function lineOf(text: string, fragment: string): number {
  const index = text.split('\n').findIndex((line) => line.includes(fragment))
  if (index === -1) throw new Error(`ligne introuvable : ${fragment}`)
  return index + 1
}

/** Nombre de questions de l'exemple, toutes catégories confondues. */
function exampleQuestionCount(): number {
  const config = z
    .looseObject({ categories: z.array(z.looseObject({ questions: z.array(z.unknown()) })) })
    .parse(JSON.parse(EXAMPLE))
  return config.categories.reduce((total, category) => total + category.questions.length, 0)
}

/** Fichier du chunk `codemirror` (groupe de `vite.config.ts`), lu dans le manifeste du build. */
function codemirrorChunk(): string {
  const manifest = z
    .record(z.string(), z.object({ file: z.string(), name: z.string().optional() }))
    .parse(JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8')))
  const entry = Object.values(manifest).find((candidate) => candidate.name === 'codemirror')
  if (entry === undefined) throw new Error('chunk codemirror absent du manifeste')
  return entry.file
}

/** Fichiers JS demandés par la page (`assets/…`). */
function trackAssetRequests(page: Page): string[] {
  const requested: string[] = []
  page.on('request', (request) => {
    const match = /\/(assets\/[^/?#]+\.js)/.exec(request.url())
    if (match?.[1] !== undefined) requested.push(match[1])
  })
  return requested
}

/** Doublon : la deuxième question de « Facile » reprend l'identifiant de la première. */
const DUPLICATE = exampleWith('"id": "facile-002"', '"id": "facile-001"')
const DUPLICATE_LINE = lineOf(EXAMPLE, '"id": "facile-002"')
// Texte de `formatConfigIssue` (fr) pour `duplicate_question_id` ; vérifié aussi sur la création.
const DUPLICATE_MESSAGE =
  'L’identifiant de question « facile-001 » est déjà utilisé (categories[0].questions[0].id) : il doit être unique dans toute la configuration.'

test("l'accueil ne charge pas CodeMirror ; la carte ouvre l'éditeur sur l'exemple", async ({
  page,
}) => {
  const requested = trackAssetRequests(page)
  const home = new HomePage(page)
  await home.goto()
  await page.waitForLoadState('networkidle')
  const chunk = codemirrorChunk()
  expect(requested.length).toBeGreaterThan(0)
  expect(requested).not.toContain(chunk)

  const editor = await home.openEditor()
  await expect(editor.editor).toContainText('"title": "Oral PHP"')
  await expect(editor.previewQuestions).toHaveCount(exampleQuestionCount())
  await expect(editor.noIssues).toBeVisible()
  expect(requested).toContain(chunk)
})

test('une virgule supprimée est signalée sur sa ligne', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await editor.replaceText(exampleWith('"schemaVersion": 1,', '"schemaVersion": 1'))

  // V8 situe l'erreur sur le jeton qui suit la virgule manquante : `"locale"`, ligne 4.
  const message = 'Le fichier n’est pas un JSON valide (ligne 4, colonne 3).'
  await expect(editor.issue(message)).toBeVisible()
  // La saisie laisse la vue en fin de texte (CodeMirror ne rend que les lignes visibles) : le clic
  // sur l'issue ramène la ligne 4 à l'écran.
  await editor.selectIssue(message)
  await expect(editor.activeLineNumber).toHaveText('4')
  await expect(editor.errorLines).toHaveCount(1)
  await expect(editor.errorLines).toContainText('"locale": "fr"')
})

test('un identifiant en double : message de la création, ligne soulignée, aperçu périmé puis à jour', async ({
  page,
}) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await expect(editor.previewQuestions).toHaveCount(exampleQuestionCount())
  await editor.replaceText(DUPLICATE)

  // 1. Issue listée avec le message de la création ; l'aperçu garde la dernière config valide.
  await expect(editor.issue(DUPLICATE_MESSAGE)).toBeVisible()
  await expect(editor.staleBanner).toBeVisible()
  await expect(editor.preview.getByText('facile-002', { exact: true })).toBeVisible()
  await expect(editor.createSessionButton).toBeDisabled()

  // 2. Clic sur l'issue : curseur sur la ligne du doublon, qui porte le soulignement.
  await editor.selectIssue(DUPLICATE_MESSAGE)
  await expect(editor.activeLineNumber).toHaveText(String(DUPLICATE_LINE))
  await expect(editor.activeLine).toContainText('"id": "facile-001"')
  await expect(editor.errorLines).toHaveCount(1)
  await expect(editor.activeLine.locator('.cm-lintRange-error')).toHaveText('"facile-001"')

  // 3. Correction : l'aperçu n'est plus périmé et suit le nouveau texte.
  await editor.replaceText(exampleWith('"id": "facile-002"', '"id": "facile-002-bis"'))
  await expect(editor.staleBanner).toBeHidden()
  await expect(editor.preview.getByText('facile-002-bis', { exact: true })).toBeVisible()
  await expect(editor.noIssues).toBeVisible()
})

test('le message du doublon est celui de la création', async ({ page }) => {
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadConfigText('doublon.json', DUPLICATE)
  await expect(page.getByText(DUPLICATE_MESSAGE)).toBeVisible()
})

test("l'aperçu rend les énoncés, replie la réponse et montre l'écran final", async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await expect(editor.previewQuestions).toHaveCount(exampleQuestionCount())

  const first = editor.previewQuestions.first()
  await expect(first).toContainText('Quelle différence entre')
  const answer = first.getByText('compare après conversion de type')
  await expect(answer).toBeHidden()
  await editor.expandAnswer(0)
  await expect(answer).toBeVisible()

  await expect(editor.finalScreen).toBeVisible()
  await expect(editor.finalScreen.getByText('Ada Lovelace')).toBeAttached()
})

test('téléchargement, brouillon au rechargement, puis création de session', async ({ page }) => {
  const edited = exampleWith('"title": "Oral PHP"', '"title": "Oral PHP e2e"')
  const editor = await (async () => {
    const home = new HomePage(page)
    await home.goto()
    return home.openEditor()
  })()
  await editor.replaceText(edited)
  // « Aucune erreur » est déjà vrai sur l'exemple : attendre le brouillon différé (300 ms), sinon
  // le rechargement peut le précéder.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('questionator:config-draft')))
    .toContain('Oral PHP e2e')
  await expect(editor.noIssues).toBeVisible()

  // 1. Le fichier téléchargé est le texte de l'éditeur, nommé d'après le titre.
  const download = await editor.download()
  expect(download.suggestedFilename()).toBe('oral-php-e2e.json')
  expect(await readFile(await download.path(), 'utf8')).toBe(edited)

  // 2. Rechargement : le brouillon est restitué.
  await editor.reload()
  await expect(editor.editor).toContainText('"title": "Oral PHP e2e"')

  // 3. Création : la config arrive chargée et validée, la session se crée avec le CSV d'exemple.
  const create = await editor.createSession()
  await expect(page).toHaveURL(/#\/new$/)
  await expect(create.configField).toContainText('oral-php-e2e.json')
  await expect(create.configField).toContainText('Fichier valide')
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.fillName('Session éditeur')
  await create.submit()
  await expect(page).toHaveURL(/#\/session\//)
})

test('Ctrl+Espace propose les clés à l’endroit du curseur, puis les valeurs d’une énumération', async ({
  page,
}) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await editor.replaceText('{\n  "scoring": {\n    \n  }\n}')
  await page.locator('.cm-line').nth(2).click()
  await page.keyboard.press('End')
  await editor.complete()
  await expect(editor.completionOption(/questionsPerStudent/)).toBeVisible()

  // L'option sélectionnée porte la couleur d'accent de l'app (--accent), pas celle de CodeMirror.
  const selected = page.locator('.cm-tooltip-autocomplete li[role="option"][aria-selected="true"]')
  const [selectedColor, accentColor] = await Promise.all([
    selected.evaluate((element) => getComputedStyle(element).backgroundColor),
    page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.background = 'var(--accent)'
      document.body.append(probe)
      const color = getComputedStyle(probe).backgroundColor
      probe.remove()
      return color
    }),
  ])
  expect(accentColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(selectedColor).toBe(accentColor)

  await page.keyboard.press('Escape')
  await page.keyboard.insertText('"rounding": { "mode": ')
  await editor.complete()
  for (const value of ['"nearest"', '"up"', '"down"']) {
    await expect(editor.completionOption(value)).toBeVisible()
  }
})

test('Entrée applique l’option de complétion sélectionnée à la place du mot en cours', async ({
  page,
}) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await editor.replaceText('{ "scoring": { "rounding": { "mode": ne } } }')
  await page.locator('.cm-line').first().click()
  await page.keyboard.press('Control+Home')
  for (let i = 0; i < 39; i++) await page.keyboard.press('ArrowRight')
  // La souris hors de la liste : elle ne doit pas changer l'option sélectionnée.
  await page.mouse.move(0, 0)
  await editor.complete()
  await expect(editor.completionOption('"nearest"')).toBeVisible()
  // CodeMirror ignore Entrée pendant les 75 ms qui suivent l'ouverture de la liste
  // (`interactionDelay`) : un appui trop tôt insère un saut de ligne, irrattrapable. On attend que
  // ce délai soit écoulé avant d'appuyer.
  const shownAt = Date.now()
  await expect.poll(() => Date.now() - shownAt).toBeGreaterThanOrEqual(150)
  await page.keyboard.press('Enter')
  await expect(editor.editor).toContainText('"mode": "nearest" }')
})

test('le survol de finalScoreDisplay affiche sa description et son défaut', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await expect(editor.editor).toContainText('"finalScoreDisplay"')
  await page.locator('.cm-content').getByText('"finalScoreDisplay"').hover()
  await expect(editor.hoverTooltip).toContainText('écran final : brute, convertie ou les deux.')
  await expect(editor.hoverTooltip).toContainText('Défaut : "both"')
})

test('le survol de showCategoryPoints affiche sa description et son défaut', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  // CodeMirror ne rend que les lignes visibles : la clé, dernière de `presentation`, passe en tête.
  await editor.replaceText(
    exampleWith(',\n    "showCategoryPoints": true', '').replace(
      '"showCumulativeScore": true,',
      '"showCategoryPoints": true,\n    "showCumulativeScore": true,',
    ),
  )
  // La saisie laisse la vue en bas du texte : revenir en tête.
  await page.keyboard.press('ControlOrMeta+Home')
  await expect(editor.editor).toContainText('"showCategoryPoints"')
  await page.locator('.cm-content').getByText('"showCategoryPoints"').hover()
  await expect(editor.hoverTooltip).toContainText('maximum de points de chaque catégorie')
  await expect(editor.hoverTooltip).toContainText('Défaut : true')
})

test('un champ obligatoire manquant est nommé dans la liste des erreurs', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await editor.replaceText(exampleWith('"finalScale": 20,', ''))

  await expect(editor.issue('Champ obligatoire manquant : « finalScale ».')).toBeVisible()
})

test('le survol de rounding.mode liste les valeurs possibles avant le défaut', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await expect(editor.editor).toContainText('"mode"')
  await page.locator('.cm-content').getByText('"mode"').hover()
  await expect(editor.hoverTooltip).toContainText('Valeurs possibles : "nearest", "up", "down"')
  await expect(editor.hoverTooltip).toContainText('Défaut : "nearest"')
})

test('le survol de icon propose la recherche Tabler, sans liste de noms', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  // `categories` en tête : CodeMirror ne rend que les lignes visibles.
  const { categories, ...rest } = z
    .looseObject({ categories: z.array(z.unknown()) })
    .parse(JSON.parse(EXAMPLE))
  await editor.replaceText(JSON.stringify({ categories, ...rest }, null, 2))
  await page.keyboard.press('ControlOrMeta+Home')
  await page.locator('.cm-content').getByText('"icon"').first().hover()

  const link = editor.hoverTooltip.getByRole('link', { name: 'Rechercher une icône sur tabler.io' })
  await expect(link).toHaveAttribute('href', 'https://tabler.io/icons')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(editor.hoverTooltip).not.toContainText('Valeurs possibles')
})

// Ni espace ni tiret : aucun point de coupure naturel (#109).
const LONG_ID = `facile_${'x'.repeat(120)}`
const LONG_URL = `https://example.com/${'a'.repeat(180)}`
const LONG_WORDS = exampleWith('"id": "facile-002"', `"id": "${LONG_ID}"`).replace(
  '"prompt": "Quelle est la différence entre `echo` et `print` ?"',
  `"prompt": "Voir ${LONG_URL}\\n\\n\`\`\`php\\n$${'b'.repeat(200)} = 1;\\n\`\`\`"`,
)

for (const width of [1280, 375]) {
  test(`un mot très long reste dans sa carte d'aperçu (${width} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const editor = new ConfigEditorPage(page)
    await editor.goto()
    await editor.replaceText(LONG_WORDS)
    const card = editor.previewQuestions.filter({ hasText: LONG_ID })
    await expect(card).toContainText(LONG_URL)

    const column = await editor.preview.boundingBox()
    const box = await card.boundingBox()
    if (column === null || box === null) throw new Error('aperçu non affiché')
    expect(box.x + box.width).toBeLessThanOrEqual(column.x + column.width)
    // Rien ne dépasse de la carte, sauf le bloc de code, qui défile dans son propre cadre.
    expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
    const code = card.locator('pre')
    expect(await code.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  })
}
