import { readFileSync } from 'node:fs'
import { z } from 'zod'
import { examplePath, expect, test } from './fixtures.ts'
import { HomePage } from './pages/home-page.ts'

/** Config d'entraînement d'exemple : « Git, les bases ». */
const CONFIG = readFileSync(examplePath('training.example.json'), 'utf8')
const NAME = 'Git, les bases'

/** Nombre de questions de l'exemple, lu dans la config plutôt qu'écrit en dur. */
function questionCount(text: string): number {
  const parsed = z
    .looseObject({ categories: z.array(z.looseObject({ questions: z.array(z.unknown()) })) })
    .parse(JSON.parse(text))
  return parsed.categories.reduce((sum, category) => sum + category.questions.length, 0)
}

/** Couverture affichée sur la carte après une seule question notée, arrondie comme l'écran. */
const ONE_RATED_PERCENT = Math.round(100 / questionCount(CONFIG))

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

  // Accueil : l'entraînement est listé avec sa couverture (une seule question notée).
  const back = await training.backHome()
  const card = back.trainingCard(NAME)
  await expect(card).toBeVisible()
  await expect(card).toContainText(
    new RegExp(String.raw`${ONE_RATED_PERCENT}\s%\sdes questions notées`, 'u'),
  )

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
