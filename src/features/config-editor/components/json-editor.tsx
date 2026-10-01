import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { json } from '@codemirror/lang-json'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { lintGutter, setDiagnostics } from '@codemirror/lint'
import { EditorState, Prec } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { editorTheme } from '@/features/config-editor/editor-theme'

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
  apiRef,
  className,
}: Readonly<JsonEditorProps>) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const initialTextRef = useRef(initialText)
  const ariaLabelRef = useRef(ariaLabel)
  const diagnosticsRef = useRef(diagnostics)

  useEffect(() => {
    onChangeRef.current = onChange
    diagnosticsRef.current = diagnostics
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
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
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

/** Borne les plages au document courant : un diagnostic périmé ne doit pas faire échouer la vue. */
function toCodeMirror(diagnostics: readonly JsonEditorDiagnostic[], length: number) {
  return diagnostics.map((diagnostic) => {
    const from = Math.min(diagnostic.from, length)
    return { ...diagnostic, from, to: Math.min(Math.max(diagnostic.to, from), length) }
  })
}
