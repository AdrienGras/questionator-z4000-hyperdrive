import { CONFIG_SCHEMA_LITE_URL, CONFIG_SCHEMA_URL } from '@/domain/config/json-schema'
import { t, type Locale } from '@/lib/i18n/i18n'
import {
  TRAINING_MESSAGES,
  TRAINING_PROMPT_SECTIONS,
  type TrainingPromptParams,
  type TrainingPromptSection,
} from './messages'
import { README_RAW_URL, TRAINING_CATEGORIES } from './training-categories'

/** Exemple de valeurs de barème dans le gabarit de `answer`, avec la décimale de la langue. */
const DECIMAL_EXAMPLE: Record<Locale, string> = { fr: '0,5 / 1 / 1,5…', en: '0.5 / 1 / 1.5…' }

/** Barème écrit `[0, 0.5, 1]`, lisible par un LLM. */
function formatScale(scale: readonly number[]): string {
  return JSON.stringify(scale).replaceAll(',', ', ')
}

/** Table markdown des catégories imposées, construite depuis la constante. */
function buildCategoryTable(locale: Locale): string {
  const rows = TRAINING_CATEGORIES.map(
    (c) => `  | ${c.id} | ${c.label[locale]} | ${formatScale(c.scale)} | ${c.icon} |`,
  )
  return ['  | id | label | scale | icon |', ...rows].join('\n')
}

/** Prompt à coller dans un LLM pour générer une config d'entraînement (D101). */
export function buildTrainingPrompt(locale: Locale): string {
  const say = <K extends TrainingPromptSection>(key: K, params: TrainingPromptParams[K]) =>
    t(TRAINING_MESSAGES, locale, key, params)
  const sections: Record<TrainingPromptSection, string> = {
    intro: say('intro', {}),
    tool: say('tool', { readmeUrl: README_RAW_URL }),
    format: say('format', {
      liteSchemaUrl: CONFIG_SCHEMA_LITE_URL,
      fullSchemaUrl: CONFIG_SCHEMA_URL,
      categoryTable: buildCategoryTable(locale),
    }),
    steps: say('steps', {}),
    calibration: say('calibration', {}),
    volume: say('volume', {}),
    writing: say('writing', { decimalExample: DECIMAL_EXAMPLE[locale] }),
    delivery: say('delivery', {}),
  }
  return TRAINING_PROMPT_SECTIONS.map((key) => sections[key]).join('\n\n')
}
