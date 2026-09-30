import { expect, test } from './fixtures.ts'

test('les statistiques comptent l’étudiant terminé et affichent l’histogramme', async ({
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
  await expect(stats.headcount('Terminés')).toHaveText('1')

  // 3. Histogramme : 20 intervalles (note sur 20) dans le tableau accessible.
  await expect(stats.histogram).toBeAttached()
  await expect(stats.histogram.getByRole('row')).toHaveCount(21) // en-tête + 20 lignes

  // 4. Retour à l'écran de passage.
  await stats.backToPassage()
  await expect(examiner.passageDone).toBeVisible()
})
