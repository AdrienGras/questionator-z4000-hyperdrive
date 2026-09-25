import { parse, type ParseError } from 'jsonc-parser'
import { configError, type ConfigIssue } from './issues'

const BYTE_ORDER_MARK = '﻿'
/** Libellés des moteurs, ancrés en fin de message : le message peut citer un extrait du source. */
const V8_POSITION = / in JSON at position (\d+)(?: \(line (\d+) column (\d+)\))?$/
const FIREFOX_LINE_AND_COLUMN = /at line (\d+) column (\d+) of the JSON data$/

type JsonErrorLocation = { line?: number; column?: number }

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; issue: ConfigIssue }

/** Ligne et colonne (base 1) d'un décalage dans le texte. */
function locateOffset(text: string, offset: number): JsonErrorLocation {
  const lines = text.slice(0, offset).split('\n')
  return { line: lines.length, column: (lines.at(-1) ?? '').length + 1 }
}

/** Localisation d'après le seul message du moteur (repli) ; rien d'inventé sans position. */
export function locateFromEngineMessage(message: string, text: string): JsonErrorLocation {
  const firefox = FIREFOX_LINE_AND_COLUMN.exec(message)
  if (firefox) return { line: Number(firefox[1]), column: Number(firefox[2]) }
  const v8 = V8_POSITION.exec(message)
  if (!v8) return {}
  if (v8[2] !== undefined && v8[3] !== undefined) {
    return { line: Number(v8[2]), column: Number(v8[3]) }
  }
  return locateOffset(text, Number(v8[1]))
}

/**
 * Ligne et colonne (base 1) de la première erreur de syntaxe. V8 ne donne aucune position pour
 * « Unexpected token » (virgule finale, valeur manquante…) : jsonc-parser, en mode JSON strict,
 * sert uniquement à localiser ; `JSON.parse` reste seul juge de la validité.
 */
export function locateJsonError(message: string, text: string): JsonErrorLocation {
  const errors: ParseError[] = []
  parse(text, errors, {
    allowTrailingComma: false,
    disallowComments: true,
    allowEmptyContent: false,
  })
  const first = errors[0]
  return first ? locateOffset(text, first.offset) : locateFromEngineMessage(message, text)
}

export function parseJson(text: string): JsonParseResult {
  const source = text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text
  try {
    return { ok: true, value: JSON.parse(source) as unknown }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    return { ok: false, issue: configError('json_syntax', [], locateJsonError(message, source)) }
  }
}
