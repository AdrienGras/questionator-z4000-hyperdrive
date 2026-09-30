import { describe, expect, test, vi } from 'vitest'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { PwaUpdate, type RegisterSW } from './pwa-update'

type Options = Parameters<RegisterSW>[0]

function setup(hasController = false) {
  const reload = vi.fn<() => void>()
  const updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve())
  let options: Options = {}
  const register: RegisterSW = (opts) => {
    options = opts
    return updateSW
  }
  const container = makeFakeContainer(hasController)
  const update = new PwaUpdate(reload)
  update.start(register, container)
  return { update, reload, updateSW, container, options: () => options }
}

describe('PwaUpdate', () => {
  test('« onNeedRefresh » passe à update-ready et notifie les abonnés', () => {
    const { update, options } = setup()
    const listener = vi.fn<() => void>()
    update.onStatusChange(listener)
    expect(update.status).toBe('current')
    options().onNeedRefresh?.()
    expect(update.status).toBe('update-ready')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('« controllerchange » au premier chargement (sans contrôleur initial) est ignoré', () => {
    const { update, container } = setup()
    container.dispatchEvent(new Event('controllerchange'))
    expect(update.status).toBe('current')
  })

  test('« controllerchange » avec contrôleur initial passe à update-ready', () => {
    const { update, container } = setup(true)
    container.dispatchEvent(new Event('controllerchange'))
    expect(update.status).toBe('update-ready')
  })

  test('applyUpdate après onNeedRefresh appelle updateSW(true)', async () => {
    const { update, reload, updateSW, options } = setup()
    options().onNeedRefresh?.()
    await update.applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
    expect(reload).not.toHaveBeenCalled()
  })

  test('applyUpdate après controllerchange recharge sans updateSW', async () => {
    const { update, reload, updateSW, options, container } = setup(true)
    options().onNeedRefresh?.()
    container.dispatchEvent(new Event('controllerchange'))
    await update.applyUpdate()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(updateSW).not.toHaveBeenCalled()
  })

  test('applyUpdate sans enregistrement (start jamais appelé) recharge', async () => {
    const reload = vi.fn<() => void>()
    await new PwaUpdate(reload).applyUpdate()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('onRegisterError laisse current et avertit', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { update, options } = setup()
    options().onRegisterError?.(new Error('quota'))
    expect(warn).toHaveBeenCalled()
    expect(update.status).toBe('current')
    warn.mockRestore()
  })

  test('le désabonnement coupe les notifications', () => {
    const { update, options } = setup()
    const listener = vi.fn<() => void>()
    const unsubscribe = update.onStatusChange(listener)
    unsubscribe()
    options().onNeedRefresh?.()
    expect(listener).not.toHaveBeenCalled()
  })
})
