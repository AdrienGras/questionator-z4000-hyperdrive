import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'
import { SessionsPage } from './pages/sessions-page.ts'

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

/** Crée une session depuis `configPath` ; renvoie le fond du bouton principal « Ajouter » et de la page. */
async function primaryButtonBackground(page: Page, configPath: string, name: string) {
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(configPath)
  await create.fillName(name)
  const examiner = await create.submit()
  await examiner.openPanel('Liste')
  await page.getByRole('button', { name: 'Ajouter un étudiant' }).click()
  const submit = page
    .getByRole('dialog', { name: 'Ajouter un étudiant' })
    .getByRole('button', { name: 'Ajouter', exact: true })
  return submit.evaluate((el) => ({
    image: getComputedStyle(el).backgroundImage,
    to: getComputedStyle(el).getPropertyValue('--tw-gradient-to').trim(),
    body: getComputedStyle(document.body).backgroundColor,
  }))
}

test('le bouton principal porte le dégradé d’action, dérivé de theme.dark.primary seul', async ({
  page,
}, testInfo) => {
  // Config qui ne surcharge que `primary` : le reste vient du design system.
  const themedPath = testInfo.outputPath('primary-only.config.json')
  const config = JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8'))
  config.theme = { dark: { primary: 'oklch(0.55 0.15 150)' } }
  writeFileSync(themedPath, JSON.stringify(config))

  const byDefault = await primaryButtonBackground(
    page,
    examplePath('config.example.json'),
    'Session par défaut',
  )
  const themed = await primaryButtonBackground(page, themedPath, 'Session thémée')
  expect(byDefault.image).toContain('linear-gradient')
  expect(themed.image).toContain('linear-gradient')
  // Second arrêt (fin du dégradé) : dérivé de `primary`, il change avec lui.
  expect(themed.to).not.toBe(byDefault.to)
  expect(themed.body).toBe('oklch(0.16 0.02 292)')
})

function backgroundOf(el: Element): string {
  return getComputedStyle(el).backgroundImage
}

/**
 * Crée une session depuis `configPath` et tire une question ; renvoie le fond du halo de la carte
 * « Note », celui d'un halo de la vue projetée, puis celui de « Étudiant suivant » en fin de passage.
 */
async function sessionHalos(page: Page, configPath: string, name: string) {
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(configPath)
  await create.fillName(name)
  const examiner = await create.submit()
  await examiner.draw('Normal')
  const score = await page
    .getByRole('region', { name: 'Noter la question' })
    .locator('xpath=preceding-sibling::div[@aria-hidden="true"]')
    .evaluate(backgroundOf)
  const present = await examiner.openPresentView()
  const projected = await present.page.locator('[data-halo]').first().evaluate(backgroundOf)
  await present.close()
  // Trois questions par étudiant dans la config d'exemple : fin du passage, note révélée.
  await examiner.score('1')
  await examiner.draw('Difficile')
  await examiner.score('1')
  await examiner.draw('Cauchemar')
  await examiner.score('1')
  await examiner.confirmAdjustment()
  const next = await page
    .getByRole('button', { name: 'Étudiant suivant' })
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--tw-gradient-to').trim())
  return { score, projected, next }
}

test('thème de session : halos du passage et de la projection dérivés de theme.dark.primary', async ({
  page,
}, testInfo) => {
  const themedPath = testInfo.outputPath('primary-halos.config.json')
  const config = JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8'))
  config.theme = { dark: { primary: 'oklch(0.55 0.15 150)' } }
  writeFileSync(themedPath, JSON.stringify(config))

  const byDefault = await sessionHalos(page, examplePath('config.example.json'), 'Halos par défaut')
  const themed = await sessionHalos(page, themedPath, 'Halos thémés')
  expect(byDefault.score).toContain('radial-gradient')
  expect(themed.score).not.toBe(byDefault.score)
  expect(themed.projected).toContain('radial-gradient')
  expect(themed.projected).not.toBe(byDefault.projected)
  expect(themed.next).not.toBe(byDefault.next)
})

