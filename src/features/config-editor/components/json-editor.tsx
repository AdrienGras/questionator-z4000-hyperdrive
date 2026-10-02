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
import { Compartment, EditorState, Prec, type Extension } from '@codemirror/state'
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
import { completionsAt, configJsonSchema, hoverAt } from '@/features/config-editor/schema-assist'
import { hoverDom, type HoverLabels } from './hover-dom'

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
  /** Libellé localisé de « Défaut : » (ponctuation comprise), affiché dans la bulle de survol. */
  /** Libellés traduits de la bulle de survol. */
  hoverLabels: HoverLabels
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
  hoverLabels,
  apiRef,
  className,
}: Readonly<JsonEditorProps>) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const initialTextRef = useRef(initialText)
  // Libellé appliqué à la vue : le compartiment n'est reconfiguré que s'il change.
  const ariaLabelRef = useRef(ariaLabel)
  const ariaCompartment = useRef(new Compartment())
  const hoverLabelsRef = useRef(hoverLabels)

  useEffect(() => {
    onChangeRef.current = onChange
    hoverLabelsRef.current = hoverLabels
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
              create: () => ({ dom: hoverDom(hover, hoverLabelsRef.current) }),
            }
          }),
          keymap.of([
            ...closeBracketsKeymap,
            ...completionKeymap,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          ariaCompartment.current.of(ariaLabelExtension(ariaLabelRef.current)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString())
          }),
        ],
      }),
    })
    viewRef.current = view
    // Pas de diagnostics ici : l'effet suivant, exécuté juste après au montage, les envoie.
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

  useEffect(() => {
    const view = viewRef.current
    if (view === null || ariaLabelRef.current === ariaLabel) return
    ariaLabelRef.current = ariaLabel
    view.dispatch({ effects: ariaCompartment.current.reconfigure(ariaLabelExtension(ariaLabel)) })
  }, [ariaLabel])

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

function ariaLabelExtension(label: string): Extension {
  return EditorView.contentAttributes.of({ 'aria-label': label })
}

/**
 * Source de complétion tirée du JSON Schema de la config. Sans appel explicite (Ctrl+Espace), la
 * liste ne s'ouvre que pendant la frappe d'un mot ou d'une clé, pas sur un espace ou une virgule.
 */
export function configCompletionSource(context: CompletionContext): CompletionResult | null {
  const previous = context.state.sliceDoc(context.pos - 1, context.pos)
  if (!context.explicit && !/["\w-]/.test(previous)) return null
  const found = completionsAt(context.state.doc.toString(), context.pos, configJsonSchema())
  if (found === undefined) return null
  return {
    from: found.from,
    to: found.to,
    options: found.options,
    validFor: /^["\w-]*$/,
  }
}

/** Borne les plages au document courant : un diagnostic périmé ne doit pas faire échouer la vue. */
function toCodeMirror(diagnostics: readonly JsonEditorDiagnostic[], length: number) {
  return diagnostics.map((diagnostic) => {
    const from = Math.min(diagnostic.from, length)
    return { ...diagnostic, from, to: Math.min(Math.max(diagnostic.to, from), length) }
  })
}
