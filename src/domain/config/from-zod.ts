import type { z } from 'zod'
import { configError, type ConfigIssue, type IssuePath } from './issues'

type ZodIssue = z.core.$ZodIssue

function toIssuePath(path: readonly PropertyKey[]): IssuePath {
  return path.filter((segment): segment is string | number => typeof segment !== 'symbol')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function valueAt(root: unknown, path: IssuePath): unknown {
  let current: unknown = root
  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[String(segment)]
  }
  return current
}

/**
 * Champs `z.int()` du schéma (`schema.ts`) pour lesquels Zod 4.6.5 ne peut pas signaler
 * `expected: 'int'` face à une valeur d'un tout autre type (chaîne, booléen, null…) : la
 * vérification de base y rapporte `expected: 'number'`, faute de plus de précision — `'int'`
 * n'apparaît que lorsque la valeur est déjà un nombre (cas `not_integer`). Vérifié en bac à sable.
 */
const INTEGER_FIELDS = new Set(['questionsPerStudent', 'order', 'decimals', 'maxPerStudent'])

function fromInvalidType(expected: string, path: IssuePath, input: unknown): ConfigIssue {
  const value = valueAt(input, path)
  if (value === undefined) return configError('required', path, {})
  const lastSegment = path.at(-1)
  const isIntegerField =
    expected === 'int' ||
    (expected === 'number' && typeof lastSegment === 'string' && INTEGER_FIELDS.has(lastSegment))
  if (!isIntegerField) return configError('invalid_type', path, { expected })
  return typeof value === 'number'
    ? configError('not_integer', path, {})
    : configError('invalid_type', path, { expected: 'integer' })
}

function fromCustom(params: Record<string, unknown> | undefined, path: IssuePath): ConfigIssue {
  const code = params?.code
  if (code === 'empty_string' || code === 'invalid_css_shape') return configError(code, path, {})
  return configError('invalid_value', path, {})
}

function fromZodIssue(issue: ZodIssue, input: unknown): ConfigIssue[] {
  const path = toIssuePath(issue.path)
  switch (issue.code) {
    case 'unrecognized_keys':
      return issue.keys.map((key) => configError('unknown_key', [...path, key], { key }))
    case 'invalid_type':
      return [fromInvalidType(issue.expected, path, input)]
    case 'invalid_value':
      if (valueAt(input, path) === undefined) return [configError('required', path, {})]
      return [
        configError('invalid_enum', path, {
          options: issue.values
            .map((value) => (typeof value === 'bigint' ? String(value) : JSON.stringify(value)))
            .join(', '),
        }),
      ]
    case 'too_small':
      return [
        configError('too_small', path, {
          minimum: Number(issue.minimum),
          inclusive: issue.inclusive ?? true,
        }),
      ]
    case 'too_big':
      return [
        configError('too_big', path, {
          maximum: Number(issue.maximum),
          inclusive: issue.inclusive ?? true,
        }),
      ]
    case 'custom':
      return [fromCustom(issue.params, path)]
    default:
      return [configError('invalid_value', path, {})]
  }
}

/** Convertit les issues Zod en codes propres ; `input` sert à distinguer un champ absent. */
export function fromZodIssues(issues: readonly ZodIssue[], input: unknown): ConfigIssue[] {
  return issues.flatMap((issue) => fromZodIssue(issue, input))
}
