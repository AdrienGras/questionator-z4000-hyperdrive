import { act, renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useReloadOnUpdate, usePwaUpdate } from './hooks'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { PwaUpdate, type RegisterSW } from './pwa-update'

function noop(): void {}

/** Store démarré avec un contrôleur initial : `activate()` simule l'activation par un autre onglet. */
function setup() {
  const reload = vi.fn<() => void>()
  let needRefresh = noop
  const register: RegisterSW = ({ onNeedRefresh }) => {
    needRefresh = onNeedRefresh ?? needRefresh
    return () => Promise.resolve()
  }
  const container = makeFakeContainer(true)
  const update = new PwaUpdate(reload)
  update.start(register, container)
  return {
    update,
    reload,
    wait: () => act(() => needRefresh()),
    activate: () =>
      act(() => {
        container.dispatchEvent(new Event('controllerchange'))
      }),
  }
}

describe('usePwaUpdate', () => {
  test("suit l'état", () => {
    const { update, wait, activate } = setup()
    const { result } = renderHook(() => usePwaUpdate(update))
    expect(result.current.status).toBe('current')
    wait()
    expect(result.current.status).toBe('waiting')
    activate()
    expect(result.current.status).toBe('activated')
  })
})

describe('useReloadOnUpdate', () => {
  test('ne recharge pas quand une version attend (waiting)', () => {
    const { update, reload, wait } = setup()
    renderHook(() => useReloadOnUpdate(false, update, reload))
    wait()
    wait()
    expect(update.status).toBe('waiting')
    expect(reload).not.toHaveBeenCalled()
  })

  test('recharge une fois sur activated', () => {
    const { update, reload, wait, activate } = setup()
    renderHook(() => useReloadOnUpdate(false, update, reload))
    wait()
    activate()
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

  test("ne recharge qu'une fois : activated puis outdated", () => {
    const { update, reload, activate } = setup()
    const { rerender } = renderHook(({ outdated }) => useReloadOnUpdate(outdated, update, reload), {
      initialProps: { outdated: false },
    })
    activate()
    rerender({ outdated: true })
    rerender({ outdated: true })
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test("ne recharge qu'une fois : outdated puis activated", () => {
    const { update, reload, activate } = setup()
    const { rerender } = renderHook(({ outdated }) => useReloadOnUpdate(outdated, update, reload), {
      initialProps: { outdated: false },
    })
    rerender({ outdated: true })
    activate()
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
