import { readFileSync } from 'node:fs'
import { examplePath, expect, test } from './fixtures.ts'

/** Texte réduit aux lettres, chiffres et espaces : neutralise le markdown et la typographie. */
function normalize(text: string): string {
  return text
    .replaceAll(/[^\p{L}\p{N}\s]/gu, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

/** Ce qui identifie un texte de la config dans la vue projetée : ses 25 premiers caractères significatifs. */
function significantStart(text: string): string {
  return normalize(text).slice(0, 25)
}

/** Début d'un énoncé : sa première ligne de texte, avant tout bloc de code (le langage du bloc n'est pas affiché). */
function promptStart(prompt: string): string {
  return significantStart(prompt.split(/[`\n]/)[0] ?? '')
}

function readConfig(): unknown {
  return JSON.parse(readFileSync(examplePath('config.example.json'), 'utf8'))
}

/** Toutes les valeurs de chaîne non vides de la clé `key`, à n'importe quelle profondeur. */
function collect(node: unknown, key: string): string[] {
  if (Array.isArray(node)) return node.flatMap((item) => collect(item, key))
  if (typeof node !== 'object' || node === null) return []
  return Object.entries(node).flatMap(([name, value]) =>
    name === key && typeof value === 'string' && value.trim() !== ''
      ? [value]
      : collect(value, key),
  )
}

test('la vue projetée suit l’examinateur sans action et ne montre jamais les réponses', async ({
  examiner,
}) => {
  const prompts = collect(readConfig(), 'prompt').map(promptStart)
  const comment = 'Hésite sur les types, à revoir - commentaire-secret-e2e'

  // 1. Ouverture : écran d'attente.
  const present = await examiner.openPresentView()
  await expect(present.waitingMessage).toBeVisible()

  // 2. Projection de l'étudiant actif : son nom apparaît dans la popup.
  await examiner.projectActiveStudent()
  await expect(present.studentName('Alice Durand')).toBeVisible()
  await expect(present.questionIndex).toHaveText('Question 1 / 3')

  // 3. Tirage : l'énoncé apparaît dans la popup sans aucune action côté projection.
  await examiner.draw('Normal')
  await expect
    .poll(async () => {
      const shown = normalize(await present.text())
      return prompts.some((start) => shown.includes(start))
    })
    .toBe(true)

  // 4. Notation : la question suivante est annoncée.
  await examiner.score('1')
  await expect(present.questionIndex).toHaveText('Question 2 / 3')

  // 5. Commentaire de l'examinateur.
  await examiner.setComment(comment)

  // 6. Étanchéité : aucune réponse, aucun commentaire dans le texte projeté.
  const answers = collect(readConfig(), 'answer').map(significantStart)
  expect(answers.length).toBeGreaterThan(0)
  const shown = await present.text()
  const normalized = normalize(shown)
  for (const answer of answers) expect(normalized).not.toContain(answer)
  expect(shown).not.toContain('commentaire-secret-e2e')

  // 7. Fermeture puis réouverture : même état.
  await present.close()
  const reopened = await examiner.openPresentView()
  await expect(reopened.studentName('Alice Durand')).toBeVisible()
  await expect(reopened.questionIndex).toHaveText('Question 2 / 3')
})
