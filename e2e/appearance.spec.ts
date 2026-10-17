import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
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

/** Crée une session depuis `configPath` et renvoie le fond calculé du bouton principal « Ajouter ». */
async function primaryButtonBackground(page: Page, configPath: string, name: string) {
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(configPath)
  await create.fillName(name)
  const examiner = await create.submit()
  await examiner.openPanel('Étudiants')
  await page.getByRole('button', { name: 'Ajouter un étudiant' }).click()
  const submit = page
    .getByRole('dialog', { name: 'Ajouter un étudiant' })
    .getByRole('button', { name: 'Ajouter', exact: true })
  return submit.evaluate((el) => getComputedStyle(el).backgroundImage)
}

test('le bouton principal porte le dégradé d’action, qui suit theme.dark.primary', async ({
  page,
}, testInfo) => {
  const themedPath = testInfo.outputPath('themed.config.json')
  const config = JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8'))
  config.theme.dark.primary = 'oklch(0.7 0.15 150)'
  writeFileSync(themedPath, JSON.stringify(config))

  const byDefault = await primaryButtonBackground(
    page,
    examplePath('config.example.json'),
    'Session par défaut',
  )
  const themed = await primaryButtonBackground(page, themedPath, 'Session thémée')
  expect(byDefault).toContain('linear-gradient')
  expect(themed).toContain('linear-gradient')
  expect(themed).not.toBe(byDefault)
})
