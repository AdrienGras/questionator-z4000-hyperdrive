import { configError, type ConfigIssue } from './issues'

const BYTE_ORDER_MARK = '﻿'
const LINE_AND_COLUMN = /line (\d+) column (\d+)/
const POSITION = /position (\d+)/

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; issue: ConfigIssue }

/** Ligne et colonne (base 1) d'une erreur de `JSON.parse`, selon le message du moteur. */
export function locateJsonError(message: string, text: string): { line?: number; column?: number } {
  const lineAndColumn = LINE_AND_COLUMN.exec(message)
  if (lineAndColumn) return { line: Number(lineAndColumn[1]), column: Number(lineAndColumn[2]) }
  const position = POSITION.exec(message)
  if (!position) return {}
  const lines = text.slice(0, Number(position[1])).split('\n')
  return { line: lines.length, column: (lines.at(-1) ?? '').length + 1 }
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
