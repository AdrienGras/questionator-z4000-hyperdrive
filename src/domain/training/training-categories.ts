import type { Locale } from '@/lib/i18n/i18n'

/** Catégorie imposée par le prompt de génération d'une config d'entraînement. */
export type TrainingCategory = {
  id: string
  scale: readonly number[]
  /** Nom d'icône Tabler. */
  icon: string
  label: Record<Locale, string>
}

/** Les 4 catégories que toute config d'entraînement doit déclarer, dans cet ordre. */
export const TRAINING_CATEGORIES: readonly TrainingCategory[] = [
  { id: 'facile', scale: [0, 0.5, 1], icon: 'leaf', label: { fr: 'Facile', en: 'Easy' } },
  {
    id: 'normal',
    scale: [0, 0.5, 1, 1.5, 2],
    icon: 'flame',
    label: { fr: 'Normal', en: 'Normal' },
  },
  { id: 'difficile', scale: [0, 1, 2, 3], icon: 'bolt', label: { fr: 'Difficile', en: 'Hard' } },
  {
    id: 'cauchemar',
    scale: [0, 1, 2, 3, 4],
    icon: 'skull',
    label: { fr: 'Cauchemar', en: 'Nightmare' },
  },
]

export const README_RAW_URL =
  'https://raw.githubusercontent.com/AdrienGras/questionator-z4000-hyperdrive/main/README.md'
