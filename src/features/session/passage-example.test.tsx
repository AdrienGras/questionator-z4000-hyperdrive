import 'fake-indexeddb/auto'
import { fireEvent, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import { validateConfig } from '@/domain/config/validate'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { categoryButton } from '@/testing/passage-assertions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'

// Deux chargements à la demande sans rapport avec ce que vérifie le test, mesurés seul : l'index
// des icônes Tabler (les catégories de l'exemple en portent ; des milliers de modules, ~400 ms) et
// Shiki pour les blocs ```php (~140 ms). Sous la suite complète, ils portaient le test au-delà de
// 4 s. Module d'icônes vide (aucune icône rendue) ; blocs de code en texte brut.
vi.mock('@tabler/icons-react/dist/esm/icons/index.mjs', () => ({}))
vi.mock('@/lib/markdown/highlighter', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/markdown/highlighter')>()),
  highlight: () => Promise.resolve(null),
}))

beforeEach(async () => {
  localStorage.clear()
  await db.sessions.clear()
})

/** Config d'exemple normalisée (`questionsPerStudent: 3`, « Cauchemar » à 2 questions). */
function exampleConfig() {
  const result = validateConfig(exampleText, { cssSupports: () => true })
  if (!result.ok) throw new Error('fichier d’exemple invalide')
  return result.config
}

test('« Cauchemar » épuisée après ses deux questions grise le bouton et affiche l’infobulle, sans que le passage soit terminé', async () => {
  const config = exampleConfig()
  await putSession(makeSession({ config, students: [makeStudent()], activeStudentId: 'student-1' }))
  renderAt('/session/session-1')

  // Premier tirage puis note. La note choisie (0) égale le score brut initial : on attend la
  // disparition du panneau (signal non ambigu que l'attempt est passé `scored`), pas le texte
  // du score brut qui, lui, ne changerait pas visiblement.
  fireEvent.click(await categoryButton('Cauchemar'))
  await screen.findByText('Éléments de réponse')
  fireEvent.click(screen.getByRole('button', { name: 'Noter 0' }))
  await waitForElementToBeRemoved(() => screen.queryByText('Éléments de réponse'))

  // Second tirage puis note : les deux questions de la catégorie sont épuisées.
  fireEvent.click(await categoryButton('Cauchemar'))
  await screen.findByText('Éléments de réponse')
  fireEvent.click(screen.getByRole('button', { name: 'Noter 1' }))
  await waitForElementToBeRemoved(() => screen.queryByText('Éléments de réponse'))
  await screen.findByText('Score brut : 1')

  // `questionsPerStudent` vaut 3 : le passage n'est pas terminé après 2 questions notées.
  expect(screen.queryByRole('heading', { name: 'Passage terminé' })).not.toBeInTheDocument()

  const button = await categoryButton('Cauchemar')
  // `aria-disabled`, pas `disabled` : un bouton nativement désactivé n'émettrait ni `focus` ni
  // `mouseenter`, l'infobulle ne s'ouvrirait jamais (D06).
  expect(button).not.toBeDisabled()
  expect(button).toHaveAttribute('aria-disabled', 'true')

  // Le motif est exposé de façon accessible indépendamment de l'ouverture de l'infobulle.
  expect(screen.getAllByText('Plus de question disponible dans cette catégorie')).toHaveLength(1)
  const describedBy = button.getAttribute('aria-describedby')
  if (describedBy === null) throw new Error('aria-describedby manquant sur le bouton épuisé')
  expect(document.getElementById(describedBy)).toHaveTextContent(
    'Plus de question disponible dans cette catégorie',
  )

  // Le clic sur une catégorie épuisée est un no-op : rien n'est écrit en base.
  const before = (await db.sessions.get('session-1'))?.students[0]?.attempts.length
  fireEvent.click(button)
  expect((await db.sessions.get('session-1'))?.students[0]?.attempts.length).toBe(before)

  // L'infobulle s'ouvre toujours au focus (un second texte identique apparaît, celui du popup).
  fireEvent.focus(button)
  expect(
    await screen.findAllByText('Plus de question disponible dans cette catégorie'),
  ).toHaveLength(2)
})
