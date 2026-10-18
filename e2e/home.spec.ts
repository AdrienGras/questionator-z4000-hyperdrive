import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

const TRAINING_CONFIG = readFileSync(examplePath('training.example.json'), 'utf8')

/** Crée une session à partir des fichiers d'exemple, depuis l'accueil. */
async function createExampleSession(page: Page, name: string): Promise<void> {
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(examplePath('config.example.json'))
  await create.fillName(name)
  await create.submit()
}

/** Largeur qui dépasse de la fenêtre (0 si la page ne défile pas horizontalement). */
function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

/** Haut du contenu (chiffres) et des boutons d'une carte de « Reprendre » : 3e et 4e enfants. */
async function rowTops(card: ReturnType<HomePage['resumeCard']>): Promise<number[]> {
  return card.evaluate((article) =>
    [article.children[2], article.children[3]].map((el) => el?.getBoundingClientRect().top ?? -1),
  )
}

test('Reprendre à 1280 px : chiffres et boutons alignés d’une carte à l’autre', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await createExampleSession(page, 'Oral du matin')
  const home = new HomePage(page)
  await home.goto()
  const setup = await home.startTraining()
  await setup.pasteConfig(TRAINING_CONFIG)
  await setup.start()
  await home.goto()
  const session = home.resumeCard('Oral du matin')
  const training = home.resumeCard('Git, les bases')
  await expect(training.getByText('questions notées')).toBeVisible()
  const [sessionTops, trainingTops] = [await rowTops(session), await rowTops(training)]
  expect(sessionTops.every((top) => top > 0)).toBe(true)
  expect(trainingTops).toEqual(sessionTops)
})

test('base vide : premier lancement, puis tableau de bord après une session', async ({ page }) => {
  const home = new HomePage(page)
  await home.goto()
  await expect(home.firstRun).toBeVisible()
  await expect(home.spaces).toBeHidden()

  await createExampleSession(page, 'Oral du matin')
  await home.goto()
  await expect(home.firstRun).toBeHidden()
  await expect(home.resumeCard('Oral du matin')).toBeVisible()
  await expect(home.spaceTile('Sessions')).toContainText(/^1/)
})

test('« Voir tout » mène aux pages d’espace', async ({ page }) => {
  await createExampleSession(page, 'Oral du matin')
  const home = new HomePage(page)
  await home.goto()
  await home.spaceTile('Sessions').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sessions' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Oral du matin' })).toBeVisible()
  await home.goto()
  await home.spaceTile('Entraînements').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Entraînement' })).toBeVisible()
})

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('390 px : aucun défilement horizontal sur l’accueil, Sessions et Entraînements', async ({
    page,
  }) => {
    const home = new HomePage(page)
    await home.goto()
    await expect(home.firstRun).toBeVisible()
    await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)

    await createExampleSession(page, 'Oral du matin')
    await home.goto()
    const setup = await home.startTraining()
    await setup.pasteConfig(TRAINING_CONFIG)
    await setup.start()

    for (const path of ['#/', '#/sessions', '#/trainings']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible()
      await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
    }
  })
})
