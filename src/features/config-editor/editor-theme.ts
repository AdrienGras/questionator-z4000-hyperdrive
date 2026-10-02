import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/**
 * Habillage de l'éditeur JSON (F26) : les couleurs viennent des variables CSS du thème de
 * l'application (jetons shadcn `--background`, `--border`… et les cinq `--cm-*` de `index.css`),
 * pas du thème de la config éditée ; le mode sombre s'applique donc sans reconfigurer l'éditeur.
 */
export const editorChrome = EditorView.theme({
  '&': {
    height: '100%',
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
    borderRadius: 'var(--radius)',
  },
  // Le thème par défaut de l'autocomplétion (bleu/blanc, préfixé `&light` / `&dark`, donc une
  // classe de plus) l'emporterait sur une règle simple : on surcharge en spécificité.
  '.cm-tooltip.cm-tooltip-autocomplete ul[role=listbox] li[role=option][aria-selected]': {
    background: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
  '.cm-completionInfo, .cm-schema-hover': {
    maxWidth: '28rem',
    padding: '0.5rem 0.75rem',
  },
  '.cm-schema-hover p + p': { marginTop: '0.25rem' },
  '.cm-schema-hover a': { textDecoration: 'underline', textUnderlineOffset: '2px' },
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
