import { readFileSync, writeFileSync } from 'node:fs'
import { examplePath } from '../fixtures.ts'
import { HomePage } from '../pages/home-page.ts'
import { capture, expect, test } from './determinism.ts'

const SESSION_NAME = 'Oral de démonstration'

/**
 * Captures du guide (F28), dans l'ordre du parcours d'un utilisateur. Un seul scénario pour la
 * session créée et passée ; la capture des avertissements de création est un scénario à part.
 */
test('parcours complet : création, passage, vue projetée, statistiques, éditeur', async ({
  page,
}) => {
  const home = new HomePage(page)
  await home.goto()
  await expect(page.getByRole('link', { name: 'Créer une session' }).first()).toBeVisible()
  await capture(page, 'accueil')

  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(examplePath('config.example.json'))
  await create.fillName(SESSION_NAME)
  await expect(page.getByRole('textbox', { name: 'Nom de la session' })).toHaveValue(SESSION_NAME)
  await capture(page, 'creation-session')

  const examiner = await create.submit()
  const present = await examiner.openPresentView()
  await examiner.projectActiveStudent()
  await expect(present.studentName('Alice Durand')).toBeVisible()

  await examiner.draw('Normal')
  await expect(present.prompt).toBeVisible()
  await expect(page.getByRole('region', { name: 'Question en cours' })).toBeVisible()
  // Réponse attendue dépliée : la capture montre ce que l'examinateur voit seul.
  await page.getByText('Éléments de réponse').click()
  await expect(page.getByText('Éléments de réponse').locator('..')).toHaveJSProperty('open', true)
  await capture(page, 'passage-question')

  // La vue projetée a fini son animation de tirage (énoncé visible) : elle porte la même question.
  await present.prompt.waitFor()
  await capture(present.page, 'vue-projetee')

  await examiner.openPanel('Étudiants')
  await capture(page, 'passage-panneau')
  await page.getByRole('button', { name: 'Fermer le panneau' }).click()
  await page.getByRole('dialog', { name: 'Panneau latéral' }).waitFor({ state: 'hidden' })

  await examiner.score('1')
  for (const category of ['Facile', 'Difficile']) {
    await examiner.draw(category)
    await examiner.score('1')
  }
  await examiner.confirmAdjustment()
  await expect(examiner.passageDone).toBeVisible()
  await capture(page, 'passage-note-finale')

  const stats = await examiner.openStats()
  await expect(stats.headcount('Terminés')).toHaveText('1')
  await expect(stats.histogram).toBeAttached()
  await capture(page, 'statistiques')

  await home.goto()
  await expect(page.getByRole('button', { name: `Actions pour « ${SESSION_NAME} »` })).toBeVisible()
  await capture(page, 'accueil-sessions')

  const editor = await home.openEditor()
  await expect(editor.previewQuestions.first()).toBeVisible()
  await expect(editor.noIssues).toBeVisible()
  await capture(page, 'editeur-config')
})

test('création : un CSV avec un doublon affiche un avertissement', async ({ page }, testInfo) => {
  const csv = `${readFileSync(examplePath('students.example.csv'), 'utf8').trimEnd()}\r\nDurand;Alice\r\n`
  const csvPath = testInfo.outputPath('etudiants-doublon.csv')
  writeFileSync(csvPath, csv)

  const home = new HomePage(page)
  await home.goto()
  const create = await home.createSession()
  await create.uploadStudents(csvPath)
  await create.uploadConfig(examplePath('config.example.json'))
  await create.fillName(SESSION_NAME)
  await expect(page.getByText('Fichier valide, avec avertissements')).toBeVisible()
  await capture(page, 'creation-avertissements')
})
