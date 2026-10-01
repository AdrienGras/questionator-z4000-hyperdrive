import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

const pythonConfig = fileURLToPath(
  new URL('./fixtures/languages-python.config.json', import.meta.url),
)

/** Énoncé avec un bloc coloré (`python`), un bloc resté brut (`pyhton`) et du code en ligne. */
const PROMPT = [
  'Que vaut `total` ?',
  '```python\ntotal = 1 + 1\n```',
  '```pyhton\ntotal = 2 + 2\n```',
].join('\n\n')

/** Config de la fixture python : première question portant `PROMPT`, mode de couleur imposé. */
function writeConfig(path: string, mode: 'light' | 'dark'): void {
  // `looseObject` : seuls les champs modifiés sont décrits, les autres sont réécrits tels quels.
  const configSchema = z.looseObject({
    presentation: z.looseObject({ defaultColorMode: z.string() }),
    categories: z.array(
      z.looseObject({ questions: z.array(z.looseObject({ prompt: z.string() })) }),
    ),
  })
  const config = configSchema.parse(JSON.parse(readFileSync(pythonConfig, 'utf8')))
  config.presentation.defaultColorMode = mode
  const question = config.categories[0]?.questions[0]
  if (question === undefined) throw new Error('fixture python sans question')
  question.prompt = PROMPT
  writeFileSync(path, JSON.stringify(config))
}

/** Hors de l'aperçu de la vue projetée (F22), qui duplique l'énoncé. */
const OUTSIDE_PREVIEW = ':not([data-projection-canvas] *)'

/** Fond calculé d'un élément de la page. */
async function backgroundOf(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor)
}

for (const mode of ['light', 'dark'] as const) {
  test(`blocs de code et code en ligne (${mode})`, async ({ page }, testInfo) => {
    const configPath = testInfo.outputPath('code-style.config.json')
    writeConfig(configPath, mode)

    const home = new HomePage(page)
    await home.goto()
    const create = await home.createSession()
    await create.uploadStudents(examplePath('students.example.csv'))
    await create.uploadConfig(configPath)
    await create.fillName(`Session style du code ${mode}`)
    const examiner = await create.submit()
    await examiner.draw('Facile')
    await expect(examiner.highlightedBlocks).toHaveCount(1)
    await expect(examiner.plainCode).toHaveCount(1)

    const highlighted = await backgroundOf(page, `pre[data-highlighted="true"]${OUTSIDE_PREVIEW}`)
    const plain = await backgroundOf(page, `pre[data-highlighted="false"]${OUTSIDE_PREVIEW}`)
    const pageBackground = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    )
    // Même fond avant et après coloration, distinct de la page.
    expect(highlighted).toBe(plain)
    expect(highlighted).not.toBe(pageBackground)

    const inline = page.locator(`.prose :not(pre) > code${OUTSIDE_PREVIEW}`).first()
    await expect(inline).toHaveText('total')
    const pseudo = await inline.evaluate((el) => ({
      before: getComputedStyle(el, '::before').content,
      after: getComputedStyle(el, '::after').content,
      background: getComputedStyle(el).backgroundColor,
    }))
    expect(pseudo.before).toBe('none')
    expect(pseudo.after).toBe('none')
    expect(pseudo.background).not.toBe('rgba(0, 0, 0, 0)')
  })
}
