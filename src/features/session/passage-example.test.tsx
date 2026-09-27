import 'fake-indexeddb/auto'
import { fireEvent, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import exampleText from '../../../examples/config.example.json?raw'
import { validateConfig } from '@/domain/config/validate'
import { db } from '@/lib/db/db'
import { putSession } from '@/lib/db/sessions'
import { makeSession } from '@/testing/session-fixtures'
import { makeStudent } from '@/testing/student-fixtures'
import { renderAt } from '@/testing/render-at'

beforeEach(async () => {
  await db.sessions.clear()
})

/**
 * Bouton de catégorie, dans la grille de tirage seule (`QuestionPanel` affiche aussi le libellé
 * de la catégorie). `findByRole` (async) : le premier montage passe par le découpage de route à
 * la demande.
 */
async function categoryButton(label: string): Promise<HTMLElement> {
  const grid = await screen.findByRole('list', { name: 'Choisir une catégorie' })
  const span = within(grid).getByText(label)
  const button = span.closest('button')
  if (button === null) throw new Error(`bouton de catégorie « ${label} » introuvable`)
  return button
}

/** Config d'exemple normalisée (`questionsPerStudent: 3`, « Cauchemar » à 2 questions). */
function exampleConfig() {
  const result = validateConfig(exampleText, { cssSupports: () => true })
  if (!result.ok) throw new Error('fichier d’exemple invalide')
  return result.config
}

test(
  '« Cauchemar » épuisée après ses deux questions grise le bouton et affiche l’infobulle, ' +
    'sans que le passage soit terminé',
  async () => {
    const config = exampleConfig()
    await putSession(
      makeSession({ config, students: [makeStudent()], activeStudentId: 'student-1' }),
    )
    renderAt('/session/session-1')

    // Premier tirage puis note. La note choisie (0) égale le score brut initial : on attend la
    // disparition du panneau (signal non ambigu que l'attempt est passé `scored`), pas le texte
    // du score brut qui, lui, ne changerait pas visiblement.
    fireEvent.click(await categoryButton('Cauchemar'))
    await screen.findByText('Éléments de réponse')
    fireEvent.click(screen.getByRole('button', { name: 'Noter 0' }))
    await waitForElementToBeRemoved(() => screen.getByText('Éléments de réponse'))

    // Second tirage puis note : les deux questions de la catégorie sont épuisées.
    fireEvent.click(await categoryButton('Cauchemar'))
    await screen.findByText('Éléments de réponse')
    fireEvent.click(screen.getByRole('button', { name: 'Noter 1' }))
    await waitForElementToBeRemoved(() => screen.getByText('Éléments de réponse'))
    await screen.findByText('Score brut : 1')

    // `questionsPerStudent` vaut 3 : le passage n'est pas terminé après 2 questions notées.
    expect(screen.queryByRole('heading', { name: 'Passage terminé' })).not.toBeInTheDocument()

    const button = await categoryButton('Cauchemar')
    expect(button).toBeDisabled()

    const wrapper = button.parentElement
    if (wrapper === null) throw new Error('enveloppe du bouton « Cauchemar » introuvable')
    fireEvent.focus(wrapper)
    expect(
      await screen.findByText('Plus de question disponible dans cette catégorie'),
    ).toBeInTheDocument()
  },
)
