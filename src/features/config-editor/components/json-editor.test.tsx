import { CompletionContext } from '@codemirror/autocomplete'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { act, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

const HOVER_LABELS = {
  default: 'Défaut :',
  values: 'Valeurs possibles :',
  iconSearch: 'Rechercher une icône sur tabler.io',
  iconHint: 'Ctrl+Espace propose les noms connus.',
}
import { configCompletionSource, JsonEditor, type JsonEditorApi } from './json-editor'

type Props = Parameters<typeof JsonEditor>[0]

function mount(overrides: Partial<Props> = {}) {
  const apiRef = createRef<JsonEditorApi>()
  const onChange = vi.fn<(text: string) => void>()
  const view = render(
    <JsonEditor
      initialText={'{"a":1}'}
      onChange={onChange}
      diagnostics={[]}
      ariaLabel="Configuration JSON"
      hoverLabels={HOVER_LABELS}
      apiRef={apiRef}
      {...overrides}
    />,
  )
  return { apiRef, onChange, ...view }
}

function classCount(selector: string) {
  return selector.split(/[.[]/).length - 1
}

describe('JsonEditor', () => {
  it('affiche le texte initial dans une zone de texte nommée', () => {
    const { container } = mount()
    expect(container.querySelector('.cm-content')?.textContent).toContain('"a"')
    expect(screen.getByRole('textbox', { name: 'Configuration JSON' })).toBeTruthy()
  })

  it('setText remplace le texte, notifie onChange et reste annulable', () => {
    const { apiRef, onChange, container } = mount()
    act(() => apiRef.current?.setText('{}'))
    expect(apiRef.current?.getText()).toBe('{}')
    expect(onChange).toHaveBeenCalledWith('{}')
    const content = container.querySelector<HTMLElement>('.cm-content')!
    act(() => {
      content.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true }),
      )
    })
    expect(apiRef.current?.getText()).toBe('{"a":1}')
  })

  it('souligne la plage d’une erreur de diagnostic', () => {
    const { container } = mount({
      diagnostics: [{ from: 1, to: 4, severity: 'error', message: 'Clé inconnue' }],
    })
    expect(container.querySelector('.cm-lintRange-error')).not.toBeNull()
  })

  it('reveal place le curseur et marque la ligne active, numéro compris', () => {
    const { apiRef, container } = mount({ initialText: '{\n  "a": 1,\n  "b": 2\n}' })
    act(() => apiRef.current?.reveal(15, 18))
    expect(container.querySelector('.cm-activeLine')?.textContent).toBe('  "b": 2')
    expect(container.querySelector('.cm-lineNumbers .cm-activeLineGutter')?.textContent).toBe('3')
  })

  it('reveal sélectionne la plage, borne au document et donne le focus', () => {
    const { apiRef, container } = mount({ initialText: '{\n  "a": 1\n}' })
    const view = EditorView.findFromDOM(container.querySelector<HTMLElement>('.cm-editor')!)!

    act(() => apiRef.current?.reveal(4, 7))
    expect(view.state.selection.main).toMatchObject({ anchor: 4, head: 7 })
    expect(view.hasFocus).toBe(true)

    // Plage périmée (texte raccourci depuis la validation) : bornée, sans exception.
    act(() => apiRef.current?.reveal(50, 60))
    expect(view.state.selection.main).toMatchObject({ anchor: 12, head: 12 })
    // Fin avant le début : sélection vide au début.
    act(() => apiRef.current?.reveal(5, 2))
    expect(view.state.selection.main).toMatchObject({ anchor: 5, head: 5 })
  })

  it('les diagnostics passés après le montage sont appliqués puis retirés', () => {
    const { container, rerender, apiRef, onChange } = mount()
    const props = { initialText: '{"a":1}', onChange, ariaLabel: 'Configuration JSON' }
    expect(container.querySelector('.cm-lintRange-error')).toBeNull()

    rerender(
      <JsonEditor
        {...props}
        hoverLabels={HOVER_LABELS}
        apiRef={apiRef}
        diagnostics={[{ from: 1, to: 4, severity: 'warning', message: 'Attention' }]}
      />,
    )
    expect(container.querySelector('.cm-lintRange-warning')).not.toBeNull()

    rerender(<JsonEditor {...props} hoverLabels={HOVER_LABELS} apiRef={apiRef} diagnostics={[]} />)
    expect(container.querySelector('.cm-lintRange-warning')).toBeNull()
  })

  it('les diagnostics initiaux ne partent qu’une fois au montage', () => {
    const dispatch = vi.spyOn(EditorView.prototype, 'dispatch')
    try {
      mount({ diagnostics: [{ from: 1, to: 4, severity: 'error', message: 'Clé inconnue' }] })
      expect(dispatch).toHaveBeenCalledTimes(1)
    } finally {
      dispatch.mockRestore()
    }
  })

  it('le nom accessible suit le changement de ariaLabel', () => {
    const { rerender, apiRef, onChange } = mount()

    rerender(
      <JsonEditor
        initialText={'{"a":1}'}
        onChange={onChange}
        diagnostics={[]}
        ariaLabel="JSON configuration"
        hoverLabels={HOVER_LABELS}
        apiRef={apiRef}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'JSON configuration' })).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: 'Configuration JSON' })).toBeNull()
  })

  it("l'élément de complétion sélectionné l'emporte en spécificité sur le thème par défaut", () => {
    mount()
    const css = [...document.querySelectorAll('style')].map((style) => style.textContent).join('\n')
    const selectors = (needle: string) =>
      [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
        .filter(([, , body]) => body?.includes(needle))
        .flatMap(([, selector]) => (selector ?? '').split(','))
        .filter((selector) => selector.includes('tooltip-autocomplete ') && selector.includes('li'))
        .map((selector) => selector.trim())
    const ours = selectors('var(--accent)')
    const theirs = selectors('white')
    expect(ours.length).toBeGreaterThan(0)
    expect(theirs.length).toBeGreaterThan(0)
    expect(Math.min(...ours.map(classCount))).toBeGreaterThan(Math.max(...theirs.map(classCount)))
  })

  describe('configCompletionSource', () => {
    const doc = '{ "scoring": {  } }'
    const between = doc.indexOf('{  }') + 2

    it('propose les clés du schéma entre les accolades', () => {
      const context = new CompletionContext(EditorState.create({ doc }), between, true)
      const result = configCompletionSource(context)
      expect(result?.from).toBe(between)
      expect(result?.options.map((option) => option.label)).toContain('questionsPerStudent')
    })

    it('accepter une option remplace le mot en cours', () => {
      const typed = '{ "scoring": { "rounding": { "mode": ne } } }'
      const pos = typed.indexOf('ne') + 2
      const result = configCompletionSource(
        new CompletionContext(EditorState.create({ doc: typed }), pos, false),
      )
      const option = result?.options.find((candidate) => candidate.label === '"nearest"')
      expect(result).not.toBeNull()
      expect(typeof option?.apply).toBe('string')
      const state = EditorState.create({ doc: typed })
      const next = state.update({
        changes: { from: result?.from ?? 0, to: result?.to ?? pos, insert: String(option?.apply) },
      }).state
      expect(next.doc.toString()).toBe('{ "scoring": { "rounding": { "mode": "nearest" } } }')
    })

    it("n'ouvre pas la liste seule hors de tout mot", () => {
      const context = new CompletionContext(EditorState.create({ doc }), between, false)
      expect(configCompletionSource(context)).toBeNull()
    })
  })
})
