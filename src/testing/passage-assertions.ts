import { screen, within } from '@testing-library/react'
import { expect } from 'vitest'
import { PassageError, type PassageErrorCode } from '@/domain/passage/errors'

/**
 * Bouton de catégorie, dans la grille de tirage seule (`QuestionPanel` affiche aussi le libellé
 * de la catégorie, donc une recherche non bornée à la grille matche les deux). `findByRole`
 * (async) : le premier montage passe par le découpage de route à la demande
 * (`autoCodeSplitting`), qui n'est jamais synchrone (`src/testing/setup.ts`). Pas de filtre de
 * nom sur la liste : son libellé suit la locale de la session (« Choisir une catégorie » /
 * « Choose a category », Review Focus 5) et une seule `<ul>` existe sur cet écran.
 */
export async function categoryButton(label: string): Promise<HTMLElement> {
  const grid = await screen.findByRole('list')
  const span = within(grid).getByText(label)
  const button = span.closest('button')
  if (button === null) throw new Error(`bouton de catégorie « ${label} » introuvable`)
  return button
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
