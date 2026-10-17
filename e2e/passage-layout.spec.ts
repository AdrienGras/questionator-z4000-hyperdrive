import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.ts'

// Disposition de l'écran de passage (F44.7) : ce que jsdom ne calcule pas (grille, ordre, largeurs).

/** Débordement horizontal, élément par élément (`overflow-x-clip` masque celui du document). */
function overflowWidth(page: Page): Promise<number> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    const rights = [...document.querySelectorAll('main *')]
      .filter((el) => el.closest('[aria-hidden="true"], pre') === null)
      .map((el) => el.getBoundingClientRect().right)
    return Math.max(0, ...rights) - width
  })
}

test.describe('téléphone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('390 px : aucun débordement, la note juste sous la question, tiroir pleine largeur', async ({
    examiner,
    page,
  }) => {
    await examiner.draw('Normal')
    const question = page.getByRole('region', { name: 'Question en cours' }).first()
    const score = page.getByRole('region', { name: 'Noter la question' })
    const draw = page.getByRole('heading', { name: 'Tirage suivant' })
    await score.waitFor()

    expect(await overflowWidth(page)).toBeLessThanOrEqual(0)
    const [questionBox, scoreBox, drawBox] = await Promise.all([
      question.boundingBox(),
      score.boundingBox(),
      draw.boundingBox(),
    ])
    if (questionBox === null || scoreBox === null || drawBox === null)
      throw new Error('écran incomplet')
    expect(scoreBox.y).toBeGreaterThan(questionBox.y)
    expect(scoreBox.y).toBeLessThan(drawBox.y)

    await examiner.openPanel()
    expect((await examiner.panel.boundingBox())?.width).toBeCloseTo(390, 0)
  })
})

test('1280 px : la note dans la colonne de droite, sous la vue projetée', async ({
  examiner,
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await examiner.draw('Normal')
  const question = page.getByRole('region', { name: 'Question en cours' }).first()
  const preview = page.getByRole('region', { name: 'Vue projetée' })
  const score = page.getByRole('region', { name: 'Noter la question' })
  await score.waitFor()

  const [questionBox, previewBox, scoreBox] = await Promise.all([
    question.boundingBox(),
    preview.boundingBox(),
    score.boundingBox(),
  ])
  if (questionBox === null || previewBox === null || scoreBox === null)
    throw new Error('écran incomplet')
  expect(previewBox.x).toBeGreaterThan(questionBox.x + questionBox.width)
  expect(scoreBox.x).toBe(previewBox.x)
  expect(scoreBox.y).toBeGreaterThan(previewBox.y + previewBox.height)

  // Grille de tirage : seuil de 30rem (D108), 4 catégories en 2 × 2 à côté de la colonne de droite.
  const grid = page.getByRole('list', { name: 'Choisir une catégorie' })
  const tops = await grid
    .getByRole('listitem')
    .evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)))
  expect(new Set(tops).size).toBe(2)
})

test('panneau : statistiques et export restent visibles sous une longue liste', async ({
  examiner,
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await examiner.openPanel('Liste')
  await expect(examiner.panel.getByRole('link', { name: 'Statistiques' })).toBeInViewport()
  await expect(examiner.panel.getByRole('button', { name: 'Exporter en Excel' })).toBeInViewport()
})
