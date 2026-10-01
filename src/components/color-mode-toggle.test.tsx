import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useMemo } from 'react'
import { expect, test } from 'vitest'
import { AppearanceProvider } from '@/app/appearance-provider'
import { colorModeKey } from '@/lib/appearance/color-mode'
import { useAppearanceScope } from '@/lib/appearance/appearance-context'
import { useUi } from '@/lib/i18n/use-ui'
import { ColorModeToggle } from './color-mode-toggle'

function Toggle() {
  return <ColorModeToggle ui={useUi()} />
}

function PresentToggle() {
  const scope = useMemo(
    () => ({
      key: colorModeKey({ sessionId: 's1', view: 'present' as const }),
      defaultMode: 'light' as const,
    }),
    [],
  )
  useAppearanceScope(scope)
  return <Toggle />
}

test('affiche le mode courant et permet d’en choisir un autre', async () => {
  render(
    <AppearanceProvider>
      <Toggle />
    </AppearanceProvider>,
  )
  const trigger = screen.getByRole('button', { name: "Mode d'affichage : système" })
  fireEvent.click(trigger)
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Sombre' }))
  expect(document.documentElement).toHaveClass('dark')
  expect(
    await screen.findByRole('button', { name: "Mode d'affichage : sombre" }),
  ).toBeInTheDocument()
})

test('dans la vue projetée, le choix ne touche pas la clé de la vue examinateur', async () => {
  localStorage.setItem('questionator:color-mode:s1:examiner', 'light')
  render(
    <AppearanceProvider>
      <PresentToggle />
    </AppearanceProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: "Mode d'affichage : clair" }))
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Sombre' }))
  expect(localStorage.getItem('questionator:color-mode:s1:present')).toBe('dark')
  expect(localStorage.getItem('questionator:color-mode:s1:examiner')).toBe('light')
})

test('choisir un mode ferme le menu et rend le focus au bouton', async () => {
  let clicks = 0
  render(
    <AppearanceProvider>
      <Toggle />
      <button type="button" onClick={() => clicks++}>
        Tirer
      </button>
    </AppearanceProvider>,
  )
  const trigger = screen.getByRole('button', { name: "Mode d'affichage : système" })
  fireEvent.click(trigger)
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Sombre' }))
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: "Mode d'affichage : sombre" })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Tirer' }))
  expect(clicks).toBe(1)
})

test('choisir un mode au clavier ferme aussi le menu', async () => {
  render(
    <AppearanceProvider>
      <Toggle />
    </AppearanceProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: "Mode d'affichage : système" }))
  const item = await screen.findByRole('menuitemradio', { name: 'Clair' })
  item.focus()
  fireEvent.keyDown(item, { key: 'Enter' })
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  expect(document.documentElement).not.toHaveClass('dark')
  expect(screen.getByRole('button', { name: "Mode d'affichage : clair" })).toHaveFocus()
})
