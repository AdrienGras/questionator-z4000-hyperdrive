import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSidePanel } from '@/features/session/hooks/use-side-panel'

describe('useSidePanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fermé au montage, onglet « student »', () => {
    const { result } = renderHook(() => useSidePanel())
    expect(result.current.open).toBe(false)
    expect(result.current.tab).toBe('student')
  })

  it('ancienne clé d’onglet ignorée (D91 remplace D76)', () => {
    localStorage.setItem('questionator:side-panel:tab', 'students')
    const { result } = renderHook(() => useSidePanel())
    expect(result.current.tab).toBe('student')
  })

  it('show(tab) ouvre sur l’onglet demandé', () => {
    const { result } = renderHook(() => useSidePanel())
    act(() => result.current.show('students'))
    expect(result.current.open).toBe(true)
    expect(result.current.tab).toBe('students')
  })

  it('show() sans onglet rouvre sur « student », même après un passage sur « students »', () => {
    const { result } = renderHook(() => useSidePanel())
    act(() => result.current.show('students'))
    act(() => result.current.setOpen(false))
    act(() => result.current.show())
    expect(result.current.open).toBe(true)
    expect(result.current.tab).toBe('student')
  })

  it('setTab change l’onglet tiroir ouvert, sans rien écrire', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { result } = renderHook(() => useSidePanel())
    act(() => result.current.show())
    act(() => result.current.setTab('students'))
    expect(result.current.tab).toBe('students')
    expect(result.current.open).toBe(true)
    expect(setItem).not.toHaveBeenCalled()
  })
})
