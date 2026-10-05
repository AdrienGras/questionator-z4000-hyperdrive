import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import exampleText from '../../../../examples/config.example.json?raw'
import { stashConfigForEditor } from '@/lib/config-handoff'
import { DRAFT_KEY, useConfigDraft } from './use-config-draft'

describe('useConfigDraft', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("part de l'exemple sans brouillon", () => {
    const { result } = renderHook(() => useConfigDraft())
    expect(result.current.initialText).toBe(exampleText)
  })

  it('restitue le brouillon enregistré', () => {
    localStorage.setItem(DRAFT_KEY, '{"a":1}')
    const { result } = renderHook(() => useConfigDraft())
    expect(result.current.initialText).toBe('{"a":1}')
  })

  it('restitue un brouillon vide tel quel', () => {
    localStorage.setItem(DRAFT_KEY, '')
    const { result } = renderHook(() => useConfigDraft())
    expect(result.current.initialText).toBe('')
  })

  it('écrit le brouillon après 300 ms', () => {
    const { result } = renderHook(() => useConfigDraft())
    act(() => result.current.save('abc'))
    act(() => void vi.advanceTimersByTime(299))
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    act(() => void vi.advanceTimersByTime(1))
    expect(localStorage.getItem(DRAFT_KEY)).toBe('abc')
  })

  it("ne garde que la dernière valeur d'une rafale", () => {
    const { result } = renderHook(() => useConfigDraft())
    act(() => result.current.save('a'))
    act(() => void vi.advanceTimersByTime(200))
    act(() => result.current.save('ab'))
    act(() => void vi.advanceTimersByTime(300))
    expect(localStorage.getItem(DRAFT_KEY)).toBe('ab')
  })

  it('tolère un stockage qui lève : exemple et save sans exception', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { result } = renderHook(() => useConfigDraft())
    expect(result.current.initialText).toBe(exampleText)
    act(() => result.current.save('x'))
    expect(() => act(() => void vi.advanceTimersByTime(300))).not.toThrow()
  })

  it('vidange l’écriture en attente sur pagehide', () => {
    const { result } = renderHook(() => useConfigDraft())
    act(() => result.current.save('quitte'))
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    act(() => void globalThis.dispatchEvent(new Event('pagehide')))
    expect(localStorage.getItem(DRAFT_KEY)).toBe('quitte')
  })

  it('retire l’écouteur pagehide au démontage', () => {
    const { result, unmount } = renderHook(() => useConfigDraft())
    unmount()
    localStorage.clear()
    act(() => result.current.save('après'))
    act(() => void globalThis.dispatchEvent(new Event('pagehide')))
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('une config déposée pour l’éditeur prime sur le brouillon et devient le brouillon', () => {
    localStorage.setItem(DRAFT_KEY, '{"ancien":1}')
    stashConfigForEditor({ text: '{"depose":1}', fileName: 'config.json' })
    const { result } = renderHook(() => useConfigDraft())
    expect(result.current.initialText).toBe('{"depose":1}')
    expect(localStorage.getItem(DRAFT_KEY)).toBe('{"depose":1}')
  })

  it('le dépôt est consommé : un second montage reprend le brouillon', () => {
    stashConfigForEditor({ text: '{"depose":1}', fileName: 'config.json' })
    renderHook(() => useConfigDraft())
    expect(sessionStorage.getItem('questionator:editor-handoff')).toBeNull()
    const { result } = renderHook(() => useConfigDraft())
    expect(result.current.initialText).toBe('{"depose":1}')
  })

  it('le double appel de StrictMode ne perd pas le dépôt', () => {
    localStorage.setItem(DRAFT_KEY, '{"ancien":1}')
    stashConfigForEditor({ text: '{"depose":1}', fileName: 'config.json' })
    const { result } = renderHook(() => useConfigDraft(), { wrapper: StrictMode })
    expect(result.current.initialText).toBe('{"depose":1}')
  })
})
