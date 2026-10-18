import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
import { AppMenu } from './pages/app-menu.ts'
import { HomePage } from './pages/home-page.ts'

// Mode clair dérivé (F44.10, D112) : ce que jsdom ne calcule pas (cascade `html` / `html.dark`,
// `color-mix` de l'encre de catégorie).

/** Couleur calculée de l'icône Sessions du menu (couleur d'espace, normalisée par le navigateur). */
async function sessionsIconColor(page: Page): Promise<string> {
  const menu = new AppMenu(page)
  await menu.goto('/editor')
  return menu
    .link('Sessions')
    .locator('svg')
    .evaluate((el) => getComputedStyle(el).color)
}

test('couleur d’espace foncée en clair', async ({ page }) => {
  expect(await sessionsIconColor(page)).toBe('oklch(0.49 0.105 225)')
})

test.describe('système sombre', () => {
  test.use({ colorScheme: 'dark' })

  test('couleur d’espace claire en sombre', async ({ page }) => {
    expect(await sessionsIconColor(page)).toBe('oklch(0.8 0.12 215)')
  })
})

/**
 * Premier texte en encre d'une tuile de tirage (icône ou points) : sa couleur et la couleur brute de
 * la catégorie, héritée de la tuile, calculées par le navigateur.
 */
async function inkAndRaw(page: Page): Promise<{ ink: string; raw: string }> {
  const badge = page
    .getByRole('list', { name: 'Choisir une catégorie' })
    .locator('[class*="text-[var(--category-ink"]')
    .first()
  return badge.evaluate((el) => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--category-color)'
    el.append(probe)
    const raw = getComputedStyle(probe).color
    probe.remove()
    return { ink: getComputedStyle(el).color, raw }
  })
}

test('encre de catégorie : foncée en clair, couleur brute en sombre', async ({
  examiner,
  page,
}) => {
  void examiner
  const menu = new AppMenu(page)
  await menu.chooseColorMode('Clair')
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  const light = await inkAndRaw(page)
  expect(light.ink).not.toBe(light.raw)

  await menu.chooseColorMode('Sombre')
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const dark = await inkAndRaw(page)
  expect(dark.ink).toBe(dark.raw)
})

test('la vue projetée ignore un choix mémorisé et suit defaultColorMode', async ({
  examiner,
  page,
}) => {
  const sessionId = /#\/session\/([^/?]+)/.exec(page.url())?.[1]
  expect(sessionId).toBeDefined()
  // Choix « clair » laissé par une version d'avant la refonte ; la config d'exemple demande `dark`.
  await page.evaluate(
    (id) => localStorage.setItem(`questionator:color-mode:${id}:present`, 'light'),
    sessionId,
  )
  const present = await examiner.openPresentView()
  await expect(present.waitingMessage).toBeVisible()
  await expect(present.page.locator('html')).toHaveClass(/\bdark\b/)
})

/** Contraste WCAG entre la couleur de `el` et celle de la carte qui le contient (canevas 1 × 1). */
function contrastOnCard(el: Element): number {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (context === null) throw new Error('canevas indisponible')
  const luminance = (color: string) => {
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = [...context.getImageData(0, 0, 1, 1).data].map((c) => {
      const v = c / 255
      return v <= 0.040_45 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  let ground: Element | null = el.parentElement
  while (ground !== null && getComputedStyle(ground).backgroundColor === 'rgba(0, 0, 0, 0)')
    ground = ground.parentElement
  const text = luminance(getComputedStyle(el).color)
  const back = luminance(getComputedStyle(ground ?? document.body).backgroundColor)
  return (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05)
}

test('lien d’un énoncé markdown lisible en clair : 4,5:1 au moins sur sa carte', async ({
  page,
}, testInfo) => {
  // Config d'exemple en clair, chaque énoncé suivi d'un lien.
  const path = testInfo.outputPath('links.config.json')
  const config = JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8'))
  config.presentation.defaultColorMode = 'light'
  for (const category of config.categories)
    for (const question of category.questions)
      question.prompt = `${question.prompt}\n\nVoir [la documentation](https://www.php.net).`
  writeFileSync(path, JSON.stringify(config))
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(path)
  await create.fillName('Session liens')
  const examiner = await create.submit()
  await examiner.draw('Facile')
  const link = page.getByRole('main').getByRole('link', { name: 'la documentation' }).first()
  await expect(link).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  expect(await link.evaluate(contrastOnCard)).toBeGreaterThanOrEqual(4.5)
})
