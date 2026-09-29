import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutosave } from '@/features/session/hooks/use-autosave'

type Save = (value: string) => Promise<boolean>

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sauvegarde après le délai puis passe saving, saved', async () => {
    const save = vi.fn<Save>().mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))
    expect(result.current.status).toBe('idle')

    act(() => result.current.schedule('a'))
    await advance(499)
    expect(save).not.toHaveBeenCalled()

    await advance(1)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('a')
    expect(result.current.status).toBe('saved')
  })

  it('passe par le statut saving pendant la sauvegarde', async () => {
    const resolvers: ((ok: boolean) => void)[] = []
    const save = vi.fn<Save>().mockReturnValue(
      new Promise<boolean>((r) => {
        resolvers.push(r)
      }),
    )
    const { result } = renderHook(() => useAutosave(save))
    act(() => result.current.schedule('a'))
    await advance(500)
    expect(result.current.status).toBe('saving')
    await act(async () => {
      resolvers[0]?.(true)
      await Promise.resolve()
    })
    expect(result.current.status).toBe('saved')
  })

  it('repousse le délai à chaque frappe', async () => {
    const save = vi.fn<Save>().mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))
    act(() => result.current.schedule('a'))
    await advance(300)
    act(() => result.current.schedule('ab'))
    await advance(300)
    expect(save).not.toHaveBeenCalled()
    await advance(200)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('ab')
  })

  it('flush sauvegarde tout de suite, sans second appel au délai', async () => {
    const save = vi.fn<Save>().mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))
    act(() => result.current.schedule('a'))
    act(() => result.current.flush())
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('a')
    await advance(500)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it("flush ne fait rien s'il n'y a rien de programmé", () => {
    const save = vi.fn<Save>().mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))
    act(() => result.current.flush())
    expect(save).not.toHaveBeenCalled()
  })

  it('sauvegarde la dernière valeur au démontage', async () => {
    const save = vi.fn<Save>().mockResolvedValue(true)
    const { result, unmount } = renderHook(() => useAutosave(save))
    act(() => result.current.schedule('a'))
    unmount()
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('a')
    await advance(500)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('passe en error si save résout false, et resauvegarde ensuite', async () => {
    const save = vi.fn<Save>().mockResolvedValueOnce(false).mockResolvedValue(true)
    const { result } = renderHook(() => useAutosave(save))
    act(() => result.current.schedule('a'))
    await advance(500)
    expect(result.current.status).toBe('error')

    act(() => result.current.schedule('ab'))
    await advance(500)
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith('ab')
    expect(result.current.status).toBe('saved')
  })

  it('utilise toujours le dernier save passé au hook', async () => {
    const first = vi.fn<Save>().mockResolvedValue(true)
    const second = vi.fn<Save>().mockResolvedValue(true)
    const { result, rerender } = renderHook(({ save }) => useAutosave(save), {
      initialProps: { save: first },
    })
    act(() => result.current.schedule('a'))
    rerender({ save: second })
    await advance(500)
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('a')
  })
})
