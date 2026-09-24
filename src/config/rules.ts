import { CONFIG_DEFAULTS } from './defaults'
import {
  configError,
  configWarning,
  formatPath,
  type ConfigIssue,
  type ConfigIssueParams,
  type IssuePath,
} from './issues'
import { THEME_TOKENS, type ParsedConfig } from './schema'

export type CssSupports = (property: string, value: string) => boolean

export type RuleDeps = { cssSupports: CssSupports; iconNames: ReadonlySet<string> }

type IdEntry = { id: string; path: IssuePath }
type NumberEntry = { value: number; path: IssuePath }
type CssEntry = {
  property: ConfigIssueParams['invalid_css_value']['property']
  value: string
  path: IssuePath
}

/** Les notes sont calculées au millième (D01) : on compare en millièmes entiers. */
const toThousandths = (value: number) => Math.round(value * 1000)
const hasAtMostThreeDecimals = (value: number) => toThousandths(value) / 1000 === value

function findDuplicates(
  entries: IdEntry[],
  code: 'duplicate_category_id' | 'duplicate_question_id',
): ConfigIssue[] {
  const firstPaths = new Map<string, IssuePath>()
  return entries.flatMap(({ id, path }) => {
    const firstPath = firstPaths.get(id)
    if (firstPath) return [configError(code, path, { id, firstPath: formatPath(firstPath) })]
    firstPaths.set(id, path)
    return []
  })
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
  const required = config.scoring.questionsPerStudent + (skipsEnabled ? maxSkips : 0)
  if (total < required) {
    issues.push(configError('not_enough_questions', ['categories'], { total, required }))
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
  return toThousandths(reachable) < toThousandths(maxRawScore)
    ? [
        configWarning('unreachable_max_score', ['scoring', 'maxRawScore'], {
          reachable,
          maxRawScore,
        }),
      ]
    : []
}

function checkFinalScaleGrid(config: ParsedConfig): ConfigIssue[] {
  const { finalScale, rounding } = config.scoring
  const decimals = rounding?.decimals ?? CONFIG_DEFAULTS.rounding.decimals
  const step = rounding?.step ?? 10 ** -decimals
  const stepThousandths = toThousandths(step)
  if (stepThousandths === 0) return []
  return toThousandths(finalScale) % stepThousandths === 0
    ? []
    : [configWarning('final_scale_off_grid', ['scoring', 'finalScale'], { finalScale, step })]
}

function checkIcons(config: ParsedConfig, iconNames: ReadonlySet<string>): ConfigIssue[] {
  return config.categories.flatMap((category, c) =>
    category.icon === undefined || iconNames.has(category.icon)
      ? []
      : [configWarning('unknown_icon', ['categories', c, 'icon'], { icon: category.icon })],
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
    ...checkCss(config, deps.cssSupports),
    ...checkReachableMax(config),
    ...checkFinalScaleGrid(config),
    ...checkIcons(config, deps.iconNames),
  ]
}
