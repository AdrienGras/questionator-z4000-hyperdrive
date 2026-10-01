import { screen } from '@testing-library/react'
import type { NormalizedCategory } from '@/domain/config/normalize'

/**
 * Catégorie `a` à 3 questions (la fixture par défaut n'en a qu'une) ; le barème contient les notes
 * brutes des tests (13,5 et 20) : une session stockée hors barème est lue comme endommagée (F31).
 */
export const screenCategory: NormalizedCategory = {
  id: 'a',
  label: 'A',
  scale: [0, 1, 2, 3, 13.5, 20],
  order: 1,
  questions: ['a-1', 'a-2', 'a-3'].map((id) => ({
    id,
    title: `Titre ${id}`,
    tags: [],
    prompt: id,
  })),
}

/** Date de révélation de la note finale, commune aux sessions de test de l'écran de passage. */
export const REVEALED = '2026-09-25T10:00:00.000Z'

/** Le tiroir latéral ouvert (`dialog` « Panneau latéral »). */
export function panel(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Panneau latéral' })
}
