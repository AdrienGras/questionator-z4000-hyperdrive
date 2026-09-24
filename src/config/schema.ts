import { z } from 'zod'
import { SUPPORTED_LOCALES } from '../i18n'

export const SCHEMA_VERSION = 1

/** Variables CSS surchargeables : exactement celles du bloc :root de src/index.css (shadcn v4 Nova). */
export const THEME_TOKENS = [
  'radius',
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const

export type ThemeToken = (typeof THEME_TOKENS)[number]

const FORBIDDEN_CSS_CHARACTERS = /[;{}<]/

function nonEmptyString() {
  return z.string().refine((value) => value.trim().length > 0, {
    params: { code: 'empty_string' },
  })
}

/** Forme seulement (D15) : la validité réelle est vérifiée par `cssSupports` dans les règles. */
export const CssValueSchema = z
  .string()
  .refine((value) => value.trim().length > 0 && !FORBIDDEN_CSS_CHARACTERS.test(value), {
    params: { code: 'invalid_css_shape' },
  })

/** Nom d'icône Tabler ; un nom inconnu est un avertissement (règles), pas une erreur. */
export const IconSchema = z.string()

const ThemeSchema = z.strictObject(
  THEME_TOKENS.reduce<Record<string, z.ZodOptional<typeof CssValueSchema>>>((shape, token) => {
    shape[token] = CssValueSchema.optional()
    return shape
  }, {}),
)

const QuestionSchema = z.strictObject({
  id: nonEmptyString(),
  title: nonEmptyString().optional(),
  tags: z.array(nonEmptyString()).optional(),
  prompt: nonEmptyString(),
  answer: z.string().optional(),
})

const CategorySchema = z.strictObject({
  id: nonEmptyString(),
  label: nonEmptyString(),
  scale: z.array(z.number()),
  color: CssValueSchema.optional(),
  icon: IconSchema.optional(),
  order: z.int().optional(),
  questions: z.array(QuestionSchema),
})

export const ConfigSchema = z.strictObject({
  $schema: z.string().optional(),
  schemaVersion: z.literal(SCHEMA_VERSION),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  exam: z.strictObject({
    title: nonEmptyString(),
    subject: z.string().optional(),
    cohort: z.string().optional(),
  }),
  scoring: z.strictObject({
    questionsPerStudent: z.int().positive(),
    maxRawScore: z.number().positive(),
    finalScale: z.number().positive(),
    rounding: z
      .strictObject({
        mode: z.enum(['nearest', 'up', 'down']).optional(),
        decimals: z.int().min(0).max(3).optional(),
        step: z.number().positive().nullable().optional(),
      })
      .optional(),
  }),
  absent: z
    .strictObject({
      export: z.enum(['label', 'zero', 'value']).optional(),
      label: z.string().optional(),
      value: z.number().optional(),
    })
    .optional(),
  skips: z
    .strictObject({
      enabled: z.boolean().optional(),
      maxPerStudent: z.int().min(0).optional(),
      reasons: z.array(nonEmptyString()).optional(),
      allowFreeText: z.boolean().optional(),
    })
    .optional(),
  presentation: z
    .strictObject({
      showCumulativeScore: z.boolean().optional(),
      finalScoreDisplay: z.enum(['raw', 'converted', 'both']).optional(),
      showStatsOnFinal: z.boolean().optional(),
      drawAnimation: z.boolean().optional(),
      defaultColorMode: z.enum(['light', 'dark', 'system']).optional(),
    })
    .optional(),
  theme: z
    .strictObject({
      light: ThemeSchema.optional(),
      dark: ThemeSchema.optional(),
    })
    .optional(),
  categories: z.array(CategorySchema),
})

export type ParsedConfig = z.infer<typeof ConfigSchema>
export type ParsedCategory = ParsedConfig['categories'][number]
export type ParsedQuestion = ParsedCategory['questions'][number]
