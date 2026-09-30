import { describe, expect, test, vi } from 'vitest'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { PwaUpdate, type RegisterSW } from './pwa-update'

type Options = Parameters<RegisterSW>[0]

/** Faux enregistrement : seule la présence d'un worker en attente est lue. */
function fakeRegistration(waiting: boolean): ServiceWorkerRegistration {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- seul `waiting !== null` est lu.
  return { waiting: waiting ? ({} as ServiceWorker) : null } as ServiceWorkerRegistration
}

function setup(hasController = false) {
  const reload = vi.fn<() => void>()
  const updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve())
  let options: Options = {}
  const register = vi.fn<RegisterSW>((opts) => {
    options = opts
    return updateSW
  })
  const container = makeFakeContainer(hasController)
  const update = new PwaUpdate(reload)
  update.start(register, container)
  const controllerChange = () => container.dispatchEvent(new Event('controllerchange'))
  return { update, reload, updateSW, register, container, controllerChange, options: () => options }
}

describe('PwaUpdate', () => {
  test('« onNeedRefresh » passe à waiting et notifie les abonnés', () => {
    const { update, options } = setup()
    const listener = vi.fn<() => void>()
    update.onStatusChange(listener)
    expect(update.status).toBe('current')
    options().onNeedRefresh?.()
    expect(update.status).toBe('waiting')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('« onNeedReload » est toujours fourni et ne recharge rien', () => {
    const { reload, options } = setup(true)
    const onNeedReload = options().onNeedReload
    expect(onNeedReload).toBeTypeOf('function')
    onNeedReload?.()
    expect(reload).not.toHaveBeenCalled()
  })

  test('un second start est sans effet', () => {
    const { update, register, container } = setup()
    update.start(register, container)
    expect(register).toHaveBeenCalledTimes(1)
  })

  test('sans contrôleur initial, seul le premier « controllerchange » est ignoré', () => {
    const { update, controllerChange } = setup()
    controllerChange()
    expect(update.status).toBe('current')
    controllerChange()
    expect(update.status).toBe('activated')
  })

  test('« controllerchange » avec contrôleur initial passe à activated sans recharger', () => {
    const { update, reload, controllerChange } = setup(true)
    controllerChange()
    expect(update.status).toBe('activated')
    expect(reload).not.toHaveBeenCalled()
  })

  test('« onNeedRefresh » après activated reste activated', () => {
    const { update, options, controllerChange } = setup(true)
    controllerChange()
    options().onNeedRefresh?.()
    expect(update.status).toBe('activated')
  })

  test('applyUpdate en waiting appelle updateSW(true) ; le controllerchange qui suit recharge', async () => {
    const { update, reload, updateSW, options, controllerChange } = setup(true)
    options().onNeedRefresh?.()
    await update.applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
    expect(reload).not.toHaveBeenCalled()
    controllerChange()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('onglet du premier chargement : son clic le recharge au controllerchange', async () => {
    const { update, reload, updateSW, options, controllerChange } = setup(false)
    controllerChange() // clientsClaim de l'installation, ignoré
    options().onNeedRefresh?.()
    await update.applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
    controllerChange()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('onglet sans contrôleur qui clique avant tout controllerchange : rechargé quand même', async () => {
    const { update, reload, options, controllerChange } = setup(false)
    options().onNeedRefresh?.()
    await update.applyUpdate()
    controllerChange()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  test('applyUpdate en waiting sans worker en attente recharge directement', async () => {
    const { update, reload, updateSW, options } = setup(true)
    options().onRegisteredSW?.('sw.js', fakeRegistration(false))
    options().onNeedRefresh?.()
    await update.applyUpdate()
    expect(reload).toHaveBeenCalledTimes(1)
    expect(updateSW).not.toHaveBeenCalled()
  })

  test('applyUpdate en waiting avec worker en attente envoie skipWaiting', async () => {
    const { update, reload, updateSW, options } = setup(true)
    options().onRegisteredSW?.('sw.js', fakeRegistration(true))
    options().onNeedRefresh?.()
    await update.applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
    expect(reload).not.toHaveBeenCalled()
  })

  test('applyUpdate en activated recharge sans updateSW', async () => {
    const { update, reload, updateSW, options, controllerChange } = setup(true)
    options().onNeedRefresh?.()
    controllerChange()
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
