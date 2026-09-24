import { t, type Dictionary, type Locale } from '../i18n'
import type { ConfigIssue, ConfigIssueParams } from './issues'

const TYPE_NAMES: Record<Locale, Record<string, string>> = {
  fr: {
    string: 'une chaîne de caractères',
    number: 'un nombre',
    integer: 'un nombre entier',
    boolean: 'un booléen (true ou false)',
    object: 'un objet',
    array: 'un tableau',
    null: 'null',
  },
  en: {
    string: 'a string',
    number: 'a number',
    integer: 'an integer',
    boolean: 'a boolean (true or false)',
    object: 'an object',
    array: 'an array',
    null: 'null',
  },
}

const typeName = (locale: Locale, expected: string) => TYPE_NAMES[locale][expected] ?? expected

const fr: Dictionary<ConfigIssueParams> = {
  json_syntax: ({ line, column }) =>
    line === undefined
      ? 'Le fichier n’est pas un JSON valide.'
      : `Le fichier n’est pas un JSON valide (ligne ${line}, colonne ${column ?? '?'}).`,
  unsupported_schema_version: ({ found, supported }) =>
    `Cette configuration utilise la version ${found} du format, mais l’application ne connaît que la version ${supported}. Rechargez la page pour mettre l’application à jour.`,
  required: () => 'Champ obligatoire manquant.',
  invalid_type: ({ expected }) => `Type invalide : ${typeName('fr', expected)} est attendu.`,
  unknown_key: ({ key }) => `Clé inconnue « ${key} » : vérifiez l’orthographe du nom de champ.`,
  invalid_enum: ({ options }) => `Valeur non autorisée. Valeurs possibles : ${options}.`,
  not_integer: () => 'Un nombre entier est attendu.',
  too_small: ({ minimum, inclusive }) =>
    inclusive
      ? `La valeur doit être supérieure ou égale à ${minimum}.`
      : `La valeur doit être strictement supérieure à ${minimum}.`,
  too_big: ({ maximum, inclusive }) =>
    inclusive
      ? `La valeur doit être inférieure ou égale à ${maximum}.`
      : `La valeur doit être strictement inférieure à ${maximum}.`,
  empty_string: () => 'Ce champ ne peut pas être vide.',
  invalid_css_shape: () =>
    'Valeur CSS invalide : elle ne doit pas être vide ni contenir « ; », « { », « } » ou « < ».',
  invalid_value: () => 'Valeur invalide.',
  duplicate_category_id: ({ id, firstPath }) =>
    `L’identifiant de catégorie « ${id} » est déjà utilisé (${firstPath}).`,
  duplicate_question_id: ({ id, firstPath }) =>
    `L’identifiant de question « ${id} » est déjà utilisé (${firstPath}) : il doit être unique dans toute la configuration.`,
  empty_scale: () => 'Le barème est vide : indiquez au moins une valeur attribuable.',
  negative_scale_value: ({ value }) => `Le barème contient une valeur négative (${value}).`,
  duplicate_scale_value: ({ value }) =>
    `La valeur ${value} apparaît plusieurs fois dans le barème.`,
  zero_max_scale: () =>
    'La valeur maximale du barème est 0 : la catégorie ne rapporterait aucun point.',
  category_without_questions: () => 'Cette catégorie ne contient aucune question.',
  not_enough_questions: ({ total, required }) =>
    `La configuration contient ${total} question(s), il en faut au moins ${required} (questions par étudiant + skips autorisés).`,
  missing_absent_value: () =>
    '« absent.value » est obligatoire quand « absent.export » vaut "value".',
  too_many_decimals: ({ value }) =>
    `${value} a plus de 3 décimales : les notes sont calculées au millième.`,
  invalid_css_value: ({ property, value }) =>
    property === 'color'
      ? `« ${value} » n’est pas une couleur CSS reconnue par ce navigateur.`
      : `« ${value} » n’est pas une valeur de border-radius reconnue par ce navigateur.`,
  unreachable_max_score: ({ reachable, maxRawScore }) =>
    `Note maximale inatteignable : ${reachable} point(s) au mieux, pour une note brute plafonnée à ${maxRawScore}.`,
  final_scale_off_grid: ({ finalScale, step }) =>
    `L’échelle finale (${finalScale}) n’est pas un multiple du pas d’arrondi (${step}) : la note maximale sera hors grille.`,
  unknown_icon: ({ icon }) => `Icône inconnue « ${icon} » : la catégorie s’affichera sans icône.`,
}

