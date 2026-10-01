import { expect, test } from './fixtures.ts'

test('un tirage juste après un changement de mode tire bien la question (#76)', async ({
  examiner,
  page,
}) => {
  await examiner.chooseColorMode('Sombre')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(page.getByRole('button', { name: "Mode d'affichage : sombre" })).toBeFocused()

  // Le clic suivant agit sur la page : il n'est pas capté par un menu resté ouvert.
  await examiner.draw('Facile')
  await expect(page.getByRole('button', { name: 'Noter 1', exact: true })).toBeVisible()
})
