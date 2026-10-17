import { expect, test } from './fixtures.ts'
import { AppMenu } from './pages/app-menu.ts'

test('naviguer entre les espaces sans repasser par l’accueil', async ({ page }) => {
  const menu = new AppMenu(page)
  await menu.goto('/editor')
  await expect(menu.link('Éditeur de config')).toHaveAttribute('aria-current', 'page')
  await menu.link('Entraînement').click()
  await expect(page).toHaveURL(/#\/trainings$/)
  await expect(menu.link('Entraînement')).toHaveAttribute('aria-current', 'page')
  await menu.link('Sessions').click()
  await expect(page).toHaveURL(/#\/sessions$/)
  await expect(menu.link('Sessions')).toHaveAttribute('aria-current', 'page')
  await expect(menu.link('Entraînement')).not.toHaveAttribute('aria-current')
})

test('replié : infobulle au survol et au focus, état gardé au rechargement', async ({ page }) => {
  const menu = new AppMenu(page)
  await menu.goto('/editor')
  await menu.collapse()
  await expect.poll(async () => (await menu.aside.boundingBox())?.width).toBe(72)

  await menu.link('Sessions').hover()
  await expect(page.getByRole('tooltip', { name: 'Sessions' })).toBeVisible()

  // Focus clavier : base-ui n'ouvre l'infobulle que sur `:focus-visible`, pas sur un `focus()`.
  await page.mouse.move(800, 400)
  await menu.link('Sessions').focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('tooltip', { name: 'Éditeur de config' })).toBeVisible()

  await page.reload()
  await expect(menu.toggle(true)).toBeVisible()
  await expect.poll(async () => (await menu.aside.boundingBox())?.width).toBe(72)
})

test('clavier : Tab parcourt le menu dans l’ordre', async ({ page }) => {
  const menu = new AppMenu(page)
  await menu.goto('/editor')
  await menu.link('Accueil').focus()
  const names: (string | null)[] = []
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab')
    names.push(
      await page.evaluate(
        () =>
          document.activeElement?.getAttribute('aria-label') ??
          document.activeElement?.textContent ??
          null,
      ),
    )
  }
  expect(names).toEqual([
    'Sessions',
    'Éditeur de config',
    'Entraînement',
    'Aide (nouvel onglet)',
    'Replier le menu',
  ])
})

test('écran étroit : tiroir', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const menu = new AppMenu(page)
  await menu.goto('/')
  await expect(menu.aside).toBeHidden()
  const drawer = await menu.openDrawer()
  await drawer.getByRole('link', { name: 'Éditeur de config', exact: true }).click()
  await expect(menu.drawer).toBeHidden()
  await expect(page).toHaveURL(/#\/editor$/)
})

test('vue projetée : aucun menu', async ({ examiner }) => {
  const present = await examiner.openPresentView()
  await expect(present.waitingMessage).toBeVisible()
  await expect(present.page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCount(
    0,
  )
  await expect(present.page.getByRole('button', { name: 'Menu', exact: true })).toHaveCount(0)
})
