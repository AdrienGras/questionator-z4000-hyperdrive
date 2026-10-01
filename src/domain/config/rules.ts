import { CONFIG_DEFAULTS } from './defaults'
import {
  configError,
  configWarning,
  formatPath,
  type ConfigIssue,
  type ConfigIssueParams,
  type IssuePath,
} from './issues'
import { hasAtMostThreeDecimals, MAX_SCORING_VALUE, roundToMilli } from '@/domain/scoring/milli'
import { fenceLanguages } from './code-fences'
import { isPlainLanguage } from '@/lib/markdown/languages'
import { THEME_TOKENS, type ParsedConfig } from './schema'

export type CssSupports = (property: string, value: string) => boolean

export type RuleDeps = {
  cssSupports: CssSupports
  iconNames: ReadonlySet<string>
  /**
   * Catalogue des langages de code (`code-languages.ts`, qui tire `shiki/langs`), injecté par les
   * écrans qui affichent les avertissements. Absent, `unknown_code_language` n'est pas évaluée :
   * la lecture du stockage et l'import de backup ne gardent que les erreurs (F31).
   */
  isKnownLanguage?: (language: string) => boolean
}

type IdEntry = { id: string; path: IssuePath }
type NumberEntry = { value: number; path: IssuePath }
type CssEntry = {
  property: ConfigIssueParams['invalid_css_value']['property']
  value: string
  path: IssuePath
}

/**
 * Doublons stricts, puis variantes Unicode : deux ids égaux une fois normalisés en NFC mais écrits
 * avec des caractères différents (« é » précomposé contre « e » + accent combinant) se ressemblent
 * à l'écran sans être la même clé (F35).
 */
function findDuplicates(
  entries: IdEntry[],
  code: 'duplicate_category_id' | 'duplicate_question_id',
): ConfigIssue[] {
  const firstByNormalized = new Map<string, IdEntry>()
  return entries.flatMap((entry) => {
    const { id, path } = entry
    const first = firstByNormalized.get(id.normalize('NFC'))
    if (!first) {
      firstByNormalized.set(id.normalize('NFC'), entry)
      return []
    }
    const params = { id, firstPath: formatPath(first.path) }
    return [configError(first.id === id ? code : 'unicode_variant_id', path, params)]
  })
}

/** Espace en début ou en fin d'id : invisible dans l'éditeur, mais une clé différente (F35). */
function findPaddedIds(entries: IdEntry[]): ConfigIssue[] {
  return entries
    .filter(({ id }) => id !== id.trim())
    .map(({ id, path }) => configError('padded_id', path, { id }))
}

function checkIds(config: ParsedConfig): ConfigIssue[] {
  const categories = config.categories.map((category, c) => ({
    id: category.id,
    path: ['categories', c, 'id'],
  }))
  const questions = config.categories.flatMap((category, c) =>
    category.questions.map((question, q) => ({
      id: question.id,
      path: ['categories', c, 'questions', q, 'id'],
    })),
  )
  return [
    ...findDuplicates(categories, 'duplicate_category_id'),
    ...findDuplicates(questions, 'duplicate_question_id'),
    ...findPaddedIds([...categories, ...questions]),
  ]
}

function checkScale(scale: number[], path: IssuePath): ConfigIssue[] {
  if (scale.length === 0) return [configError('empty_scale', path, {})]
  const issues: ConfigIssue[] = []
  const seen = new Set<number>()
  scale.forEach((value, index) => {
    if (value < 0) issues.push(configError('negative_scale_value', [...path, index], { value }))
    if (seen.has(value))
      issues.push(configError('duplicate_scale_value', [...path, index], { value }))
    seen.add(value)
  })
  if (Math.max(...scale) === 0) issues.push(configError('zero_max_scale', path, {}))
  return issues
}

function checkScales(config: ParsedConfig): ConfigIssue[] {
  return config.categories.flatMap((category, c) =>
    checkScale(category.scale, ['categories', c, 'scale']),
  )
}

function checkQuestionCounts(config: ParsedConfig): ConfigIssue[] {
  const issues = config.categories.flatMap((category, c) =>
    category.questions.length === 0
      ? [configError('category_without_questions', ['categories', c, 'questions'], {})]
      : [],
  )
  const total = config.categories.reduce((sum, category) => sum + category.questions.length, 0)
  const skipsEnabled = config.skips?.enabled ?? CONFIG_DEFAULTS.skips.enabled
  const maxSkips = config.skips?.maxPerStudent ?? CONFIG_DEFAULTS.skips.maxPerStudent
  const skips = skipsEnabled ? maxSkips : 0
  const required = config.scoring.questionsPerStudent + skips
  if (total < required) {
    issues.push(configError('not_enough_questions', ['categories'], { total, required, skips }))
  }
  return issues
}

function checkAbsent(config: ParsedConfig): ConfigIssue[] {
  return config.absent?.export === 'value' && config.absent.value === undefined
    ? [configError('missing_absent_value', ['absent', 'value'], {})]
    : []
}

