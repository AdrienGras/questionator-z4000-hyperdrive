import { screen, waitFor, within } from '@testing-library/react'
import { expect } from 'vitest'
import { PassageError, type PassageErrorCode } from '@/domain/passage/errors'

/**
 * Bouton de catégorie, dans la grille de tirage seule (`QuestionPanel` affiche aussi le libellé
 * de la catégorie, et le détail de l'écran final est une `<ol>` qui le contient aussi : une
 * recherche non bornée matche ces éléments). On retente jusqu'à trouver une `<ul>` (la grille ;
 * l'écran final n'utilise que des `<ol>`) qui contient un bouton portant ce libellé : juste après
 * une réinitialisation, l'écran final périmé est encore là quelques instants. Le premier montage
 * passe par le découpage de route à la demande (`autoCodeSplitting`), jamais synchrone
 * (`src/testing/setup.ts`), d'où l'attente. Pas de filtre sur le nom de la liste : il suit la
 * locale de la session (« Choisir une catégorie » / « Choose a category », Review Focus 5).
 */
export function categoryButton(label: string): Promise<HTMLElement> {
  return waitFor(() => {
    for (const grid of screen.queryAllByRole('list')) {
      if (grid.tagName !== 'UL') continue
      const button = within(grid).queryByText(label)?.closest('button')
      if (button) return button
    }
    throw new Error(`bouton de catégorie « ${label} » introuvable`)
  })
}

/** `fn` doit lever une `PassageError` de ce `code`, rien d'autre. */
export function expectPassageError(fn: () => unknown, code: PassageErrorCode): void {
  let caught: unknown
  expect(() => {
    try {
      fn()
    } catch (error) {
      caught = error
      throw error
    }
  }).toThrow(PassageError)
  if (!(caught instanceof PassageError)) throw new Error('Erreur inattendue')
  expect(caught.code).toBe(code)
}

/**
 * Élément portant ce texte, hors du panneau latéral : le panneau répète les notes et les listes
 * de l'écran final, une requête d'écran non bornée y trouverait plusieurs éléments (F12).
 */
export function outsidePanel(label: string): HTMLElement {
  const found = screen.getAllByText(label).filter((element) => element.closest('aside') === null)
  const [first] = found
  if (found.length !== 1 || first === undefined) {
    throw new Error(`« ${label} » : ${found.length} éléments hors panneau, un seul attendu`)
  }
  return first
}
