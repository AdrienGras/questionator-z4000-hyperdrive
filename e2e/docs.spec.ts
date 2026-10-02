import { expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

// Le site de documentation (F27) est servi sous `/docs/`, dans le même scope que le service worker de l'app :
// ces tests vérifient que le SW ne le détourne pas vers l'app.
test.beforeEach(async ({ page }) => {
  await new HomePage(page).goto()
  // Le service worker doit contrôler la page avant de tester la navigation (même attente qu'`offline.spec.ts`).
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })
})

test("lien Aide : nouvel onglet sur l'accueil de la doc", async ({ page, context }) => {
  const popupPromise = context.waitForEvent('page')
  await page.getByRole('link', { name: 'Aide (nouvel onglet)' }).click()
  const docs = await popupPromise

  await expect(docs).toHaveURL(/\/docs\/$/)
  await expect(
    docs.getByRole('heading', { level: 1, name: /Questionator Z-4000 Hyperdrive/ }),
  ).toBeVisible()
})

// `docs` sans barre finale n'est pas testé : `vite preview` répond alors par son repli SPA (index.html de l'app, 200),
// alors que GitHub Pages redirige `docs` vers `docs/`.
test('docs/ sert la doc sous service worker', async ({ page }) => {
  await page.goto('docs/')

  await expect(page.locator('.VPHero')).toBeVisible()
  // L'app n'a pas pris la main : son rendu n'est pas là.
  await expect(page.locator('#root')).toHaveCount(0)
})

test('recharger une page profonde affiche la page', async ({ page }) => {
  await page.goto('docs/guide/prise-en-main.html')
  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: 'Prise en main' })).toBeVisible()
})

test('la recherche locale trouve une page squelette', async ({ page }) => {
  await page.goto('docs/')
  await page.getByRole('button', { name: 'Rechercher dans la documentation' }).click()
  await page.getByPlaceholder('Rechercher').fill('Projeter')

  await expect(
    page.locator('#localsearch-list a[href*="guide/projeter.html"]').first(),
  ).toBeVisible()
})
