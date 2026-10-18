import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { examplePath } from '../fixtures.ts'
import { HomePage } from '../pages/home-page.ts'
import { SessionsPage } from '../pages/sessions-page.ts'
import { TrainingsPage } from '../pages/trainings-page.ts'
import { FROZEN_TIME, capture, expect, test } from './determinism.ts'

/** Histogramme dessiné : au moins une barre non vide est visible. */
async function expectBarDrawn(page: Page): Promise<void> {
  await expect(page.locator('[data-bar]').first()).toBeVisible()
}

/** Icônes des catégories de `config.example.json`, chargées à la demande (chunk Tabler). */
const CATEGORY_ICONS = ['leaf', 'brand-php', 'flame', 'skull']

/** Icônes de catégorie dessinées : sans cette attente, la capture part parfois avant le chunk. */
async function expectCategoryIconsDrawn(page: Page): Promise<void> {
  for (const icon of CATEGORY_ICONS) {
    await expect(page.locator(`svg.tabler-icon-${icon}`).first()).toBeVisible()
  }
}

const SESSION_NAME = 'Oral de démonstration'
const TRAINING_NAME = 'Git, les bases'

/** Session créée, état vide des stats, passage, vue projetée, stats, éditeur. */
async function sessionScenario(page: Page): Promise<void> {
  const home = new HomePage(page)
  await home.goto()
  await expect(home.firstRun).toBeVisible()
  await capture(page, 'accueil')

  const create = await home.createSession()
  await create.uploadStudents(examplePath('students.example.csv'))
  await create.uploadConfig(examplePath('config.example.json'))
  await create.fillName(SESSION_NAME)
  await expect(page.getByRole('textbox', { name: 'Nom de la session' })).toHaveValue(SESSION_NAME)
  await page.getByRole('textbox', { name: 'Nom de la session' }).blur()
  await expectCategoryIconsDrawn(page)
  await capture(page, 'creation-session')

  const created = await create.submit()
  const emptyStats = await created.openStats()
  await expect(emptyStats.emptyState).toBeVisible()
  await capture(page, 'stats-vide')

  const examiner = await emptyStats.goToPassage()
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
  await expectCategoryIconsDrawn(present.page)
  await capture(present.page, 'vue-projetee')

  await examiner.openPanel('Liste')
  await capture(page, 'passage-panneau')
  await page.getByRole('button', { name: 'Fermer le panneau' }).click()
  await examiner.panel.waitFor({ state: 'hidden' })

  await examiner.score('1')
  for (const category of ['Facile', 'Difficile']) {
    await examiner.draw(category)
    await examiner.score('1')
  }
  await examiner.confirmAdjustment()
  await expect(examiner.passageDone).toBeVisible()
  await capture(page, 'passage-note-finale')

  const stats = await examiner.openStats()
  await expect(stats.headcount('Passés')).toHaveText('1')
  await expect(stats.histogram).toBeAttached()
  await expectBarDrawn(page)
  await capture(page, 'statistiques')

  await home.goto()
  const editor = await home.openEditor()
  await expect(editor.previewQuestions.first()).toBeVisible()
  await expect(editor.noIssues).toBeVisible()
  await capture(page, 'editeur-config')
}

/** Entraînement : mise en place, question révélée, quelques notes, stats. */
async function trainingScenario(page: Page): Promise<void> {
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
  // Fenêtre plus haute : à 800 px, « Passer » serait coupé, et une capture en page entière
  // arrêterait le menu latéral (hauteur d'écran) à 800 px.
  await page.setViewportSize({ width: 1280, height: 1110 })
  await capture(page, 'entrainement-question')
  await page.setViewportSize({ width: 1280, height: 800 })

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
}

/**
 * Captures du guide (F28, F44.11), dans l'ordre du parcours d'un utilisateur. Un seul scénario
 * pour la session et l'entraînement, pour que l'accueil et les pages d'espace montrent les deux ;
 * la capture des avertissements de création est un scénario à part.
 */
test('parcours complet : session, entraînement, espaces, mode clair', async ({ page }) => {
  await sessionScenario(page)
  // Une heure plus tard : à date égale, « Reprendre » départage par identifiant, qui est aléatoire.
  await page.clock.setFixedTime(new Date(FROZEN_TIME.getTime() + 60 * 60 * 1000))
  await trainingScenario(page)

  const sessions = new SessionsPage(page)
  await sessions.goto()
  await expect(sessions.sessionCard(SESSION_NAME)).toBeVisible()
  await capture(page, 'sessions')

  const trainings = new TrainingsPage(page)
  await trainings.goto()
  await expect(trainings.trainingCard(TRAINING_NAME)).toBeVisible()
  await capture(page, 'entrainements')

  const home = new HomePage(page)
  await home.goto()
  await expect(home.resume).toContainText(SESSION_NAME)
  await expect(home.resume).toContainText(TRAINING_NAME)
  await capture(page, 'accueil-reprendre')

  // Seule capture en clair (D113) : le mode global suit le système par défaut.
  await page.emulateMedia({ colorScheme: 'light' })
  await home.goto()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
  await capture(page, 'mode-clair')
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
  await expectCategoryIconsDrawn(page)
  await capture(page, 'creation-avertissements')
})
