import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useLiveValidation } from './use-live-validation'

import exampleText from '../../../../examples/config.example.json?raw'

async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300)
  })
}

describe('useLiveValidation', () => {
  // Module chargé à l'avance : l'import dynamique du hook se résout alors sans E/S réelle.
  beforeAll(async () => {
    await import('@/domain/config/validate')
  })
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('CSS', { supports: () => true })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('valide après 300 ms et garde la config valide', async () => {
    const { result } = renderHook(({ text }) => useLiveValidation(text), {
      initialProps: { text: exampleText },
    })
    expect(result.current.pending).toBe(true)
    expect(result.current.result).toBeUndefined()
    await settle()
    expect(result.current.pending).toBe(false)
    expect(result.current.result?.ok).toBe(true)
    expect(result.current.lastValid).toBeDefined()
  })

  it('conserve la dernière config valide quand le texte devient invalide', async () => {
    const { result, rerender } = renderHook(({ text }) => useLiveValidation(text), {
      initialProps: { text: exampleText },
    })
    await settle()
    const valid = result.current.lastValid
    rerender({ text: '{}' })
    expect(result.current.pending).toBe(true)
    expect(result.current.validatedText).toBe(exampleText)
    await settle()
    expect(result.current.result?.ok).toBe(false)
    expect(result.current.validatedText).toBe('{}')
    expect(result.current.lastValid).toBe(valid)
  })

  it('remonte json_syntax sans exception sur « [ »', async () => {
    const { result } = renderHook(() => useLiveValidation('['))
    await settle()
    expect(result.current.result?.ok).toBe(false)
    expect(result.current.result?.issues.map((issue) => issue.code)).toContain('json_syntax')
  })

  it('import du validateur en échec : pas de rejet non géré, pending retombe, loadError', async () => {
    vi.resetModules()
    vi.doMock('@/domain/config/validate', () => {
      throw new Error('chunk introuvable')
    })
    try {
      const { useLiveValidation: fresh } = await import('./use-live-validation')
      const { result } = renderHook(() => fresh(exampleText))
      expect(result.current.loadError).toBe(false)
      await settle()
      expect(result.current.loadError).toBe(true)
      expect(result.current.pending).toBe(false)
      expect(result.current.result).toBeUndefined()
    } finally {
      vi.doUnmock('@/domain/config/validate')
      vi.resetModules()
    }
  })
})
