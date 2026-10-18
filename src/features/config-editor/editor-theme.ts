import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

/**
 * Habillage de l'éditeur JSON (F26, artboard `editeur-config`) : les couleurs viennent des
 * variables CSS du thème de l'application (jetons `--background`, `--input`… et les cinq `--cm-*`
 * de `index.css`), pas du thème de la config éditée. Sans bordure ni rayon : la frame de la page
 * les porte.
 */
export const editorChrome = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--foreground)',
    backgroundColor: 'var(--background)',
    fontSize: '13px',
  },
  // Contour dans la frame, qui coupe tout débord (`overflow-hidden`).
  '&.cm-focused': { outline: '2px solid var(--ring)', outlineOffset: '-2px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)', lineHeight: '20px' },
  '.cm-content': { caretColor: 'var(--foreground)', padding: '12px 0' },
  '.cm-cursor': { borderLeftColor: 'var(--foreground)' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--input)',
    border: 'none',
  },
  '.cm-lineNumbers .cm-gutterElement': { textAlign: 'right', padding: '0 12px 0 8px' },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in oklch, var(--muted-foreground) 8%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in oklch, var(--muted-foreground) 8%, transparent)',
    color: 'var(--foreground)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in oklab, var(--ring) 30%, transparent)',
  },
  // Marqueurs de `lintGutter` : pastille de 8 px à la place de l'icône par défaut.
  '.cm-gutter-lint .cm-gutterElement': { padding: '6px 4px 0' },
  '.cm-lint-marker': { width: '8px', height: '8px', borderRadius: '999px' },
  '.cm-lint-marker-error': { content: 'none', backgroundColor: 'var(--destructive)' },
  '.cm-lint-marker-warning': { content: 'none', backgroundColor: 'var(--color-space-editor)' },
  // Soulignement ondulé de la valeur visée, à la place de l'image de fond par défaut.
  '.cm-lintRange-error, .cm-lintRange-warning': {
    backgroundImage: 'none',
    textDecorationLine: 'underline',
    textDecorationStyle: 'wavy',
    textUnderlineOffset: '3px',
  },
  '.cm-lintRange-error': { textDecorationColor: 'var(--destructive)' },
  '.cm-lintRange-warning': { textDecorationColor: 'var(--muted-foreground)' },
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
