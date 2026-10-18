import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Disposition de l'entraînement à 390 px (F44.9) : ce que jsdom ne calcule pas.

/** Libellé de catégorie sans point de coupure (ni espace ni tiret). */
const LONG_LABEL = 'Catégorie_au_libellé_particulièrement_long_pour_le_test'

/**
 * Config d'entraînement d'exemple portée à 13 catégories (celles de l'exemple recopiées sous des
 * ids neufs), la première au libellé insécable.
 */
function thirteenCategoriesConfig(): string {
  const config = z
    .looseObject({
      categories: z.array(
        z.looseObject({
          id: z.string(),
          label: z.string(),
          questions: z.array(z.looseObject({ id: z.string() })),
        }),
      ),
    })
    .parse(JSON.parse(readFileSync(examplePath('training.example.json'), 'utf8')))
  const source = config.categories
  config.categories = Array.from({ length: 13 }, (_, index) => {
    const category = source[index % source.length]
    if (category === undefined) throw new Error('exemple sans catégorie')
    return {
      ...category,
      id: `${category.id}-${index}`,
      label: index === 0 ? LONG_LABEL : `${category.label} ${index}`,
      questions: category.questions.map((question) => ({
        ...question,
        id: `${question.id}-${index}`,
      })),
    }
  })
  return JSON.stringify(config)
}

/** Débordement horizontal, élément par élément (`overflow-x-clip` masque celui du document). */
function overflowWidth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const rights = [...document.querySelectorAll('main *')]
      .filter((el) => el.closest('[aria-hidden="true"]') === null)
      .map((el) => el.getBoundingClientRect().right)
    return Math.max(0, ...rights) - width
  })
}

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('mise en place à 390 px, 13 catégories et un libellé long : aucun débordement', async ({
    page,
  }) => {
    const home = new HomePage(page)
    await home.goto()
    const setup = await home.startTraining()
    await setup.pasteConfig(thirteenCategoriesConfig())
    await expect(page.getByRole('list', { name: 'Questions par niveau' })).toBeVisible()
    await expect(setup.submitButton).toBeEnabled()
    expect(await overflowWidth(page)).toBeLessThanOrEqual(0)
  })

  test('question à 390 px : tuiles verrouillées sur deux colonnes, aucun débordement', async ({
    page,
  }) => {
    const home = new HomePage(page)
    await home.goto()
    const setup = await home.startTraining()
    await setup.pasteConfig(thirteenCategoriesConfig())
    const training = await setup.start()
    await training.draw(LONG_LABEL)
    await training.reveal()

    const tiles = page
      .getByRole('list', { name: 'Catégories (indisponibles pendant la question)' })
      .getByRole('listitem')
    await expect(tiles).toHaveCount(13)
    const first = await tiles.nth(0).boundingBox()
    const second = await tiles.nth(1).boundingBox()
    expect(second?.y).toBe(first?.y)
    expect(await overflowWidth(page)).toBeLessThanOrEqual(0)
  })
})
