import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
import { ConfigEditorPage } from './pages/config-editor-page.ts'
import { CreateSessionPage } from './pages/create-session-page.ts'

const EXAMPLE_CONFIG = readFileSync(examplePath('config.example.json'), 'utf8')

/**
 * Plus grand dépassement à droite de la fenêtre parmi les éléments du `main`. Mesuré élément par
 * élément : la colonne de contenu est en `overflow-x-clip`, le `scrollWidth` du document ne voit
 * plus ce qu'elle coupe. Exclus : décors (`aria-hidden`), texte défilant de CodeMirror, blocs de
 * code (`pre`, qui défilent eux-mêmes).
 */
function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const rights = [...document.querySelectorAll('main *')]
      .filter((el) => el.closest('[aria-hidden="true"], .cm-scroller, pre') === null)
      .map((el) => el.getBoundingClientRect().right)
    return Math.max(0, ...rights) - width
  })
}

/** Écran de création avec les deux fichiers d'exemple déposés. */
async function filledCreation(page: Page): Promise<CreateSessionPage> {
  await page.goto('#/new')
  const create = new CreateSessionPage(page)
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(examplePath('config.example.json'))
  return create
}

test('création : la phrase sous le bouton suit la cause', async ({ page }) => {
  await page.goto('#/new')
  const create = new CreateSessionPage(page)
  const submit = page.getByRole('button', { name: 'Créer la session' })
  await expect(submit).toHaveAccessibleDescription(
    'Déposez la liste d’étudiants et la config pour créer la session.',
  )
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfigText('cassee.json', '{}')
  await expect(submit).toHaveAccessibleDescription(
    'Corrigez la configuration pour créer la session.',
  )
  await expect(submit).toBeDisabled()
})

test('création : fichiers d’exemple déposés, ni phrase ni bouton désactivé', async ({ page }) => {
  await filledCreation(page)
  const submit = page.getByRole('button', { name: 'Créer la session' })
  await expect(submit).toBeEnabled()
  await expect(submit).not.toHaveAttribute('aria-describedby')
})

test('éditeur : un problème montre sa ligne et y mène', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  const icon = /"icon": "[^"]+"/u.exec(EXAMPLE_CONFIG)?.[0]
  if (icon === undefined) throw new Error('exemple sans icône')
  const text = EXAMPLE_CONFIG.replace(icon, '"icon": "leafs"')
  const line = text.slice(0, text.indexOf('"leafs"')).split('\n').length
  await editor.replaceText(text)
  await expect(editor.problems).toBeVisible()
  const issue = editor.issue('leafs')
  await expect(issue).toContainText(`ligne ${line}`)
  await issue.click()
  await expect(editor.activeLineNumber).toHaveText(String(line))
})

test('éditeur : une puce mène à sa catégorie', async ({ page }) => {
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  const chip = editor.categoryNav.getByRole('button').nth(1)
  await expect(chip).toBeVisible()
  const label = (await chip.textContent())?.replace(/\d+$/u, '') ?? ''
  await chip.click()
  const heading = editor.preview.getByRole('heading', { level: 3, name: label, exact: true })
  await expect(heading).toBeFocused()
  await expect(heading).toBeInViewport()
  expect(page.url()).toMatch(/#\/editor$/u)
})

test('éditeur : le code ne bouge pas quand un problème apparaît ou disparaît', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await expect(editor.noIssues).toBeVisible()
  const line = page.locator('.cm-line').nth(4)
  const top = async () => (await line.boundingBox())?.y ?? Number.NaN
  const before = await top()
  await page.locator('.cm-line').nth(2).click()
  await page.keyboard.press('End')
  await page.keyboard.type(' x')
  await expect(page.getByText(/^\d+ erreurs?, /u)).toBeVisible()
  expect(Math.abs((await top()) - before)).toBeLessThanOrEqual(2)
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await expect(editor.noIssues).toBeVisible()
  expect(Math.abs((await top()) - before)).toBeLessThanOrEqual(2)
})

test('création : les deux zones de dépôt gardent la même hauteur, pleine ou vide', async ({
  page,
}) => {
  await page.goto('#/new')
  const create = new CreateSessionPage(page)
  const zones = page.locator('[data-status]')
  const heights = async () =>
    Promise.all([0, 1].map(async (i) => (await zones.nth(i).boundingBox())?.height ?? 0))
  const [emptyHeight] = await heights()
  await create.uploadStudents(examplePath('students.example.csv'))
  await expect(zones.first()).toHaveAttribute('data-status', 'ok')
  const [filled, empty] = await heights()
  expect(Math.abs((filled ?? 0) - (empty ?? 0))).toBeLessThanOrEqual(1)
  expect(Math.abs((emptyHeight ?? 0) - (filled ?? 0))).toBeLessThanOrEqual(1)
})

test('éditeur sur grand écran : aperçu aussi large que le code et haut comme l’écran', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1869, height: 1137 })
  const editor = new ConfigEditorPage(page)
  await editor.goto()
  await expect(editor.categoryNav).toBeVisible()
  const source = await page.getByRole('region', { name: /\.json$/u }).boundingBox()
  const preview = await editor.preview.boundingBox()
  if (source === null || preview === null) throw new Error('colonnes absentes')
  expect(preview.width).toBeGreaterThanOrEqual(source.width * 0.8)
  expect(preview.y + preview.height).toBeGreaterThanOrEqual(1137 - 40)
})

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('390 px : aucun défilement horizontal sur /new et /editor', async ({ page }) => {
    await filledCreation(page)
    await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
    const editor = new ConfigEditorPage(page)
    await editor.goto()
    await expect(editor.categoryNav).toBeVisible()
    await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })
})
