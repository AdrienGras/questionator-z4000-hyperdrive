import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/**
 * Habillage de l'éditeur JSON (F26) : les couleurs viennent des variables CSS du thème de la
 * config (`--background`, `--border`…) et des cinq `--cm-*` de `index.css`, donc le mode sombre
 * s'applique sans reconfigurer l'éditeur.
 */
export const editorChrome = EditorView.theme({
  '&': {
    color: 'var(--foreground)',
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: '0.875rem',
  },
  '&.cm-focused': { outline: '2px solid var(--ring)', outlineOffset: '1px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', lineHeight: '1.5' },
  '.cm-content': { caretColor: 'var(--foreground)' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-gutters': {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    border: 'none',
    borderRight: '1px solid var(--border)',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--muted) 50%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--muted)', color: 'var(--foreground)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in oklab, var(--ring) 30%, transparent)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--popover, var(--background))',
    color: 'var(--popover-foreground, var(--foreground))',
    border: '1px solid var(--border)',
  },
})

export const highlightStyle = HighlightStyle.define([
  { tag: tags.string, color: 'var(--cm-string)' },
  { tag: tags.number, color: 'var(--cm-number)' },
  { tag: [tags.bool, tags.null, tags.keyword], color: 'var(--cm-keyword)' },
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: 'var(--cm-property)' },
  {
    tag: [tags.punctuation, tags.separator, tags.bracket, tags.squareBracket, tags.brace],
    color: 'var(--cm-punctuation)',
  },
])

export const editorTheme = [editorChrome, syntaxHighlighting(highlightStyle)]