const en: Dictionary<ConfigIssueParams> = {
  json_syntax: ({ line, column }) =>
    line === undefined
      ? 'The file is not valid JSON.'
      : `The file is not valid JSON (line ${line}, column ${column ?? '?'}).`,
  unsupported_schema_version: ({ found, supported }) =>
    `This configuration uses format version ${found}, but the application only knows version ${supported}. Reload the page to update the application.`,
  required: () => 'Required field is missing.',
  invalid_type: ({ expected }) => `Invalid type: ${typeName('en', expected)} is required.`,
  unknown_key: ({ key }) => `Unknown key "${key}": check the spelling of the field name.`,
  invalid_enum: ({ options }) => `Value not allowed. Allowed values: ${options}.`,
  not_integer: () => 'A whole number is required.',
  too_small: ({ minimum, inclusive }) =>
    inclusive
      ? `The value must be greater than or equal to ${minimum}.`
      : `The value must be greater than ${minimum}.`,
  too_big: ({ maximum, inclusive }) =>
    inclusive
      ? `The value must be less than or equal to ${maximum}.`
      : `The value must be less than ${maximum}.`,
  empty_string: () => 'This field cannot be empty.',
  invalid_css_shape: () =>
    'Invalid CSS value: it must not be empty or contain ";", "{", "}" or "<".',
  invalid_value: () => 'Invalid value.',
  duplicate_category_id: ({ id, firstPath }) =>
    `Category id "${id}" is already used (${firstPath}).`,
  duplicate_question_id: ({ id, firstPath }) =>
    `Question id "${id}" is already used (${firstPath}): it must be unique across the whole configuration.`,
  empty_scale: () => 'The scale is empty: list at least one value that can be awarded.',
  negative_scale_value: ({ value }) => `The scale contains a negative value (${value}).`,
  duplicate_scale_value: ({ value }) => `The value ${value} appears more than once in the scale.`,
  zero_max_scale: () => 'The highest value of the scale is 0: the category would award no points.',
  category_without_questions: () => 'This category has no questions.',
  not_enough_questions: ({ total, required }) =>
    `The configuration has ${total} question(s); at least ${required} are needed (questions per student + allowed skips).`,
  missing_absent_value: () => '"absent.value" is required when "absent.export" is "value".',
  too_many_decimals: ({ value }) =>
    `${value} has more than 3 decimal places: scores are computed to the thousandth.`,
  invalid_css_value: ({ property, value }) =>
    property === 'color'
      ? `"${value}" is not a CSS color this browser recognises.`
      : `"${value}" is not a border-radius value this browser recognises.`,
  unreachable_max_score: ({ reachable, maxRawScore }) =>
    `The maximum score cannot be reached: ${reachable} point(s) at best, for a raw score capped at ${maxRawScore}.`,
  final_scale_off_grid: ({ finalScale, step }) =>
    `The final scale (${finalScale}) is not a multiple of the rounding step (${step}): the top score will fall off the grid.`,
  unknown_icon: ({ icon }) => `Unknown icon "${icon}": the category will be shown without an icon.`,
}

export const CONFIG_ISSUE_MESSAGES: Record<Locale, Dictionary<ConfigIssueParams>> = { fr, en }

export function formatConfigIssue(issue: ConfigIssue, locale: Locale): string {
  return t(CONFIG_ISSUE_MESSAGES, locale, issue.code, issue.params)
}
