import { CompletionContext } from '@codemirror/autocomplete'
import { EditorState } from '@codemirror/state'
import { act, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
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
      defaultLabel="Défaut"
      apiRef={apiRef}
      {...overrides}
    />,
  )
  return { apiRef, onChange, ...view }
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

  describe('configCompletionSource', () => {
    const doc = '{ "scoring": {  } }'
    const between = doc.indexOf('{  }') + 2

    it('propose les clés du schéma entre les accolades', () => {
      const context = new CompletionContext(EditorState.create({ doc }), between, true)
      const result = configCompletionSource(context)
      expect(result?.from).toBe(between)
      expect(result?.options.map((option) => option.label)).toContain('questionsPerStudent')
    })

    it("n'ouvre pas la liste seule hors de tout mot", () => {
      const context = new CompletionContext(EditorState.create({ doc }), between, false)
      expect(configCompletionSource(context)).toBeNull()
    })
  })
})
