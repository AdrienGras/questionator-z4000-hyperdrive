import { afterEach, describe, expect, test, vi } from 'vitest'
import { makeFakeContainer } from '@/testing/pwa-fixtures'
import { browserTriggers, PwaUpdate, type RegisterSW, type UpdateTriggers } from './pwa-update'

type Options = Parameters<RegisterSW>[0]

/** Faux enregistrement : seuls `waiting !== null` et `update()` sont lus. */
function fakeRegistration(
  waiting: boolean,
  update: () => Promise<void> = () => Promise.resolve(),
): ServiceWorkerRegistration {
  // `update` du DOM résout l'enregistrement ; seule la promesse est lue, d'où `unknown`.
  const fake: unknown = { waiting: waiting ? {} : null, update }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- seuls `waiting` et `update` sont lus.
  return fake as ServiceWorkerRegistration
}

function fire(runs: readonly (() => void)[]): void {
  for (const run of runs) run()
}

/** Déclencheurs factices : horloge manuelle, minuteur et événements appelés à la main. */
function fakeTriggers() {
  let time = 0
  const intervals: number[] = []
  const runs = {
    every: [] as (() => void)[],
    visible: [] as (() => void)[],
    online: [] as (() => void)[],
  }
  const triggers: UpdateTriggers = {
    now: () => time,
    every: (ms, run) => {
      intervals.push(ms)
      runs.every.push(run)
    },
    onVisible: (run) => runs.visible.push(run),
    onOnline: (run) => runs.online.push(run),
  }
  return {
    triggers,
    intervals,
    advance: (ms: number) => {
      time += ms
    },
    tick: () => fire(runs.every),
    visible: () => fire(runs.visible),
    online: () => fire(runs.online),
  }
}

/** Laisse passer les promesses en cours (`getRegistration`, `registration.update`). */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function setup(hasController = false, activeBefore: boolean = hasController) {
  const reload = vi.fn<() => void>()
  const updateSW = vi.fn<(reloadPage?: boolean) => Promise<void>>(() => Promise.resolve())
  let options: Options = {}
  const register = vi.fn<RegisterSW>((opts) => {
    options = opts
    return updateSW
  })
  const container = makeFakeContainer(hasController, activeBefore)
  const fake = fakeTriggers()
  const update = new PwaUpdate(reload, fake.triggers)
  update.start(register, container)
  const controllerChange = () => container.dispatchEvent(new Event('controllerchange'))
  return {
    update,
    reload,
    updateSW,
    register,
    container,
    controllerChange,
    fake,
    options: () => options,
  }
}

