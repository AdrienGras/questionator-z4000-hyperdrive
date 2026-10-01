import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { lintGutter, setDiagnostics } from '@codemirror/lint'
import { EditorState, Prec } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  hoverTooltip,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { editorTheme } from '@/features/config-editor/editor-theme'
import {
  completionsAt,
  configJsonSchema,
  type AssistHover,
  hoverAt,
} from '@/features/config-editor/schema-assist'

export type JsonEditorApi = {
  /** Remplace tout le texte (transaction annulable). */
  setText(text: string): void
  /** Sélectionne la plage et la fait défiler dans la vue. */
  reveal(from: number, to: number): void
  getText(): string
}

export type JsonEditorDiagnostic = {
  from: number
  to: number
  severity: 'error' | 'warning'
  message: string
}

type JsonEditorProps = {
  initialText: string
  onChange: (text: string) => void
  diagnostics: readonly JsonEditorDiagnostic[]
  ariaLabel: string
  /** Libellé localisé de « Défaut », affiché dans la bulle de survol. */
  defaultLabel: string
  apiRef: Ref<JsonEditorApi>
  /** Classes du conteneur ; l'éditeur en occupe toute la hauteur. */
  className?: string
}

/**
 * Éditeur JSON CodeMirror 6, monté impérativement (pas de wrapper React). Non contrôlé : le texte
 * vit dans la vue, `initialText` n'est lu qu'au montage ; passer par `apiRef.setText` ensuite.
 * À charger paresseusement : CodeMirror doit rester hors du bundle initial.
 */
export function JsonEditor({
  initialText,
  onChange,
  diagnostics,
  ariaLabel,
  defaultLabel,
  apiRef,
  className,
}: Readonly<JsonEditorProps>) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const initialTextRef = useRef(initialText)
  const ariaLabelRef = useRef(ariaLabel)
  const defaultLabelRef = useRef(defaultLabel)
  const diagnosticsRef = useRef(diagnostics)

  useEffect(() => {
    onChangeRef.current = onChange
    diagnosticsRef.current = diagnostics
    defaultLabelRef.current = defaultLabel
  })

  useEffect(() => {
    const host = hostRef.current
    if (host === null) return undefined
    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: initialTextRef.current,
        extensions: [
          lineNumbers(),
          // Ligne du curseur marquée (texte et numéro) : c'est là que mène le clic sur une issue.
          highlightActiveLine(),
          highlightActiveLineGutter(),
          history(),
          closeBrackets(),
          indentOnInput(),
          bracketMatching(),
          json(),
          // Fichier lâché : la page remplace tout le texte. Déclaré traité ici pour que CodeMirror
          // ne l'insère pas aussi au point de dépôt ; l'événement DOM remonte quand même à React.
          Prec.highest(
            EditorView.domEventHandlers({
              drop: (event) => (event.dataTransfer?.files.length ?? 0) > 0,
            }),
          ),
          lintGutter(),
          editorTheme,
          autocompletion({ override: [configCompletionSource] }),
          hoverTooltip((editorView, pos) => {
            const hover = hoverAt(editorView.state.doc.toString(), pos, configJsonSchema())
            if (hover === undefined) return null
            return {
              pos: hover.from,
              end: hover.to,
              above: true,
              create: () => ({ dom: hoverDom(hover, defaultLabelRef.current) }),
            }
          }),
          keymap.of([
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabelRef.current }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    view.dispatch(
      setDiagnostics(view.state, toCodeMirror(diagnosticsRef.current, view.state.doc.length)),
    )
    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (view === null) return
    view.dispatch(setDiagnostics(view.state, toCodeMirror(diagnostics, view.state.doc.length)))
  }, [diagnostics])

  useImperativeHandle(apiRef, () => ({
    setText(text) {
      const view = viewRef.current
      view?.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } })
    },
    reveal(from, to) {
      const view = viewRef.current
      if (view === null) return
      const length = view.state.doc.length
      const anchor = Math.min(from, length)
      view.dispatch({
        selection: { anchor, head: Math.min(Math.max(to, anchor), length) },
        effects: EditorView.scrollIntoView(anchor, { y: 'center' }),
      })
      view.focus()
    },
    getText: () => viewRef.current?.state.doc.toString() ?? '',
  }))

  return <div ref={hostRef} className={className} />
}

/**
 * Source de complétion tirée du JSON Schema de la config. Sans appel explicite (Ctrl+Espace), la
 * liste ne s'ouvre que pendant la frappe d'un mot ou d'une clé, pas sur un espace ou une virgule.
 */
export function configCompletionSource(context: CompletionContext): CompletionResult | null {
  if (!context.explicit && context.matchBefore(/["\w-]+$/) === null) return null
  const found = completionsAt(context.state.doc.toString(), context.pos, configJsonSchema())
  if (found === undefined) return null
  return {
    from: found.from,
    to: found.to,
    options: found.options,
    validFor: /^["\w-]*$/,
  }
}

/** Contenu de la bulle de survol ; texte posé via `textContent`, jamais `innerHTML`. */
function hoverDom(hover: AssistHover, defaultLabel: string): HTMLElement {
  const dom = document.createElement('div')
  dom.className = 'cm-schema-hover'
  const description = document.createElement('p')
  description.textContent = hover.description
  dom.append(description)
  if ('default' in hover) {
    const line = document.createElement('p')
    line.append(`${defaultLabel} : `)
    const code = document.createElement('code')
    code.textContent = JSON.stringify(hover.default)
    line.append(code)
    dom.append(line)
  }
  return dom
}

/** Borne les plages au document courant : un diagnostic périmé ne doit pas faire échouer la vue. */
function toCodeMirror(diagnostics: readonly JsonEditorDiagnostic[], length: number) {
  return diagnostics.map((diagnostic) => {
    const from = Math.min(diagnostic.from, length)
    return { ...diagnostic, from, to: Math.min(Math.max(diagnostic.to, from), length) }
  })
}
