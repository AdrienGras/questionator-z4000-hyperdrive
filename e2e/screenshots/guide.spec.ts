import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath } from '../fixtures.ts'
import { HomePage } from '../pages/home-page.ts'
import { capture, expect, test } from './determinism.ts'

/**
 * Attend que l'animation d'entrée de recharts ait fini : la barre est visible et sa hauteur, non
 * nulle, est la même à 400 ms d'intervalle (l'animation dure moins). `animations: 'disabled'` ne
 * couvre que CSS et Web Animations, pas cette animation JS.
 */
async function expectBarDrawn(page: Page): Promise<void> {
  const bar = page.locator('.recharts-bar-rectangle path').first()
  await expect(bar).toBeVisible()
  await expect
    .poll(() =>
      bar.evaluate(async (path) => {
        const before = path.getBoundingClientRect().height
        await new Promise((resolve) => setTimeout(resolve, 400))
        return before > 0 && before === path.getBoundingClientRect().height
      }),
    )
    .toBe(true)
}

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
  await page.getByRole('textbox', { name: 'Nom de la session' }).blur()
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
  await expectBarDrawn(page)
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
  await page.getByRole('textbox', { name: 'Nom de la session' }).blur()
  await capture(page, 'creation-avertissements')
})

test('entraînement : mise en place, question révélée, stats', async ({ page }) => {
  const home = new HomePage(page)
  await home.goto()
  const setup = await home.startTraining()
  // Étape 2 seule : le prompt et l'encadré sur l'effort de réflexion.
  const promptStep = page.getByRole('listitem', { name: 'Copiez le prompt' })
  await expect(
    promptStep.getByText('Réglez le LLM sur son effort de réflexion maximal.'),
  ).toBeVisible()
  await capture(promptStep, 'entrainement-mise-en-place')

  await setup.pasteConfig(readFileSync(examplePath('training.example.json'), 'utf8'))
  const training = await setup.start()

  await training.draw('Normal')
  await training.reveal()
  await expect(training.answerTitle).toBeVisible()
  // Page entière : à 800 px de haut, le bouton « Passer » sous la réponse serait coupé.
  await capture(page, 'entrainement-question', { fullPage: true })

  // Quelques notes, dont deux sous la moitié du barème (« À revoir »), et un passage.
  await training.score('1,5')
  for (const [category, value] of [
    ['Facile', '0'],
    ['Difficile', '3'],
    ['Normal', '0,5'],
    ['Facile', '1'],
  ] as const) {
    await training.draw(category)
    await training.reveal()
    await training.score(value)
  }
  await training.draw('Cauchemar')
  await training.pass()

  const stats = await training.openStats()
  await expect(stats.keyFigures).toContainText('5 réponses notées')
  await expect(stats.reviewList).toBeVisible()
  await capture(page, 'entrainement-stats')
})