function scoringValues(config: ParsedConfig): NumberEntry[] {
  const { scoring, absent } = config
  const step = scoring.rounding?.step
  return [
    { value: scoring.maxRawScore, path: ['scoring', 'maxRawScore'] },
    { value: scoring.finalScale, path: ['scoring', 'finalScale'] },
    ...(step == null ? [] : [{ value: step, path: ['scoring', 'rounding', 'step'] }]),
    ...(absent?.value === undefined ? [] : [{ value: absent.value, path: ['absent', 'value'] }]),
    ...config.categories.flatMap((category, c) =>
      category.scale.map((value, index) => ({ value, path: ['categories', c, 'scale', index] })),
    ),
  ]
}

function checkDecimals(config: ParsedConfig): ConfigIssue[] {
  return scoringValues(config)
    .filter(({ value }) => !hasAtMostThreeDecimals(value))
    .map(({ value, path }) => configError('too_many_decimals', path, { value }))
}

/** D44 : au-delà, le moteur de notation sortirait des entiers sûrs. */
function checkMagnitude(config: ParsedConfig): ConfigIssue[] {
  return scoringValues(config)
    .filter(({ value }) => Math.abs(value) > MAX_SCORING_VALUE)
    .map(({ value, path }) =>
      configError('scoring_value_too_large', path, { value, max: MAX_SCORING_VALUE }),
    )
}

function cssValues(config: ParsedConfig): CssEntry[] {
  const entries: CssEntry[] = []
  for (const mode of ['light', 'dark'] as const) {
    const theme = config.theme?.[mode]
    if (!theme) continue
    for (const token of THEME_TOKENS) {
      const value = theme[token]
      if (value === undefined) continue
      const property = token === 'radius' ? 'border-radius' : 'color'
      entries.push({ property, value, path: ['theme', mode, token] })
    }
  }
  config.categories.forEach((category, c) => {
    if (category.color !== undefined) {
      entries.push({ property: 'color', value: category.color, path: ['categories', c, 'color'] })
    }
  })
  return entries
}

function checkCss(config: ParsedConfig, cssSupports: CssSupports): ConfigIssue[] {
  return cssValues(config)
    .filter(({ property, value }) => !cssSupports(property, value))
    .map(({ property, value, path }) => configError('invalid_css_value', path, { property, value }))
}

function checkReachableMax(config: ParsedConfig): ConfigIssue[] {
  const scaleValues = config.categories.flatMap((category) => category.scale)
  if (scaleValues.length === 0) return []
  const { questionsPerStudent, maxRawScore } = config.scoring
  const reachable = questionsPerStudent * Math.max(...scaleValues)
  return roundToMilli(reachable) < roundToMilli(maxRawScore)
    ? [
        configWarning('unreachable_max_score', ['scoring', 'maxRawScore'], {
          reachable: roundToMilli(reachable) / 1000,
          maxRawScore,
        }),
      ]
    : []
}

function checkFinalScaleGrid(config: ParsedConfig): ConfigIssue[] {
  const { finalScale, rounding } = config.scoring
  const decimals = rounding?.decimals ?? CONFIG_DEFAULTS.rounding.decimals
  const step = rounding?.step ?? 10 ** -decimals
  const stepThousandths = roundToMilli(step)
  if (stepThousandths === 0) return []
  return roundToMilli(finalScale) % stepThousandths === 0
    ? []
    : [configError('final_scale_off_grid', ['scoring', 'finalScale'], { finalScale, step })]
}

function checkIcons(config: ParsedConfig, iconNames: ReadonlySet<string>): ConfigIssue[] {
  return config.categories.flatMap((category, c) =>
    category.icon === undefined || iconNames.has(category.icon)
      ? []
      : [configWarning('unknown_icon', ['categories', c, 'icon'], { icon: category.icon })],
  )
}

/** F18 : un avertissement par couple (question, langage), à la première occurrence (énoncé d'abord). */
function checkCodeLanguages(
  config: ParsedConfig,
  isKnownLanguage: (language: string) => boolean,
): ConfigIssue[] {
  return config.categories.flatMap((category, c) =>
    category.questions.flatMap((question, q) => {
      const seen = new Set<string>()
      return (['prompt', 'answer'] as const).flatMap((field) =>
        fenceLanguages(question[field] ?? '').flatMap((language) => {
          if (seen.has(language) || isPlainLanguage(language) || isKnownLanguage(language))
            return []
          seen.add(language)
          return [
            configWarning('unknown_code_language', ['categories', c, 'questions', q, field], {
              language,
              questionId: question.id,
            }),
          ]
        }),
      )
    }),
  )
}

/** Règles croisées de PRODUCT.md §6.2, sur une config structurellement valide (D38). */
export function checkRules(config: ParsedConfig, deps: RuleDeps): ConfigIssue[] {
  return [
    ...checkIds(config),
    ...checkScales(config),
    ...checkQuestionCounts(config),
    ...checkAbsent(config),
    ...checkDecimals(config),
    ...checkMagnitude(config),
    ...checkCss(config, deps.cssSupports),
    ...checkReachableMax(config),
    ...checkFinalScaleGrid(config),
    ...checkIcons(config, deps.iconNames),
    ...(deps.isKnownLanguage ? checkCodeLanguages(config, deps.isKnownLanguage) : []),
  ]
}
