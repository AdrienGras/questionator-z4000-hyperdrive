import { z } from 'zod'
import { SUPPORTED_LOCALES } from '@/lib/i18n/i18n'
import { CONFIG_DEFAULTS } from './defaults'

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

export function nonEmptyString() {
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

/** Un jeton de thème porte une description générique, identique pour tous. */
function themeSchema(mode: 'light' | 'dark') {
  const modeLabel = mode === 'light' ? 'clair' : 'sombre'
  const shape = Object.fromEntries(
    THEME_TOKENS.map((token) => [
      token,
      CssValueSchema.optional().meta({
        description: `Variable CSS \`--${token}\` du thème ${modeLabel}.`,
      }),
    ]),
  )
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Object.fromEntries ne peut pas exprimer l'ensemble exhaustif des clés ThemeToken ; la forme est garantie par THEME_TOKENS ci-dessus.
  return z.strictObject(shape as Record<ThemeToken, z.ZodOptional<typeof CssValueSchema>>)
}

const QuestionSchema = z.strictObject({
  id: nonEmptyString().meta({
    description: 'Identifiant stable de la question, unique dans toute la config.',
  }),
  title: nonEmptyString().optional().meta({
    description:
      'Libellé court, utilisé dans le side panel et les exports ; par défaut, le début du `prompt` sans markdown.',
  }),
  tags: z.array(nonEmptyString()).optional().meta({
    description: 'Notions pédagogiques, utilisées dans les stats.',
  }),
  prompt: nonEmptyString().meta({
    description: 'Énoncé en markdown, affiché aux deux vues.',
  }),
  answer: z.string().optional().meta({
    description: 'Éléments de réponse en markdown, visibles uniquement dans la vue examinateur.',
  }),
})

const CategorySchema = z.strictObject({
  id: nonEmptyString().meta({ description: 'Identifiant stable de la catégorie.' }),
  label: nonEmptyString().meta({ description: 'Libellé affiché.' }),
  scale: z.array(z.number()).meta({
    description:
      'Valeurs attribuables, décimales autorisées ; la valeur maximale est la valeur de la catégorie (points max), affichée sur la tuile et utilisée dans les exports et les stats.',
  }),
  color: CssValueSchema.optional().meta({
    description: 'Couleur CSS de la tuile, validée par le navigateur à la création de session.',
  }),
  icon: IconSchema.optional().meta({
    description:
      "Nom d'icône Tabler en kebab-case (ex. `leaf`, `brand-php`) ; un nom inconnu n'affiche aucune icône, avec un avertissement.",
  }),
  order: z.int().optional().meta({
    description: "Ordre d'affichage ; par défaut, l'ordre du tableau.",
  }),
  questions: z.array(QuestionSchema).meta({ description: 'Questions de la catégorie.' }),
})

export const ConfigSchema = z.strictObject({
  $schema: z.string().optional().meta({
    description: "URL du JSON Schema, pour l'autocomplétion dans l'éditeur.",
  }),
  schemaVersion: z.literal(SCHEMA_VERSION).meta({
    description:
      'Version du format de config, utilisée pour la compatibilité des sessions et des backups.',
  }),
  locale: z.enum(SUPPORTED_LOCALES).optional().meta({
    description:
      "Langue de l'interface ; par défaut, la langue du navigateur si elle est supportée, sinon `fr`.",
  }),
  exam: z
    .strictObject({
      title: nonEmptyString().meta({
        description: 'Titre affiché sur la vue projetée et en tête des exports.',
      }),
      subject: z.string().optional().meta({ description: 'Matière, reprise dans les exports.' }),
      cohort: z.string().optional().meta({ description: 'Promotion, reprise dans les exports.' }),
    })
    .meta({
      description: 'Examen : titre et métadonnées reprises dans la vue projetée et les exports.',
    }),
  scoring: z
    .strictObject({
      questionsPerStudent: z.int().positive().meta({
        description: 'Nombre de questions notées par passage.',
      }),
      maxRawScore: z.number().positive().meta({ description: 'Plafond de la note brute.' }),
      finalScale: z.number().positive().meta({ description: 'Échelle de la note finale.' }),
      rounding: z
        .strictObject({
          mode: z.enum(['nearest', 'up', 'down']).optional().meta({
            description: "Sens de l'arrondi : au plus proche, au-dessus ou au-dessous.",
            default: CONFIG_DEFAULTS.rounding.mode,
          }),
          decimals: z.int().min(0).max(3).optional().meta({
            description: 'Nombre de décimales de la note finale (0 à 3).',
            default: CONFIG_DEFAULTS.rounding.decimals,
          }),
          step: z.number().positive().nullable().optional().meta({
            description: "Pas d'arrondi ; s'il est défini, il prime sur `decimals`.",
            default: CONFIG_DEFAULTS.rounding.step,
          }),
        })
        .optional()
        .meta({ description: 'Arrondi de la note finale ; tous ses champs sont optionnels.' }),
    })
    .meta({
      description:
        'Notation : nombre de questions, plafond de la note brute, échelle finale et arrondi.',
    }),
  absent: z
    .strictObject({
      export: z.enum(['label', 'zero', 'value']).optional().meta({
        description: "Ce que l'export met en note pour un absent : le libellé, zéro ou une valeur.",
        default: CONFIG_DEFAULTS.absent.export,
      }),
      label: z.string().optional().meta({
        description: 'Texte exporté pour un absent quand `export` vaut `label`.',
        default: CONFIG_DEFAULTS.absent.label,
      }),
      value: z.number().optional().meta({
        description: 'Note attribuée aux absents ; requise quand `export` vaut `value`.',
      }),
    })
    .optional()
    .meta({
      description: 'Note exportée pour un étudiant absent ; tous ses champs sont optionnels.',
    }),
  skips: z
    .strictObject({
      enabled: z.boolean().optional().meta({
        description: "Autorise l'examinateur à passer une question.",
        default: CONFIG_DEFAULTS.skips.enabled,
      }),
      maxPerStudent: z.int().min(0).optional().meta({
        description: 'Nombre maximal de questions passées par étudiant.',
        default: CONFIG_DEFAULTS.skips.maxPerStudent,
      }),
      reasons: z.array(nonEmptyString()).optional().meta({
        description: 'Motifs proposés dans la boîte de skip.',
      }),
      allowFreeText: z.boolean().optional().meta({
        description: 'Autorise un motif libre.',
        default: CONFIG_DEFAULTS.skips.allowFreeText,
      }),
    })
    .optional()
    .meta({ description: 'Questions passées (skips) ; tous ses champs sont optionnels.' }),
  presentation: z
    .strictObject({
      showCumulativeScore: z.boolean().optional().meta({
        description: 'Affiche le score cumulé sur la vue projetée après chaque question.',
        default: CONFIG_DEFAULTS.presentation.showCumulativeScore,
      }),
      finalScoreDisplay: z.enum(['raw', 'converted', 'both']).optional().meta({
        description: "Note affichée sur l'écran final : brute, convertie ou les deux.",
        default: CONFIG_DEFAULTS.presentation.finalScoreDisplay,
      }),
      showStatsOnFinal: z.boolean().optional().meta({
        description: "Affiche le détail du passage sur l'écran final projeté.",
        default: CONFIG_DEFAULTS.presentation.showStatsOnFinal,
      }),
      drawAnimation: z.boolean().optional().meta({
        description: "Active l'animation lors du tirage.",
        default: CONFIG_DEFAULTS.presentation.drawAnimation,
      }),
      defaultColorMode: z.enum(['light', 'dark', 'system']).optional().meta({
        description:
          "Mode d'affichage clair, sombre ou celui du système à l'ouverture de la session.",
        default: CONFIG_DEFAULTS.presentation.defaultColorMode,
      }),
      showCategoryPoints: z.boolean().optional().meta({
        description: 'Affiche le maximum de points de chaque catégorie sur la vue projetée.',
        default: CONFIG_DEFAULTS.presentation.showCategoryPoints,
      }),
    })
    .optional()
    .meta({
      description: 'Affichage de la vue projetée ; tous ses champs sont optionnels.',
    }),
  theme: z
    .strictObject({
      light: themeSchema('light').optional().meta({ description: 'Variables CSS du thème clair.' }),
      dark: themeSchema('dark').optional().meta({ description: 'Variables CSS du thème sombre.' }),
    })
    .optional()
    .meta({
      description: "Surcharge des variables CSS de l'interface, par mode clair et sombre.",
    }),
  categories: z.array(CategorySchema).meta({
    description: 'Catégories de difficulté proposées au tirage.',
  }),
})

export type ParsedConfig = z.infer<typeof ConfigSchema>
export type ParsedCategory = ParsedConfig['categories'][number]
export type ParsedQuestion = ParsedCategory['questions'][number]
