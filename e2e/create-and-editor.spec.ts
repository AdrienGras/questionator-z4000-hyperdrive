import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
import { ConfigEditorPage } from './pages/config-editor-page.ts'
import { CreateSessionPage } from './pages/create-session-page.ts'

const EXAMPLE_CONFIG = readFileSync(examplePath('config.example.json'), 'utf8')

/** Largeur qui dépasse de la fenêtre (0 si la page ne défile pas horizontalement). */
function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
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
