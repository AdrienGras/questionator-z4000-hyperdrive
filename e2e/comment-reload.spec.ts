import { expect, test } from './fixtures.ts'

test('un commentaire tapé puis un rechargement immédiat : retrouvé dans le champ, puis enregistré', async ({
  examiner,
  page,
}) => {
  await examiner.typeCommentWithoutSaving('Réponse hésitante')
  // Ni blur ni attente : le délai de 500 ms n'est pas écoulé, seule la copie locale peut survivre.
  await page.reload()
  await examiner.openPanel('Étudiant')
  await expect(examiner.commentField).toHaveValue('Réponse hésitante')
  await expect(examiner.commentSaved).toBeVisible()
})