test('surfaces et champs du design system', async ({ page }) => {
  const home = new HomePage(page)
  // Carte de la liste vide de la page Sessions (l'accueil vide montre le premier lancement).
  await new SessionsPage(page).goto()
  const card = await page
    .locator('[data-slot="card"]')
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el)
      return { radius: style.borderTopLeftRadius, shadow: style.boxShadow }
    })
  expect(card.radius).toBe('18px')
  expect(card.shadow).toContain('inset')
  await home.createSession()
  const input = await page
    .locator('input:visible')
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el)
      return { height: style.height, radius: style.borderTopLeftRadius }
    })
  expect(input).toEqual({ height: '44px', radius: '12px' })

  // La modale de suppression ouverte depuis l'accueil.
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(examplePath('config.example.json'))
  await create.fillName('Session surfaces')
  await create.submit()
  await home.goto()
  const sessions = new SessionsPage(page)
  await sessions.goto()
  const dialog = await sessions.openDeleteDialog('Session surfaces')
  await expect(dialog).toHaveCSS('border-top-left-radius', '18px')
})

test('chevron dessiné sur les details, sans animation si mouvement réduit', async ({
  examiner,
  page,
}) => {
  await examiner.draw('Facile')
  const summary = page.locator('summary', { hasText: 'Éléments de réponse' }).first()
  const marker = () =>
    summary.evaluate((el) => {
      const before = getComputedStyle(el, '::before')
      return {
        list: getComputedStyle(el).listStyleType,
        mask: before.maskImage,
        transform: before.transform,
        duration: before.transitionDuration,
      }
    })
  const closed = await marker()
  expect(closed.list).toBe('none')
  expect(closed.mask).not.toBe('none')
  expect(closed.duration).toBe('0.15s')
  await summary.click()
  expect((await marker()).transform).not.toBe('none')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect((await marker()).duration).toBe('0s')
})

/** Contraste WCAG entre la couleur de texte d'un élément et le fond de `body` (via un canevas). */
async function textContrastOnPage(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (context === null) throw new Error('canevas indisponible')
      const luminance = (color: string) => {
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        const [r = 0, g = 0, b = 0] = [...context.getImageData(0, 0, 1, 1).data].map((c) => {
          const s = c / 255
          return s <= 0.040_45 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const text = luminance(getComputedStyle(el).color)
      const ground = luminance(getComputedStyle(document.body).backgroundColor)
      return (Math.max(text, ground) + 0.05) / (Math.min(text, ground) + 0.05)
    })
}

test('focus clavier visible sur un bouton', async ({ page }) => {
  await new HomePage(page).goto()
  const button = page.locator('[data-slot="button"]').first()
  await button.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  const focused = page.locator('[data-slot="button"]:focus-visible').first()
  await expect(focused).toHaveCount(1)
  expect(await focused.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none')
})

test('lien texte lisible : 4,5:1 au moins sur le fond', async ({ page }) => {
  // Liens d'exemple de la création (`SMALL_TEXT_LINK_CLASS`) : « Session introuvable » a désormais
  // son retour en bouton principal (F44.4).
  await page.goto('#/new')
  await expect(page.getByRole('heading', { name: 'Nouvelle session' })).toBeVisible()
  expect(await textContrastOnPage(page, 'main a.underline')).toBeGreaterThanOrEqual(4.5)
})

test('menu des actions d’une carte aux formes du design system', async ({ examiner, page }) => {
  void examiner
  await new SessionsPage(page).goto()
  await page.getByRole('button', { name: 'Actions pour « Session e2e »' }).click()
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCSS(
    'border-top-left-radius',
    '12px',
  )
})

test('survol d’un bouton secondaire lisible avec un thème de config de l’ancien modèle', async ({
  page,
}) => {
  // Fixture au thème sombre d'avant la refonte : `accent` cyan clair, `accent-foreground` sombre.
  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(new URL('./fixtures/offline-php.config.json', import.meta.url).pathname)
  await create.fillName('Session ancien thème')
  const examiner = await create.submit()
  await examiner.openPanel('Liste')
  const button = page.getByRole('button', { name: 'Ajouter un étudiant' })
  await button.hover()
  const expected = await button.evaluate((el) => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--accent-foreground)'
    el.append(probe)
    const resolved = getComputedStyle(probe).color
    probe.remove()
    return resolved
  })
  // `transition-all` : `toHaveCSS` réessaie jusqu'à la couleur finale.
  await expect(button).toHaveCSS('color', expected)
})

test('champs à 16 px sur téléphone (pas de zoom iOS au focus)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  const home = new HomePage(page)
  await home.goto()
  await home.createSession()
  await expect(page.locator('input:visible').first()).toHaveCSS('font-size', '16px')
})
