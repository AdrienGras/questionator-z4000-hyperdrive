import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.ts'
import { AppMenu } from './pages/app-menu.ts'

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
