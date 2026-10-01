import { act, fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { OfflineReadyPrompt } from '@/components/offline-ready-prompt'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { PwaUpdate, type RegisterSW } from '@/lib/pwa/pwa-update'
import { makeFakeContainer } from '@/testing/pwa-fixtures'

/** `PwaUpdate` neuve ; `ready()` simule la fin du pré-cache, `waiting()` une version en attente. */
function makeUpdate() {
  let options: Parameters<RegisterSW>[0] = {}
  const register: RegisterSW = (opts) => {
    options = opts
    return () => Promise.resolve()
  }
  const update = new PwaUpdate(vi.fn<() => void>())
  // Premier chargement : sans contrôleur ni worker actif, seul cas où « onOfflineReady » compte.
  update.start(register, makeFakeContainer(false, false))
  return {
    update,
    ready: () =>
      act(async () => {
        options.onOfflineReady?.()
        await new Promise((resolve) => setTimeout(resolve, 0))
      }),
    waiting: () => act(() => options.onNeedRefresh?.()),
  }
}

test("n'affiche rien tant que le pré-cache n'est pas terminé", () => {
  const { update } = makeUpdate()
  render(<OfflineReadyPrompt update={update} />)
  expect(screen.queryByRole('status')).toBeNull()
})

test('affiche « Prête pour le hors ligne » jusqu’au clic sur « OK »', async () => {
  const { update, ready } = makeUpdate()
  render(<OfflineReadyPrompt update={update} />)
  await ready()
  expect(screen.getByRole('status')).toHaveTextContent('Prête pour le hors ligne')
  fireEvent.click(screen.getByRole('button', { name: 'OK' }))
  expect(screen.queryByRole('status')).toBeNull()
  expect(update.offlineReady).toBe(false)
})

test('s’efface devant la pastille de mise à jour', async () => {
  const { update, ready, waiting } = makeUpdate()
  render(<OfflineReadyPrompt update={update} />)
  await ready()
  waiting()
  expect(screen.queryByRole('status')).toBeNull()
})

test('libellés anglais', async () => {
  const { update, ready } = makeUpdate()
  await ready()
  render(
    <LocaleProvider locale="en">
      <OfflineReadyPrompt update={update} />
    </LocaleProvider>,
  )
  expect(screen.getByRole('status')).toHaveTextContent('Ready to work offline')
  expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
})
