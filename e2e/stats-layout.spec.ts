import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Disposition des statistiques à 390 px (F44.8) : ce que jsdom ne calcule pas.

/** Titre de question sans point de coupure (ni espace ni tiret). */
const LONG_TITLE = 'Q'.repeat(60)

/** Config d'exemple dont chaque question porte un titre insécable de 60 caractères. */
function writeLongTitlesConfig(path: string): void {
  const config = z
    .looseObject({
      categories: z.array(
        z.looseObject({ questions: z.array(z.looseObject({ title: z.string().optional() })) }),
      ),
    })
    .parse(JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8')))
  for (const category of config.categories) {
    for (const question of category.questions) question.title = LONG_TITLE
  }
  writeFileSync(path, JSON.stringify(config))
}

/**
 * Débordement horizontal, élément par élément (`overflow-x-clip` masque celui du document). Le
 * contenu d'un tableau qui défile dans sa carte (`overflow-x-auto`) n'est pas un débordement.
 */
function overflowWidth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const rights = [...document.querySelectorAll('main *')]
      .filter((el) => el.closest('[aria-hidden="true"]') === null)
      .filter((el) => el.parentElement?.closest('.overflow-x-auto') == null)
      .map((el) => el.getBoundingClientRect().right)
    return Math.max(0, ...rights) - width
  })
}

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('statistiques de session à 390 px : aucun débordement, tableaux dans leur cadre', async ({
    page,
  }, testInfo) => {
    const configPath = testInfo.outputPath('long-titles.config.json')
    writeLongTitlesConfig(configPath)
    const home = new HomePage(page)
    await home.goto()
    const create = await home.createSession()
    await create.uploadStudents(examplePath('students.example.csv'))
    await create.uploadConfig(configPath)
    await create.fillName('Session e2e')
    const examiner = await create.submit()
    for (const category of ['Facile', 'Normal', 'Difficile']) {
      await examiner.draw(category)
      await examiner.score('1')
    }
    await examiner.confirmAdjustment()

    const stats = await examiner.openStats()
    await expect(stats.histogram).toBeAttached()
    expect(await overflowWidth(page)).toBeLessThanOrEqual(0)
    for (const table of await page.getByRole('table').all()) {
      expect(
        await table.evaluate((el) => el.parentElement?.classList.contains('overflow-x-auto')),
      ).toBe(true)
    }
  })

  test('stats d’entraînement à 390 px : aucun débordement', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    const setup = await home.startTraining()
    await setup.pasteConfig(readFileSync(examplePath('training.example.json'), 'utf8'))
    const training = await setup.start()
    await training.draw('Normal')
    await training.reveal()
    await training.score('0,5')

    const stats = await training.openStats()
    await expect(stats.reviewList).toBeVisible()
    await stats.openDetails(9)
    expect(await overflowWidth(page)).toBeLessThanOrEqual(0)
  })
})
