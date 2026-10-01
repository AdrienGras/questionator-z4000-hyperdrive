import { findNodeAtLocation, parseTree, type Node, type ParseError } from 'jsonc-parser'
import type { ConfigIssue } from '@/domain/config/issues'

export type TextRange = { from: number; to: number }

function rangeOf(node: Node): TextRange {
  return { from: node.offset, to: node.offset + node.length }
}

/** Décalage d'une position ligne / colonne (base 1), borné au texte. */
function offsetOfLineColumn(text: string, line: number, column: number): number {
  let offset = 0
  for (let current = 1; current < line; current++) {
    const next = text.indexOf('\n', offset)
    if (next === -1) return text.length
    offset = next + 1
  }
  return Math.min(offset + Math.max(column - 1, 0), text.length)
}

function locateSyntaxIssue(text: string, params: { line?: number; column?: number }): TextRange {
  if (params.line === undefined) return { from: 0, to: 0 }
  const from = offsetOfLineColumn(text, params.line, params.column ?? 1)
  return { from, to: Math.min(from + 1, text.length) }
}

/** Plage du texte que souligne une issue : la valeur visée, sinon son plus proche ancêtre. */
export function locateIssue(text: string, issue: ConfigIssue): TextRange {
  if (issue.code === 'json_syntax') return locateSyntaxIssue(text, issue.params)

  const errors: ParseError[] = []
  const root = parseTree(text, errors, { allowTrailingComma: false, disallowComments: true })
  if (!root) return { from: 0, to: 0 }

  const path = [...issue.path]
  while (path.length > 0) {
    const node = findNodeAtLocation(root, path)
    if (node) {
      const isUnknownKey = issue.code === 'unknown_key' && path.length === issue.path.length
      return rangeOf(isUnknownKey && node.parent?.type === 'property' ? node.parent : node)
    }
    path.pop()
  }
  return rangeOf(root)
}
