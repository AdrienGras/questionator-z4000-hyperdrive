import { expect, test } from './fixtures.ts'
import { AppMenu } from './pages/app-menu.ts'

test('un tirage juste après un changement de mode tire bien la question (#76)', async ({
  examiner,
  page,
}) => {
  const menu = new AppMenu(page)
  await menu.chooseColorMode('Sombre')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(menu.colorModeButton()).toHaveAccessibleName("Mode d'affichage : sombre")
  await expect(menu.colorModeButton()).toBeFocused()

  // Le clic suivant agit sur la page : il n'est pas capté par un menu resté ouvert.
  await examiner.draw('Facile')
  await expect(page.getByRole('button', { name: 'Noter 1', exact: true })).toBeVisible()
})
