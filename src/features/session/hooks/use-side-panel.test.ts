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

  it('fermé au montage, onglet par défaut « student »', () => {
    const { result } = renderHook(() => useSidePanel())
    expect(result.current.open).toBe(false)
    expect(result.current.tab).toBe('student')
  })

  it('onglet mémorisé relu au montage', () => {
    localStorage.setItem('questionator:side-panel:tab', 'students')
    const { result } = renderHook(() => useSidePanel())
    expect(result.current.tab).toBe('students')
  })

  it('show(tab) ouvre sur l’onglet et le mémorise', () => {
    const { result } = renderHook(() => useSidePanel())
    act(() => result.current.show('students'))
    expect(result.current.open).toBe(true)
    expect(result.current.tab).toBe('students')
    expect(localStorage.getItem('questionator:side-panel:tab')).toBe('students')
  })

  it('setOpen ne mémorise rien', () => {
    const first = renderHook(() => useSidePanel())
    act(() => first.result.current.setOpen(true))
    expect(first.result.current.open).toBe(true)
    const second = renderHook(() => useSidePanel())
    expect(second.result.current.open).toBe(false)
  })

  it('localStorage inaccessible : fermé, onglet « student », show fonctionne', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('inaccessible')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('inaccessible')
    })
    const { result } = renderHook(() => useSidePanel())
    expect(result.current.open).toBe(false)
    expect(result.current.tab).toBe('student')
    act(() => result.current.show('students'))
    expect(result.current.open).toBe(true)
    expect(result.current.tab).toBe('students')
  })
})
