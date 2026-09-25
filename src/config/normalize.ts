import type { Locale } from '../i18n'
import { CONFIG_DEFAULTS } from './defaults'
import { deriveTitle } from './derive-title'
import type {
  ParsedCategory,
  ParsedConfig,
  ParsedQuestion,
  SCHEMA_VERSION,
  ThemeToken,
} from './schema'

export type ThemeOverrides = Partial<Record<ThemeToken, string>>

export type NormalizedQuestion = {
  id: string
  title: string
  tags: string[]
  prompt: string
  answer?: string
}

export type NormalizedCategory = {
  id: string
  label: string
  scale: number[]
  color?: string
  icon?: string
  order: number
  questions: NormalizedQuestion[]
}

/** Forme figée dans la session (F06) : défauts appliqués, catégories triées, titres dérivés. */
export type NormalizedConfig = {
  schemaVersion: typeof SCHEMA_VERSION
  locale?: Locale
  exam: { title: string; subject?: string; cohort?: string }
  scoring: {
    questionsPerStudent: number
    maxRawScore: number
    finalScale: number
    rounding: { mode: 'nearest' | 'up' | 'down'; decimals: number; step: number | null }
  }
  absent: { export: 'label' | 'zero' | 'value'; label: string; value?: number }
  skips: { enabled: boolean; maxPerStudent: number; reasons: string[]; allowFreeText: boolean }
  presentation: {
    showCumulativeScore: boolean
    finalScoreDisplay: 'raw' | 'converted' | 'both'
    showStatsOnFinal: boolean
    drawAnimation: boolean
    defaultColorMode: 'light' | 'dark' | 'system'
  }
  theme: { light: ThemeOverrides; dark: ThemeOverrides }
  categories: NormalizedCategory[]
}

function normalizeQuestion(question: ParsedQuestion): NormalizedQuestion {
  return {
    id: question.id,
    title: question.title ?? deriveTitle(question.prompt, question.id),
    tags: [...(question.tags ?? [])],
    prompt: question.prompt,
    ...(question.answer !== undefined && { answer: question.answer }),
  }
}

function normalizeCategory(category: ParsedCategory, order: number): NormalizedCategory {
  return {
    id: category.id,
    label: category.label,
    scale: [...category.scale],
    ...(category.color !== undefined && { color: category.color }),
    ...(category.icon !== undefined && { icon: category.icon }),
    order,
    questions: category.questions.map(normalizeQuestion),
  }
}

/**
 * Tri stable par clé puis par position (D40). La clé est `order` s'il est fourni, sinon la
 * position 1-based de la catégorie dans le fichier : les deux partagent le même espace de valeurs,
 * donc une catégorie sans `order` placée 1re a la clé 1 et vient à égalité avec un `order: 1`
 * explicite. À clé égale, la position dans le fichier départage.
 */
function sortCategories(categories: ParsedCategory[]): ParsedCategory[] {
  return categories
    .map((category, index) => ({ category, index, key: category.order ?? index + 1 }))
    .toSorted((a, b) => a.key - b.key || a.index - b.index)
    .map(({ category }) => category)
}

export function normalize(config: ParsedConfig): NormalizedConfig {
  const { scoring, absent, skips, presentation, theme } = config
  const defaults = CONFIG_DEFAULTS
  return {
    schemaVersion: config.schemaVersion,
    ...(config.locale !== undefined && { locale: config.locale }),
    exam: { ...config.exam },
    scoring: {
      questionsPerStudent: scoring.questionsPerStudent,
      maxRawScore: scoring.maxRawScore,
      finalScale: scoring.finalScale,
      rounding: {
        mode: scoring.rounding?.mode ?? defaults.rounding.mode,
        decimals: scoring.rounding?.decimals ?? defaults.rounding.decimals,
        step: scoring.rounding?.step ?? defaults.rounding.step,
      },
    },
    absent: {
      export: absent?.export ?? defaults.absent.export,
      label: absent?.label ?? defaults.absent.label,
      ...(absent?.value !== undefined && { value: absent.value }),
    },
    skips: {
      enabled: skips?.enabled ?? defaults.skips.enabled,
      maxPerStudent: skips?.maxPerStudent ?? defaults.skips.maxPerStudent,
      reasons: [...(skips?.reasons ?? [])],
      allowFreeText: skips?.allowFreeText ?? defaults.skips.allowFreeText,
    },
    presentation: {
      showCumulativeScore:
        presentation?.showCumulativeScore ?? defaults.presentation.showCumulativeScore,
      finalScoreDisplay: presentation?.finalScoreDisplay ?? defaults.presentation.finalScoreDisplay,
      showStatsOnFinal: presentation?.showStatsOnFinal ?? defaults.presentation.showStatsOnFinal,
      drawAnimation: presentation?.drawAnimation ?? defaults.presentation.drawAnimation,
      defaultColorMode: presentation?.defaultColorMode ?? defaults.presentation.defaultColorMode,
    },
    theme: { light: { ...theme?.light }, dark: { ...theme?.dark } },
    categories: sortCategories(config.categories).map((category, index) =>
      normalizeCategory(category, index + 1),
    ),
  }
}
