import { screen } from '@testing-library/react'
import type { NormalizedCategory, NormalizedConfig } from '@/domain/config/normalize'
import { makeConfig } from './student-fixtures'

/** Barème par défaut : il contient les notes brutes des tests (13,5 et 20). */
const SCREEN_SCALE = [0, 1, 2, 3, 13.5, 20]

/**
 * Catégorie `a` de l'écran de passage (la fixture par défaut n'a qu'une question). `questions` :
 * nombre de questions `a-1`… (3 par défaut ; `makeStudent` fabrique `attempt-2` et au-delà sur
 * `a-2`…). `scale` : le barème, qui doit contenir toute note stockée, sinon la session est lue
 * comme endommagée (F31).
 */
export function makeScreenCategory(
  options: Readonly<{ scale?: readonly number[]; questions?: number }> = {},
): NormalizedCategory {
  const { scale = SCREEN_SCALE, questions = 3 } = options
  return {
    id: 'a',
    label: 'A',
    scale: [...scale],
    order: 1,
    questions: Array.from({ length: questions }, (_, i) => {
      const id = `a-${i + 1}`
      return { id, title: `Titre ${id}`, tags: [], prompt: id }
    }),
  }
}

/** Catégorie `a` à 3 questions, barème par défaut. */
export const screenCategory: NormalizedCategory = makeScreenCategory()

/**
 * Config de l'écran de passage : note brute max 20, échelle finale 20, arrondi au plus proche,
 * sur la seule catégorie `category` (`screenCategory` par défaut).
 */
export function screenConfig(
  options: Readonly<{
    questionsPerStudent?: number
    step?: number
    decimals?: number
    category?: NormalizedCategory
  }> = {},
): NormalizedConfig {
  const { questionsPerStudent = 1, step = 0.5, decimals = 2, category = screenCategory } = options
  return {
    ...makeConfig({
      questionsPerStudent,
      maxRawScore: 20,
      finalScale: 20,
      rounding: { mode: 'nearest', decimals, step },
    }),
    categories: [category],
  }
}

/** Date de révélation de la note finale, commune aux sessions de test de l'écran de passage. */
export const REVEALED = '2026-09-25T10:00:00.000Z'

/** Le tiroir latéral ouvert (`dialog` « Panneau latéral »). */
export function panel(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Panneau latéral' })
}
