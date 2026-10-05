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

/** Catégories de l'exemple, avec l'id, le titre et le libellé utiles au parcours. */
function categoriesOf(text: string) {
  return z
    .looseObject({
      categories: z.array(
        z.looseObject({
          id: z.string(),
          label: z.string(),
          questions: z.array(z.looseObject({ id: z.string(), title: z.string() })),
        }),
      ),
    })
    .parse(JSON.parse(text)).categories
}

/**
 * Variante de l'exemple : la première question d'une autre catégorie que `keptCategoryId` est
 * retirée, une question est ajoutée dans `keptCategoryId`. Renvoie le JSON et le titre ajouté.
 */
function updatedConfig(keptCategoryId: string): { text: string; addedTitle: string } {
  const config = z
    .looseObject({
      categories: z.array(
        z.looseObject({ id: z.string(), questions: z.array(z.record(z.string(), z.unknown())) }),
      ),
    })
    .parse(JSON.parse(CONFIG))
  const target = config.categories.find((c) => c.id === keptCategoryId)
  const other = config.categories.find((c) => c.id !== keptCategoryId && c.questions.length > 1)
  if (target === undefined || other === undefined) throw new Error('Exemple inattendu')
  other.questions.shift()
  const addedTitle = 'Question ajoutée par la mise à jour'
  target.questions.push({
    ...target.questions[0],
    id: `${keptCategoryId}-ajoutee-e2e`,
    title: addedTitle,
  })
  return { text: JSON.stringify(config, null, 2), addedTitle }
}

test('stats et mise à jour de config : la note reste, la question ajoutée sort en priorité', async ({
  page,
}) => {
  const total = questionCount(CONFIG)
  const [first] = categoriesOf(CONFIG)
  if (first === undefined) throw new Error('Exemple sans catégorie')
  const level = first.label
  const { text: updated, addedTitle } = updatedConfig(first.id)

  const home = new HomePage(page)
  await home.goto()
  const setup = await home.startTraining()
  await setup.pasteConfig(CONFIG)
  const training = await setup.start()

  // Une question notée 0 (elle devient « à revoir »), une autre passée.
  await training.draw(level)
  const scoredTitle = (await training.questionTitle.textContent()) ?? ''
  expect(scoredTitle).not.toBe('')
  await training.reveal()
  await training.score('0')
  await training.draw(level)
  const passedTitle = (await training.questionTitle.textContent()) ?? ''
  expect(passedTitle).not.toBe(scoredTitle)
  await training.pass()

  const stats = await training.openStats()
  await expect(stats.keyFigures).toContainText('1 réponse notée')
  await expect(stats.keyFigures).toContainText('1 passée')
  await expect(stats.keyFigures).toContainText(`1 / ${total} questions notées`)
  await expect(stats.reviewItem(scoredTitle)).toBeVisible()

  // Les autres questions du niveau sont vues à leur tour : seule l'ajoutée restera jamais vue.
  const back = await stats.backToTraining()
  const seen = new Set([scoredTitle, passedTitle])
  while (seen.size < first.questions.length) {
    const before = seen.size
    await back.draw(level)
    seen.add((await back.questionTitle.textContent()) ?? '')
    expect(seen.size).toBe(before + 1)
    await back.pass()
  }

  const update = await back.openUpdate()
  await update.pasteConfig(updated)
  await expect(update.updateSummary).toContainText(
    `${total - 1} questions conservées — historique gardé`,
  )
  await expect(update.updateSummary).toContainText('1 nouvelle')
  await expect(update.updateSummary).toContainText('1 retirée')
  const afterUpdate = await update.update()

  // La question ajoutée est la seule jamais vue du niveau : elle sort en premier.
  await afterUpdate.draw(level)
  await expect(afterUpdate.questionTitle).toHaveText(addedTitle)
  await afterUpdate.pass()

  // Les stats gardent la note d'avant la mise à jour ; le total ne bouge pas (une retirée, une ajoutée).
  const homeAgain = await afterUpdate.backHome()
  const finalStats = await homeAgain.openTrainingStats(NAME)
  await expect(finalStats.keyFigures).toContainText('1 réponse notée')
  // Passées : toutes les questions du niveau d'origine sauf la notée, plus l'ajoutée.
  const passed = first.questions.length
  await expect(finalStats.keyFigures).toContainText(
    `${passed} ${passed > 1 ? 'passées' : 'passée'}`,
  )
  await expect(finalStats.keyFigures).toContainText(`1 / ${total} questions notées`)
  await expect(finalStats.reviewItem(scoredTitle)).toBeVisible()
})