/** Store sous contrôle, enregistrement reçu : les déclencheurs de vérification sont posés. */
function registered(updateFn = vi.fn<() => Promise<void>>(() => Promise.resolve())) {
  const ctx = setup(true)
  ctx.options().onRegisteredSW?.('sw.js', fakeRegistration(false, updateFn))
  return { ...ctx, updateFn }
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

  test('premier chargement sans contrôleur : seul le premier « controllerchange » est ignoré', async () => {
    const { update, controllerChange } = setup(false, false)
    controllerChange()
    await settle()
    expect(update.status).toBe('current')
    controllerChange()
    await settle()
    expect(update.status).toBe('activated')
  })

  test('Shift+Reload (sans contrôleur, worker déjà actif) : le premier « controllerchange » compte', async () => {
    const { update, reload, controllerChange } = setup(false, true)
    controllerChange()
    await settle()
    expect(update.status).toBe('activated')
    expect(reload).not.toHaveBeenCalled()
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
    await settle()
    expect(update.status).toBe('current')
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

  describe('vérification périodique (F36)', () => {
    test('rien avant que le service worker soit enregistré', () => {
      const { fake } = setup(true)
      expect(fake.intervals).toEqual([])
    })

    test("vérifie toutes les heures, sans jamais appliquer d'office", () => {
      const { fake, updateFn, updateSW, reload, update } = registered()
      expect(fake.intervals).toEqual([3_600_000])
      fake.tick()
      fake.tick()
      expect(updateFn).toHaveBeenCalledTimes(2)
      expect(updateSW).not.toHaveBeenCalled()
      expect(reload).not.toHaveBeenCalled()
      expect(update.status).toBe('current')
    })

    test("au retour sur l'onglet, au plus une fois toutes les 5 minutes", () => {
      const { fake, updateFn } = registered()
      fake.advance(4 * 60_000)
      fake.visible()
      expect(updateFn).not.toHaveBeenCalled()
      fake.advance(60_000)
      fake.visible()
      expect(updateFn).toHaveBeenCalledTimes(1)
      fake.advance(60_000)
      fake.visible()
      expect(updateFn).toHaveBeenCalledTimes(1)
    })

    test('au retour du réseau, avec la même limite', () => {
      const { fake, updateFn } = registered()
      fake.advance(5 * 60_000)
      fake.online()
      fake.online()
      expect(updateFn).toHaveBeenCalledTimes(1)
    })

    test('la vérification horaire remet la limite à zéro', () => {
      const { fake, updateFn } = registered()
      fake.advance(60 * 60_000)
      fake.tick()
      fake.advance(60_000)
      fake.visible()
      expect(updateFn).toHaveBeenCalledTimes(1)
    })

    test('un échec (hors ligne) est ignoré sans bruit', async () => {
      const warn = vi.spyOn(console, 'warn')
      const { fake, update } = registered(
        vi.fn<() => Promise<void>>(() => Promise.reject(new TypeError('Failed to fetch'))),
      )
      fake.tick()
      await settle()
      expect(update.status).toBe('current')
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    test('après un échec, le retour du réseau réessaie sans attendre 5 minutes', async () => {
      const updateFn = vi.fn<() => Promise<void>>(() => Promise.reject(new TypeError('offline')))
      const { fake } = registered(updateFn)
      fake.tick()
      await settle()
      fake.advance(60_000)
      fake.online()
      expect(updateFn).toHaveBeenCalledTimes(2)
    })

    test("un second enregistrement n'ajoute pas de déclencheurs", () => {
      const { fake, options } = registered()
      options().onRegisteredSW?.('sw.js', fakeRegistration(false))
      expect(fake.intervals).toEqual([3_600_000])
    })
  })

  describe('prête pour le hors ligne (F36)', () => {
    test('« onOfflineReady » lève le drapeau et notifie ; dismiss le baisse', async () => {
      const { update, options } = setup(false, false)
      const listener = vi.fn<() => void>()
      update.onStatusChange(listener)
      expect(update.offlineReady).toBe(false)
      options().onOfflineReady?.()
      await settle()
      expect(update.offlineReady).toBe(true)
      expect(listener).toHaveBeenCalledTimes(1)
      update.dismissOfflineReady()
      expect(update.offlineReady).toBe(false)
      expect(listener).toHaveBeenCalledTimes(2)
    })

    test('ignoré après un Shift+Reload (worker déjà actif) : ce n’est pas une première installation', async () => {
      const { update, options } = setup(false, true)
      options().onOfflineReady?.()
      await settle()
      expect(update.offlineReady).toBe(false)
    })
  })

  test('getRegistration rejeté : le premier « controllerchange » reste ignoré (comportement D72)', async () => {
    const container = makeFakeContainer(false)
    container.getRegistration = () => Promise.reject(new Error('SecurityError'))
    const update = new PwaUpdate(vi.fn<() => void>(), fakeTriggers().triggers)
    update.start(() => () => Promise.resolve(), container)
    container.dispatchEvent(new Event('controllerchange'))
    await settle()
    expect(update.status).toBe('current')
  })

  test('onglet qui a cliqué : rechargé tout de suite, sans attendre getRegistration', async () => {
    const { update, reload, options, controllerChange } = setup(false, false)
    options().onNeedRefresh?.()
    await update.applyUpdate()
    controllerChange()
    expect(reload).toHaveBeenCalledTimes(1)
  })
})

/** Simule un changement de visibilité de l'onglet : jsdom ne la fait jamais varier. */
function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('browserTriggers', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'visibilityState')
  })

  test('onVisible ne réagit qu’au retour vers « visible »', () => {
    const run = vi.fn<() => void>()
    browserTriggers.onVisible(run)
    setVisibility('hidden')
    expect(run).not.toHaveBeenCalled()
    setVisibility('visible')
    expect(run).toHaveBeenCalledTimes(1)
  })
})
