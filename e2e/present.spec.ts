import { readFileSync } from 'node:fs'
import { examplePath, expect, test } from './fixtures.ts'
import type { PresentPage } from './pages/present-page.ts'

/** Texte réduit aux lettres, chiffres et espaces : neutralise le markdown et la typographie. */
function normalize(text: string): string {
  return text
    .replaceAll(/[^\p{L}\p{N}\s]/gu, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

const NEEDLE_LENGTH = 40
const MIN_NEEDLE_LENGTH = 20

/**
 * Aiguille d'un texte de la config : ses 40 premiers caractères significatifs. Le langage qui suit
 * une clôture ``` n'est jamais affiché : il est retiré avant la normalisation, la même pour les
 * énoncés et les réponses.
 */
function needle(text: string): string {
  return normalize(text.replaceAll(/```\w*/g, ' ')).slice(0, NEEDLE_LENGTH)
}

/** Aiguilles d'une clé de la config ; échoue bruyamment si l'une est dégénérée. */
function needles(key: string): string[] {
  const result = collect(readConfig(), key).map(needle)
  expect(result.length).toBeGreaterThan(0)
  for (const item of result) expect(item.length).toBeGreaterThanOrEqual(MIN_NEEDLE_LENGTH)
  return result
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

/** Aucune réponse de la config, ni le commentaire saisi, dans le texte affiché par la vue projetée. */
async function expectNoLeak(present: PresentPage, answers: string[], comment: string) {
  const shown = await present.text()
  const normalized = normalize(shown)
  for (const answer of answers) expect(normalized).not.toContain(answer)
  expect(shown).not.toContain(comment)
}

test('la vue projetée suit l’examinateur sans action et ne montre jamais les réponses', async ({
  examiner,
}) => {
  const prompts = needles('prompt')
  const answers = needles('answer')
  const comment = 'commentaire-secret-e2e'

  // 1. Ouverture : écran d'attente.
  const present = await examiner.openPresentView()
  await expect(present.waitingMessage).toBeVisible()

  // 2. Projection de l'étudiant actif : son nom apparaît dans la popup.
  await examiner.projectActiveStudent()
  await expect(present.studentName('Alice Durand')).toBeVisible()
  await expect(present.questionIndex).toHaveText('Question 1 / 3')

  // 3. Tirage : l'énoncé apparaît dans la popup sans aucune action côté projection, et les
  // réponses n'y sont pas (c'est là qu'une fuite est la plus probable).
  await examiner.draw('Normal')
  await expect(present.prompt).toBeVisible()
  const shownPrompt = normalize(await present.prompt.innerText())
  expect(prompts.some((start) => shownPrompt.includes(start))).toBe(true)
  await expectNoLeak(present, answers, comment)

  // 4. Notation : la question suivante est annoncée.
  await examiner.score('1')
  await expect(present.questionIndex).toHaveText('Question 2 / 3')

  // 5. Commentaire de l'examinateur.
  await examiner.setComment(comment)

  // 6. Étanchéité après notation.
  await expectNoLeak(present, answers, comment)

  // 7. Fermeture puis réouverture : même état, toujours étanche.
  await present.close()
  const reopened = await examiner.openPresentView()
  await expect(reopened.studentName('Alice Durand')).toBeVisible()
  await expect(reopened.questionIndex).toHaveText('Question 2 / 3')
  await expectNoLeak(reopened, answers, comment)
})
