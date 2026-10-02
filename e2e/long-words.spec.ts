import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Ni espace ni tiret : aucun point de coupure naturel (#118).
const LONG_URL = `https://example.com/${'a'.repeat(180)}`
const LONG_CODE = `$${'b'.repeat(200)} = 1;`
const LONG_NAME = 'Oral_de_rattrapage_du_module_architecture_logicielle_groupe_B_2026'

/** Config d'exemple dont chaque énoncé contient une URL et une ligne de code insécables. */
function writeLongWordsConfig(path: string): void {
  const config = z
    .looseObject({
      categories: z.array(
        z.looseObject({ questions: z.array(z.looseObject({ prompt: z.string() })) }),
      ),
    })
    .parse(JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8')))
  for (const category of config.categories) {
    for (const question of category.questions) {
      question.prompt = `Voir ${LONG_URL}\n\n\`\`\`php\n${LONG_CODE}\n\`\`\``
    }
  }
  writeFileSync(path, JSON.stringify(config))
}

/** Défilement horizontal de la page : largeur du document au-delà de la fenêtre. */
function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

/** Le bloc de code de la question en cours défile dans son propre cadre. */
function codeScrolls(page: Page): Promise<boolean> {
  return page
    .getByRole('region', { name: 'Question en cours' })
    .locator('pre')
    .first()
    .evaluate((el) => el.scrollWidth > el.clientWidth)
}

for (const width of [1280, 375]) {
  test(`un mot très long ne fait défiler ni le passage ni la vue projetée (${width} px)`, async ({
    page,
  }, testInfo) => {
    const configPath = testInfo.outputPath('long-words.config.json')
    writeLongWordsConfig(configPath)
    await page.setViewportSize({ width, height: 900 })
    const home = new HomePage(page)
    await home.goto()
    const create = await home.createSession()
    await create.uploadStudents(examplePath('students.example.csv'))
    await create.uploadConfig(configPath)
    await create.fillName(LONG_NAME)
    const examiner = await create.submit()

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Ouvrir la vue projetée' }).click(),
    ])
    await popup.setViewportSize({ width, height: 900 })
    await page.getByRole('button', { name: 'Projeter cet étudiant' }).click()
    await examiner.draw('Facile')

    // Écran de passage.
    await expect(page.getByRole('region', { name: 'Question en cours' })).toContainText(LONG_URL)
    await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
    expect(await codeScrolls(page)).toBe(true)

    // Vue projetée (énoncé révélé après l'animation de tirage).
    await expect(popup.getByRole('region', { name: 'Question en cours' })).toContainText(LONG_URL)
    await expect.poll(() => horizontalOverflow(popup)).toBeLessThanOrEqual(0)
    expect(await codeScrolls(popup)).toBe(true)

    // Carte de la session à l'accueil.
    await home.goto()
    const title = page.getByRole('heading', { name: LONG_NAME })
    await expect(title).toBeVisible()
    await expect.poll(() => horizontalOverflow(page)).toBeLessThanOrEqual(0)
    // Le titre peut déborder de sa carte sans élargir la page : sa boîte reste dans la fenêtre.
    const box = await title.boundingBox()
    expect(box).not.toBeNull()
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width)
  })
}
