import { readFileSync } from 'node:fs'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

/** Config d'entraînement d'exemple : « Git, les bases », 9 questions en 4 catégories. */
const CONFIG = readFileSync(examplePath('training.example.json'), 'utf8')
const NAME = 'Git, les bases'

test('entraînement : tirer, noter, reprendre après rechargement, passer, retrouver la couverture', async ({
  page,
}) => {
  const home = new HomePage(page)
  await home.goto()
  await expect(home.trainings).toBeHidden()

  const setup = await home.startTraining()
  await setup.pasteConfig(CONFIG)
  const training = await setup.start()

  // Premier tirage : la réponse est masquée jusqu'à « Voir la réponse », puis notée.
  await training.draw('Facile')
  await expect(training.questionTitle).toBeFocused()
  await expect(training.answerTitle).toBeHidden()
  await training.reveal()
  await expect(training.answerTitle).toBeFocused()
  await training.score('0')
  await expect(training.question).toBeHidden()

  // Deuxième tirage : après rechargement, la même question revient, réponse masquée.
  await training.draw('Normal')
  const title = await training.questionTitle.textContent()
  expect(title).toBeTruthy()
  await training.reload()
  await expect(training.questionTitle).toHaveText(title ?? '')
  await expect(training.revealButton).toBeVisible()
  await expect(training.answerTitle).toBeHidden()

  await training.pass()
  await expect(training.question).toBeHidden()

  // Accueil : l'entraînement est listé avec sa couverture (1 question notée sur 9 → 11 %).
  const back = await training.backHome()
  const card = back.trainingCard(NAME)
  await expect(card).toBeVisible()
  await expect(card).toContainText(/11\s%\sdes questions vues/)

  const reopened = await back.openTraining(NAME)
  await expect(reopened.tiles).toBeVisible()
})

test('une config collée invalide affiche ses erreurs et se corrige dans l’éditeur', async ({
  page,
}) => {
  const invalid = CONFIG.replace(/,\s*"finalScale": 20/, '')
  expect(invalid).not.toBe(CONFIG)

  const home = new HomePage(page)
  await home.goto()
  const setup = await home.startTraining()
  await setup.pasteConfig(invalid)

  await expect(setup.issue('Champ obligatoire manquant : « finalScale ».')).toBeVisible()
  await expect(setup.submitButton).toBeDisabled()

  const editor = await setup.fixInEditor()
  await expect(editor.editor).toContainText('"title": "Git, les bases"')
  await expect(editor.issue('Champ obligatoire manquant : « finalScale ».')).toBeVisible()
})
