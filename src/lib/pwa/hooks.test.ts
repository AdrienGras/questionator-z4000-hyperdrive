import { act, renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useReloadOnUpdate, usePwaUpdate } from './hooks'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { PwaUpdate, type RegisterSW } from './pwa-update'

function noop(): void {}

function setup() {
  const reload = vi.fn<() => void>()
  let needRefresh = noop
  const register: RegisterSW = ({ onNeedRefresh }) => {
    needRefresh = onNeedRefresh ?? needRefresh
    return () => Promise.resolve()
  }
  const container = makeFakeContainer(false)
  const update = new PwaUpdate(reload)
  update.start(register, container)
  return { update, reload, needRefresh: () => act(() => needRefresh()) }
}

describe('usePwaUpdate', () => {
  test("suit l'état", () => {
    const { update, needRefresh } = setup()
    const { result } = renderHook(() => usePwaUpdate(update))
    expect(result.current.status).toBe('current')
    needRefresh()
    expect(result.current.status).toBe('update-ready')
  })
})

describe('useReloadOnUpdate', () => {
  test('recharge une fois sur update-ready', () => {
    const { update, reload, needRefresh } = setup()
    renderHook(() => useReloadOnUpdate(false, update, reload))
    needRefresh()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('recharge une fois quand la base passe outdated', () => {
    const { update, reload } = setup()
    const { rerender } = renderHook(({ outdated }) => useReloadOnUpdate(outdated, update, reload), {
      initialProps: { outdated: false },
    })
    rerender({ outdated: true })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test("ne recharge qu'une fois si les deux signaux arrivent", () => {
    const { update, reload, needRefresh } = setup()
    const { rerender } = renderHook(({ outdated }) => useReloadOnUpdate(outdated, update, reload), {
      initialProps: { outdated: false },
    })
    needRefresh()
    rerender({ outdated: true })
    rerender({ outdated: true })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('ne recharge pas tant que rien ne change', () => {
    const { update, reload } = setup()
    const { rerender } = renderHook(() => useReloadOnUpdate(false, update, reload))
    rerender()
    expect(reload).not.toHaveBeenCalled()
  })
})
