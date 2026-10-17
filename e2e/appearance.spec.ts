import { expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Rendu du design system (F44.3, D102) : ce que jsdom ne calcule pas (tokens, cascade, Tailwind).

test('thème sombre du design system par défaut', async ({ page }) => {
  await new HomePage(page).goto()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  const style = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    return {
      scheme: root.colorScheme,
      // Couleur calculée (normalisée) : la valeur brute du token est minifiée au build.
      background: getComputedStyle(document.body).backgroundColor,
      radius: root.getPropertyValue('--radius').trim(),
    }
  })
  expect(style).toEqual({ scheme: 'dark', background: 'oklch(0.16 0.02 292)', radius: '1.125rem' })
})
