import { expect, test } from './fixtures.ts'

test('les statistiques comptent l’étudiant terminé et décrivent l’histogramme', async ({
  examiner,
}) => {
  // 1. Passage complet du premier étudiant : trois questions tirées puis notées.
  for (const category of ['Facile', 'Normal', 'Difficile']) {
    await examiner.draw(category)
    await examiner.score('1')
  }

  // La boîte d'ajustement s'ouvre d'elle-même en fin de passage : on la valide telle quelle.
  await examiner.confirmAdjustment()

  // 2. Ouverture des statistiques : un seul étudiant terminé.
  const stats = await examiner.openStats()
  await expect(stats.headcount('Passés')).toHaveText('1')

  // 3. Histogramme : dessin caché, une phrase cite la barre de l'unique note.
  await expect(stats.histogram).toHaveText(/^Note de l’étudiant noté : 1 entre \d+ et \d+$/)

  // 4. Retour à l'écran de passage.
  await stats.backToPassage()
  await expect(examiner.passageDone).toBeVisible()
})

test('session sans tirage : état vide, « Aller au passage » y ramène', async ({
  examiner,
  page,
}) => {
  const stats = await examiner.openStats()
  await expect(stats.emptyState).toBeVisible()
  await expect(page.getByRole('region', { name: 'Synthèse' })).toHaveCount(0)

  await stats.goToPassage()
  await expect(page.getByRole('heading', { name: 'Tirage suivant' })).toBeVisible()
})
